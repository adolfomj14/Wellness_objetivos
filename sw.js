// Service Worker para PWA, notificaciones nativas al dispositivo y sincronización en segundo plano
const CACHE_NAME = 'objetivos-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

let bgConfig = null; // { url, anonKey, userId, userRole }
let swKnownTasks = new Map();
let swInitialLoaded = false;
let swNotifiedDue = new Set();
let swPollTimer = null;

// Filtro anti-duplicados (evita que Web Push + Realtime/Background disparen 2 veces la misma alerta)
const recentNotificationTags = new Map();
const DEDUP_WINDOW_MS = 45000;

function normalizeTag(rawTag) {
  const tag = String(rawTag || '');
  // Unificar formatos equivalentes entre Web Push, Webhook y detector local
  let m;
  if ((m = tag.match(/^(?:task-new|new)-(\d+)/))) return `task-new-${m[1]}`;
  if ((m = tag.match(/^(?:task-done|done)-(\d+)/))) return `task-done-${m[1]}`;
  if ((m = tag.match(/^(?:task-take|taken)-(\d+)/))) return `task-take-${m[1]}`;
  if ((m = tag.match(/^(?:task-start|prog)-(\d+)/))) return `task-start-${m[1]}`;
  if ((m = tag.match(/^(?:task-help|help)-(\d+)/))) return `task-help-${m[1]}`;
  if ((m = tag.match(/^(?:task-helper|helper)-(\d+)/))) return `task-helper-${m[1]}`;
  return tag || ('notif-' + Date.now());
}

async function showDedupedNotification(title, options = {}) {
  const now = Date.now();
  // Limpiar entradas antiguas
  for (const [k, ts] of recentNotificationTags.entries()) {
    if (now - ts > DEDUP_WINDOW_MS) recentNotificationTags.delete(k);
  }

  const canonicalTag = normalizeTag(options.tag);
  const lastShown = recentNotificationTags.get(canonicalTag);
  if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
    // Ya se mostró esta misma notificación hace pocos segundos (evita notificación doble)
    return false;
  }
  recentNotificationTags.set(canonicalTag, now);

  await self.registration.showNotification(title, {
    body: options.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: options.vibrate || [200, 100, 200],
    tag: canonicalTag,
    renotify: false,
    requireInteraction: false
  });
  return true;
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Network-first con fallback a cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Verificación en segundo plano directamente desde el Service Worker hacia Supabase REST API
async function checkSupabaseTasksInBackground() {
  if (!bgConfig || !bgConfig.url || !bgConfig.anonKey || !bgConfig.userId) return;

  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyFocused = clientList.some((c) => c.focused || c.visibilityState === 'visible');

    const headers = {
      apikey: bgConfig.anonKey,
      Authorization: `Bearer ${bgConfig.anonKey}`
    };

    const [tRes, uRes] = await Promise.all([
      fetch(`${bgConfig.url}/rest/v1/tasks?select=*`, { headers }),
      fetch(`${bgConfig.url}/rest/v1/users?select=id,name`, { headers })
    ]);

    if (!tRes.ok) return;
    const tasks = await tRes.json();
    const users = uRes.ok ? await uRes.json() : [];
    const userMap = new Map(users.map((u) => [Number(u.id), u.name]));
    const getName = (id) => userMap.get(Number(id)) || 'Un compañero';
    const myId = Number(bgConfig.userId);

    if (!swInitialLoaded) {
      for (const t of tasks) {
        swKnownTasks.set(t.id, {
          status: t.status,
          assignee_id: t.assignee_id,
          needs_help: Boolean(t.needs_help)
        });
      }
      swInitialLoaded = true;
      return;
    }

    // Si la ventana no está en primer plano, el Service Worker respalda las alertas
    for (const t of tasks) {
      const prev = swKnownTasks.get(t.id);
      swKnownTasks.set(t.id, {
        status: t.status,
        assignee_id: t.assignee_id,
        needs_help: Boolean(t.needs_help)
      });

      if (t.is_private && Number(t.created_by) !== myId) continue;
      if (!t.active) continue;

      if (!anyFocused) {
        if (!prev) {
          await showDedupedNotification('📌 Nueva tarea creada', {
            body: `${getName(t.created_by)} creó: "${t.title}"`,
            tag: `task-new-${t.id}`
          });
        } else if (t.status === 'terminada' && prev.status !== 'terminada') {
          const who = t.completed_by ? getName(t.completed_by) : getName(t.assignee_id);
          await showDedupedNotification('✅ Tarea finalizada', {
            body: `${who} terminó: "${t.title}"`,
            tag: `task-done-${t.id}`
          });
        } else if (t.assignee_id && prev.assignee_id !== t.assignee_id) {
          await showDedupedNotification('👤 Tarea tomada / asignada', {
            body: `${getName(t.assignee_id)} tomó la tarea: "${t.title}"`,
            tag: `task-take-${t.id}`
          });
        } else if (t.needs_help && !prev.needs_help) {
          await showDedupedNotification('🆘 Piden ayuda con una tarea', {
            body: `${getName(t.assignee_id)} necesita apoyo en: "${t.title}"`,
            tag: `task-help-${t.id}`,
            vibrate: [300, 100, 300, 100, 300]
          });
        }
      }

      // Verificar vencimiento próximo en segundo plano
      if (!anyFocused && t.status !== 'terminada' && t.due_at) {
        const dueMs = new Date(t.due_at).getTime();
        if (!isNaN(dueMs)) {
          const diffMin = Math.round((dueMs - Date.now()) / 60000);
          if (diffMin > 0 && diffMin <= 30 && !swNotifiedDue.has(`${t.id}_30`)) {
            swNotifiedDue.add(`${t.id}_30`);
            await showDedupedNotification(`⏰ Tarea por vencer (${diffMin} min)`, {
              body: `"${t.title}" está próxima a vencer.`,
              tag: `task-due-${t.id}`,
              vibrate: [250, 100, 250]
            });
          }
        }
      }
    }
  } catch (err) {
    // Error de red silencioso en background
  }
}

// Comunicación directa desde app.js hacia el Service Worker
self.addEventListener('message', (e) => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'SHOW_NOTIFICATION') {
    const title = data.title || '🔔 Objetivos · Wellness';
    e.waitUntil(
      showDedupedNotification(title, {
        body: data.body || '',
        tag: data.tag || ('notif-' + Date.now())
      })
    );
  } else if (data.type === 'REGISTER_TAG') {
    if (data.tag) {
      recentNotificationTags.set(normalizeTag(data.tag), Date.now());
    }
  } else if (data.type === 'INIT_BG_SYNC') {
    bgConfig = {
      url: data.url,
      anonKey: data.anonKey,
      userId: data.userId,
      userRole: data.userRole
    };
    if (!swPollTimer) {
      swPollTimer = setInterval(checkSupabaseTasksInBackground, 15000);
    }
    checkSupabaseTasksInBackground();
  }
});

// Soporte para Periodic Background Sync (en PWAs instaladas en Android/Chrome)
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'check-tasks-sync') {
    e.waitUntil(checkSupabaseTasksInBackground());
  }
});

// Soporte para Web Push nativo
self.addEventListener('push', (e) => {
  let payload = {
    title: '🔔 Objetivos · Wellness',
    body: 'Nueva actualización en las tareas del equipo.',
    tag: 'push-' + Date.now()
  };
  try {
    if (e.data) payload = { ...payload, ...e.data.json() };
  } catch (err) {
    if (e.data) payload.body = e.data.text();
  }

  const canonicalTag = normalizeTag(payload.tag);

  e.waitUntil(
    (async () => {
      // Avisar a las ventanas abiertas que este tag ya fue cubierto por Push para que Realtime no lo duplique
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          tag: canonicalTag,
          title: payload.title,
          body: payload.body
        });
      }
      await showDedupedNotification(payload.title, {
        body: payload.body,
        tag: canonicalTag
      });
    })()
  );
});

// Al tocar una notificación en el celular o PC, abrir o enfocar la app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
