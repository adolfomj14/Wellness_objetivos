// Service Worker para PWA, notificaciones nativas al dispositivo y sincronización en segundo plano
const CACHE_NAME = 'objetivos-v7';
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

// Filtro anti-duplicados (en memoria + consulta nativa al sistema operativo)
const recentNotificationTags = new Map();
const DEDUP_WINDOW_MS = 60000;

function normalizeTag(rawTag) {
  const tag = String(rawTag || '');
  // Unificar a los mismos tags exactos que envía la Edge Function en Supabase y app.js
  let m;
  if ((m = tag.match(/^(?:task-new|new)-(\d+)/))) return `task-new-${m[1]}`;
  if ((m = tag.match(/^(?:task-done|done)-(\d+)/))) return `done-${m[1]}-terminada`;
  if ((m = tag.match(/^(?:task-take|taken)-(\d+)/))) return `taken-${m[1]}`;
  if ((m = tag.match(/^(?:task-start|prog)-(\d+)/))) return `prog-${m[1]}`;
  if ((m = tag.match(/^(?:task-help|help)-(\d+)/))) return `help-${m[1]}`;
  if ((m = tag.match(/^(?:task-helper|helper)-(\d+)/))) return `helper-${m[1]}`;
  return tag || ('notif-' + Date.now());
}

async function showDedupedNotification(title, options = {}) {
  const now = Date.now();
  for (const [k, ts] of recentNotificationTags.entries()) {
    if (now - ts > DEDUP_WINDOW_MS) recentNotificationTags.delete(k);
  }

  const canonicalTag = normalizeTag(options.tag);

  // 1. Verificar memoria reciente del Service Worker
  const lastShown = recentNotificationTags.get(canonicalTag);
  if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
    return false;
  }
  recentNotificationTags.set(canonicalTag, now);

  // 2. Verificar en la bandeja del sistema operativo si ya existe una notificación activa con este tag
  // (Persiste incluso si el navegador reinició el proceso del Service Worker)
  try {
    if (self.registration && typeof self.registration.getNotifications === 'function') {
      const existing = await self.registration.getNotifications({ tag: canonicalTag });
      if (existing && existing.length > 0) {
        return false;
      }
    }
  } catch (e) {}

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

// Verificación en segundo plano (respaldo únicamente para vencimientos próximos)
async function checkSupabaseTasksInBackground() {
  if (!bgConfig || !bgConfig.url || !bgConfig.anonKey || !bgConfig.userId) return;

  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyFocused = clientList.some((c) => c.focused || c.visibilityState === 'visible');
    if (anyFocused) return;

    const headers = {
      apikey: bgConfig.anonKey,
      Authorization: `Bearer ${bgConfig.anonKey}`
    };

    const tRes = await fetch(`${bgConfig.url}/rest/v1/tasks?select=*`, { headers });
    if (!tRes.ok) return;
    const tasks = await tRes.json();
    const myId = Number(bgConfig.userId);

    for (const t of tasks) {
      if (t.is_private && Number(t.created_by) !== myId) continue;
      if (!t.active) continue;

      // Verificar vencimiento próximo en segundo plano
      if (t.status !== 'terminada' && t.due_at) {
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
      swPollTimer = setInterval(checkSupabaseTasksInBackground, 30000);
    }
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
      // Avisar a las ventanas abiertas que este tag ya llegó por Push
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
