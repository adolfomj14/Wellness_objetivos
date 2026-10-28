// Service Worker para PWA, notificaciones nativas al dispositivo y sincronización en segundo plano
const CACHE_NAME = 'objetivos-v5';
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
    // Verificar si alguna ventana de la app está visible en primer plano
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyFocused = clientList.some((c) => c.focused || c.visibilityState === 'visible');
    // Aún si está en segundo plano o cerrada la pestaña, consultamos Supabase
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

    // Si la ventana no está en primer plano, el Service Worker dispara la notificación nativa al dispositivo
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
          await self.registration.showNotification('📌 Nueva tarea creada', {
            body: `${getName(t.created_by)} creó: "${t.title}"`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [200, 100, 200],
            tag: `task-new-${t.id}`,
            renotify: true
          });
        } else if (t.status === 'terminada' && prev.status !== 'terminada') {
          const who = t.completed_by ? getName(t.completed_by) : getName(t.assignee_id);
          await self.registration.showNotification('✅ Tarea finalizada', {
            body: `${who} terminó: "${t.title}"`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [200, 100, 200],
            tag: `done-${t.id}-terminada`,
            renotify: true
          });
        } else if (t.assignee_id && prev.assignee_id !== t.assignee_id) {
          await self.registration.showNotification('👤 Tarea tomada / asignada', {
            body: `${getName(t.assignee_id)} tomó la tarea: "${t.title}"`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [200, 100, 200],
            tag: `taken-${t.id}-${t.assignee_id}`,
            renotify: true
          });
        } else if (t.needs_help && !prev.needs_help) {
          await self.registration.showNotification('🆘 Piden ayuda con una tarea', {
            body: `${getName(t.assignee_id)} necesita apoyo en: "${t.title}"`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [300, 100, 300, 100, 300],
            tag: `help-${t.id}`,
            renotify: true
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
            await self.registration.showNotification(`⏰ Tarea por vencer (${diffMin} min)`, {
              body: `"${t.title}" está próxima a vencer.`,
              icon: './icon-192.png',
              badge: './icon-192.png',
              vibrate: [250, 100, 250],
              tag: `task-due-${t.id}`,
              renotify: true
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
    const opts = {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || ('notif-' + Date.now()),
      renotify: true,
      requireInteraction: false
    };
    e.waitUntil(self.registration.showNotification(title, opts));
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
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: payload.tag,
      renotify: true
    })
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
