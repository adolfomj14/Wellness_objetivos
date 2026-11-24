'use strict';
/* ==========================================================================
   Objetivos del Equipo — cliente conectado a Supabase + GitHub Pages
   ========================================================================== */

const TEAM_NAME = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.teamName) || 'Wellness Movilidad';
const STORE_NAME = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.storeName) || 'Decathlon';
const SHIFT_MINUTES = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.shiftMinutes) || 480;
const DEFAULT_DUE_HOUR = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.defaultDueHour) || 19;

// Inicialización del cliente Supabase
let sb = null;
if (typeof SUPABASE_CONFIG !== 'undefined' &&
    SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'TU_SUPABASE_URL_AQUI' &&
    SUPABASE_CONFIG.anonKey && SUPABASE_CONFIG.anonKey !== 'TU_SUPABASE_ANON_KEY_AQUI') {
  sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

const STATUS = {
  sin_iniciar: 'Sin iniciar',
  en_progreso: 'En progreso',
  faltante: 'Faltante',
  terminada: 'Terminada',
};
const STATUS_ORDER = ['sin_iniciar', 'en_progreso', 'faltante', 'terminada'];
const PRIORITY = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const PRIO_RANK = { alta: 0, media: 1, baja: 2 };
const ROLE = { admin: 'Administrador', lider: 'Líder', colaborador: 'Colaborador', colaborador_pro: 'Colaborador Pro' };
const WEEKDAYS = [['1', 'L'], ['2', 'M'], ['3', 'X'], ['4', 'J'], ['5', 'V'], ['6', 'S'], ['7', 'D']];
const URG_RANK = { overdue: 0, critical: 1, soon: 2, near: 3, ok: 4, none: 5, done: 6 };

const ZONES = [
  { id: 'Wellness', label: '🧘 Wellness' },
  { id: 'Movilidad / Bicis', label: '🚲 Movilidad / Bicis' },
  { id: 'Taller', label: '🔧 Taller' },
  { id: 'Fitness', label: '🏋️ Fitness' },
  { id: 'Running', label: '👟 Running' },
  { id: 'Bodega / Stock', label: '📦 Bodega / Stock' },
  { id: 'Caja / Lineal', label: '🛒 Caja / Lineal' },
];
const ZONE_MAP = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));

const ICON = {
  today: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>',
  board: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  activity: '<svg viewBox="0 0 24 24"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.5.5 4 2.5 4 5.5"/></svg>',
  timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.7M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-1 .2"/><path d="M20 4v14h-7"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  chevronUp: '<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  unlock: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  bellOff: '<svg viewBox="0 0 24 24"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  key: '<svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
};

/* ---------- Estado local ---------- */
const state = {
  me: JSON.parse(localStorage.getItem('obj_user') || 'null'),
  users: [], objectives: [], tasks: [], routines: [], activity: [],
  view: localStorage.getItem('obj_view') || 'hoy',
  more: 'menu',
  filters: { person: '', objective: '', zone: '', status: 'sin_iniciar', activityUser: '', activityKind: '' },
  sheetOpen: false,
  showAllDoneToday: false,
  boardDoneFilter: 'recientes', // 'recientes' (últimas 5 o de hoy) | 'semana' (últimos 7 días) | 'todas'
  theme: localStorage.getItem('obj_theme') || 'light',
  notifMode: localStorage.getItem('obj_notif_mode') || 'all', // 'all' | 'mine'
  isOnline: navigator.onLine !== false,
  offlineQueue: JSON.parse(localStorage.getItem('obj_offline_queue') || '[]'),
  draftSubtasks: [],
  draftPhotos: [],
  statsPeriod: '30d', // '7d' | '30d' | 'month' | 'all'
  statsChartPerson: '',
  statsChartZero: true,
};

// Aplicar tema inmediatamente
if (state.theme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const nowIso = () => new Date().toISOString();

const TIMEZONE = 'America/Bogota';

// Obtiene componentes de fecha/hora en la zona horaria de Bogotá (UTC-5)
function getBogotaParts(d = new Date()) {
  const dObj = typeof d === 'string' ? new Date(d) : d;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(dObj);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === '24' ? '00' : map.hour,
    minute: map.minute,
    second: map.second,
  };
}

function parseLocal(s) {
  if (!s) return null;
  if (s instanceof Date) return isNaN(s) ? null : s;
  s = String(s).trim();
  // Solo fecha YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + 'T00:00:00-05:00');
  }
  // Fecha sin zona horaria explícita YYYY-MM-DDTHH:mm o YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return new Date(s + '-05:00');
  }
  // Si ya tiene Z o offset (+/-HH:mm)
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function dateStr(d = new Date()) {
  const p = getBogotaParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

function todayStr() {
  return dateStr(new Date());
}

function defaultDue() {
  const now = new Date();
  const p = getBogotaParts(now);
  const hour = Number(p.hour);
  // Si ya pasó la hora por defecto, sugerir mañana a esa hora
  if (hour >= DEFAULT_DUE_HOUR) {
    const tmrw = new Date(now.getTime() + 864e5);
    return `${dateStr(tmrw)}T${pad(DEFAULT_DUE_HOUR)}:00`;
  }
  return `${p.year}-${p.month}-${p.day}T${pad(DEFAULT_DUE_HOUR)}:00`;
}

// Formatea para inputs datetime-local (YYYY-MM-DDTHH:mm) en hora Bogotá
function toLocalInputDate(s) {
  if (!s) return '';
  const d = parseLocal(s);
  if (!d) return '';
  const p = getBogotaParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function fmtMinutes(m) {
  m = Math.round(Number(m) || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
function fmtRel(ms) {
  const min = Math.round(Math.abs(ms) / 60000);
  let t;
  if (min < 60) t = `${min} min`;
  else if (min < 60 * 48) t = `${Math.round(min / 60)} h`;
  else t = `${Math.round(min / 1440)} días`;
  return ms >= 0 ? `en ${t}` : `hace ${t}`;
}
function fmtDue(s) {
  const d = parseLocal(s);
  if (!d) return 'Sin fecha';
  const p = getBogotaParts(d);
  const time = `${p.hour}:${p.minute}`;

  // Comparar con hoy en Bogotá
  const todayParts = getBogotaParts(new Date());
  const todayDate = new Date(`${todayParts.year}-${todayParts.month}-${todayParts.day}T00:00:00-05:00`);
  const targetDate = new Date(`${p.year}-${p.month}-${p.day}T00:00:00-05:00`);
  const diff = Math.round((targetDate - todayDate) / 864e5);

  if (diff === 0) return `Hoy ${time}`;
  if (diff === 1) return `Mañana ${time}`;
  if (diff === -1) return `Ayer ${time}`;
  return `${d.toLocaleDateString('es-CO', { timeZone: TIMEZONE, weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
}
function fmtDate(s) {
  const d = parseLocal(s);
  return d ? d.toLocaleDateString('es-CO', { timeZone: TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function fmtDateTime(s) {
  const d = parseLocal(s);
  return d ? d.toLocaleString('es-CO', { timeZone: TIMEZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
}

/* ---------- Selectores ---------- */
const userById = (id) => state.users.find((u) => u.id === Number(id));
const userName = (id) => (userById(id) || {}).name || 'Sin asignar';
const objById = (id) => state.objectives.find((o) => o.id === Number(id));
const activeUsers = () => state.users.filter((u) => u.active);
const activeTasks = () => state.tasks.filter((t) => t.active && canSeeTask(t));
const activeObjectives = () => state.objectives.filter((o) => o.active);
const isAdmin = () => state.me && state.me.role === 'admin';
const isLead = () => state.me && (state.me.role === 'admin' || state.me.role === 'lider');
const hasPrivateTasks = () => state.me && ['admin', 'lider', 'colaborador_pro'].includes(state.me.role);
const isTaskPrivate = (t) => Boolean(t.is_private);
const canSeeTask = (t, uid = (state.me && state.me.id)) => {
  if (!t.is_private) return true;
  return Number(uid) && t.created_by === Number(uid);
};
const isOpen = (t) => t.status !== 'terminada';
const doneToday = (t) => t.status === 'terminada' && (t.completed_at ? dateStr(parseLocal(t.completed_at)) === todayStr() : false);

// Funciones para ayudantes
const getHelperIds = (t) => Array.isArray(t.helper_ids) ? t.helper_ids.map(Number) : [];
const isHelper = (t, uid = (state.me && state.me.id)) => getHelperIds(t).includes(Number(uid));
const isAssignedOrHelper = (t, uid = (state.me && state.me.id)) => t.assignee_id === Number(uid) || isHelper(t, uid);

const canEditTask = (t) => {
  if (t.is_private) return t.created_by === (state.me && state.me.id);
  return isLead() || isAssignedOrHelper(t, state.me && state.me.id) || t.created_by === (state.me && state.me.id);
};
const canFullEditTask = (t) => {
  if (t.is_private) return t.created_by === (state.me && state.me.id);
  return !t.id || isLead() || t.created_by === (state.me && state.me.id);
};
const canHideTask = (t) => canEditTask(t);
const canTogglePrivacy = (t) => Boolean(t.id && hasPrivateTasks() && t.created_by === (state.me && state.me.id));

/* ---------- Helpers para Subtareas, Comentarios, Fotos, Zonas, PIN y Tema ---------- */
function getLocalExtrasMap() {
  try { return JSON.parse(localStorage.getItem('obj_task_extras') || '{}'); } catch (e) { return {}; }
}
function saveLocalTaskExtra(taskId, patch) {
  if (!taskId) return;
  const map = getLocalExtrasMap();
  map[taskId] = { ...(map[taskId] || {}), ...patch };
  try { localStorage.setItem('obj_task_extras', JSON.stringify(map)); } catch (e) {}
}
function getSubtasks(t) {
  if (!t) return [];
  if (Array.isArray(t.subtasks) && t.subtasks.length) return t.subtasks;
  const loc = getLocalExtrasMap()[t.id];
  return (loc && Array.isArray(loc.subtasks)) ? loc.subtasks : (Array.isArray(t.subtasks) ? t.subtasks : []);
}
function getComments(t) {
  if (!t) return [];
  if (Array.isArray(t.comments) && t.comments.length) return t.comments;
  const loc = getLocalExtrasMap()[t.id];
  return (loc && Array.isArray(loc.comments)) ? loc.comments : (Array.isArray(t.comments) ? t.comments : []);
}
function getPhotos(t) {
  if (!t) return [];
  if (Array.isArray(t.photos) && t.photos.length) return t.photos;
  const loc = getLocalExtrasMap()[t.id];
  return (loc && Array.isArray(loc.photos)) ? loc.photos : (Array.isArray(t.photos) ? t.photos : []);
}
function getTaskZone(t) {
  if (!t) return '';
  if (t.zone) return t.zone;
  const loc = getLocalExtrasMap()[t.id];
  return (loc && loc.zone) ? loc.zone : '';
}
function getUserPin(u) {
  if (!u) return '';
  if (u.pin_code !== undefined && u.pin_code !== null) return String(u.pin_code);
  try {
    const pins = JSON.parse(localStorage.getItem('obj_user_pins') || '{}');
    return pins[u.id] ? String(pins[u.id]) : '';
  } catch (e) { return ''; }
}
function saveUserPinLocal(uid, pin) {
  try {
    const pins = JSON.parse(localStorage.getItem('obj_user_pins') || '{}');
    if (pin) pins[uid] = String(pin);
    else delete pins[uid];
    localStorage.setItem('obj_user_pins', JSON.stringify(pins));
  } catch (e) {}
}

function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('obj_theme', state.theme);
  applyTheme(state.theme);
  render();
}

// Comprime una foto desde cámara/galería usando Canvas (máx 820px, JPEG 0.72) para guardar rápido sin configurar buckets externos
function compressImageFile(file, maxDim = 820, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

function openPhotoLightbox(url, caption = '') {
  const existing = document.getElementById('photo-lightbox');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'photo-lightbox';
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <img src="${esc(url)}" alt="Evidencia">
    ${caption ? `<div class="lightbox-caption"><b>${esc(caption)}</b></div>` : ''}
    <button type="button" class="btn btn-sm" style="margin-top:14px;background:#fff;color:#111">✕ Cerrar vista</button>
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

// Filtro de notificaciones dirigidas: si el usuario eligió 'mine', solo notifica si la tarea es suya, es ayudante o es SOS
function shouldNotifyMeForTask(t, isSos = false) {
  if (!state.me) return false;
  if (state.notifMode !== 'mine') return true;
  if (isSos || Boolean(t.needs_help)) return true;
  const myId = Number(state.me.id);
  return Number(t.assignee_id) === myId || getHelperIds(t).includes(myId) || Number(t.created_by) === myId;
}

// Calcula el ranking de compañerismo (quiénes más han apoyado tareas como ayudantes o sacado adelante tareas de compañeros)
function getCompanerismoStats() {
  const allPublic = state.tasks.filter((t) => t.active && !t.is_private);
  const stats = activeUsers().map((u) => {
    const uid = Number(u.id);
    const items = [];

    for (const t of allPublic) {
      const assigneeId = t.assignee_id ? Number(t.assignee_id) : null;
      const completedById = t.completed_by ? Number(t.completed_by) : null;
      const otherHelpers = getHelperIds(t).filter((hid) => hid !== assigneeId);
      const inHelpers = otherHelpers.includes(uid);

      // Si una tarea tiene > 3 ayudantes marcados, es una tarea masiva/grupal asignada a todo el equipo;
      // en ese caso solo cuenta como apoyo individual si la persona la finalizó, comentó o subió foto.
      const isMassTask = otherHelpers.length > 3;
      const participatedInTask =
        completedById === uid ||
        getComments(t).some((c) => Number(c.user_id) === uid || c.user_name === u.name) ||
        getPhotos(t).some((p) => p.by === u.name);

      const isDirectHelper = inHelpers && (!isMassTask || participatedInTask);
      const completedForTeammate =
        t.status === 'terminada' &&
        completedById === uid &&
        Boolean(assigneeId && assigneeId !== uid);

      if (isDirectHelper || completedForTeammate) {
        items.push({
          task: t,
          isDirectHelper,
          completedForTeammate,
          isDone: t.status === 'terminada'
        });
      }
    }

    const doneItems = items.filter((x) => x.isDone);
    const completedForOthersCount = items.filter((x) => x.completedForTeammate).length;
    const helpedMinutes = items.reduce((s, x) => s + (x.task.estimated_minutes || 0), 0);
    // Puntaje: 3 pts si finalizó la tarea de otro compañero, 2 pts por apoyo terminado, 1 pt por apoyo en curso
    const score = items.reduce((s, x) => {
      if (x.completedForTeammate) return s + 3;
      if (x.isDone) return s + 2;
      return s + 1;
    }, 0);

    return {
      user: u,
      items,
      totalHelped: items.length,
      doneHelped: doneItems.length,
      completedForOthersCount,
      helpedMinutes,
      score
    };
  }).filter((x) => x.totalHelped > 0)
    .sort((a, b) => b.score - a.score || b.doneHelped - a.doneHelped || b.completedForOthersCount - a.completedForOthersCount || b.helpedMinutes - a.helpedMinutes);
  return stats;
}

/* ---------- Sistema de Notificaciones del Equipo + Web Push (VAPID) ---------- */
const notifiedDueAlerts = new Set();
const sentNotificationKeys = new Set();
const knownTasksSnapshot = new Map();
let initialTasksLoaded = false;
let swRegPromise = null;

const VAPID_PUBLIC_KEY = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.vapidPublicKey)
  ? SUPABASE_CONFIG.vapidPublicKey
  : 'BAKsGKOnwhZPA69o7_YwR25xO0sz0vd4EBFoIBMxcS_A_3IpZ8NaYl-kXwr28BqYGrb7nLynWIbzQjtcx5uMf04';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isNotificationsMuted() {
  return localStorage.getItem('obj_notifications_disabled') === 'true';
}

function canNotify() {
  return !isNotificationsMuted();
}

function isNotificationGranted() {
  return ('Notification' in window) && Notification.permission === 'granted';
}

let hasWebPushSubscription = false;
const pushReceivedTags = new Set();

// Suscribe el dispositivo a Web Push (VAPID) y guarda el endpoint en Supabase (push_subscriptions)
async function subscribeDeviceToWebPush(reg) {
  if (!reg || !('pushManager' in reg) || !state.me || !sb) return null;
  if (!isNotificationGranted() || isNotificationsMuted()) return null;
  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub && VAPID_PUBLIC_KEY) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    if (sub) {
      const subJson = sub.toJSON();
      if (subJson && subJson.endpoint && subJson.keys) {
        const { error } = await sb.from('push_subscriptions').upsert({
          user_id: state.me.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          user_agent: navigator.userAgent.slice(0, 250),
          updated_at: nowIso()
        }, { onConflict: 'endpoint' });
        if (!error) hasWebPushSubscription = true;
      }
    }
    return sub;
  } catch (err) {
    console.warn('Aviso al registrar suscripción Web Push:', err);
    return null;
  }
}

// Envía notificación Web Push real a los dispositivos cerrados/bloqueados mediante Supabase Edge Function (send-push)
async function dispatchRemoteWebPush({ title, body, tag, targetUserIds = null, excludeUserId = null }) {
  if (!sb || !title) return;
  const canonicalTag = normalizeNotificationTag(tag);
  try {
    await sb.functions.invoke('send-push', {
      body: {
        title,
        body: body || '',
        tag: canonicalTag,
        url: './',
        targetUserIds,
        excludeUserId
      }
    });
  } catch (err) {
    // Si la Edge Function aún no está desplegada, continúa silenciosamente con Realtime + SW local
    console.warn('Edge Function send-push no disponible o error:', err);
  }
}

// Normaliza cualquier variante de tag para que Web Push, Webhook, Realtime y Service Worker usen el mismo tag exacto
function normalizeNotificationTag(rawTag) {
  const tag = String(rawTag || '');
  let m;
  if ((m = tag.match(/^(?:task-new|new)-(\d+)/))) return `task-new-${m[1]}`;
  if ((m = tag.match(/^(?:task-done|done)-(\d+)/))) return `done-${m[1]}-terminada`;
  if ((m = tag.match(/^(?:task-take|taken)-(\d+)/))) return `taken-${m[1]}`;
  if ((m = tag.match(/^(?:task-start|prog)-(\d+)/))) return `prog-${m[1]}`;
  if ((m = tag.match(/^(?:task-help|help)-(\d+)/))) return `help-${m[1]}`;
  if ((m = tag.match(/^(?:task-helper|helper)-(\d+)/))) return `helper-${m[1]}`;
  return tag || ('notif-' + Date.now());
}

function markNotificationTagHandled(rawTag) {
  const canonical = normalizeNotificationTag(rawTag);
  sentNotificationKeys.add(canonical);
  pushReceivedTags.add(canonical);
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({ type: 'REGISTER_TAG', tag: canonical });
    } catch (e) {}
  }
}

let swMessageListenerBound = false;

// Registra y activa inmediatamente el Service Worker (vital para notificaciones nativas en Android / PWA)
async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    if (!swMessageListenerBound) {
      swMessageListenerBound = true;
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'PUSH_RECEIVED' && e.data.tag) {
          const canonical = normalizeNotificationTag(e.data.tag);
          const alreadySeen = sentNotificationKeys.has(canonical);
          sentNotificationKeys.add(canonical);
          pushReceivedTags.add(canonical);
          if (!alreadySeen && document.visibilityState === 'visible') {
            playNotificationSound();
            showInAppNotificationBanner(e.data.title || '🔔 Objetivos · Wellness', e.data.body || '');
          }
        }
      });
    }
    if (!swRegPromise) {
      swRegPromise = navigator.serviceWorker.register('./sw.js?v=11');
    }
    const reg = await Promise.race([
      swRegPromise,
      new Promise((res) => setTimeout(() => res(null), 2500))
    ]);
    if (reg) {
      try { reg.update(); } catch (e) {}
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      const worker = reg.active || reg.installing || reg.waiting;
      if (worker && state.me && typeof SUPABASE_CONFIG !== 'undefined') {
        worker.postMessage({
          type: 'INIT_BG_SYNC',
          url: SUPABASE_CONFIG.url,
          anonKey: SUPABASE_CONFIG.anonKey,
          userId: state.me.id,
          userRole: state.me.role
        });
      }
      if ('periodicSync' in reg) {
        try {
          await reg.periodicSync.register('check-tasks-sync', { minInterval: 60000 });
        } catch (e) {}
      }
      if (isNotificationGranted() && state.me) {
        subscribeDeviceToWebPush(reg);
      }
    }
    return reg;
  } catch (err) {
    console.warn('Error registrando SW:', err);
    return null;
  }
}

// Sonido suave de notificación mediante Web Audio API (sin archivos externos)
function playNotificationSound() {
  if (isNotificationsMuted()) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.11); // A5
    osc2.frequency.setValueAtTime(293.66, now);
    osc2.frequency.setValueAtTime(440, now + 0.11);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Ignorar si el navegador bloquea audio antes de interacción
  }
}

// Tarjeta visual flotante tipo Push en la parte superior de la pantalla
function showInAppNotificationBanner(title, body) {
  if (isNotificationsMuted()) return;
  let root = document.getElementById('notif-floating-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'notif-floating-root';
    document.body.appendChild(root);
  }
  const card = document.createElement('div');
  card.className = 'floating-notif';
  card.innerHTML = `
    <div class="floating-notif-icon">${ICON.bell}</div>
    <div class="floating-notif-body">
      <b>${esc(title)}</b>
      ${body ? `<p>${esc(body)}</p>` : ''}
    </div>
    <button type="button" class="floating-notif-close" aria-label="Cerrar">✕</button>
  `;
  const removeCard = () => {
    if (card.parentNode) card.remove();
  };
  card.addEventListener('click', removeCard);
  root.appendChild(card);
  setTimeout(removeCard, 6500);
}

async function requestNotificationPermission() {
  localStorage.setItem('obj_notifications_disabled', 'false');
  await ensureServiceWorker();

  if (!('Notification' in window)) {
    toast('En iPhone/iPad debes instalar la app en Pantalla de Inicio (Compartir → Agregar a inicio) para recibir notificaciones al dispositivo.', 'error');
    await sendLocalNotification('🔔 Alertas en pantalla activadas', {
      body: 'Para recibir alertas fuera de la app en iPhone, agrégala a la Pantalla de Inicio desde Safari.',
      tag: 'notif-welcome-' + Date.now()
    });
    render();
    return false;
  }

  try {
    const permission = await new Promise((resolve) => {
      try {
        const res = Notification.requestPermission((p) => resolve(p));
        if (res && typeof res.then === 'function') {
          res.then(resolve).catch(() => resolve(Notification.permission));
        }
      } catch (e) {
        resolve(Notification.permission);
      }
    });

    if (permission === 'granted') {
      const reg = await ensureServiceWorker();
      if (reg) await subscribeDeviceToWebPush(reg);
      toast('¡Permiso del dispositivo concedido! 🎉', 'ok');
      await sendLocalNotification('🔔 Notificaciones del dispositivo activadas', {
        body: 'Recibirás alertas en tu dispositivo cuando se creen, tomen o finalicen tareas.',
        tag: 'notif-welcome-' + Date.now(),
        immediate: true
      });
      render();
      return true;
    } else if (permission === 'denied') {
      toast('⚠️ El navegador tiene bloqueadas las notificaciones. Haz clic en el candado junto a la URL arriba y cambia Notificaciones a "Permitir".', 'error');
      showInAppNotificationBanner(
        '⚠️ Permiso bloqueado en tu navegador',
        'Toca el icono de ajustes/candado a la izquierda de la dirección web arriba → Permisos → Notificaciones → Permitir.'
      );
      render();
      return false;
    }
  } catch (err) {
    toast('Aviso: ' + err.message, 'error');
  }
  return false;
}

async function sendLocalNotification(title, options = {}) {
  if (isNotificationsMuted() || !state.me) return false;

  const tag = normalizeNotificationTag(options.tag || ('notif-' + Date.now()));
  sentNotificationKeys.add(tag);

  // 1. Emitir alerta visual flotante y sonido en la app cuando está visible
  if (document.visibilityState === 'visible') {
    playNotificationSound();
    showInAppNotificationBanner(title, options.body || '');
  }

  // 2. Verificar soporte y permiso del sistema operativo / navegador
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const opts = {
    body: options.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag,
    renotify: false,
    requireInteraction: false,
    silent: false
  };

  const triggerNativeSwNotification = async () => {
    // Si ya llegó por Web Push mientras esperábamos, no enviar notificación local adicional
    if (!options.immediate && pushReceivedTags.has(tag)) return true;
    try {
      const reg = await ensureServiceWorker();
      const activeWorker = reg && (reg.active || navigator.serviceWorker.controller);
      if (activeWorker) {
        activeWorker.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body: opts.body,
          tag
        });
        return true;
      } else if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, opts);
        return true;
      }
    } catch (swErr) {
      console.warn('SW showNotification fallback:', swErr);
    }

    try {
      const n = new Notification(title, opts);
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (err) {
      return false;
    }
  };

  // Si el dispositivo tiene Web Push activo y no es el botón de prueba, dar prioridad a Web Push (2.5s)
  // y solo disparar local si Web Push no llegó, evitando cualquier notificación doble.
  if (!options.immediate && hasWebPushSubscription) {
    setTimeout(() => {
      if (!pushReceivedTags.has(tag)) {
        triggerNativeSwNotification();
      }
    }, 2500);
    return true;
  }

  return await triggerNativeSwNotification();
}

function makeTaskSnapshot(t) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    assignee_id: t.assignee_id,
    completed_by: t.completed_by,
    created_by: t.created_by,
    needs_help: Boolean(t.needs_help),
    help_note: t.help_note || '',
    is_private: Boolean(t.is_private),
    active: Boolean(t.active),
    helper_ids: getHelperIds(t).join(','),
    commentsCount: getComments(t).length
  };
}

// Detecta cambios entre la lista anterior y la nueva (funciona tanto con Realtime como con refresco/acciones)
function detectTaskChangesAndNotify(newTasks) {
  if (!Array.isArray(newTasks)) return false;

  if (!initialTasksLoaded) {
    knownTasksSnapshot.clear();
    for (const t of newTasks) {
      knownTasksSnapshot.set(t.id, makeTaskSnapshot(t));
    }
    initialTasksLoaded = true;
    return false;
  }

  let anyChanged = false;

  for (const t of newTasks) {
    const prev = knownTasksSnapshot.get(t.id);
    const curr = makeTaskSnapshot(t);
    knownTasksSnapshot.set(t.id, curr);

    // Respetar privacidad: nunca notificar tareas privadas ajenas
    if (t.is_private && (!state.me || t.created_by !== state.me.id)) continue;
    if (!t.active) continue;

    // Caso 1: Nueva tarea creada
    if (!prev) {
      anyChanged = true;
      const key = `task-new-${t.id}`;
      if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
        sentNotificationKeys.add(key);
        const creator = t.created_by ? userName(t.created_by) : 'Alguien';
        sendLocalNotification('📌 Nueva tarea creada', {
          body: `${creator} creó: "${t.title}"`,
          tag: key
        });
      }
      continue;
    }

    // Verificar si hubo algún cambio en esta tarea
    if (
      prev.status !== curr.status ||
      prev.assignee_id !== curr.assignee_id ||
      prev.needs_help !== curr.needs_help ||
      prev.helper_ids !== curr.helper_ids ||
      prev.commentsCount !== curr.commentsCount ||
      prev.title !== curr.title
    ) {
      anyChanged = true;
    }

    // Caso 2: Tarea finalizada (usar tag 'done-${id}-terminada' idéntico a la Edge Function en Supabase)
    if (curr.status === 'terminada' && prev.status !== 'terminada') {
      const key = `done-${t.id}-terminada`;
      if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
        sentNotificationKeys.add(key);
        const finisher = t.completed_by ? userName(t.completed_by) : (t.assignee_id ? userName(t.assignee_id) : 'Un compañero');
        sendLocalNotification('✅ Tarea finalizada', {
          body: `${finisher} terminó: "${t.title}"`,
          tag: key
        });
      }
      continue;
    }

    // Caso 3: Alguien tomó o fue asignado a la tarea
    if (curr.assignee_id && prev.assignee_id !== curr.assignee_id) {
      const key = `taken-${t.id}`;
      if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
        sentNotificationKeys.add(key);
        const taker = userName(curr.assignee_id);
        sendLocalNotification('👤 Tarea tomada / asignada', {
          body: `${taker} tomó la tarea: "${t.title}"`,
          tag: key
        });
      }
    }

    // Caso 4: Tarea puesta en progreso
    if (curr.status === 'en_progreso' && prev.status !== 'en_progreso') {
      const key = `prog-${t.id}`;
      if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
        sentNotificationKeys.add(key);
        const who = curr.assignee_id ? userName(curr.assignee_id) : 'Un compañero';
        sendLocalNotification('▶️ Tarea en progreso', {
          body: `${who} inició: "${t.title}"`,
          tag: key
        });
      }
    }

    // Caso 5: Piden ayuda (SOS) (siempre notifica incluso en modo 'mine')
    if (curr.needs_help && !prev.needs_help) {
      const key = `help-${t.id}`;
      if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, true)) {
        sentNotificationKeys.add(key);
        const asker = curr.assignee_id ? userName(curr.assignee_id) : 'Un compañero';
        sendLocalNotification('🆘 Piden ayuda con una tarea', {
          body: `${asker} necesita apoyo en: "${t.title}"${curr.help_note ? ' (' + curr.help_note + ')' : ''}`,
          tag: key
        });
      }
    }

    // Caso 6: Nuevo ayudante sumado
    if (curr.helper_ids && curr.helper_ids !== prev.helper_ids) {
      const prevSet = new Set(prev.helper_ids ? prev.helper_ids.split(',').map(Number) : []);
      const newIds = curr.helper_ids.split(',').map(Number).filter((id) => id && !prevSet.has(id));
      if (newIds.length) {
        const key = `helper-${t.id}`;
        if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
          sentNotificationKeys.add(key);
          const names = newIds.map(userName).join(', ');
          sendLocalNotification('🤝 Nuevo apoyo en tarea', {
            body: `${names} se sumó como ayudante en: "${t.title}"`,
            tag: key
          });
        }
      }
    }

    // Caso 7: Nuevo comentario en tarea
    if (curr.commentsCount > prev.commentsCount) {
      const comments = getComments(t);
      const lastComment = comments[comments.length - 1];
      const key = `comment-${t.id}-${curr.commentsCount}`;
      if (lastComment && (!state.me || Number(lastComment.user_id) !== Number(state.me.id))) {
        if (!sentNotificationKeys.has(key) && shouldNotifyMeForTask(t, false)) {
          sentNotificationKeys.add(key);
          sendLocalNotification(`💬 Comentario en "${t.title}"`, {
            body: `${lastComment.user_name || 'Compañero'}: ${lastComment.text}`,
            tag: key
          });
        }
      }
    }
  }

  return anyChanged;
}

function handleTaskRealtimeNotification(payload) {
  if (!state.me || !payload || !payload.new) return;
  const row = payload.new;
  if (row.is_private && row.created_by !== state.me.id) return;
  // Alimentar detector de cambios en tiempo real inmediatamente
  const updatedList = state.tasks.some((t) => t.id === row.id)
    ? state.tasks.map((t) => (t.id === row.id ? { ...t, ...row } : t))
    : [...state.tasks, row];
  detectTaskChangesAndNotify(updatedList);
}

function checkDueTasksForNotification() {
  if (isNotificationsMuted() || !state.me) return;
  const now = Date.now();
  const tasksToCheck = activeTasks().filter((t) => {
    if (t.status === 'terminada' || !t.due_at) return false;
    if (t.is_private) return t.created_by === state.me.id;
    return isLead() || isAssignedOrHelper(t, state.me.id) || !t.assignee_id;
  });

  for (const t of tasksToCheck) {
    const due = parseLocal(t.due_at);
    if (!due) continue;
    const diffMin = Math.round((due.getTime() - now) / 60000);

    // Alerta crítica: faltan 15 minutos o menos
    if (diffMin > 0 && diffMin <= 15) {
      const key = `${t.id}_crit_15`;
      if (!notifiedDueAlerts.has(key)) {
        notifiedDueAlerts.add(key);
        sendLocalNotification(`🚨 ¡Últimos ${diffMin} min para terminar!`, {
          body: `"${t.title}" está a punto de vencer (${fmtDue(t.due_at).toLowerCase()})`,
          tag: `task-crit-${t.id}`
        });
      }
    }
    // Alerta preventiva: falta 1 hora o menos (16 a 60 min)
    else if (diffMin > 15 && diffMin <= 60) {
      const key = `${t.id}_soon_60`;
      if (!notifiedDueAlerts.has(key)) {
        notifiedDueAlerts.add(key);
        sendLocalNotification(`⏰ Tarea próxima a vencer (${diffMin} min)`, {
          body: `"${t.title}" vence ${fmtDue(t.due_at).toLowerCase()}`,
          tag: `task-due-${t.id}`
        });
      }
    }
    // Alerta de tarea vencida
    else if (diffMin <= 0) {
      const key = `${t.id}_overdue`;
      if (!notifiedDueAlerts.has(key)) {
        notifiedDueAlerts.add(key);
        sendLocalNotification('⚠️ Tarea vencida', {
          body: `"${t.title}" venció (${fmtDue(t.due_at).toLowerCase()}). Requiere atención.`,
          tag: `task-overdue-${t.id}`
        });
      }
    }
  }
}


function urgency(t) {
  if (t.status === 'terminada') {
    let label = 'Terminada';
    if (t.completed_by) {
      const finisherName = userName(t.completed_by);
      label += ` por ${finisherName}`;
    }
    if (t.completed_at) {
      label += ' ' + fmtDue(t.completed_at).toLowerCase();
    }
    return { level: 'done', label, ts: Infinity };
  }
  const d = parseLocal(t.due_at);
  if (!d) return { level: 'none', label: 'Sin fecha límite', ts: Infinity };
  const ms = d.getTime() - Date.now();
  const needMs = (t.status === 'en_progreso' ? 0.5 : 1) * (t.estimated_minutes || 0) * 60000;
  let level, label;
  if (ms < 0) { level = 'overdue'; label = `Vencida ${fmtRel(ms)}`; }
  else if (ms < needMs) { level = 'critical'; label = `No alcanza el tiempo · vence ${fmtRel(ms)}`; }
  else if (ms <= 4 * 36e5) { level = 'critical'; label = `Urgente · vence ${fmtRel(ms)}`; }
  else if (ms <= 24 * 36e5) { level = 'soon'; label = `Vence ${fmtRel(ms)}`; }
  else if (ms <= 72 * 36e5) { level = 'near'; label = `Vence ${fmtRel(ms)}`; }
  else { level = 'ok'; label = `A tiempo · vence ${fmtRel(ms)}`; }
  return { level, label, ts: d.getTime() };
}


function sortTasks(list) {
  return [...list].sort((a, b) => {
    // Si ambas están terminadas, mostrar las terminadas más recientemente primero
    if (a.status === 'terminada' && b.status === 'terminada') {
      const ta = parseLocal(a.completed_at) ? parseLocal(a.completed_at).getTime() : 0;
      const tb = parseLocal(b.completed_at) ? parseLocal(b.completed_at).getTime() : 0;
      return tb - ta;
    }
    const ua = urgency(a), ub = urgency(b);
    return URG_RANK[ua.level] - URG_RANK[ub.level]
      || PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
      || ua.ts - ub.ts;
  });
}
const isUrgent = (t) => ['overdue', 'critical'].includes(urgency(t).level);

function objectiveStats(o) {
  const ts = activeTasks().filter((t) => !t.is_private && t.objective_id === o.id);
  const w = (t) => Math.max(1, t.estimated_minutes || 0);
  const total = ts.reduce((s, t) => s + w(t), 0);
  const done = ts.filter((t) => t.status === 'terminada').reduce((s, t) => s + w(t), 0);
  const taskPct = total ? Math.round((done / total) * 100) : 0;
  const metricPct = o.metric_target ? clamp(Math.round((o.metric_current / o.metric_target) * 100)) : null;
  const progress = metricPct ?? taskPct;
  const start = parseLocal(o.start_date);
  const end = o.end_date ? parseLocal(o.end_date + 'T23:59') : null;
  const now = Date.now();
  const elapsed = start && end && end > start ? clamp(((now - start) / (end - start)) * 100) : null;
  const daysLeft = end ? Math.ceil((end - now) / 864e5) : null;
  let pace = { cls: 'neutral', label: 'Sin fechas' };
  if (progress >= 100) pace = { cls: 'good', label: '¡Cumplido!' };
  else if (end && now > end) pace = { cls: 'bad', label: 'No cumplido' };
  else if (start && now < start) pace = { cls: 'neutral', label: 'Aún no empieza' };
  else if (elapsed !== null) {
    if (progress >= elapsed - 5) pace = { cls: 'good', label: 'En ritmo' };
    else if (progress >= elapsed - 20) pace = { cls: 'warn', label: 'Algo atrasado' };
    else pace = { cls: 'bad', label: 'Atrasado' };
  }
  const counts = {};
  STATUS_ORDER.forEach((s) => (counts[s] = ts.filter((t) => t.status === s).length));
  return { tasks: ts, taskPct, metricPct, progress, elapsed, daysLeft, pace, counts };
}

/* ==========================================================================
   Operaciones en Supabase + Cola de Sincronización Offline
   ========================================================================== */
function assertSupabase() {
  if (!sb) throw new Error('Por favor configura la URL y la Anon Key de Supabase en public/config.js');
}

function saveOfflineQueue() {
  try { localStorage.setItem('obj_offline_queue', JSON.stringify(state.offlineQueue)); } catch (e) {}
}

function enqueueOfflineOp(op) {
  state.offlineQueue.push({ ...op, queuedAt: nowIso() });
  saveOfflineQueue();
  render();
}

// Separa columnas nuevas (zone, subtasks, comments, photos) por si la tabla en Supabase aún no tiene el ALTER TABLE
const EXTRA_TASK_COLS = ['zone', 'subtasks', 'comments', 'photos'];
function splitExtraTaskCols(payload) {
  const core = { ...payload };
  const extras = {};
  for (const k of EXTRA_TASK_COLS) {
    if (k in core) {
      extras[k] = core[k];
      delete core[k];
    }
  }
  return { core, extras };
}

async function safeTaskUpdate(id, patch, allowQueue = true) {
  const numId = Number(id);
  const { core, extras } = splitExtraTaskCols(patch);
  if (Object.keys(extras).length) saveLocalTaskExtra(numId, extras);

  // Actualizar estado optimista en memoria
  state.tasks = state.tasks.map((t) => (t.id === numId ? { ...t, ...patch } : t));

  if (!navigator.onLine && allowQueue) {
    enqueueOfflineOp({ type: 'update_task', id: numId, patch });
    return { offline: true };
  }

  try {
    const { error } = await sb.from('tasks').update(patch).eq('id', numId);
    if (error) {
      // Si el error es por columna nueva aún no creada en SQL, guardar con columnas base
      if (/column|schema cache/i.test(error.message) && Object.keys(core).length) {
        const { error: err2 } = await sb.from('tasks').update(core).eq('id', numId);
        if (err2) throw new Error(err2.message);
        return { ok: true };
      }
      throw new Error(error.message);
    }
    return { ok: true };
  } catch (err) {
    if (allowQueue && (!navigator.onLine || /fetch|network|Failed to fetch/i.test(err.message))) {
      enqueueOfflineOp({ type: 'update_task', id: numId, patch });
      return { offline: true };
    }
    throw err;
  }
}

async function safeTaskInsert(data, allowQueue = true) {
  const { core, extras } = splitExtraTaskCols(data);

  if (!navigator.onLine && allowQueue) {
    const tempId = Date.now();
    const optimistic = { id: tempId, active: true, ...data };
    state.tasks.unshift(optimistic);
    if (Object.keys(extras).length) saveLocalTaskExtra(tempId, extras);
    enqueueOfflineOp({ type: 'insert_task', data });
    return { data: optimistic, offline: true };
  }

  try {
    const { data: created, error } = await sb.from('tasks').insert([data]).select().single();
    if (error) {
      if (/column|schema cache/i.test(error.message)) {
        const { data: created2, error: err2 } = await sb.from('tasks').insert([core]).select().single();
        if (err2) throw new Error(err2.message);
        if (created2 && Object.keys(extras).length) saveLocalTaskExtra(created2.id, extras);
        return { data: created2 };
      }
      throw new Error(error.message);
    }
    if (created && Object.keys(extras).length) saveLocalTaskExtra(created.id, extras);
    return { data: created };
  } catch (err) {
    if (allowQueue && (!navigator.onLine || /fetch|network|Failed to fetch/i.test(err.message))) {
      const tempId = Date.now();
      const optimistic = { id: tempId, active: true, ...data };
      state.tasks.unshift(optimistic);
      enqueueOfflineOp({ type: 'insert_task', data });
      return { data: optimistic, offline: true };
    }
    throw err;
  }
}

async function safeUserPinUpdate(uid, pinValue) {
  saveUserPinLocal(uid, pinValue);
  state.users = state.users.map((u) => (u.id === Number(uid) ? { ...u, pin_code: pinValue || null } : u));
  if (state.me && state.me.id === Number(uid)) {
    state.me.pin_code = pinValue || null;
    localStorage.setItem('obj_user', JSON.stringify(state.me));
  }
  try {
    const { error } = await sb.from('users').update({ pin_code: pinValue || null }).eq('id', Number(uid));
    if (error && !/column|schema cache/i.test(error.message)) {
      throw new Error(error.message);
    }
  } catch (err) {
    if (!/column|schema cache/i.test(err.message)) console.warn('PIN guardado localmente:', err);
  }
}

let isFlushingQueue = false;
async function flushOfflineQueue() {
  if (isFlushingQueue || !navigator.onLine || !sb || !state.offlineQueue.length) return;
  isFlushingQueue = true;
  const pending = [...state.offlineQueue];
  const remaining = [];
  let syncedCount = 0;

  for (const op of pending) {
    try {
      if (op.type === 'update_task') {
        await safeTaskUpdate(op.id, op.patch, false);
        syncedCount++;
      } else if (op.type === 'insert_task') {
        await safeTaskInsert(op.data, false);
        syncedCount++;
      }
    } catch (e) {
      remaining.push(op);
    }
  }

  state.offlineQueue = remaining;
  saveOfflineQueue();
  isFlushingQueue = false;

  if (syncedCount > 0) {
    toast(`✅ Conexión recuperada: ${syncedCount} cambio(s) sincronizado(s)`, 'ok');
    await refresh();
  } else {
    render();
  }
}

async function logActivity(action, entity, entity_id, summary, details = null) {
  if (!sb || !navigator.onLine) return;
  try {
    await sb.from('activity').insert([{
      user_id: state.me ? state.me.id : null,
      user_name: state.me ? state.me.name : 'Sistema',
      action, entity, entity_id, summary, details,
      created_at: nowIso()
    }]);
  } catch (e) {
    console.error('Error registrando actividad', e);
  }
}

let dailyCheckinInFlight = false;

// Registra automáticamente el ingreso diario cuando el usuario ya tiene la sesión iniciada en su dispositivo
async function ensureDailySessionEntryLogged() {
  if (!sb || !navigator.onLine || !state.me || !state.me.id || dailyCheckinInFlight) return;
  const uid = Number(state.me.id);
  const today = todayStr();
  const dateKey = `obj_daily_entry_${uid}`;
  const pingKey = `obj_last_ping_${uid}`;
  const nowMs = Date.now();
  const lastPing = Number(localStorage.getItem(pingKey) || 0);
  const isNewDayOnDevice = localStorage.getItem(dateKey) !== today;

  // Si ya se registró hoy en este dispositivo y han pasado menos de 15 minutos, no hacer nada
  if (!isNewDayOnDevice && (nowMs - lastPing < 15 * 60 * 1000)) return;

  dailyCheckinInFlight = true;
  try {
    const isoNow = nowIso();
    localStorage.setItem(pingKey, String(nowMs));

    if (isNewDayOnDevice) {
      localStorage.setItem(dateKey, today);
      // Verificar en Supabase si ya existe un registro de ingreso (login) hoy para este usuario (en hora Bogotá -05:00)
      const startOfTodayBogota = `${today}T00:00:00-05:00`;
      const { data: existingToday } = await sb
        .from('activity')
        .select('id')
        .eq('user_id', uid)
        .eq('action', 'login')
        .gte('created_at', startOfTodayBogota)
        .limit(1);

      if (!existingToday || existingToday.length === 0) {
        await logActivity('login', 'usuario', uid, 'Ingresó a la aplicación (inicio de jornada)');
      }
    }

    // Mantener actualizado last_login en la tabla users para que "Último ingreso" sea siempre real
    await sb.from('users').update({ last_login: isoNow }).eq('id', uid);
    if (state.me && Number(state.me.id) === uid) {
      state.me.last_login = isoNow;
      localStorage.setItem('obj_user', JSON.stringify(state.me));
    }
    const uInState = state.users.find((u) => Number(u.id) === uid);
    if (uInState) uInState.last_login = isoNow;
  } catch (e) {
    console.warn('No se pudo registrar el check-in diario:', e);
  } finally {
    dailyCheckinInFlight = false;
  }
}

let autoFaltanteInFlight = false;

// Pasa automáticamente a estado "faltante" las tareas de días anteriores que quedaron en "sin_iniciar"
async function autoMarkOverdueAsFaltante() {
  if (!sb || !navigator.onLine || autoFaltanteInFlight) return;
  const today = todayStr();
  const toMark = state.tasks.filter((t) => {
    if (!t.active || t.status !== 'sin_iniciar' || !t.due_at) return false;
    const d = parseLocal(t.due_at);
    return d && dateStr(d) < today;
  });
  if (!toMark.length) return;

  autoFaltanteInFlight = true;
  try {
    const ids = toMark.map((t) => t.id);
    const isoNow = nowIso();
    for (const t of toMark) {
      t.status = 'faltante';
      t.updated_at = isoNow;
    }
    await sb.from('tasks').update({ status: 'faltante', updated_at: isoNow }).in('id', ids);
  } catch (e) {
    console.warn('Error en autoMarkOverdueAsFaltante:', e);
  } finally {
    autoFaltanteInFlight = false;
  }
}

async function generateRoutineTasks() {
  if (!sb || !navigator.onLine || !state.routines.length) return;
  const today = todayStr();
  const d = new Date();
  const wd = String(d.getDay() === 0 ? 7 : d.getDay()); // 1=L, 7=D
  const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  for (const r of state.routines.filter((x) => x.active)) {
    if (!r.weekdays.split(',').includes(wd)) continue;
    if (r.created_at && r.created_at.slice(0, 10) === today && r.due_time <= hhmm) continue;

    // Verificar si ya existe para hoy
    const exists = state.tasks.some((t) => t.routine_id === r.id && t.routine_date === today);
    if (!exists) {
      const payload = {
        title: r.title,
        description: r.description,
        objective_id: r.objective_id,
        routine_id: r.id,
        routine_date: today,
        assignee_id: r.assignee_id,
        estimated_minutes: r.estimated_minutes,
        priority: r.priority,
        zone: r.zone || '',
        due_at: `${today}T${r.due_time}:00-05:00`,
        created_by: r.created_by,
        created_at: nowIso(),
        updated_at: nowIso()
      };
      const { data } = await safeTaskInsert(payload, false).catch(() => ({ data: null }));

      if (data) {
        knownTasksSnapshot.set(data.id, makeTaskSnapshot(data));
        state.tasks.unshift(data);
        await logActivity('crear', 'tarea', data.id, `Generó la tarea diaria "${r.title}" para hoy`);
      }
    }
  }
}

async function refresh() {
  if (!sb) return;
  if (!navigator.onLine) {
    try {
      const cached = JSON.parse(localStorage.getItem('obj_offline_data') || 'null');
      if (cached) {
        state.users = cached.users || state.users;
        state.objectives = cached.objectives || state.objectives;
        state.tasks = cached.tasks || state.tasks;
        state.routines = cached.routines || state.routines;
      }
    } catch (e) {}
    render();
    return;
  }

  try {
    const [uRes, oRes, tRes, rRes] = await Promise.all([
      sb.from('users').select('*').order('name', { ascending: true }),
      sb.from('objectives').select('*').order('end_date', { ascending: true }),
      sb.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false }),
      sb.from('routines').select('*').order('due_time', { ascending: true })
    ]);

    if (uRes.error) throw new Error(uRes.error.message);
    state.users = uRes.data || [];
    state.objectives = oRes.data || [];
    const fetchedTasks = tRes.data || [];
    detectTaskChangesAndNotify(fetchedTasks);
    state.tasks = fetchedTasks;
    state.routines = rRes.data || [];

    // Guardar copia local para Modo Offline
    try {
      localStorage.setItem('obj_offline_data', JSON.stringify({
        users: state.users,
        objectives: state.objectives,
        tasks: state.tasks,
        routines: state.routines
      }));
    } catch (e) {}
  } catch (netErr) {
    try {
      const cached = JSON.parse(localStorage.getItem('obj_offline_data') || 'null');
      if (cached) {
        state.users = cached.users || state.users;
        state.objectives = cached.objectives || state.objectives;
        state.tasks = cached.tasks || state.tasks;
        state.routines = cached.routines || state.routines;
      }
    } catch (e) {}
    render();
    return;
  }

  // Actualizar usuario en sesión
  if (state.me) {
    const current = state.users.find((u) => u.id === state.me.id);
    if (current) {
      if (!current.active) {
        clearSession();
        toast('Tu usuario fue desactivado.', 'error');
        render();
        return;
      }
      state.me = current;
      localStorage.setItem('obj_user', JSON.stringify(current));
    }
  }

  await ensureDailySessionEntryLogged();
  await autoMarkOverdueAsFaltante();
  await generateRoutineTasks();
  if (state.view === 'actividad' || (state.view === 'mas' && state.more === 'estadisticas')) {
    await loadActivity(false);
  }
  render();
  checkDueTasksForNotification();
  maybeShowMorningShiftSummary();
}

// Sincronización silenciosa en segundo plano para detectar cambios de otros compañeros aunque Realtime falle
async function silentRefresh() {
  if (!sb || !state.me || !navigator.onLine) return;
  try {
    ensureDailySessionEntryLogged();
    if (state.offlineQueue.length) {
      await flushOfflineQueue();
      return;
    }
    const [uRes, tRes] = await Promise.all([
      sb.from('users').select('*').order('name', { ascending: true }),
      sb.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false })
    ]);
    if (uRes.data) state.users = uRes.data;
    if (tRes.data) {
      const changed = detectTaskChangesAndNotify(tRes.data);
      state.tasks = tRes.data;
      if (changed && !state.sheetOpen) render();
    }
    checkDueTasksForNotification();
  } catch (e) {
    console.warn('Silent refresh error:', e);
  }
}

async function loadActivity(rerender = true) {
  if (!sb || !navigator.onLine) return;
  let q = sb.from('activity').select('*').order('id', { ascending: false }).limit(400);
  if (state.filters.activityUser) q = q.eq('user_id', Number(state.filters.activityUser));
  const { data, error } = await q;
  if (!error) state.activity = data || [];
  if (rerender) render();
}

function clearSession() {
  state.me = null;
  localStorage.removeItem('obj_user');
}

async function run(fn, okMsg) {
  try {
    assertSupabase();
    await fn();
    if (okMsg) toast(okMsg + (!navigator.onLine ? ' (Guardado en cola offline 📡)' : ''), 'ok');
    if (navigator.onLine) await refresh();
    else render();
    return true;
  } catch (err) {
    toast(err.message, 'error');
    return false;
  }
}

/* ---------- Toast & Sheet ---------- */
function toast(msg, kind = '') {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), kind === 'error' ? 4500 : 2600);
}
function openSheet(html) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  root.classList.add('open');
  state.sheetOpen = true;
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  const root = $('#sheet-root');
  root.innerHTML = '';
  root.classList.remove('open');
  state.sheetOpen = false;
  document.body.style.overflow = '';
}
const sheetHead = (title) => `<div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-action="close-sheet" aria-label="Cerrar">${ICON.close}</button></div>`;

/* ==========================================================================
   Vistas y Componentes
   ========================================================================== */
const NAV = [
  { id: 'hoy', label: 'Mi día', icon: ICON.today },
  { id: 'tablero', label: 'Tablero', icon: ICON.board },
  { id: 'objetivos', label: 'Objetivos', icon: ICON.target },
  { id: 'actividad', label: 'Actividad', icon: ICON.activity },
  { id: 'mas', label: 'Más', icon: ICON.more },
];

function navBadge(id) {
  if (id === 'hoy') return activeTasks().filter((t) => isAssignedOrHelper(t, state.me && state.me.id) && isOpen(t) && isUrgent(t)).length;
  if (id === 'tablero') return activeTasks().filter((t) => t.needs_help && isOpen(t)).length;
  return 0;
}


function render() {
  const app = $('#app');
  if (!sb) {
    app.innerHTML = `
      <div class="login"><div class="login-card">
        <div class="brand-mark"><img src="icon.svg" alt=""></div>
        <h1>Falta configuración</h1>
        <p class="muted">Abre el archivo <code>public/config.js</code> y coloca tu URL y tu Anon Key de Supabase.</p>
      </div></div>`;
    return;
  }
  if (!state.me) { app.innerHTML = renderLogin(); return; }

  const navBtns = () => NAV.map((n) => {
    const b = navBadge(n.id);
    return `<button class="${state.view === n.id ? 'active' : ''}" data-action="nav" data-view="${n.id}">${n.icon}<span>${n.label}</span>${b ? `<i class="badge">${b}</i>` : ''}</button>`;
  }).join('');
  const showFab = ['hoy', 'tablero', 'objetivos'].includes(state.view);
  const isDark = state.theme === 'dark';

  const offlineBannerHtml = !navigator.onLine
    ? `<div class="offline-bar">
         <span>📡 Modo sin conexión · Puedes seguir trabajando (${state.offlineQueue.length} cambio(s) en cola)</span>
       </div>`
    : state.offlineQueue.length > 0
      ? `<div class="sync-bar">
           <span>🔄 Sincronizando ${state.offlineQueue.length} cambio(s) guardado(s) sin conexión…</span>
           <button type="button" class="btn btn-sm btn-success" data-action="sync-offline-now">Sincronizar</button>
         </div>`
      : '';

  app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand-row"><div class="brand"><img src="icon.svg" alt=""></div><div><b>${esc(TEAM_NAME)}</b><span>${esc(STORE_NAME)} · Objetivos</span></div></div>
      <nav>${navBtns()}</nav>
      <div class="me">
        <span class="avatar">${esc(initials(state.me.name))}</span>
        <div><b>${esc(state.me.name)}</b><span>${ROLE[state.me.role]}</span></div>
        <button class="icon-btn" title="${isDark ? 'Modo claro' : 'Modo oscuro'}" data-action="toggle-theme">${isDark ? ICON.sun : ICON.moon}</button>
        <button class="icon-btn" title="Cerrar sesión" data-action="logout">${ICON.logout}</button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="brand"><img src="icon.svg" alt=""></div>
        <div class="t"><b>${esc(TEAM_NAME)}</b><span>${esc(STORE_NAME)} · ${ROLE[state.me.role]}</span></div>
        <button class="icon-btn" style="color:#fff" title="${isDark ? 'Modo claro' : 'Modo oscuro'}" data-action="toggle-theme">${isDark ? ICON.sun : ICON.moon}</button>
        <span class="avatar" data-action="nav" data-view="mas">${esc(initials(state.me.name))}</span>
      </header>
      ${offlineBannerHtml}
      <div class="content">${renderView()}</div>
    </main>
    <nav class="bottomnav">${navBtns()}</nav>
    ${showFab ? `<button class="fab" data-action="${state.view === 'objetivos' && isLead() ? 'new-objective' : 'new-task'}" aria-label="Nuevo">${ICON.plus}</button>` : ''}
  </div>`;
}

function renderView() {
  switch (state.view) {
    case 'tablero': return viewBoard();
    case 'objetivos': return viewObjectives();
    case 'actividad': return viewActivity();
    case 'mas': return viewMore();
    default: return viewToday();
  }
}

function renderLogin() {
  const chips = activeUsers().map((u) => {
    const hasPin = Boolean(getUserPin(u));
    return `<button class="chip" data-action="login-pick" data-name="${esc(u.name)}">${hasPin ? '🔒 ' : ''}${esc(u.name)}</button>`;
  }).join('');
  return `
  <div class="login"><div class="login-card">
    <div class="brand-mark"><img src="icon.svg" alt=""></div>
    <h1>Objetivos del equipo</h1>
    <p class="muted">${esc(STORE_NAME)} · ${esc(TEAM_NAME)}</p>
    <form data-form="login" class="stack" autocomplete="off">
      <label class="field"><span>¿Cómo te llamas?</span>
        <input name="name" placeholder="Ej: Juan Pérez" maxlength="40" required autocapitalize="words"></label>
      <button class="btn btn-primary btn-lg" type="submit">Entrar</button>
    </form>
    ${chips ? `<div class="quick-users"><p class="muted small">¿Ya entraste antes? Toca tu nombre:</p><div class="chips">${chips}</div></div>` : ''}
    <p class="login-note small muted">Puedes proteger tu perfil con un PIN de 4 dígitos desde el menú <b>Más → PIN de seguridad</b>.</p>
  </div></div>`;
}

function taskCard(t) {
  const u = urgency(t);
  const obj = t.objective_id ? objById(t.objective_id) : null;
  const helpers = getHelperIds(t);
  const me = state.me ? state.me.id : null;
  const isMyTask = t.assignee_id === me;
  const amHelper = helpers.includes(me);
  const zone = getTaskZone(t);
  const subtasks = getSubtasks(t);
  const comments = getComments(t);
  const photos = getPhotos(t);

  const actions = [];
  if (t.active && isOpen(t)) {
    if (!t.assignee_id) {
      actions.push(`<button class="btn btn-primary btn-sm" data-action="take-task" data-id="${t.id}">Tomar tarea</button>`);
    } else {
      // Si la tarea ya tiene responsable pero no soy yo, puedo unirme como ayudante o salirme
      if (!isMyTask && me) {
        if (!amHelper) {
          actions.push(`<button class="btn btn-warn btn-sm" data-action="join-helper" data-id="${t.id}">🤝 Apoyar como ayudante</button>`);
        } else {
          actions.push(`<button class="btn btn-ghost btn-sm" data-action="leave-helper" data-id="${t.id}">Dejar de apoyar</button>`);
        }
      }

      if (canEditTask(t)) {
        if (t.status === 'sin_iniciar' || t.status === 'faltante') {
          actions.push(`<button class="btn btn-primary btn-sm" data-action="task-status" data-status="en_progreso" data-id="${t.id}">▶ Iniciar</button>`);
        }
        if (t.status === 'en_progreso') {
          actions.push(`<button class="btn btn-success btn-sm" data-action="task-status" data-status="terminada" data-id="${t.id}">✓ Terminar</button>`);
        }
        if (t.status === 'faltante' || u.level === 'overdue') {
          actions.push(`<button class="btn btn-ghost btn-sm" data-action="reschedule-today" data-id="${t.id}" title="Mover fecha límite para hoy en 1 toque">📅 Reprogramar hoy</button>`);
        }
        if (isMyTask || amHelper) {
          actions.push(t.needs_help
            ? `<button class="btn btn-ghost btn-sm" data-action="help-off" data-id="${t.id}">Ya no necesito ayuda</button>`
            : `<button class="btn btn-warn btn-sm" data-action="help-on" data-id="${t.id}">🆘 Pedir ayuda</button>`);
        }
        actions.push(`<button class="btn btn-ghost btn-sm" data-action="quick-photo" data-id="${t.id}" title="Adjuntar foto de evidencia">${ICON.camera} Foto${photos.length ? ` (${photos.length})` : ''}</button>`);
      }
    }
  }

  // Botón rápido de hilo de comentarios / notas de turno
  if (t.active) {
    actions.push(`<button class="btn btn-ghost btn-sm" data-action="open-comments" data-id="${t.id}" title="Comentarios y notas de turno">${ICON.chat} ${comments.length ? `${comments.length}` : 'Comentar'}</button>`);
  }

  // Si soy el creador y tengo rol con tareas privadas, puedo cambiar entre pública y privada
  if (t.active && canTogglePrivacy(t)) {
    if (t.is_private) {
      actions.push(`<button class="btn btn-ghost btn-sm" data-action="toggle-privacy" data-id="${t.id}" title="Hacer visible para todo el equipo">${ICON.unlock} Hacer pública</button>`);
    } else {
      actions.push(`<button class="btn btn-ghost btn-sm" data-action="toggle-privacy" data-id="${t.id}" title="Hacer privada (solo visible para ti)">${ICON.lock} Hacer privada</button>`);
    }
  }

  let real = '';
  if (t.status === 'terminada' && t.started_at && t.completed_at) {
    const startD = parseLocal(t.started_at);
    const compD = parseLocal(t.completed_at);
    if (startD && compD) {
      const mins = (compD.getTime() - startD.getTime()) / 60000;
      if (mins >= 0) real = `<span title="Tiempo real">${ICON.timer} real ${fmtMinutes(mins)}</span>`;
    }
  }

  // Renderizar ayudantes
  const helpersHtml = helpers.length ? `
    <span class="helpers-badges">
      ${ICON.users}
      ${helpers.map((hid) => {
        const hName = userName(hid);
        const isMeTag = hid === me;
        return `<span class="helper-tag ${isMeTag ? 'is-me' : ''}" title="Ayudante">${esc(hName)}${isMeTag ? ' (tú)' : ''}</span>`;
      }).join('')}
    </span>` : '';

  // Detectar si es tarea grupal (tiene casillas por participante o más de 3 ayudantes)
  const hasMemberChecks = subtasks.some((s) => s.is_member_check || /^👤\s/.test(s.text || ''));
  const isGroupTask = hasMemberChecks || helpers.length > 3;
  const myNameLower = (state.me && state.me.name ? state.me.name : '').toLowerCase();

  // Renderizar Checklist de Subtareas interactivo en la tarjeta
  let subtasksHtml = '';
  if (subtasks.length > 0) {
    const doneSub = subtasks.filter((s) => s.done).length;
    const pctSub = Math.round((doneSub / subtasks.length) * 100);
    subtasksHtml = `
      <div class="subtasks-card-preview" data-action="noop">
        <div class="subtasks-progress-head">
          <span>${hasMemberChecks ? '👥 Avance por persona' : '☑️ Pasos'} (${doneSub}/${subtasks.length})</span>
          <span>${pctSub}%</span>
        </div>
        <div class="subtasks-bar"><i style="width:${pctSub}%"></i></div>
        ${subtasks.map((st, idx) => {
          const isMineSub = (st.user_id && Number(st.user_id) === me) || (myNameLower && String(st.text || '').toLowerCase().includes(myNameLower));
          return `
          <label class="subtask-row ${st.done ? 'done' : ''} ${isMineSub ? 'is-mine' : ''}" data-action="toggle-subtask" data-id="${t.id}" data-idx="${idx}">
            <input type="checkbox" ${st.done ? 'checked' : ''} ${canEditTask(t) ? '' : 'disabled'} tabindex="-1">
            <span>${esc(st.text)}</span>
            ${isMineSub && !st.done ? '<span class="pill st-en_progreso" style="margin-left:auto;font-size:10.5px;padding:1px 6px">Tu parte</span>' : ''}
          </label>`;
        }).join('')}
      </div>`;
  }

  // Renderizar miniaturas de fotos de evidencia
  let photosHtml = '';
  if (photos.length > 0) {
    photosHtml = `
      <div class="task-photos-strip">
        ${photos.map((p, idx) => `
          <div class="photo-thumb" data-action="view-photo" data-id="${t.id}" data-idx="${idx}" title="Ver evidencia fotográfica">
            <img src="${esc(p.url)}" alt="Evidencia">
            <span class="photo-tag">${esc(p.label || 'Evidencia')}</span>
          </div>
        `).join('')}
      </div>`;
  }

  // Último comentario visible como vista previa
  const lastComment = comments.length ? comments[comments.length - 1] : null;
  const lastCommentHtml = lastComment ? `
    <div class="small muted" style="margin-top:6px;padding:5px 8px;background:var(--bg);border-radius:8px;border-left:3px solid var(--blue)">
      💬 <b>${esc(lastComment.user_name)}:</b> ${esc(lastComment.text)}
    </div>` : '';

  return `
  <article class="task u-${u.level} ${t.needs_help && isOpen(t) ? 'needs-help' : ''} ${t.is_private ? 'is-private' : ''} ${t.active ? '' : 'is-hidden'}" data-action="open-task" data-id="${t.id}">
    <div class="task-top">
      <span class="pill st-${t.status}">${STATUS[t.status]}</span>
      ${zone ? `<span class="pill pill-zone">${esc(ZONE_MAP[zone] || zone)}</span>` : ''}
      ${isGroupTask ? `<span class="pill pill-group" title="Tarea grupal del equipo">👥 Grupal</span>` : ''}
      ${t.is_private ? `<span class="pill pill-private" title="Solo tú puedes ver esta tarea">${ICON.lock} Privada</span>` : ''}
      ${t.priority !== 'media' ? `<span class="pill prio-${t.priority}">Prioridad ${PRIORITY[t.priority].toLowerCase()}</span>` : ''}
      ${t.routine_id ? `<span class="pill">${ICON.repeat} Diaria</span>` : ''}
    </div>
    <h3>${esc(t.title)}</h3>
    <div class="meta">
      <span>${ICON.clock} ${esc(fmtDue(t.due_at))}</span>
      <span>${ICON.user} ${t.assignee_id ? esc(userName(t.assignee_id)) : '<em>Sin asignar</em>'}</span>
      ${helpersHtml}
      <span title="Tiempo estimado">${ICON.timer} ${fmtMinutes(t.estimated_minutes)}</span>
      ${real}
      ${obj ? `<span>${ICON.target} ${esc(obj.title)}</span>` : ''}
    </div>
    <div class="urg-label">${esc(u.label)}</div>
    ${subtasksHtml}
    ${photosHtml}
    ${lastCommentHtml}
    ${t.needs_help && isOpen(t) ? `<div class="help-box">🆘 Necesita ayuda${t.help_note ? ': ' + esc(t.help_note) : ''}</div>` : ''}
    ${actions.length ? `<div class="task-actions">${actions.join('')}</div>` : ''}
  </article>`;
}


const taskList = (list, emptyMsg) => (list.length
  ? `<div class="list">${list.map(taskCard).join('')}</div>`
  : `<div class="empty">${emptyMsg}</div>`);

const legend = () => `<div class="legend">
  <span><i style="background:var(--u-overdue)"></i>Vencida / no alcanza</span>
  <span><i style="background:var(--u-soon)"></i>Vence en &lt; 24 h</span>
  <span><i style="background:var(--u-near)"></i>&lt; 3 días</span>
  <span><i style="background:var(--u-ok)"></i>A tiempo</span>
  <span><i style="background:var(--u-done)"></i>Terminada</span></div>`;

function renderZoneFilterChips() {
  const cur = state.filters.zone || '';
  return `
    <div class="zone-filter-scroll">
      <button type="button" class="zone-chip ${cur === '' ? 'active' : ''}" data-action="filter-zone" data-zone="">Todas las zonas</button>
      ${ZONES.map((z) => `<button type="button" class="zone-chip ${cur === z.id ? 'active' : ''}" data-action="filter-zone" data-zone="${esc(z.id)}">${esc(z.label)}</button>`).join('')}
    </div>`;
}

function renderCompanerismoCard(showAll = false) {
  const allStats = getCompanerismoStats();
  const stats = showAll ? allStats : allStats.slice(0, 4);
  if (!stats.length) {
    return showAll ? `
      <div class="companerismo-card">
        <div class="companerismo-head">
          <div>
            <h2 style="font-size:15.5px;display:flex;align-items:center;gap:6px">🏆 Reconocimiento al Compañerismo (Top Apoyos)</h2>
            <p class="small muted" style="margin:2px 0 0">Aún no hay apoyos directos registrados. Únete con el botón "🤝 Apoyar como ayudante" en las tareas de tus compañeros.</p>
          </div>
        </div>
      </div>` : '';
  }
  const medals = ['🥇', '🥈', '🥉', '🏅'];
  return `
    <div class="companerismo-card">
      <div class="companerismo-head">
        <div>
          <h2 style="font-size:15.5px;display:flex;align-items:center;gap:6px">🏆 Reconocimiento al Compañerismo (Top Apoyos)</h2>
          <p class="small muted" style="margin:2px 0 0">Colaboradores que más han apoyado directamente o sacado adelante tareas de sus compañeros. <b>Toca un nombre para ver el detalle.</b></p>
        </div>
      </div>
      <div class="companerismo-grid">
        ${stats.map((s, idx) => `
          <div class="leader-item" data-action="open-companerismo-detail" data-id="${s.user.id}" style="cursor:pointer" title="Ver tareas apoyadas por ${esc(s.user.name)}">
            <span class="medal-icon">${medals[idx] || '🤝'}</span>
            <div class="leader-info">
              <b>${esc(s.user.name)}</b>
              <span>🤝 ${s.totalHelped} apoyo${s.totalHelped === 1 ? '' : 's'} · ✓ ${s.doneHelped} terminada${s.doneHelped === 1 ? '' : 's'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function openCompanerismoDetailSheet(userId) {
  const stat = getCompanerismoStats().find((s) => s.user.id === Number(userId));
  const u = userById(userId);
  if (!u) return;
  const items = stat ? stat.items : [];
  const rowsHtml = items.length
    ? items.map((x) => {
        const t = x.task;
        const ownerName = t.assignee_id ? userName(t.assignee_id) : 'Equipo';
        const badge = x.completedForTeammate
          ? `<span class="pill st-terminada">✓ Sacó adelante tarea de ${esc(ownerName)}</span>`
          : `<span class="pill st-en_progreso">🤝 Apoyó como ayudante a ${esc(ownerName)}</span>`;
        return `
          <div class="card" style="padding:10px 12px;margin-bottom:8px;box-shadow:none;border:1px solid var(--line)">
            <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
              <b>${esc(t.title)}</b>
              <span class="pill st-${t.status}">${STATUS[t.status]}</span>
            </div>
            <div class="row" style="margin-top:6px;flex-wrap:wrap;gap:6px">
              ${badge}
              <span class="small muted">· ${fmtMinutes(t.estimated_minutes)} · ${fmtDue(t.due_at)}</span>
            </div>
          </div>`;
      }).join('')
    : '<p class="muted">Sin tareas de apoyo directo registradas aún.</p>';

  openSheet(`
    <div class="stack">
      ${sheetHead(`🏆 Apoyos de ${u.name}`)}
      <div class="stats" style="margin:0">
        <div class="stat"><b>${stat ? stat.totalHelped : 0}</b><span>Total apoyos</span></div>
        <div class="stat good"><b>${stat ? stat.doneHelped : 0}</b><span>Terminadas</span></div>
        <div class="stat"><b>${stat ? stat.completedForOthersCount : 0}</b><span>Finalizadas por compañero</span></div>
        <div class="stat"><b>${fmtMinutes(stat ? stat.helpedMinutes : 0)}</b><span>Tiempo apoyado</span></div>
      </div>
      <div style="max-height:52vh;overflow-y:auto;padding-right:4px">
        ${rowsHtml}
      </div>
      <div class="sheet-actions">
        <span class="spacer"></span>
        <button type="button" class="btn btn-primary" data-action="close-sheet">Cerrar</button>
      </div>
    </div>
  `);
}

function viewToday() {
  const me = state.me.id;
  const zoneFilter = state.filters.zone || '';
  const all = activeTasks().filter((t) => !zoneFilter || getTaskZone(t) === zoneFilter);
  const mine = sortTasks(all.filter((t) => !t.is_private && isAssignedOrHelper(t, me) && isOpen(t)));
  const free = sortTasks(all.filter((t) => !t.is_private && !t.assignee_id && isOpen(t)));
  const doneAll = sortTasks(all.filter((t) => isAssignedOrHelper(t, me) && doneToday(t)));
  const today = todayStr();
  const dueToday = mine.filter((t) => !t.due_at || dateStr(parseLocal(t.due_at)) <= today);
  const loadMin = dueToday.reduce((s, t) => s + (t.estimated_minutes || 0) * (t.status === 'en_progreso' ? 0.5 : 1), 0);
  const loadPct = clamp((loadMin / SHIFT_MINUTES) * 100);
  const loadCls = loadMin > SHIFT_MINUTES ? 'bad' : loadMin > SHIFT_MINUTES * 0.8 ? 'warn' : 'good';
  const urgent = mine.filter(isUrgent).length;
  const hour = Number(getBogotaParts(new Date()).hour);
  const hello = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateLabel = new Date().toLocaleDateString('es-CO', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' });

  // Paginación / colapso de terminadas hoy para no saturar la vista
  const DONE_LIMIT = 4;
  const hasManyDone = doneAll.length > DONE_LIMIT;
  const visibleDone = (hasManyDone && !state.showAllDoneToday)
    ? doneAll.slice(0, DONE_LIMIT)
    : doneAll;

  let doneSectionHtml = '';
  if (!doneAll.length) {
    doneSectionHtml = `<div class="empty">Aún no terminas tareas hoy. ¡Vamos! 💪</div>`;
  } else {
    doneSectionHtml = `
      <div class="list">${visibleDone.map(taskCard).join('')}</div>
      ${hasManyDone ? `
        <div class="expand-done-row">
          <button class="btn btn-ghost btn-sm expand-done-btn" data-action="toggle-done-today">
            ${state.showAllDoneToday
              ? `${ICON.chevronUp} Ver menos (mostrando las ${doneAll.length})`
              : `${ICON.chevronDown} Ver ${doneAll.length - DONE_LIMIT} anteriores de hoy`}
          </button>
        </div>` : ''}
    `;
  }

  const privates = hasPrivateTasks()
    ? sortTasks(all.filter((t) => t.is_private && t.created_by === me && isOpen(t)))
    : [];

  const privateSectionHtml = hasPrivateTasks() ? `
    <div class="section private-tasks-section">
      <div class="section-head">
        <h2>${ICON.lock} Mis tareas privadas <span class="count">${privates.length}</span></h2>
        <button class="btn btn-sm btn-ghost" data-action="new-private-task" title="Crear tarea que solo tú podrás ver">${ICON.plus} Nueva privada</button>
      </div>
      <p class="small muted" style="margin:-4px 0 10px">Solo tú puedes ver este apartado y estas tareas. Ningún otro colaborador las ve.</p>
      ${taskList(privates, 'No tienes tareas privadas en curso. Puedes crear notas, recordatorios o tareas confidenciales con el botón "+ Nueva privada".')}
    </div>` : '';

  const notifBannerHtml = ('Notification' in window && Notification.permission === 'default') ? `
    <div class="notif-banner">
      <div class="notif-banner-text">
        <span class="notif-banner-icon">${ICON.bell}</span>
        <div>
          <b style="font-size:13.5px;color:var(--blue)">¿Activar alertas de tareas?</b>
          <p class="small muted" style="margin:2px 0 0">Avisos de tareas creadas, tomadas, finalizadas y alertas de vencimiento.</p>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-action="enable-notifications" style="flex:none">Activar</button>
    </div>` : '';

  return `
  <div class="page-head">
    <div><h1>${hello}, ${esc(state.me.name.split(' ')[0])}</h1><p class="muted" style="margin:4px 0 0;text-transform:capitalize">${dateLabel}</p></div>
    <button class="btn btn-sm" data-action="open-shift-summary" title="Ver resumen de inicio de turno">${ICON.clipboard} Resumen de turno</button>
  </div>
  ${notifBannerHtml}
  ${renderZoneFilterChips()}
  <div class="stats">
    <div class="stat"><b>${mine.length}</b><span>Mis tareas / apoyo</span></div>
    ${hasPrivateTasks() ? `<div class="stat private-stat"><b>${privates.length}</b><span>Tareas privadas</span></div>` : ''}
    <div class="stat ${urgent ? 'alert' : ''}"><b>${urgent}</b><span>Urgentes / vencidas</span></div>
    <div class="stat"><b>${fmtMinutes(mine.reduce((s, t) => s + (t.estimated_minutes || 0), 0))}</b><span>Tiempo estimado</span></div>
    <div class="stat good"><b>${doneAll.length}</b><span>Terminadas hoy</span></div>
  </div>
  <div class="card load">
    <div class="row" style="justify-content:space-between"><b>Mi carga para hoy</b><span class="muted small">${fmtMinutes(loadMin)} de ${fmtMinutes(SHIFT_MINUTES)}</span></div>
    <div class="bar" style="margin-top:8px"><i class="${loadCls}" style="width:${loadPct}%"></i></div>
    <p class="small muted" style="margin:6px 0 0">${loadMin > SHIFT_MINUTES ? '⚠️ Tienes más trabajo que horas de turno: avisa a tu líder o pide ayuda.' : 'Incluye tareas asignadas o en apoyo que vencen hoy o antes.'}</p>
  </div>
  <div class="today-grid">
    <div>
      <div class="section"><div class="section-head"><h2>Mis tareas y apoyos <span class="count">${mine.length}</span></h2>
        <button class="btn btn-sm" data-action="new-task" data-assignee="${me}">${ICON.plus} Nueva</button></div>
        ${taskList(mine, 'No tienes tareas pendientes ni en apoyo. Toma una de las disponibles 👇')}
        ${legend()}
      </div>
      ${privateSectionHtml}
    </div>
    <div>
      <div class="section"><div class="section-head"><h2>Disponibles para tomar <span class="count">${free.length}</span></h2></div>
        ${taskList(free, 'No hay tareas libres en este momento.')}</div>
      <div class="section"><div class="section-head"><h2>Terminadas hoy <span class="count">${doneAll.length}</span></h2></div>
        ${doneSectionHtml}</div>
    </div>
  </div>`;
}


function viewBoard() {
  const f = state.filters;
  const all = activeTasks().filter((t) => !t.is_private);
  let list = all.filter((t) => isOpen(t) || t.status === 'terminada');

  if (f.person === 'none') list = list.filter((t) => !t.assignee_id && !getHelperIds(t).length);
  else if (f.person) list = list.filter((t) => isAssignedOrHelper(t, Number(f.person)));
  if (f.objective) list = list.filter((t) => String(t.objective_id) === f.objective);
  if (f.zone) list = list.filter((t) => getTaskZone(t) === f.zone);

  const helps = sortTasks(all.filter((t) => t.needs_help && isOpen(t)));

  const people = activeUsers().map((u) => {
    const open = all.filter((t) => isAssignedOrHelper(t, u.id) && isOpen(t));
    return {
      u, open: open.length,
      minutes: open.reduce((s, t) => s + (t.estimated_minutes || 0), 0),
      inProgress: open.filter((t) => t.status === 'en_progreso').length,
      urgent: open.filter(isUrgent).length,
      help: open.filter((t) => t.needs_help).length,
      done: all.filter((t) => isAssignedOrHelper(t, u.id) && doneToday(t)).length,
    };
  }).sort((a, b) => b.minutes - a.minutes);
  const maxMin = Math.max(SHIFT_MINUTES, ...people.map((p) => p.minutes));


  const personCards = people.map((p) => `
    <div class="person ${f.person === String(p.u.id) ? 'on' : ''}" data-action="filter-person" data-id="${p.u.id}">
      <div class="row"><span class="avatar sm">${esc(initials(p.u.name))}</span><b>${esc(p.u.name)}</b></div>
      <div class="nums"><span>${p.open} abiertas</span><span>${fmtMinutes(p.minutes)}</span></div>
      <div class="bar"><i class="${p.minutes > SHIFT_MINUTES ? 'bad' : p.minutes > SHIFT_MINUTES * 0.8 ? 'warn' : 'good'}" style="width:${(p.minutes / maxMin) * 100}%"></i>
        <span class="marker" style="left:${(SHIFT_MINUTES / maxMin) * 100}%" title="Jornada"></span></div>
      <div class="flags">
        <span class="pill st-en_progreso">${p.inProgress} en curso</span>
        <span class="pill st-terminada">${p.done} hoy ✓</span>
        ${p.urgent ? `<span class="pill st-faltante">${p.urgent} urgentes</span>` : ''}
        ${p.help ? `<span class="pill prio-alta">🆘 ${p.help}</span>` : ''}
      </div>
    </div>`).join('');
  const freeCount = all.filter((t) => !t.assignee_id && isOpen(t)).length;

  // Filtrado organizado para la columna de terminadas
  const allDoneItems = sortTasks(list.filter((t) => t.status === 'terminada'));
  const weekAgo = Date.now() - 7 * 864e5;

  let visibleDoneItems = allDoneItems;
  if (state.boardDoneFilter === 'recientes') {
    visibleDoneItems = allDoneItems.filter((t, idx) => doneToday(t) || idx < 5);
  } else if (state.boardDoneFilter === 'semana') {
    visibleDoneItems = allDoneItems.filter((t) => (parseLocal(t.completed_at) || 0) >= weekAgo);
  }

  const cols = STATUS_ORDER.map((s) => {
    if (s === 'terminada') {
      const totalDone = allDoneItems.length;
      const countLabel = visibleDoneItems.length === totalDone ? `${totalDone}` : `${visibleDoneItems.length}/${totalDone}`;
      
      const filterPills = `
        <div class="done-filter-bar">
          <button class="done-pill ${state.boardDoneFilter === 'recientes' ? 'active' : ''}" data-action="set-board-done-filter" data-val="recientes">Recientes</button>
          <button class="done-pill ${state.boardDoneFilter === 'semana' ? 'active' : ''}" data-action="set-board-done-filter" data-val="semana">Últimos 7 días</button>
          <button class="done-pill ${state.boardDoneFilter === 'todas' ? 'active' : ''}" data-action="set-board-done-filter" data-val="todas">Todas (${totalDone})</button>
        </div>`;

      let bodyHtml = '';
      if (!allDoneItems.length) {
        bodyHtml = '<div class="empty">Nada terminado recientemente.</div>';
      } else {
        bodyHtml = `
          ${filterPills}
          <div class="list done-organized-list">${visibleDoneItems.map(taskCard).join('')}</div>
          ${(visibleDoneItems.length < totalDone) ? `
            <div class="done-more-notice">
              <span class="small muted">Mostrando ${visibleDoneItems.length} de ${totalDone} tareas finalizadas.</span>
              <button class="btn btn-ghost btn-sm" data-action="set-board-done-filter" data-val="todas">Ver todas (${totalDone})</button>
            </div>` : ''}
        `;
      }

      return `<section class="col" data-status="${s}">
        <div class="col-head"><span>${STATUS[s]}</span><span class="count">${countLabel}</span></div>
        ${bodyHtml}
      </section>`;
    }

    const items = sortTasks(list.filter((t) => t.status === s));
    const reschedAllBtn = (s === 'faltante' && items.length > 0 && isLead())
      ? `<div style="margin-bottom:8px"><button type="button" class="btn btn-sm btn-ghost" style="width:100%" data-action="reschedule-all-faltantes">📅 Reprogramar las ${items.length} faltantes para hoy</button></div>`
      : '';
    return `<section class="col" data-status="${s}">
      <div class="col-head"><span>${STATUS[s]}</span><span class="count">${items.length}</span></div>
      ${reschedAllBtn}
      ${taskList(items, 'Sin tareas aquí.')}
    </section>`;
  }).join('');

  const tabs = STATUS_ORDER.map((s) => {
    const count = s === 'terminada' ? allDoneItems.length : list.filter((t) => t.status === s).length;
    return `<button class="${f.status === s ? 'on' : ''}" data-action="board-status" data-status="${s}">${STATUS[s]} <span class="count">${count}</span></button>`;
  }).join('');

  return `
  <div class="page-head">
    <div><h1>Tablero del equipo</h1><p class="muted" style="margin:4px 0 0">Control en tiempo real de avance, cargas y ayudas.</p></div>
    <button class="btn btn-sm btn-primary" data-action="open-stats">📈 Estadísticas y Excel</button>
  </div>
  ${helps.length ? `<div class="section help-list" style="margin-top:0"><div class="section-head"><h2>🆘 Piden ayuda <span class="count">${helps.length}</span></h2></div>${taskList(helps, '')}</div>` : ''}
  ${renderCompanerismoCard()}
  <div class="section"><div class="section-head"><h2>${ICON.users} Carga del equipo</h2>
    ${f.person ? '<button class="btn btn-sm btn-ghost" data-action="filter-person" data-id="">Ver todos</button>' : ''}</div>
    <div class="team-scroll">${personCards || '<div class="empty">Aún no hay colaboradores.</div>'}
      <div class="person ${f.person === 'none' ? 'on' : ''}" data-action="filter-person" data-id="none">
        <div class="row"><span class="avatar sm" style="background:#E3E5F0">?</span><b>Sin asignar</b></div>
        <div class="nums"><span>${freeCount} libres</span><span></span></div>
        <p class="small muted" style="margin:4px 0 0">Tareas que cualquiera puede tomar.</p>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="filters" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <select data-filter="person"><option value="">Todas las personas</option><option value="none" ${f.person === 'none' ? 'selected' : ''}>Sin asignar</option>
        ${activeUsers().map((u) => `<option value="${u.id}" ${f.person === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
      <select data-filter="objective"><option value="">Todos los objetivos</option>
        ${activeObjectives().map((o) => `<option value="${o.id}" ${f.objective === String(o.id) ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select>
      <select data-filter="zone"><option value="">Todas las zonas / deportes</option>
        ${ZONES.map((z) => `<option value="${esc(z.id)}" ${f.zone === z.id ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}</select>
    </div>
    <div class="seg-tabs board-tabs">${tabs}</div>
    <div class="board" data-mobile="${f.status}">${cols}</div>
    ${legend()}
  </div>`;
}

function viewObjectives() {
  const objs = activeObjectives().map((o) => ({ o, s: objectiveStats(o) }))
    .sort((a, b) => (a.o.end_date || '9999').localeCompare(b.o.end_date || '9999'));
  const cards = objs.map(({ o, s }) => {
    const barCls = s.pace.cls === 'neutral' ? '' : s.pace.cls;
    return `
    <div class="card obj">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <h3>${esc(o.title)}</h3><span class="pace ${s.pace.cls}">${s.pace.label}</span>
      </div>
      ${o.description ? `<p class="desc">${esc(o.description)}</p>` : ''}
      <div class="meta">
        <span>📅 ${fmtDate(o.start_date)} → ${fmtDate(o.end_date)}</span>
        ${s.daysLeft !== null ? `<span>${s.daysLeft >= 0 ? `⏳ ${s.daysLeft} días restantes` : '⌛ Finalizado'}</span>` : ''}
      </div>
      ${s.metricPct !== null ? `
        <div class="kv"><span>Meta</span><b>${fmtNum(o.metric_current)} / ${fmtNum(o.metric_target)} ${esc(o.metric_unit)} · ${s.metricPct}%</b></div>
        <div class="bar"><i class="${barCls}" style="width:${s.metricPct}%"></i>${s.elapsed !== null ? `<span class="marker" style="left:${s.elapsed}%" title="Tiempo transcurrido"></span>` : ''}</div>` : ''}
      <div class="kv"><span>Tareas completadas (por tiempo)</span><b>${s.taskPct}%</b></div>
      <div class="bar"><i class="${s.metricPct === null ? barCls : ''}" style="width:${s.taskPct}%"></i>${s.elapsed !== null && s.metricPct === null ? `<span class="marker" style="left:${s.elapsed}%" title="Tiempo transcurrido"></span>` : ''}</div>
      <div class="status-counts">${STATUS_ORDER.map((st) => `<span class="pill st-${st}">${STATUS[st]}: ${s.counts[st]}</span>`).join('')}</div>
      <div class="obj-foot">
        <button class="btn btn-sm" data-action="objective-tasks" data-id="${o.id}">Ver tareas</button>
        <button class="btn btn-sm" data-action="new-task" data-objective="${o.id}">${ICON.plus} Tarea</button>
        ${o.metric_target ? `<button class="btn btn-sm btn-success" data-action="update-metric" data-id="${o.id}">Registrar avance</button>` : ''}
        ${isLead() ? `<button class="btn btn-sm btn-ghost" data-action="edit-objective" data-id="${o.id}">Editar</button>` : ''}
      </div>
    </div>`;
  }).join('');

  const routines = state.routines.filter((r) => r.active);
  const routineRows = routines.map((r) => `
    <div class="card routine" ${isLead() ? `data-action="edit-routine" data-id="${r.id}" style="cursor:pointer"` : ''}>
      <span class="avatar sm" style="background:var(--blue-50);color:var(--blue)">${ICON.repeat}</span>
      <div class="r-body"><b>${esc(r.title)}</b>
        <div class="meta">
          ${r.zone ? `<span class="pill pill-zone" style="font-size:11px;padding:1px 6px">${esc(ZONE_MAP[r.zone] || r.zone)}</span>` : ''}
          <span>${ICON.clock} hasta ${esc(r.due_time)}</span>
          <span>${ICON.user} ${r.assignee_id ? esc(userName(r.assignee_id)) : 'Libre'}</span>
          <span>${ICON.timer} ${fmtMinutes(r.estimated_minutes)}</span>
        </div>
      </div>
      <span class="days">${WEEKDAYS.map(([v, l]) => `<i class="${r.weekdays.split(',').includes(v) ? 'on' : ''}">${l}</i>`).join('')}</span>
    </div>`).join('');

  return `
  <div class="page-head"><div><h1>Objetivos</h1><p class="muted" style="margin:4px 0 0">Metas del periodo y seguimiento de ritmo.</p></div>
    ${isLead() ? `<button class="btn btn-primary" data-action="new-objective">${ICON.plus} Objetivo</button>` : ''}</div>
  ${cards ? `<div class="cards-grid list">${cards}</div>` : `<div class="empty">Todavía no hay objetivos creados.</div>`}
  <div class="section">
    <div class="section-head"><h2>${ICON.repeat} Rutinas diarias <span class="count">${routines.length}</span></h2>
      ${isLead() ? `<button class="btn btn-sm" data-action="new-routine">${ICON.plus} Rutina</button>` : ''}</div>
    <p class="small muted" style="margin:-4px 0 10px">Se generan automáticamente cada día para que nadie las olvide.</p>
    ${routineRows ? `<div class="cards-grid list">${routineRows}</div>` : '<div class="empty">Sin rutinas diarias configuradas.</div>'}
  </div>`;
}
const fmtNum = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('es', { maximumFractionDigits: 2 }));

function viewActivity() {
  const f = state.filters;
  const today = todayStr();

  // 1. Calcular personas activas hoy (combinando bitácora de activity de hoy + last_login de hoy en users)
  const todayMap = new Map();
  for (const u of state.users) {
    if (u.last_login) {
      const d = parseLocal(u.last_login);
      if (d && dateStr(d) === today) {
        todayMap.set(u.name, d);
      }
    }
  }
  for (const a of state.activity) {
    if (!a.user_name || a.user_name === 'Sistema') continue;
    const d = parseLocal(a.created_at);
    if (d && dateStr(d) === today) {
      const prev = todayMap.get(a.user_name);
      if (!prev || d > prev) todayMap.set(a.user_name, d);
    }
  }
  const activeTodayList = Array.from(todayMap.entries())
    .map(([name, lastDate]) => ({ name, lastDate }))
    .sort((a, b) => b.lastDate - a.lastDate);

  // 2. Resumen de ingresos / personas activas por día (últimos 7 días con registros)
  const byDayMap = new Map();
  for (const a of state.activity) {
    if (!a.user_name || a.user_name === 'Sistema') continue;
    const d = parseLocal(a.created_at);
    if (!d) continue;
    const dayKey = dateStr(d);
    if (!byDayMap.has(dayKey)) byDayMap.set(dayKey, new Set());
    byDayMap.get(dayKey).add(a.user_name);
  }
  for (const u of state.users) {
    if (!u.last_login) continue;
    const d = parseLocal(u.last_login);
    if (!d) continue;
    const dayKey = dateStr(d);
    if (!byDayMap.has(dayKey)) byDayMap.set(dayKey, new Set());
    byDayMap.get(dayKey).add(u.name);
  }
  const recentDays = Array.from(byDayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  const dayRowsHtml = recentDays.map(([dayKey, namesSet]) => {
    const dObj = parseLocal(dayKey);
    const label = dObj
      ? dObj.toLocaleDateString('es-CO', { timeZone: TIMEZONE, weekday: 'short', day: 'numeric', month: 'short' })
      : dayKey;
    const names = Array.from(namesSet).sort();
    return `
      <div class="user-row" style="padding:8px 0">
        <div class="u-body">
          <b style="text-transform:capitalize">${esc(label)} ${dayKey === today ? '<span class="pill st-terminada" style="font-size:11px">Hoy</span>' : ''}</b>
          <div class="small muted">${names.map(esc).join(', ')}</div>
        </div>
        <span class="pill st-en_progreso" style="font-weight:700">${names.length} persona${names.length === 1 ? '' : 's'}</span>
      </div>`;
  }).join('');

  // 3. Filtrar lista de eventos por tipo de acción
  let filteredActivity = state.activity;
  if (f.activityKind === 'login') {
    filteredActivity = filteredActivity.filter((a) => a.action === 'login');
  } else if (f.activityKind === 'tareas') {
    filteredActivity = filteredActivity.filter((a) => a.action !== 'login');
  }

  const items = filteredActivity.map((a) => `
    <div class="feed-item"><span class="avatar sm">${esc(initials(a.user_name))}</span>
      <div class="f-body"><b>${esc(a.user_name)}</b> ${esc(lowerFirst(a.summary))}<time>${fmtDateTime(a.created_at)}</time></div></div>`).join('');

  return `
  <div class="page-head">
    <div><h1>Actividad e Ingresos</h1><p class="muted" style="margin:4px 0 0">Asistencia diaria automática (incluso con sesión iniciada) y auditoría de movimientos.</p></div>
    <button class="btn btn-sm btn-primary" data-action="open-stats">📈 Estadísticas y Excel</button>
  </div>
  <div class="today-grid" style="margin-bottom:14px">
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <b>🟢 Personas que han entrado hoy</b>
        <span class="pill st-terminada">${activeTodayList.length} hoy</span>
      </div>
      ${activeTodayList.length
        ? `<div class="chips">${activeTodayList.map((p) => {
            const hm = getBogotaParts(p.lastDate);
            return `<span class="chip" style="cursor:default"><b>${esc(p.name)}</b> <span class="muted small">(${hm.hour}:${hm.minute})</span></span>`;
          }).join('')}</div>`
        : '<p class="small muted" style="margin:0">Nadie ha registrado actividad todavía hoy.</p>'}
    </div>
    <div class="card">
      <b>📅 Personas activas por día (últimos 7 días)</b>
      <div style="margin-top:6px">${dayRowsHtml || '<p class="small muted">Sin datos recientes.</p>'}</div>
    </div>
  </div>
  <div class="filters" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
    <select data-filter="activityUser"><option value="">Todas las personas</option>
      ${state.users.map((u) => `<option value="${u.id}" ${f.activityUser === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
    <select data-filter="activityKind">
      <option value="" ${!f.activityKind ? 'selected' : ''}>Todos los movimientos</option>
      <option value="login" ${f.activityKind === 'login' ? 'selected' : ''}>🚪 Solo ingresos a la app</option>
      <option value="tareas" ${f.activityKind === 'tareas' ? 'selected' : ''}>☑️ Solo acciones en tareas y objetivos</option>
    </select>
  </div>
  <div class="card">${items || '<div class="muted">Sin actividad registrada para este filtro.</div>'}</div>`;
}
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : '');

function viewMore() {
  if (state.more === 'equipo') return viewUsers();
  if (state.more === 'estadisticas') return viewStats();
  if (state.more === 'papelera') return viewTrash();
  if (state.more === 'guia') return viewGuide();
  if (state.more === 'instalar') return viewInstallGuide();

  const muted = isNotificationsMuted();
  const notifGranted = isNotificationGranted();
  const notifLabel = muted
    ? `${ICON.bellOff} Notificaciones silenciadas <span class="pill st-faltante" style="margin-left:auto;font-size:11px">Silenciadas (Toca para activar)</span>`
    : notifGranted
      ? `${ICON.bell} Notificaciones del equipo <span class="pill st-terminada" style="margin-left:auto;font-size:11px">Activas ✓</span>`
      : `${ICON.bell} Permitir notificaciones del sistema <span class="pill st-en_progreso" style="margin-left:auto;font-size:11px">Activar permiso</span>`;

  const notifModeLabel = state.notifMode === 'mine'
    ? '🎯 Solo mis tareas / SOS'
    : '🔔 Todas las del equipo';

  const hasPin = Boolean(getUserPin(state.me));
  const isDark = state.theme === 'dark';

  return `
  <div class="page-head"><h1>Más</h1></div>
  <div class="card row" style="gap:14px"><span class="avatar lg">${esc(initials(state.me.name))}</span>
    <div style="flex:1"><b style="font-size:17px">${esc(state.me.name)}</b><div><span class="pill role-${state.me.role}">${ROLE[state.me.role]}</span> ${hasPin ? '<span class="pill st-terminada">🔒 PIN activo</span>' : ''}</div></div>
    <button class="btn btn-sm btn-ghost" data-action="open-shift-summary">${ICON.clipboard} Resumen</button>
  </div>
  <div class="card menu-list" style="padding:0;margin-top:14px">
    <button data-action="more" data-sub="estadisticas" style="color:var(--blue);font-weight:700">${ICON.activity} 📈 Estadísticas del mes y Reportes Excel/CSV</button>
    <button data-action="toggle-notifications">${notifLabel}</button>
    <button data-action="toggle-notif-mode">${ICON.target} Filtro de alertas <span class="pill st-en_progreso" style="margin-left:auto;font-size:11px">${notifModeLabel}</span></button>
    <button data-action="test-notification" style="color:var(--blue);font-weight:600">${ICON.bell} Probar notificación ahora</button>
    <button data-action="toggle-theme">${isDark ? ICON.sun : ICON.moon} Apariencia <span class="pill" style="margin-left:auto;font-size:11px">${isDark ? '☀️ Cambiar a Claro' : '🌙 Cambiar a Oscuro'}</span></button>
    <button data-action="open-pin-sheet">${ICON.key} PIN de seguridad (4 dígitos) <span class="pill ${hasPin ? 'st-terminada' : ''}" style="margin-left:auto;font-size:11px">${hasPin ? 'Configurado ✓' : 'Opcional'}</span></button>
    <button data-action="more" data-sub="instalar" style="color:var(--blue);font-weight:600">${ICON.phone} Instalar como App en celular</button>
    <button data-action="more" data-sub="equipo">${ICON.users} Equipo, roles y compañerismo</button>
    <button data-action="more" data-sub="papelera">${ICON.eyeOff} Elementos ocultos</button>
    <button data-action="more" data-sub="guia">${ICON.book} Metodología de trabajo</button>
    <button data-action="logout" style="color:var(--u-overdue)">${ICON.logout} Cerrar sesión</button>
  </div>`;
}
const backBtn = () => '<button class="btn btn-sm btn-ghost" data-action="more" data-sub="menu">← Volver</button>';

function viewInstallGuide() {
  return `
  <div class="page-head"><div><h1>Instalar como App</h1><p class="muted" style="margin:4px 0 0">Acceso directo en tu celular con icono propio y pantalla completa.</p></div>${backBtn()}</div>
  <div class="cards-grid list guide">
    <div class="card pwa-install-box">
      <div style="display:flex;gap:12px;align-items:center">
        <img src="icon.svg" alt="" style="width:52px;height:52px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.15)">
        <div><b style="font-size:16px">Objetivos · Wellness</b><p class="muted small" style="margin:2px 0 0">Decathlon</p></div>
      </div>
      <div style="margin-top:14px" id="pwa-install-cta">
        <button class="btn btn-primary" data-action="trigger-install" style="width:100%">${ICON.download} Instalar en este dispositivo</button>
      </div>
    </div>

    <div class="card">
      <h3 style="display:flex;align-items:center;gap:8px">📱 En iPhone / iPad (Safari)</h3>
      <ol style="padding-left:18px;margin:8px 0 0;line-height:1.6">
        <li>Abre esta página en <b>Safari</b>.</li>
        <li>Toca el botón <b>Compartir</b> (el cuadrito con la flecha hacia arriba ⎋ abajo en el centro).</li>
        <li>Baja y selecciona <b>"Agregar a inicio"</b> (o <i>"Add to Home Screen"</i> ➕).</li>
        <li>Toca <b>"Agregar"</b> arriba a la derecha. ¡Listo! Quedará como cualquier app instalada.</li>
      </ol>
    </div>

    <div class="card">
      <h3 style="display:flex;align-items:center;gap:8px">🤖 En Android (Chrome)</h3>
      <ol style="padding-left:18px;margin:8px 0 0;line-height:1.6">
        <li>Abre esta página en <b>Google Chrome</b>.</li>
        <li>Toca los <b>tres puntos</b> (⋮) arriba a la derecha.</li>
        <li>Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</li>
        <li>Confirma tocando <b>"Instalar"</b>.</li>
      </ol>
    </div>

    <div class="card">
      <h3 style="display:flex;align-items:center;gap:8px">💻 En Computador (Chrome / Edge)</h3>
      <p class="muted small" style="margin:6px 0 0">En la barra de direcciones verás un icono de computadora con una flecha hacia abajo. Haz clic en él y selecciona <b>Instalar</b> para abrirla en su propia ventana sin barras de navegador.</p>
    </div>
  </div>`;
}

function viewUsers() {
  const list = isLead() ? state.users : activeUsers();
  const rows = list.map((u) => {
    const self = u.id === state.me.id;
    const uHasPin = Boolean(getUserPin(u));
    let actions = '';
    if (isAdmin()) {
      actions = `
        <select data-change="user-role" data-id="${u.id}" style="width:auto;min-height:36px;padding:6px 10px;font-size:14px">
          ${Object.keys(ROLE).map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLE[r]}</option>`).join('')}</select>
        ${uHasPin ? `<button class="btn btn-sm btn-ghost" data-action="admin-reset-pin" data-id="${u.id}" title="Quitar PIN olvidado">🔓 Quitar PIN</button>` : ''}
        ${self ? '' : `<button class="btn btn-sm ${u.active ? 'btn-ghost' : 'btn-success'}" data-action="user-toggle" data-id="${u.id}">${u.active ? 'Desactivar' : 'Reactivar'}</button>
        <button class="btn btn-sm btn-danger" data-action="user-delete" data-id="${u.id}" title="Eliminar">${ICON.trash}</button>`}`;
    } else if (state.me.role === 'lider' && ['colaborador', 'colaborador_pro'].includes(u.role)) {
      actions = `
        <select data-change="user-role" data-id="${u.id}" style="width:auto;min-height:36px;padding:6px 10px;font-size:14px">
          <option value="colaborador" ${u.role === 'colaborador' ? 'selected' : ''}>Colaborador</option>
          <option value="colaborador_pro" ${u.role === 'colaborador_pro' ? 'selected' : ''}>Colaborador Pro</option>
        </select>
        ${self ? '' : `<button class="btn btn-sm ${u.active ? 'btn-ghost' : 'btn-success'}" data-action="user-toggle" data-id="${u.id}">${u.active ? 'Desactivar' : 'Reactivar'}</button>`}`;
    }
    return `<div class="user-row ${u.active ? '' : 'off'}"><span class="avatar">${esc(initials(u.name))}</span>
      <div class="u-body"><b>${esc(u.name)}${self ? ' (tú)' : ''} ${uHasPin ? '<span title="PIN configurado">🔒</span>' : ''}</b><div class="small muted">${isAdmin() ? '' : `<span class="pill role-${u.role}">${ROLE[u.role]}</span> `}${u.active ? `Último ingreso: ${u.last_login ? fmtDateTime(u.last_login) : '—'}` : 'Desactivado'}</div></div>
      <div class="u-actions">${actions}</div></div>`;
  }).join('');
  return `
  <div class="page-head"><div><h1>Equipo y compañerismo</h1><p class="muted" style="margin:4px 0 0">${activeUsers().length} personas activas</p></div>${backBtn()}</div>
  ${renderCompanerismoCard(true)}
  <div class="card">${rows}</div>`;
}

function viewTrash() {
  const me = state.me.id;
  const tasks = state.tasks.filter((t) => !t.active && (isLead() || t.hidden_by === me));
  const objs = isLead() ? state.objectives.filter((o) => !o.active) : [];
  const routines = isLead() ? state.routines.filter((r) => !r.active) : [];
  const row = (kind, item) => `
    <div class="user-row"><div class="u-body"><b>${esc(item.title)}</b>
      <div class="small muted">Oculto por ${esc(userName(item.hidden_by))} · ${fmtDateTime(item.hidden_at)}</div></div>
      <div class="u-actions"><button class="btn btn-sm btn-success" data-action="restore" data-kind="${kind}" data-id="${item.id}">Restaurar</button>
      ${isAdmin() ? `<button class="btn btn-sm btn-danger" data-action="hard-delete" data-kind="${kind}" data-id="${item.id}">${ICON.trash} Eliminar</button>` : ''}</div></div>`;
  const block = (title, kind, list) => `<div class="section"><div class="section-head"><h2>${title} <span class="count">${list.length}</span></h2></div>
    <div class="card">${list.length ? list.map((i) => row(kind, i)).join('') : '<div class="muted">Nada oculto.</div>'}</div></div>`;
  return `
  <div class="page-head"><div><h1>Elementos ocultos</h1><p class="muted" style="margin:4px 0 0">Papelera: los datos no se pierden, se pueden reactivar.</p></div>${backBtn()}</div>
  ${block('Tareas', 'tasks', tasks)}
  ${isLead() ? block('Objetivos', 'objectives', objs) + block('Rutinas diarias', 'routines', routines) : ''}`;
}


function getStatsPeriodCutoff(period) {
  const now = new Date();
  if (period === '7d') return new Date(now.getTime() - 7 * 864e5);
  if (period === '30d') return new Date(now.getTime() - 30 * 864e5);
  if (period === 'month') {
    const p = getBogotaParts(now);
    return new Date(`${p.year}-${p.month}-01T00:00:00-05:00`);
  }
  return null;
}

function downloadCsvFile(filename, rows) {
  const csvContent = '\uFEFF' + rows.map((r) =>
    r.map((cell) => {
      const s = String(cell ?? '').replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    }).join(',')
  ).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 500);
}

function exportTasksCSV() {
  const all = state.tasks.filter((t) => t.active && !t.is_private);
  const rows = [
    ['ID', 'Titulo', 'Estado', 'Zona_Deporte', 'Prioridad', 'Responsable', 'Ayudantes', 'Finalizada_Por', 'Minutos_Estimados', 'Fecha_Limite', 'Fecha_Creacion', 'Fecha_Finalizacion', 'Subtareas_Completadas', 'Objetivo']
  ];
  for (const t of all) {
    const subs = getSubtasks(t);
    const subStr = subs.length ? `${subs.filter((s) => s.done).length}/${subs.length}` : '0/0';
    const helpersNames = getHelperIds(t).map((id) => userName(id)).join(' | ');
    const obj = t.objective_id ? objById(t.objective_id) : null;
    rows.push([
      t.id,
      t.title,
      STATUS[t.status] || t.status,
      getTaskZone(t) || 'General',
      PRIORITY[t.priority] || t.priority,
      t.assignee_id ? userName(t.assignee_id) : 'Sin asignar',
      helpersNames,
      t.completed_by ? userName(t.completed_by) : '',
      t.estimated_minutes || 0,
      t.due_at ? fmtDateTime(t.due_at) : '',
      t.created_at ? fmtDateTime(t.created_at) : '',
      t.completed_at ? fmtDateTime(t.completed_at) : '',
      subStr,
      obj ? obj.title : ''
    ]);
  }
  downloadCsvFile(`reporte_tareas_${todayStr()}.csv`, rows);
  toast('📥 Reporte de tareas descargado (.CSV compatible con Excel)', 'ok');
}

function exportActivityCSV() {
  const byDayPerson = new Map();
  for (const a of state.activity) {
    if (!a.user_name || a.user_name === 'Sistema') continue;
    const d = parseLocal(a.created_at);
    if (!d) continue;
    const day = dateStr(d);
    const month = day.slice(0, 7) + '-01';
    const key = `${day}__${a.user_name}`;
    byDayPerson.set(key, {
      month,
      day,
      person: a.user_name,
      count: (byDayPerson.get(key)?.count || 0) + 1
    });
  }
  const summaryRows = [
    ['month', 'day', 'person', 'activity_count'],
    ...Array.from(byDayPerson.values())
      .sort((a, b) => a.day.localeCompare(b.day) || a.person.localeCompare(b.person))
      .map((x) => [x.month, x.day, x.person, x.count])
  ];
  downloadCsvFile(`reporte_actividad_diaria_${todayStr()}.csv`, summaryRows);
  toast('📥 Reporte de actividad diaria descargado (.CSV)', 'ok');
}

function viewStats() {
  const period = state.statsPeriod || '30d';
  const cutoff = getStatsPeriodCutoff(period);
  const allPublic = state.tasks.filter((t) => t.active && !t.is_private);

  const tasksInPeriod = allPublic.filter((t) => {
    if (!cutoff) return true;
    const refD = parseLocal(t.completed_at || t.due_at || t.created_at);
    return !refD || refD >= cutoff;
  });

  const doneTasks = tasksInPeriod.filter((t) => t.status === 'terminada');
  const openTasks = tasksInPeriod.filter((t) => isOpen(t));
  const faltanteTasks = allPublic.filter((t) => t.status === 'faltante' || (isOpen(t) && urgency(t).level === 'overdue'));

  // Cumplimiento a tiempo: terminadas antes o en el mismo día de su due_at
  const doneWithDue = doneTasks.filter((t) => t.due_at && t.completed_at);
  const doneOnTime = doneWithDue.filter((t) => {
    const dueD = parseLocal(t.due_at);
    const compD = parseLocal(t.completed_at);
    return dueD && compD && (compD.getTime() <= dueD.getTime() + 3600 * 1000 || dateStr(compD) <= dateStr(dueD));
  });
  const onTimePct = doneWithDue.length ? Math.round((doneOnTime.length / doneWithDue.length) * 100) : 100;
  const totalExecMinutes = doneTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);

  // Construir serie de actividad diaria por persona (Eje Y: actividad, Eje X: tiempo)
  const actInPeriod = state.activity.filter((a) => {
    if (!a.user_name || a.user_name === 'Sistema') return false;
    if (!cutoff) return true;
    const d = parseLocal(a.created_at);
    return !d || d >= cutoff;
  });

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#ef4444'];
  const peopleNames = activeUsers().map((u) => u.name);
  const colorMap = {};
  peopleNames.forEach((n, idx) => { colorMap[n] = CHART_COLORS[idx % CHART_COLORS.length]; });

  const datesSet = new Set();
  const dataByDate = {};
  const personActTotals = {};
  peopleNames.forEach((n) => { personActTotals[n] = 0; });

  for (const a of actInPeriod) {
    const d = parseLocal(a.created_at);
    if (!d) continue;
    const day = dateStr(d);
    datesSet.add(day);
    if (!dataByDate[day]) dataByDate[day] = {};
    dataByDate[day][a.user_name] = (dataByDate[day][a.user_name] || 0) + 1;
    personActTotals[a.user_name] = (personActTotals[a.user_name] || 0) + 1;
  }

  const sortedDates = Array.from(datesSet).sort();
  const selectedPerson = state.statsChartPerson || '';
  const fillZeros = state.statsChartZero !== false;

  // Renderizar SVG de la gráfica lineal en vivo
  let svgChartHtml = '';
  if (sortedDates.length < 2) {
    svgChartHtml = `<div class="empty">Cargando historial de actividad o aún hay menos de 2 días en este rango…</div>`;
  } else {
    const W = 800, H = 240;
    const padL = 36, padR = 16, padT = 14, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    let maxVal = 5;
    for (const d of sortedDates) {
      for (const p of peopleNames) {
        if (selectedPerson && p !== selectedPerson) continue;
        const v = (dataByDate[d] && dataByDate[d][p]) || 0;
        if (v > maxVal) maxVal = v;
      }
    }
    maxVal = Math.ceil(maxVal / 5) * 5;
    const xOf = (i) => padL + (i / (sortedDates.length - 1)) * plotW;
    const yOf = (v) => padT + plotH - (v / maxVal) * plotH;

    let svgInner = '';
    for (let step = 0; step <= 4; step++) {
      const val = Math.round((maxVal / 4) * step);
      const y = yOf(val);
      svgInner += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-dasharray="${val === 0 ? '' : '3,3'}" stroke-width="1"/>`;
      svgInner += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${val}</text>`;
    }

    const labelStep = Math.max(1, Math.floor(sortedDates.length / 7));
    sortedDates.forEach((d, idx) => {
      if (idx % labelStep === 0 || idx === sortedDates.length - 1) {
        const x = xOf(idx);
        const shortLbl = d.slice(5); // MM-DD
        svgInner += `<text x="${x}" y="${padT + plotH + 20}" text-anchor="middle" fill="var(--muted)" font-size="11">${shortLbl}</text>`;
      }
    });

    peopleNames.forEach((p) => {
      if (selectedPerson && p !== selectedPerson) return;
      const color = colorMap[p] || '#3b82f6';
      const pts = [];
      sortedDates.forEach((d, idx) => {
        const v = dataByDate[d] ? dataByDate[d][p] : undefined;
        if (v !== undefined) pts.push({ x: xOf(idx), y: yOf(v), v, d });
        else if (fillZeros) pts.push({ x: xOf(idx), y: yOf(0), v: 0, d });
      });
      if (pts.length > 1) {
        const dPath = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
        svgInner += `<path d="${dPath}" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      pts.forEach((pt) => {
        if (pt.v > 0) {
          svgInner += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.5" fill="${color}" stroke="var(--card)" stroke-width="1.3"><title>${esc(p)} · ${pt.d}: ${pt.v} mov.</title></circle>`;
        }
      });
    });

    svgChartHtml = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;overflow:visible">${svgInner}</svg>`;
  }

  // Productividad por colaborador
  const compMap = new Map(getCompanerismoStats().map((s) => [s.user.id, s]));
  const userRowsStats = activeUsers().map((u) => {
    const ownDone = doneTasks.filter((t) => t.assignee_id === u.id || (t.completed_by === u.id && !t.assignee_id)).length;
    const ownOpen = openTasks.filter((t) => t.assignee_id === u.id).length;
    const comp = compMap.get(u.id);
    const supportsDone = comp ? comp.doneHelped : 0;
    const minsExec = doneTasks
      .filter((t) => t.assignee_id === u.id || t.completed_by === u.id || getHelperIds(t).includes(u.id))
      .reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    const actCount = personActTotals[u.name] || 0;
    return { u, ownDone, ownOpen, supportsDone, minsExec, actCount, totalImpact: ownDone + supportsDone };
  }).sort((a, b) => b.totalImpact - a.totalImpact || b.actCount - a.actCount);

  const maxImpact = Math.max(1, ...userRowsStats.map((r) => r.totalImpact));

  // Distribución por Zona / Deporte
  const zoneBuckets = [...ZONES.map((z) => ({ id: z.id, label: z.label })), { id: '', label: '📋 General / Sin zona' }];
  const zoneRowsHtml = zoneBuckets.map((zb) => {
    const zTasks = tasksInPeriod.filter((t) => getTaskZone(t) === zb.id);
    if (!zTasks.length) return '';
    const zDone = zTasks.filter((t) => t.status === 'terminada').length;
    const pct = Math.round((zDone / zTasks.length) * 100);
    return `
      <div style="margin-bottom:10px">
        <div class="row" style="justify-content:space-between;font-size:13.5px;margin-bottom:4px">
          <b>${esc(zb.label)}</b>
          <span class="muted small"><b>${zDone}</b> / ${zTasks.length} terminadas (${pct}%)</span>
        </div>
        <div class="bar"><i class="${pct >= 80 ? 'good' : pct >= 50 ? 'warn' : ''}" style="width:${pct}%"></i></div>
      </div>`;
  }).filter(Boolean).join('');

  return `
  <div class="page-head">
    <div><h1>📈 Estadísticas y Productividad</h1><p class="muted" style="margin:4px 0 0">Rendimiento del equipo, gráfica lineal de actividad y descarga para Excel.</p></div>
    ${backBtn()}
  </div>

  <div class="card" style="margin-bottom:14px">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div class="done-filter-bar" style="margin:0">
        <button class="done-pill ${period === '7d' ? 'active' : ''}" data-action="set-stats-period" data-period="7d">Últimos 7 días</button>
        <button class="done-pill ${period === '30d' ? 'active' : ''}" data-action="set-stats-period" data-period="30d">Últimos 30 días</button>
        <button class="done-pill ${period === 'month' ? 'active' : ''}" data-action="set-stats-period" data-period="month">Este mes</button>
        <button class="done-pill ${period === 'all' ? 'active' : ''}" data-action="set-stats-period" data-period="all">Todo el historial</button>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-success" data-action="export-tasks-csv">${ICON.download} Descargar Tareas (Excel/CSV)</button>
        <button class="btn btn-sm btn-primary" data-action="export-activity-csv">${ICON.download} Descargar Actividad Diaria (CSV)</button>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat good"><b>${doneTasks.length}</b><span>Tareas terminadas</span></div>
    <div class="stat ${onTimePct >= 80 ? 'good' : ''}"><b>${onTimePct}%</b><span>Cumplimiento a tiempo</span></div>
    <div class="stat ${faltanteTasks.length ? 'alert' : ''}"><b>${faltanteTasks.length}</b><span>Faltantes / Vencidas</span></div>
    <div class="stat"><b>${fmtMinutes(totalExecMinutes)}</b><span>Tiempo ejecutado</span></div>
  </div>

  <!-- Gráfica lineal en vivo -->
  <div class="card" style="margin-top:14px">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div>
        <h3 style="margin:0;font-size:15.5px">📈 Gráfica lineal de actividad diaria por persona</h3>
        <p class="small muted" style="margin:2px 0 0">Eje Y: Registros de actividad en la app · Eje X: Fecha. Toca un colaborador para aislar su línea.</p>
      </div>
      <button type="button" class="btn btn-sm btn-ghost" data-action="stats-chart-zero">
        ${fillZeros ? 'Modo: Con ceros en días inactivos' : 'Modo: Conectar días activos'}
      </button>
    </div>
    <div class="chips" style="margin-bottom:12px">
      <button type="button" class="chip ${!selectedPerson ? 'active-chip' : ''}" data-action="stats-chart-person" data-person="">Ver todos</button>
      ${peopleNames.map((n) => `
        <button type="button" class="chip ${selectedPerson === n ? 'active-chip' : ''}" data-action="stats-chart-person" data-person="${esc(n)}">
          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${colorMap[n]};margin-right:4px"></span>
          ${esc(n)} <span class="muted small">(${personActTotals[n] || 0})</span>
        </button>
      `).join('')}
    </div>
    ${svgChartHtml}
  </div>

  <div class="today-grid" style="margin-top:14px">
    <div class="card">
      <h3 style="margin:0 0 10px;font-size:15.5px">🏅 Productividad por colaborador</h3>
      ${userRowsStats.map((r) => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div class="row"><span class="avatar sm">${esc(initials(r.u.name))}</span><b>${esc(r.u.name)}</b></div>
            <div class="row" style="gap:6px;flex-wrap:wrap">
              <span class="pill st-terminada">✓ ${r.ownDone} propias</span>
              <span class="pill st-en_progreso">🤝 ${r.supportsDone} apoyos</span>
              <span class="pill">${r.actCount} mov.</span>
            </div>
          </div>
          <div class="bar" style="margin-top:6px"><i class="good" style="width:${Math.round((r.totalImpact / maxImpact) * 100)}%"></i></div>
          <div class="small muted" style="margin-top:4px">${fmtMinutes(r.minsExec)} completados · ${r.ownOpen} abiertas actualmente</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h3 style="margin:0 0 10px;font-size:15.5px">🏷️ Avance por Zona / Deporte</h3>
      ${zoneRowsHtml || '<p class="muted small">Aún no hay tareas clasificadas en este periodo.</p>'}
    </div>
  </div>`;
}

function viewGuide() {
  return `
  <div class="page-head"><div><h1>Cómo trabajamos</h1><p class="muted" style="margin:4px 0 0">Scrum en tienda: ciclos cortos y comunicación constante.</p></div>${backBtn()}</div>
  <div class="cards-grid list guide">
    <div class="card"><h3>1 · Objetivos del Mes</h3><p class="muted small">El líder fija 2-4 objetivos de impacto y los desglosa en tareas accionables.</p></div>
    <div class="card"><h3>2 · Daily de 5 min al inicio de turno</h3><p class="muted small">Revisar "Mi día", ver las alertas rojas y tomar tareas libres según tu jornada.</p></div>
    <div class="card"><h3>3 · Gestión Visual</h3><p class="muted small">Si te bloqueas, activa 🆘 Pedir ayuda. Todo el equipo y líderes lo verán al instante.</p></div>
    <div class="card"><h3>4 · Cierre y Retro</h3><p class="muted small">Lo no realizado pasa a "Faltante" y se analiza en la reunión semanal de mejora.</p></div>
  </div>`;
}

/* ==========================================================================
   Modales (Sheets)
   ========================================================================== */
const radio = (name, value, label, checked, disabled = false) =>
  `<label><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span>${label}</span></label>`;

function renderDraftSubtasksList() {
  const box = document.getElementById('draft-subtasks-list');
  if (!box) return;
  if (!state.draftSubtasks.length) {
    box.innerHTML = '<p class="small muted" style="margin:6px 0 0">Sin subtareas. Añade pasos arriba si deseas dividir la tarea.</p>';
    return;
  }
  box.innerHTML = state.draftSubtasks.map((st, idx) => `
    <div class="subtask-edit-item">
      <label class="row" style="flex:1;cursor:pointer">
        <input type="checkbox" data-action="draft-subtask-toggle" data-idx="${idx}" ${st.done ? 'checked' : ''}>
        <span style="${st.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(st.text)}</span>
      </label>
      <button type="button" class="btn btn-sm btn-danger" style="min-height:26px;padding:2px 8px" data-action="draft-subtask-del" data-idx="${idx}">✕</button>
    </div>
  `).join('');
}

function renderDraftPhotosList() {
  const box = document.getElementById('draft-photos-list');
  if (!box) return;
  if (!state.draftPhotos.length) {
    box.innerHTML = '<span class="small muted">Sin fotos adjuntas todavía.</span>';
    return;
  }
  box.innerHTML = state.draftPhotos.map((p, idx) => `
    <div class="photo-thumb">
      <img src="${esc(p.url)}" alt="Foto" data-action="preview-draft-photo" data-idx="${idx}">
      <span class="photo-tag">${esc(p.label || 'Evidencia')}</span>
      <button type="button" class="photo-del" data-action="draft-photo-del" data-idx="${idx}" title="Quitar foto">✕</button>
    </div>
  `).join('');
}

function openTaskSheet(t) {
  if (t.id && !canEditTask(t)) return openTaskDetail(t);
  const isNew = !t.id;
  const full = canFullEditTask(t);
  const dis = full ? '' : 'disabled';
  let assignees = isLead() ? activeUsers() : activeUsers().filter((u) => u.id === state.me.id);
  if (t.assignee_id && !assignees.some((u) => u.id === t.assignee_id) && userById(t.assignee_id)) assignees = [...assignees, userById(t.assignee_id)];
  const objs = state.objectives.filter((o) => o.active || o.id === t.objective_id);

  const helpers = getHelperIds(t);
  const allUsers = activeUsers();
  const currentZone = getTaskZone(t);
  state.draftSubtasks = getSubtasks(t).map((s) => ({ ...s }));
  state.draftPhotos = getPhotos(t).map((p) => ({ ...p }));

  // Checkboxes para asignar ayudantes / colaboradores de apoyo
  const helpersCheckboxes = allUsers.map((u) => {
    const isChecked = helpers.includes(u.id);
    return `
      <label class="helper-check ${isChecked ? 'checked' : ''}">
        <input type="checkbox" name="helper_ids" value="${u.id}" ${isChecked ? 'checked' : ''}>
        <span>${esc(u.name)}${u.id === state.me.id ? ' (tú)' : ''}</span>
      </label>`;
  }).join('');

  openSheet(`
  <form data-form="task" data-id="${t.id || ''}" class="stack">
    ${sheetHead(isNew ? 'Nueva tarea' : 'Editar tarea')}
    <label class="field"><span>Título *</span><input name="title" required maxlength="150" value="${esc(t.title || '')}" ${dis} placeholder="Ej: Reponer lineal de bicis"></label>
    <div class="grid2">
      <label class="field"><span>Zona / Pasillo / Deporte</span>
        <select name="zone" ${dis}>
          <option value="">— General —</option>
          ${ZONES.map((z) => `<option value="${esc(z.id)}" ${currentZone === z.id ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Objetivo</span><select name="objective_id" ${dis}><option value="">— Ninguno —</option>
        ${objs.map((o) => `<option value="${o.id}" ${t.objective_id === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000" ${dis} placeholder="Detalles o ubicación…">${esc(t.description || '')}</textarea></label>
    <div class="field"><span>Estado</span><div class="seg">${STATUS_ORDER.map((s) => radio('status', s, STATUS[s], (t.status || 'sin_iniciar') === s)).join('')}</div></div>
    
    <div class="grid2">
      <label class="field"><span>Responsable principal</span><select name="assignee_id">
        <option value="">— Sin asignar (libre) —</option>
        ${assignees.map((u) => `<option value="${u.id}" ${t.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Fecha y hora límite (Hora Bogotá)</span><input type="datetime-local" name="due_at" value="${esc(toLocalInputDate(t.due_at))}" ${dis}></label>
    </div>

    <!-- Subtareas / Checklist -->
    <div class="subtasks-editor">
      <span style="font-size:13px;font-weight:600;color:var(--muted)">☑️ Checklist / Subtareas paso a paso:</span>
      <div class="subtask-add-row">
        <input type="text" id="new-subtask-input" placeholder="Ej: Traer cajas de bodega…" maxlength="120">
        <button type="button" class="btn btn-sm btn-primary" data-action="draft-subtask-add">+ Paso</button>
      </div>
      <div id="draft-subtasks-list"></div>
    </div>

    <!-- Evidencia Fotográfica (Antes / Después) -->
    <div class="photos-box">
      <div class="row" style="justify-content:space-between;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:600;color:var(--muted)">📷 Evidencia fotográfica (Antes / Después):</span>
        <div class="row" style="gap:6px">
          <select id="draft-photo-label" style="width:auto;min-height:34px;padding:4px 8px;font-size:13px">
            <option value="Antes">Antes</option>
            <option value="Después" selected>Después</option>
            <option value="Evidencia">Evidencia</option>
            <option value="SOS / Bloqueo">SOS / Bloqueo</option>
          </select>
          <label class="btn btn-sm btn-primary" style="cursor:pointer;margin:0">
            ${ICON.camera} Subir / Cámara
            <input type="file" id="draft-photo-input" accept="image/*" capture="environment" style="display:none">
          </label>
        </div>
      </div>
      <div id="draft-photos-list" class="photos-grid"></div>
    </div>

    <!-- Ayudantes / Apoyos y Modo Grupal -->
    <div class="helpers-box">
      <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:var(--muted)">🤝 Colaboradores en apoyo / Tarea Grupal:</span>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-ghost" style="min-height:28px;padding:3px 8px;font-size:12px" data-action="helpers-select-all">👥 Seleccionar todos</button>
          <button type="button" class="btn btn-sm btn-ghost" style="min-height:28px;padding:3px 8px;font-size:12px" data-action="helpers-clear-all">Limpiar</button>
          <button type="button" class="btn btn-sm btn-primary" style="min-height:28px;padding:3px 10px;font-size:12px" data-action="helpers-generate-checks">☑️ Crear casilla por persona</button>
        </div>
      </div>
      <div class="helpers-checkboxes">
        ${helpersCheckboxes || '<span class="small muted">No hay colaboradores disponibles.</span>'}
      </div>
      <label class="check" style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)">
        <input type="checkbox" id="group-auto-checks" name="group_auto_checks">
        <span class="small"><b>👥 Modo Tarea Grupal:</b> crear una casilla de avance individual por cada participante seleccionado (la tarea se finaliza cuando todos marquen su parte).</span>
      </label>
    </div>

    <div class="field"><span>Tiempo estimado (minutos)</span>
      <input type="number" name="estimated_minutes" min="0" step="5" inputmode="numeric" value="${t.estimated_minutes ?? 30}" ${dis}>
      <div class="chips" style="margin-top:8px">${[15, 30, 60, 120, 240].map((m) => `<button type="button" class="chip" data-action="set-minutes" data-min="${m}" ${dis}>${fmtMinutes(m)}</button>`).join('')}</div></div>
    <div class="field"><span>Prioridad</span><div class="seg">${Object.keys(PRIORITY).map((p) => radio('priority', p, PRIORITY[p], (t.priority || 'media') === p, !full)).join('')}</div></div>
    <div class="help-field">
      <label class="check"><input type="checkbox" name="needs_help" ${t.needs_help ? 'checked' : ''}> 🆘 Necesito ayuda con esta tarea</label>
      <input name="help_note" maxlength="500" placeholder="¿Qué necesitas? (opcional)" value="${esc(t.help_note || '')}">
    </div>

    ${hasPrivateTasks() ? `
    <div class="private-field-box">
      <label class="check">
        <input type="checkbox" name="is_private" ${t.is_private ? 'checked' : ''}>
        <b>${ICON.lock} Tarea privada (oculta de los demás)</b>
      </label>
      <p class="small muted" style="margin:4px 0 0 24px">Solo tú podrás ver y gestionar esta tarea en tu sección privada. Ningún otro colaborador la verá.</p>
    </div>` : ''}

    <div class="sheet-actions">
      ${!isNew && t.active && canHideTask(t) ? `<button type="button" class="btn btn-ghost" data-action="hide" data-kind="tasks" data-id="${t.id}">${ICON.eyeOff} Ocultar</button>` : ''}
      ${!isNew && isAdmin() ? `<button type="button" class="btn btn-danger" data-action="hard-delete" data-kind="tasks" data-id="${t.id}">${ICON.trash}</button>` : ''}
      <span class="spacer"></span>
      <button type="submit" class="btn btn-primary">${isNew ? 'Crear tarea' : 'Guardar'}</button>
    </div>
  </form>`);

  renderDraftSubtasksList();
  renderDraftPhotosList();

  const subInput = document.getElementById('new-subtask-input');
  if (subInput) {
    subInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const val = subInput.value.trim();
        if (val) {
          state.draftSubtasks.push({ id: Date.now(), text: val, done: false });
          subInput.value = '';
          renderDraftSubtasksList();
        }
      }
    });
  }

  const photoInput = document.getElementById('draft-photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      try {
        toast('Procesando imagen…');
        const dataUrl = await compressImageFile(file);
        const labelSel = document.getElementById('draft-photo-label');
        const label = labelSel ? labelSel.value : 'Evidencia';
        state.draftPhotos.push({
          id: Date.now(),
          url: dataUrl,
          label,
          by: state.me ? state.me.name : '',
          at: nowIso()
        });
        renderDraftPhotosList();
        toast('📷 Foto agregada', 'ok');
      } catch (err) {
        toast(err.message, 'error');
      }
      photoInput.value = '';
    });
  }
}


function openTaskDetail(t) {
  const obj = t.objective_id ? objById(t.objective_id) : null;
  const zone = getTaskZone(t);
  openSheet(`
    ${sheetHead('Detalle de la tarea')}
    <div class="stack">
      ${taskCard(t).replace('data-action="open-task"', '')}
      ${t.description ? `<div class="card" style="box-shadow:none;background:var(--bg)">${esc(t.description)}</div>` : ''}
      <dl class="info-grid">
        ${zone ? `<dt>Zona</dt><dd>${esc(ZONE_MAP[zone] || zone)}</dd>` : ''}
        <dt>Prioridad</dt><dd>${PRIORITY[t.priority]}</dd>
        <dt>Objetivo</dt><dd>${obj ? esc(obj.title) : '—'}</dd>
        <dt>Creada por</dt><dd>${esc(userName(t.created_by))}</dd>
      </dl>
    </div>`);
}

function openCommentsSheet(t) {
  const comments = getComments(t);
  const listHtml = comments.length
    ? comments.map((c) => `
        <div class="comment-item">
          <div class="comment-head">
            <b>${esc(c.user_name || 'Colaborador')}</b>
            <span>${fmtDateTime(c.created_at)}</span>
          </div>
          <div>${esc(c.text)}</div>
        </div>
      `).join('')
    : '<div class="empty" style="padding:14px">Aún no hay comentarios ni notas de turno en esta tarea.</div>';

  openSheet(`
    <form data-form="comment" data-id="${t.id}" class="stack">
      ${sheetHead('💬 Notas y Comentarios')}
      <p class="muted small" style="margin:0">Tarea: <b>${esc(t.title)}</b></p>
      <div class="comments-list">${listHtml}</div>
      <div class="comment-add-row">
        <input name="comment_text" required maxlength="400" placeholder="Escribe un comentario o nota de relevo…" autofocus>
        <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
      </div>
    </form>
  `);
}

function openQuickPhotoSheet(t) {
  const photos = getPhotos(t);
  openSheet(`
    <form data-form="quick-photo" data-id="${t.id}" class="stack">
      ${sheetHead('📷 Evidencia Fotográfica')}
      <p class="muted small" style="margin:0">Tarea: <b>${esc(t.title)}</b></p>
      <div class="grid2">
        <label class="field"><span>Tipo de foto</span>
          <select name="photo_label">
            <option value="Después" selected>✅ Después (Resultado)</option>
            <option value="Antes">📌 Antes (Estado inicial)</option>
            <option value="Evidencia">📷 Evidencia general</option>
            <option value="SOS / Bloqueo">🆘 SOS / Problema</option>
          </select>
        </label>
        <label class="field"><span>Seleccionar o tomar foto *</span>
          <input type="file" name="photo_file" accept="image/*" capture="environment" required style="padding:8px">
        </label>
      </div>
      ${photos.length ? `
        <div>
          <span class="small muted">Fotos actuales (${photos.length}):</span>
          <div class="photos-grid">
            ${photos.map((p, idx) => `
              <div class="photo-thumb" data-action="view-photo" data-id="${t.id}" data-idx="${idx}">
                <img src="${esc(p.url)}" alt="Foto">
                <span class="photo-tag">${esc(p.label || 'Foto')}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      <div class="sheet-actions">
        <button type="submit" class="btn btn-primary">${ICON.camera} Guardar foto en la tarea</button>
      </div>
    </form>
  `);
}

function openShiftSummarySheet() {
  if (!state.me) return;
  const me = state.me.id;
  const all = activeTasks();
  const mine = all.filter((t) => !t.is_private && isAssignedOrHelper(t, me) && isOpen(t));
  const urgent = mine.filter(isUrgent);
  const sosList = all.filter((t) => !t.is_private && t.needs_help && isOpen(t));
  const freeList = all.filter((t) => !t.is_private && !t.assignee_id && isOpen(t));
  const doneTodayList = all.filter((t) => isAssignedOrHelper(t, me) && doneToday(t));
  const loadMin = mine.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
  const hour = Number(getBogotaParts(new Date()).hour);
  const greeting = hour < 12 ? '☀️ Buen inicio de jornada' : hour < 18 ? '🌤️ Resumen de tu turno' : '🌙 Resumen de cierre';

  localStorage.setItem('obj_shift_summary_date', `${todayStr()}_${me}`);

  openSheet(`
    <div class="stack">
      ${sheetHead(greeting)}
      <p class="muted" style="margin:0">Hola <b>${esc(state.me.name)}</b>, aquí tienes el panorama rápido de tu turno hoy:</p>
      <div class="shift-summary-grid">
        <div class="summary-kpi">
          <b>${mine.length}</b>
          <span>Mis tareas activas (${fmtMinutes(loadMin)})</span>
        </div>
        <div class="summary-kpi ${urgent.length ? 'warn' : 'good'}">
          <b>${urgent.length}</b>
          <span>Urgentes / por vencer</span>
        </div>
        <div class="summary-kpi ${sosList.length ? 'warn' : ''}">
          <b>${sosList.length}</b>
          <span>Compañeros piden ayuda 🆘</span>
        </div>
        <div class="summary-kpi good">
          <b>${freeList.length} / ${doneTodayList.length}✓</b>
          <span>Libres / Terminadas hoy</span>
        </div>
      </div>
      ${sosList.length ? `
        <div class="help-box">
          <b>🆘 Hay ${sosList.length} tarea(s) pidiendo apoyo:</b>
          <ul style="margin:6px 0 0;padding-left:18px;font-weight:500">
            ${sosList.slice(0, 3).map((t) => `<li><b>${esc(t.title)}</b> (${esc(userName(t.assignee_id))})</li>`).join('')}
          </ul>
        </div>` : ''}
      ${urgent.length ? `
        <div class="card" style="background:var(--bg);box-shadow:none">
          <b style="font-size:13.5px">⚡ Tu prioridad número 1 ahora:</b>
          <p style="margin:4px 0 0;font-weight:700;color:var(--blue)">${esc(urgent[0].title)} (${esc(fmtDue(urgent[0].due_at))})</p>
        </div>` : ''}
      <div class="sheet-actions">
        ${sosList.length ? `<button type="button" class="btn btn-warn" data-action="go-board-sos">Ir a apoyar equipo</button>` : ''}
        <button type="button" class="btn btn-primary" data-action="close-sheet">¡A darle con toda! 💪</button>
      </div>
    </div>
  `);
}

function maybeShowMorningShiftSummary() {
  if (!state.me || state.sheetOpen) return;
  const key = `${todayStr()}_${state.me.id}`;
  if (localStorage.getItem('obj_shift_summary_date') !== key) {
    openShiftSummarySheet();
  }
}

function openPinConfigSheet() {
  if (!state.me) return;
  const currentPin = getUserPin(state.me);
  openSheet(`
    <form data-form="pin-config" class="stack" autocomplete="off">
      ${sheetHead('🔐 PIN de seguridad (4 dígitos)')}
      <p class="muted small" style="margin:0">Protege tu perfil y tus tareas privadas con un código numérico de 4 dígitos al iniciar sesión.</p>
      ${currentPin ? `
        <label class="field"><span>PIN actual *</span>
          <input type="password" name="current_pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" class="pin-input-large" placeholder="••••" required>
        </label>` : ''}
      <label class="field"><span>Nuevo PIN de 4 dígitos (deja vacío para desactivar)</span>
        <input type="password" name="new_pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" class="pin-input-large" placeholder="1234" ${currentPin ? '' : 'required'}>
      </label>
      <div class="sheet-actions">
        ${currentPin ? `<button type="button" class="btn btn-danger" data-action="remove-my-pin">Desactivar PIN</button>` : ''}
        <span class="spacer"></span>
        <button type="submit" class="btn btn-primary">Guardar PIN</button>
      </div>
    </form>
  `);
}

function openObjectiveSheet(o) {
  const isNew = !o.id;
  const d = new Date();
  const first = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  const last = dateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  openSheet(`
  <form data-form="objective" data-id="${o.id || ''}" class="stack">
    ${sheetHead(isNew ? 'Nuevo objetivo' : 'Editar objetivo')}
    <label class="field"><span>Objetivo *</span><input name="title" required maxlength="150" value="${esc(o.title || '')}" placeholder="Ej: Vender 40 bicis"></label>
    <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000">${esc(o.description || '')}</textarea></label>
    <div class="grid2">
      <label class="field"><span>Inicio</span><input type="date" name="start_date" value="${esc(o.start_date || (isNew ? first : ''))}"></label>
      <label class="field"><span>Fin</span><input type="date" name="end_date" value="${esc(o.end_date || (isNew ? last : ''))}"></label>
    </div>
    <div class="card" style="box-shadow:none;background:var(--bg)">
      <b>Meta medible (opcional)</b>
      <div class="grid2" style="margin-top:8px">
        <label class="field"><span>Meta</span><input type="number" step="any" name="metric_target" value="${o.metric_target ?? ''}" placeholder="Ej: 40"></label>
        <label class="field"><span>Unidad</span><input name="metric_unit" maxlength="30" value="${esc(o.metric_unit || '')}" placeholder="Ej: bicis"></label>
        <label class="field"><span>Avance actual</span><input type="number" step="any" name="metric_current" value="${o.metric_current ?? 0}"></label>
      </div>
    </div>
    <div class="sheet-actions">
      ${!isNew ? `<button type="button" class="btn btn-ghost" data-action="hide" data-kind="objectives" data-id="${o.id}">${ICON.eyeOff} Ocultar</button>` : ''}
      ${!isNew && isAdmin() ? `<button type="button" class="btn btn-danger" data-action="hard-delete" data-kind="objectives" data-id="${o.id}">${ICON.trash}</button>` : ''}
      <span class="spacer"></span>
      <button type="submit" class="btn btn-primary">${isNew ? 'Crear objetivo' : 'Guardar'}</button>
    </div>
  </form>`);
}

function openMetricSheet(o) {
  openSheet(`
  <form data-form="metric" data-id="${o.id}" class="stack">
    ${sheetHead('Registrar avance')}
    <p class="muted" style="margin:0">${esc(o.title)}<br>Actual: <b>${fmtNum(o.metric_current)} / ${fmtNum(o.metric_target)} ${esc(o.metric_unit)}</b></p>
    <label class="field"><span>Sumar al avance</span><input type="number" step="any" name="add" inputmode="decimal" placeholder="Ej: 3" autofocus></label>
    <div class="chips">${[1, 2, 5, 10].map((n) => `<button type="button" class="chip" data-action="metric-add" data-n="${n}">+${n}</button>`).join('')}</div>
    <label class="field"><span>…o fijar total</span><input type="number" step="any" name="total" placeholder="${fmtNum(o.metric_current)}"></label>
    <div class="sheet-actions"><button type="submit" class="btn btn-primary">Guardar avance</button></div>
  </form>`);
}

function openRoutineSheet(r) {
  const isNew = !r.id;
  const days = (r.weekdays || '1,2,3,4,5,6,7').split(',');
  openSheet(`
  <form data-form="routine" data-id="${r.id || ''}" class="stack">
    ${sheetHead(isNew ? 'Nueva rutina diaria' : 'Editar rutina diaria')}
    <label class="field"><span>Tarea *</span><input name="title" required maxlength="150" value="${esc(r.title || '')}" placeholder="Ej: Revisar etiquetas de precio"></label>
    <div class="grid2">
      <label class="field"><span>Zona / Deporte</span>
        <select name="zone">
          <option value="">— General —</option>
          ${ZONES.map((z) => `<option value="${esc(z.id)}" ${(r.zone || '') === z.id ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Objetivo</span><select name="objective_id"><option value="">— Ninguno —</option>
        ${activeObjectives().map((o) => `<option value="${o.id}" ${r.objective_id === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000">${esc(r.description || '')}</textarea></label>
    <div class="field"><span>Días</span><div class="daypick">${WEEKDAYS.map(([v, l]) => `<label><input type="checkbox" name="weekdays" value="${v}" ${days.includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="grid2">
      <label class="field"><span>Hora límite</span><input type="time" name="due_time" required value="${esc(r.due_time || '12:00')}"></label>
      <label class="field"><span>Tiempo estimado (min)</span><input type="number" name="estimated_minutes" min="0" step="5" value="${r.estimated_minutes ?? 30}"></label>
      <label class="field"><span>Responsable</span><select name="assignee_id"><option value="">— Libre —</option>
        ${activeUsers().map((u) => `<option value="${u.id}" ${r.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
    </div>
    <div class="field"><span>Prioridad</span><div class="seg">${Object.keys(PRIORITY).map((p) => radio('priority', p, PRIORITY[p], (r.priority || 'media') === p)).join('')}</div></div>
    <div class="sheet-actions">
      ${!isNew ? `<button type="button" class="btn btn-ghost" data-action="hide" data-kind="routines" data-id="${r.id}">${ICON.eyeOff} Ocultar</button>` : ''}
      ${!isNew && isAdmin() ? `<button type="button" class="btn btn-danger" data-action="hard-delete" data-kind="routines" data-id="${r.id}">${ICON.trash}</button>` : ''}
      <span class="spacer"></span>
      <button type="submit" class="btn btn-primary">${isNew ? 'Crear rutina' : 'Guardar'}</button>
    </div>
  </form>`);
}

function openHelpSheet(t) {
  openSheet(`
  <form data-form="help" data-id="${t.id}" class="stack">
    ${sheetHead('🆘 Pedir ayuda')}
    <p class="muted" style="margin:0">${esc(t.title)}</p>
    <label class="field"><span>¿En qué necesitas ayuda?</span><textarea name="help_note" rows="3" maxlength="500" placeholder="Ej: necesito apoyo con el stock pesado" autofocus></textarea></label>
    <label class="field"><span>📷 Foto del bloqueo / problema (opcional)</span>
      <input type="file" name="help_photo" accept="image/*" capture="environment" style="padding:8px">
    </label>
    <div class="sheet-actions"><button type="submit" class="btn btn-warn">Avisar al equipo</button></div>
  </form>`);
}

/* ==========================================================================
   Manejadores de Eventos
   ========================================================================== */
const KIND_TABLE = { tasks: 'tasks', objectives: 'objectives', routines: 'routines', users: 'users' };
const findItem = (kind, id) => state[kind].find((x) => x.id === id);

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id ? Number(el.dataset.id) : null;
  const kind = el.dataset.kind;

  switch (a) {
    case 'noop':
      e.stopPropagation();
      break;
    case 'open-companerismo-detail':
      if (id) openCompanerismoDetailSheet(id);
      break;
    case 'open-stats':
      state.view = 'mas';
      state.more = 'estadisticas';
      localStorage.setItem('obj_view', 'mas');
      render();
      window.scrollTo(0, 0);
      loadActivity().catch((err) => toast(err.message, 'error'));
      break;
    case 'set-stats-period':
      state.statsPeriod = el.dataset.period || '30d';
      render();
      break;
    case 'stats-chart-person':
      state.statsChartPerson = state.statsChartPerson === (el.dataset.person || '') ? '' : (el.dataset.person || '');
      render();
      break;
    case 'stats-chart-zero':
      state.statsChartZero = !state.statsChartZero;
      render();
      break;
    case 'export-tasks-csv':
      exportTasksCSV();
      break;
    case 'export-activity-csv':
      exportActivityCSV();
      break;
    case 'helpers-select-all': {
      const form = el.closest('form');
      if (!form) break;
      form.querySelectorAll('input[name="helper_ids"]').forEach((cb) => {
        cb.checked = true;
        const lbl = cb.closest('.helper-check');
        if (lbl) lbl.classList.add('checked');
      });
      break;
    }
    case 'helpers-clear-all': {
      const form = el.closest('form');
      if (!form) break;
      form.querySelectorAll('input[name="helper_ids"]').forEach((cb) => {
        cb.checked = false;
        const lbl = cb.closest('.helper-check');
        if (lbl) lbl.classList.remove('checked');
      });
      break;
    }
    case 'helpers-generate-checks': {
      const form = el.closest('form');
      if (!form) break;
      const assigneeVal = Number(form.elements.assignee_id ? form.elements.assignee_id.value : 0);
      const checkedHelperIds = Array.from(form.querySelectorAll('input[name="helper_ids"]:checked')).map((cb) => Number(cb.value));
      const participantIds = Array.from(new Set([assigneeVal, ...checkedHelperIds].filter(Boolean)));
      if (!participantIds.length) {
        toast('Selecciona primero a los participantes o haz clic en "👥 Seleccionar todos".', 'error');
        break;
      }
      let added = 0;
      for (const uid of participantIds) {
        const u = userById(uid);
        if (!u) continue;
        const already = state.draftSubtasks.some((s) => Number(s.user_id) === uid || String(s.text || '').toLowerCase().includes(u.name.toLowerCase()));
        if (!already) {
          state.draftSubtasks.push({
            id: Date.now() + uid,
            text: `👤 ${u.name} (completó su parte)`,
            user_id: uid,
            is_member_check: true,
            done: false
          });
          added++;
        }
      }
      renderDraftSubtasksList();
      toast(added ? `☑️ Se crearon ${added} casillas individuales por participante` : 'Ya existen casillas para los participantes seleccionados', 'ok');
      break;
    }
    case 'reschedule-today': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (!t) break;
      const p = getBogotaParts(new Date());
      const targetHour = Number(p.hour) >= DEFAULT_DUE_HOUR ? 23 : DEFAULT_DUE_HOUR;
      const newDue = `${todayStr()}T${pad(targetHour)}:00:00-05:00`;
      const patch = {
        due_at: newDue,
        updated_at: nowIso()
      };
      if (t.status === 'faltante') patch.status = 'sin_iniciar';
      run(async () => {
        await safeTaskUpdate(id, patch);
        await logActivity('editar', 'tarea', id, `Reprogramó para hoy la tarea "${t.title}"`);
      }, `📅 Reprogramada para hoy (${pad(targetHour)}:00)`);
      break;
    }
    case 'reschedule-all-faltantes': {
      const faltantes = activeTasks().filter((t) => !t.is_private && t.status === 'faltante');
      if (!faltantes.length) break;
      if (!confirm(`¿Reprogramar las ${faltantes.length} tarea(s) faltante(s) para hoy a las ${pad(DEFAULT_DUE_HOUR)}:00?`)) break;
      const p = getBogotaParts(new Date());
      const targetHour = Number(p.hour) >= DEFAULT_DUE_HOUR ? 23 : DEFAULT_DUE_HOUR;
      const newDue = `${todayStr()}T${pad(targetHour)}:00:00-05:00`;
      run(async () => {
        for (const t of faltantes) {
          await safeTaskUpdate(t.id, { status: 'sin_iniciar', due_at: newDue, updated_at: nowIso() });
        }
        await logActivity('editar', 'tarea', null, `Reprogramó ${faltantes.length} tareas faltantes para hoy`);
      }, `📅 ${faltantes.length} tareas reprogramadas para hoy`);
      break;
    }
    case 'nav':
      state.view = el.dataset.view;
      if (state.view === 'mas') state.more = 'menu';
      localStorage.setItem('obj_view', state.view);
      render();
      window.scrollTo(0, 0);
      if (state.view === 'actividad') loadActivity().catch((err) => toast(err.message, 'error'));
      break;
    case 'more':
      state.more = el.dataset.sub;
      render();
      window.scrollTo(0, 0);
      if (state.more === 'estadisticas') loadActivity().catch((err) => toast(err.message, 'error'));
      break;
    case 'toggle-theme':
      toggleTheme();
      break;
    case 'toggle-notif-mode':
      state.notifMode = state.notifMode === 'mine' ? 'all' : 'mine';
      localStorage.setItem('obj_notif_mode', state.notifMode);
      toast(
        state.notifMode === 'mine'
          ? '🎯 Modo activo: Solo mis tareas y alertas SOS'
          : '🌐 Modo activo: Todas las alertas del equipo',
        'ok'
      );
      render();
      break;
    case 'open-shift-summary':
      openShiftSummarySheet();
      break;
    case 'go-board-sos':
      closeSheet();
      state.view = 'tablero';
      localStorage.setItem('obj_view', 'tablero');
      render();
      window.scrollTo(0, 0);
      break;
    case 'open-pin-sheet':
      openPinConfigSheet();
      break;
    case 'remove-my-pin':
      if (!state.me || !confirm('¿Quitar el PIN de 4 dígitos de tu cuenta?')) break;
      await safeUserPinUpdate(state.me.id, null);
      closeSheet();
      toast('🔓 PIN desactivado', 'ok');
      render();
      break;
    case 'admin-reset-pin': {
      if (!isAdmin() || !id) break;
      const u = findItem('users', id);
      if (!u || !confirm(`¿Restablecer (quitar) el PIN de ${u.name}?`)) break;
      await safeUserPinUpdate(id, null);
      toast(`🔓 PIN de ${u.name} restablecido`, 'ok');
      render();
      break;
    }
    case 'filter-zone':
      state.filters.zone = el.dataset.zone || '';
      render();
      break;
    case 'sync-offline-now':
      flushOfflineQueue();
      break;
    case 'toggle-subtask': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (!t) break;
      const idx = Number(el.dataset.idx);
      const subtasks = getSubtasks(t).map((s, i) => (i === idx ? { ...s, done: !s.done, done_by: state.me ? state.me.name : '', done_at: nowIso() } : s));
      const patch = { subtasks, updated_at: nowIso() };
      const allSubsDone = subtasks.length > 0 && subtasks.every((s) => s.done);
      const anySubDone = subtasks.some((s) => s.done);
      const hasMemberChecks = subtasks.some((s) => s.is_member_check || /^👤\s/.test(s.text || ''));

      if (allSubsDone && hasMemberChecks && t.status !== 'terminada') {
        patch.status = 'terminada';
        patch.completed_at = nowIso();
        patch.completed_by = state.me ? state.me.id : null;
        patch.needs_help = false;
        markNotificationTagHandled(`done-${id}-terminada`);
        await safeTaskUpdate(id, patch);
        await logActivity('editar', 'tarea', id, `Completó el último paso grupal y finalizó "${t.title}"`);
        toast('🎉 ¡Todos completaron su parte! Tarea grupal finalizada.', 'ok');
      } else {
        if (anySubDone && t.status === 'sin_iniciar') {
          patch.status = 'en_progreso';
          if (!t.started_at) patch.started_at = nowIso();
        }
        await safeTaskUpdate(id, patch);
      }
      render();
      break;
    }
    case 'draft-subtask-add': {
      const inp = document.getElementById('new-subtask-input');
      if (!inp) break;
      const text = inp.value.trim();
      if (!text) break;
      state.draftSubtasks.push({ text, done: false });
      inp.value = '';
      renderDraftSubtasksList();
      inp.focus();
      break;
    }
    case 'draft-subtask-toggle': {
      const idx = Number(el.dataset.idx);
      if (state.draftSubtasks[idx]) {
        state.draftSubtasks[idx].done = !state.draftSubtasks[idx].done;
        renderDraftSubtasksList();
      }
      break;
    }
    case 'draft-subtask-del': {
      const idx = Number(el.dataset.idx);
      state.draftSubtasks.splice(idx, 1);
      renderDraftSubtasksList();
      break;
    }
    case 'draft-photo-del': {
      const idx = Number(el.dataset.idx);
      state.draftPhotos.splice(idx, 1);
      renderDraftPhotosList();
      break;
    }
    case 'preview-draft-photo': {
      const idx = Number(el.dataset.idx);
      const p = state.draftPhotos[idx];
      if (p) openPhotoLightbox(p.url, `${p.label || 'Evidencia'} · Subida por ${p.by || ''}`);
      break;
    }
    case 'view-photo': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (!t) break;
      const photos = getPhotos(t);
      const p = photos[Number(el.dataset.idx)];
      if (p) openPhotoLightbox(p.url, `${p.label || 'Evidencia'} · ${t.title} (${p.by || 'Equipo'})`);
      break;
    }
    case 'quick-photo': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (t) openQuickPhotoSheet(t);
      break;
    }
    case 'open-comments': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (t) openCommentsSheet(t);
      break;
    }
    case 'enable-notifications':
      await requestNotificationPermission();
      break;
    case 'toggle-notifications': {
      const currentlyOff = isNotificationsMuted();
      if (currentlyOff) {
        localStorage.setItem('obj_notifications_disabled', 'false');
        if (!isNotificationGranted()) {
          await requestNotificationPermission();
        } else {
          toast('🔔 Notificaciones reactivadas', 'ok');
          await sendLocalNotification('🔔 Notificaciones reactivadas', {
            body: 'Volverás a recibir todas las alertas del equipo.',
            tag: 'notif-re-' + Date.now()
          });
          render();
        }
      } else if (!isNotificationGranted()) {
        await requestNotificationPermission();
      } else {
        localStorage.setItem('obj_notifications_disabled', 'true');
        toast('🔕 Notificaciones silenciadas', 'ok');
        render();
      }
      break;
    }
    case 'test-notification': {
      localStorage.setItem('obj_notifications_disabled', 'false');
      if (!('Notification' in window)) {
        toast('En iPhone/iPad debes agregar la app a Pantalla de Inicio desde Safari para notificaciones al dispositivo.', 'error');
        showInAppNotificationBanner(
          '📱 Requiere instalar en Pantalla de Inicio',
          'En iPhone/iPad abre en Safari → Compartir → Agregar a inicio para recibir notificaciones al dispositivo.'
        );
        break;
      }
      if (Notification.permission === 'default') {
        await requestNotificationPermission();
        break;
      }
      if (Notification.permission === 'denied') {
        toast('⚠️ Tienes bloqueadas las notificaciones en el navegador. Toca el candado junto a la URL arriba y elige "Permitir".', 'error');
        showInAppNotificationBanner(
          '⚠️ Notificaciones bloqueadas en tu navegador',
          'Toca el icono a la izquierda de la dirección web arriba → Permisos → Notificaciones → Permitir.'
        );
        break;
      }
      const reg = await ensureServiceWorker();
      if (reg) await subscribeDeviceToWebPush(reg);
      const testTag = 'test-notif-' + Date.now();
      const sent = await sendLocalNotification('🔔 Prueba de notificación al dispositivo', {
        body: '¡Notificación activa! Tu dispositivo ya recibe alertas del equipo.',
        tag: testTag,
        immediate: true
      });
      if (sent) {
        toast('✅ Notificación de prueba enviada al dispositivo.', 'ok');
      }
      render();
      break;
    }
    case 'trigger-install':
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            toast('¡Aplicación instalada con éxito!', 'ok');
          }
          window.deferredPrompt = null;
        });
      } else {
        toast('Sigue las instrucciones abajo según tu tipo de dispositivo.', '');
      }
      break;
    case 'close-sheet':
      closeSheet(); break;
    case 'login-pick':
      doLogin(el.dataset.name); break;
    case 'logout':
      if (!confirm('¿Cerrar sesión?')) return;
      clearSession(); render(); break;

    case 'new-task':
      openTaskSheet({
        due_at: defaultDue(), estimated_minutes: 30, priority: 'media', status: 'sin_iniciar',
        assignee_id: el.dataset.assignee ? Number(el.dataset.assignee) : (isLead() ? null : state.me.id),
        objective_id: el.dataset.objective ? Number(el.dataset.objective) : null,
        zone: state.filters.zone || '',
        is_private: false,
      });
      break;
    case 'new-private-task':
      openTaskSheet({
        due_at: defaultDue(), estimated_minutes: 30, priority: 'media', status: 'sin_iniciar',
        assignee_id: state.me.id,
        objective_id: null,
        is_private: true,
      });
      break;
    case 'open-task': {
      const t = findItem('tasks', id); if (t) openTaskSheet(t); break;
    }
    case 'task-status': {
      e.stopPropagation();
      const status = el.dataset.status;
      const t = findItem('tasks', id);
      if (!t) break;
      const patch = { status, updated_at: nowIso() };
      if (status === 'en_progreso' && !t.started_at) patch.started_at = nowIso();
      if (status === 'terminada') {
        patch.completed_at = nowIso();
        patch.completed_by = state.me ? state.me.id : null;
        patch.needs_help = false;
      } else if (t.status === 'terminada') {
        patch.completed_at = null;
        patch.completed_by = null;
      }
      if (status === 'terminada') markNotificationTagHandled(`done-${id}-terminada`);
      else if (status === 'en_progreso') markNotificationTagHandled(`prog-${id}`);
      run(async () => {
        await safeTaskUpdate(id, patch);
        await logActivity('editar', 'tarea', id, `Cambió estado a "${STATUS[status]}" en "${t.title}"`);
        if (!t.is_private && state.me) {
          if (status === 'terminada') {
            dispatchRemoteWebPush({
              title: '✅ Tarea finalizada',
              body: `"${t.title}" fue finalizada por ${state.me.name}`,
              tag: `done-${id}-terminada`,
              excludeUserId: state.me.id
            });
          } else if (status === 'en_progreso') {
            dispatchRemoteWebPush({
              title: '▶️ Tarea en progreso',
              body: `${state.me.name} comenzó "${t.title}"`,
              tag: `prog-${id}`,
              excludeUserId: state.me.id
            });
          }
        }
      }, status === 'terminada' ? '¡Tarea terminada! ✓' : 'Tarea en progreso');
      break;
    }
    case 'take-task': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      if (!t) break;
      markNotificationTagHandled(`taken-${id}`);
      run(async () => {
        await safeTaskUpdate(id, { assignee_id: state.me.id, updated_at: nowIso() });
        await logActivity('tomar', 'tarea', id, `Tomó la tarea "${t.title}"`);
        if (!t.is_private && state.me) {
          dispatchRemoteWebPush({
            title: '✋ Tarea tomada',
            body: `${state.me.name} tomó la tarea "${t.title}"`,
            tag: `taken-${id}`,
            excludeUserId: state.me.id
          });
        }
      }, 'Tarea tomada. ¡Es tuya!');
      break;
    }
    case 'join-helper': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      if (!t) break;
      const currentHelpers = getHelperIds(t);
      if (!currentHelpers.includes(state.me.id)) {
        const nextHelpers = [...currentHelpers, state.me.id];
        markNotificationTagHandled(`helper-${id}`);
        run(async () => {
          await safeTaskUpdate(id, { helper_ids: nextHelpers, updated_at: nowIso() });
          await logActivity('editar', 'tarea', id, `Se unió como ayudante a la tarea "${t.title}"`);
          if (!t.is_private && state.me) {
            dispatchRemoteWebPush({
              title: '🤝 Nuevo ayudante en tarea',
              body: `${state.me.name} se unió a apoyar en "${t.title}"`,
              tag: `helper-${id}`,
              excludeUserId: state.me.id
            });
          }
        }, '¡Te uniste como ayudante a la tarea!');
      }
      break;
    }
    case 'leave-helper': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      if (!t) break;
      const currentHelpers = getHelperIds(t);
      const nextHelpers = currentHelpers.filter((hid) => hid !== state.me.id);
      run(async () => {
        await safeTaskUpdate(id, { helper_ids: nextHelpers, updated_at: nowIso() });
        await logActivity('editar', 'tarea', id, `Dejó de ser ayudante en la tarea "${t.title}"`);
      }, 'Dejaste de apoyar en la tarea');
      break;
    }

    case 'help-on': {
      e.stopPropagation(); const t = findItem('tasks', id); if (t) openHelpSheet(t); break;
    }
    case 'help-off': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (!t) break;
      run(async () => {
        await safeTaskUpdate(id, { needs_help: false, help_note: '', updated_at: nowIso() });
        await logActivity('editar', 'tarea', id, `Retiró solicitud de ayuda en "${t.title}"`);
      }, 'Solicitud de ayuda retirada');
      break;
    }
    case 'set-minutes': {
      const input = el.form && el.form.elements.estimated_minutes;
      if (input && !input.disabled) input.value = el.dataset.min;
      break;
    }

    case 'new-objective': openObjectiveSheet({}); break;
    case 'edit-objective': { const o = findItem('objectives', id); if (o) openObjectiveSheet(o); break; }
    case 'update-metric': { const o = findItem('objectives', id); if (o) openMetricSheet(o); break; }
    case 'metric-add': {
      const input = el.closest('form').elements.add;
      input.value = (Number(input.value) || 0) + Number(el.dataset.n);
      break;
    }
    case 'objective-tasks':
      state.filters.objective = String(id); state.filters.person = ''; state.view = 'tablero';
      localStorage.setItem('obj_view', 'tablero'); render(); window.scrollTo(0, 0); break;
    case 'new-routine': openRoutineSheet({}); break;
    case 'edit-routine': { const r = findItem('routines', id); if (r) openRoutineSheet(r); break; }

    case 'filter-person':
      state.filters.person = state.filters.person === String(el.dataset.id) ? '' : String(el.dataset.id || '');
      render(); break;
    case 'board-status':
      state.filters.status = el.dataset.status; render(); break;
    case 'toggle-done-today':
      state.showAllDoneToday = !state.showAllDoneToday;
      render(); break;
    case 'set-board-done-filter':
      state.boardDoneFilter = el.dataset.val || 'recientes';
      render(); break;

    case 'toggle-privacy': {
      e.stopPropagation();
      const t = findItem('tasks', id);
      if (!t) return;
      const willBePrivate = !t.is_private;
      const msg = willBePrivate
        ? `¿Hacer privada la tarea "${t.title}"?\nSolo tú podrás verla en tu sección privada.`
        : `¿Hacer pública la tarea "${t.title}"?\nTodo el equipo podrá verla en el tablero.`;
      if (!confirm(msg)) return;
      const patch = {
        is_private: willBePrivate,
        updated_at: nowIso()
      };
      if (willBePrivate) {
        patch.assignee_id = state.me.id;
        patch.helper_ids = [];
      }
      run(async () => {
        await safeTaskUpdate(id, patch);
        await logActivity('editar', 'tarea', id, `${willBePrivate ? 'Cambió a privada' : 'Hizo pública'} la tarea "${t.title}"`);
      }, willBePrivate ? 'Tarea cambiada a privada (solo tú la ves)' : 'Tarea hecha pública (visible para el equipo)');
      break;
    }

    case 'hide': {
      const item = findItem(kind, id);
      if (!item || !confirm(`¿Ocultar "${item.title}"?\nNo se perderá: podrás restaurarlo en Más → Elementos ocultos.`)) return;
      closeSheet();
      run(async () => {
        const patch = { active: false, hidden_by: state.me.id, hidden_at: nowIso(), updated_at: nowIso() };
        if (kind === 'tasks') {
          await safeTaskUpdate(id, patch);
        } else {
          const { error } = await sb.from(KIND_TABLE[kind]).update(patch).eq('id', id);
          if (error) throw new Error(error.message);
        }
        await logActivity('ocultar', kind === 'tasks' ? 'tarea' : 'objetivo', id, `Ocultó "${item.title}"`);
      }, 'Oculto. Puedes restaurarlo en Elementos ocultos.');
      break;
    }
    case 'restore': {
      const item = findItem(kind, id);
      run(async () => {
        const patch = { active: true, hidden_by: null, hidden_at: null, updated_at: nowIso() };
        if (kind === 'tasks') {
          await safeTaskUpdate(id, patch);
        } else {
          const { error } = await sb.from(KIND_TABLE[kind]).update(patch).eq('id', id);
          if (error) throw new Error(error.message);
        }
        await logActivity('restaurar', kind === 'tasks' ? 'tarea' : 'objetivo', id, `Restauró "${item.title}"`);
      }, 'Restaurado');
      break;
    }
    case 'hard-delete': {
      if (!isAdmin()) { toast('Solo un administrador puede eliminar definitivamente.', 'error'); return; }
      const item = findItem(kind, id);
      const label = item ? (item.title || item.name) : '';
      if (!confirm(`⚠️ ELIMINAR DEFINITIVAMENTE "${label}"?\n\nEsta acción no se puede deshacer.`)) return;
      closeSheet();
      run(async () => {
        const { error } = await sb.from(KIND_TABLE[kind]).delete().eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('eliminar', kind === 'tasks' ? 'tarea' : 'objetivo', id, `Eliminó definitivamente "${label}"`);
      }, 'Eliminado definitivamente');
      break;
    }
    case 'user-toggle': {
      const u = findItem('users', id);
      if (!u) return;
      if (u.active && !confirm(`¿Desactivar a ${u.name}?`)) return;
      run(async () => {
        const { error } = await sb.from('users').update({ active: !u.active }).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('editar', 'usuario', id, `${u.active ? 'Desactivó' : 'Reactivó'} a ${u.name}`);
      }, u.active ? 'Usuario desactivado' : 'Usuario reactivado');
      break;
    }
    case 'user-delete': {
      if (!isAdmin()) return;
      const u = findItem('users', id);
      if (!u || !confirm(`⚠️ ¿Eliminar definitivamente a ${u.name}?`)) return;
      run(async () => {
        const { error } = await sb.from('users').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('eliminar', 'usuario', id, `Eliminó a ${u.name}`);
      }, 'Usuario eliminado');
      break;
    }
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.filter) {
    state.filters[el.dataset.filter] = el.value;
    if (el.dataset.filter === 'activityUser') loadActivity().catch((err) => toast(err.message, 'error'));
    else render();
  } else if (el.dataset.change === 'user-role') {
    const uid = Number(el.dataset.id);
    const targetUser = findItem('users', uid);
    if (!isAdmin() && !(state.me && state.me.role === 'lider' && targetUser && ['colaborador', 'colaborador_pro'].includes(targetUser.role))) {
      toast('No tienes permiso para cambiar este rol.', 'error');
      return;
    }
    const role = el.value;
    run(async () => {
      const { error } = await sb.from('users').update({ role }).eq('id', uid);
      if (error) throw new Error(error.message);
      await logActivity('editar', 'usuario', uid, `Cambió rol de ${targetUser ? targetUser.name : 'usuario'} a ${ROLE[role]}`);
    }, 'Rol actualizado');
  }
});

document.addEventListener('submit', async (e) => {
  const form = e.target;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const id = form.dataset.id ? Number(form.dataset.id) : null;
  const fd = new FormData(form);
  const btn = form.querySelector('[type=submit]');
  if (btn) btn.disabled = true;
  let ok = false;

  if (kind === 'login') {
    await doLogin(fd.get('name'));
    if (btn) btn.disabled = false;
    return;
  }

  if (kind === 'pin-verify') {
    const uid = Number(form.dataset.userid);
    const user = state.users.find((u) => u.id === uid) || state._pendingLoginUser;
    const entered = String(fd.get('pin_code') || '').trim();
    const expected = getUserPin(user);
    if (entered !== expected) {
      toast('❌ PIN incorrecto. Intenta de nuevo.', 'error');
      if (btn) btn.disabled = false;
      form.reset();
      return;
    }
    closeSheet();
    await completeLogin(user);
    return;
  }

  if (kind === 'pin-config') {
    if (!state.me) { if (btn) btn.disabled = false; return; }
    const existingPin = getUserPin(state.me);
    if (existingPin) {
      const currentPin = String(fd.get('current_pin') || '').trim();
      if (currentPin !== existingPin) {
        toast('El PIN actual no coincide.', 'error');
        if (btn) btn.disabled = false;
        return;
      }
    }
    const newPin = String(fd.get('new_pin') || '').trim();
    if (!/^\d{4}$/.test(newPin)) {
      toast('El PIN debe tener exactamente 4 números.', 'error');
      if (btn) btn.disabled = false;
      return;
    }
    await safeUserPinUpdate(state.me.id, newPin);
    toast('🔒 PIN de 4 dígitos guardado', 'ok');
    closeSheet();
    render();
    return;
  }

  if (kind === 'comment') {
    const t = findItem('tasks', id);
    const text = String(fd.get('comment_text') || '').trim();
    if (!t || !text) { if (btn) btn.disabled = false; return; }
    const comments = [
      ...getComments(t),
      {
        id: Date.now(),
        user_id: state.me.id,
        user_name: state.me.name,
        text,
        created_at: nowIso()
      }
    ];
    markNotificationTagHandled(`comment-${id}-${comments.length}`);
    await safeTaskUpdate(id, { comments, updated_at: nowIso() });
    await logActivity('comentar', 'tarea', id, `Comentó en "${t.title}": ${text.slice(0, 60)}`);
    if (!t.is_private && state.me) {
      dispatchRemoteWebPush({
        title: `💬 Nota en "${t.title}"`,
        body: `${state.me.name}: "${text.slice(0, 80)}"`,
        tag: `comment-${id}-${comments.length}`,
        excludeUserId: state.me.id
      });
    }
    toast('💬 Nota agregada', 'ok');
    const updatedTask = findItem('tasks', id) || { ...t, comments };
    openCommentsSheet(updatedTask);
    render();
    return;
  }

  if (kind === 'quick-photo') {
    const t = findItem('tasks', id);
    const fileInput = form.elements.photo_file;
    const file = fileInput && fileInput.files && fileInput.files[0];
    const label = String(fd.get('photo_label') || 'Después');
    if (!t || !file) {
      toast('Selecciona o toma una foto.', 'error');
      if (btn) btn.disabled = false;
      return;
    }
    try {
      const dataUrl = await compressImageFile(file);
      const photos = [
        ...getPhotos(t),
        {
          id: Date.now(),
          url: dataUrl,
          label,
          by: state.me ? state.me.name : 'Equipo',
          at: nowIso()
        }
      ];
      await safeTaskUpdate(id, { photos, updated_at: nowIso() });
      await logActivity('foto', 'tarea', id, `Subió foto (${label}) en "${t.title}"`);
      toast('📷 Evidencia fotográfica guardada', 'ok');
      closeSheet();
      render();
    } catch (err) {
      toast('Error procesando foto: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
    return;
  }

  if (kind === 'task') {
    const existingTask = id ? findItem('tasks', id) : null;
    const data = Object.fromEntries(fd.entries());
    // Eliminar campos auxiliares del formulario que no son columnas de DB
    delete data.photo_label;
    delete data.group_auto_checks;
    data.needs_help = form.elements.needs_help.checked;
    if (!data.needs_help) data.help_note = '';

    // Si quien edita es un ayudante/responsable sin permisos de edición completa, conservar campos deshabilitados
    if (existingTask && !canFullEditTask(existingTask)) {
      if (data.title === undefined) data.title = existingTask.title;
      if (data.description === undefined) data.description = existingTask.description || '';
      if (data.zone === undefined) data.zone = getTaskZone(existingTask);
      if (data.objective_id === undefined) data.objective_id = existingTask.objective_id;
      if (data.due_at === undefined) data.due_at = existingTask.due_at;
      if (data.estimated_minutes === undefined) data.estimated_minutes = existingTask.estimated_minutes;
      if (data.priority === undefined) data.priority = existingTask.priority;
    }

    // Soporte para tareas privadas
    data.is_private = form.elements.is_private ? form.elements.is_private.checked : (existingTask ? Boolean(existingTask.is_private) : false);

    // Si es privada, se autoasigna al creador
    if (data.is_private) {
      data.assignee_id = state.me.id;
      data.helper_ids = [];
    } else {
      // Múltiples ayudantes
      const selectedHelpers = fd.getAll('helper_ids').map(Number).filter(Boolean);
      data.helper_ids = selectedHelpers;
    }

    // Si quedó texto escrito en el input de subtarea sin darle a "+ Agregar", incluirlo
    const pendingSubInp = document.getElementById('new-subtask-input');
    if (pendingSubInp && pendingSubInp.value.trim()) {
      state.draftSubtasks.push({ text: pendingSubInp.value.trim(), done: false });
    }

    // Si activó el checkbox de "Modo Tarea Grupal", generar automáticamente casillas por participante seleccionado
    const groupAutoChecks = form.elements.group_auto_checks && form.elements.group_auto_checks.checked;
    if (groupAutoChecks && !data.is_private) {
      const pIds = Array.from(new Set([Number(data.assignee_id || 0), ...(data.helper_ids || [])].filter(Boolean)));
      for (const uid of pIds) {
        const u = userById(uid);
        if (!u) continue;
        const already = state.draftSubtasks.some((s) => Number(s.user_id) === uid || String(s.text || '').toLowerCase().includes(u.name.toLowerCase()));
        if (!already) {
          state.draftSubtasks.push({
            id: Date.now() + uid,
            text: `👤 ${u.name} (completó su parte)`,
            user_id: uid,
            is_member_check: true,
            done: false
          });
        }
      }
    }

    data.zone = data.zone || '';
    data.subtasks = state.draftSubtasks || [];
    data.photos = state.draftPhotos || [];

    ['assignee_id', 'objective_id', 'due_at'].forEach((k) => { if (!data[k]) data[k] = null; });
    if (data.assignee_id) data.assignee_id = Number(data.assignee_id);
    if (data.objective_id) data.objective_id = Number(data.objective_id);

    // Ajustar due_at con la zona horaria de Bogotá (-05:00) para persistencia correcta en Supabase
    if (data.due_at) {
      if (data.due_at.length === 16) {
        data.due_at = data.due_at + ':00-05:00';
      }
    }

    // Registrar timestamps y quién finalizó la tarea cuando cambia de estado dentro del formulario
    if (data.status === 'en_progreso' && (!existingTask || !existingTask.started_at)) {
      data.started_at = nowIso();
    }
    if (data.status === 'terminada') {
      if (!existingTask || existingTask.status !== 'terminada') {
        data.completed_at = nowIso();
        data.completed_by = state.me ? state.me.id : null;
      }
      data.needs_help = false;
    } else if (existingTask && existingTask.status === 'terminada') {
      data.completed_at = null;
      data.completed_by = null;
    }

    data.estimated_minutes = Number(data.estimated_minutes) || 0;
    data.updated_at = nowIso();

    ok = await run(async () => {
      if (id) {
        if (data.status === 'terminada') markNotificationTagHandled(`done-${id}-terminada`);
        if (data.status === 'en_progreso') markNotificationTagHandled(`prog-${id}`);
        if (data.needs_help) markNotificationTagHandled(`help-${id}`);
        if (data.assignee_id) markNotificationTagHandled(`taken-${id}`);
        markNotificationTagHandled(`helper-${id}`);
        await safeTaskUpdate(id, data);
        await logActivity('editar', 'tarea', id, `Modificó la tarea "${data.title}"`);
      } else {
        data.created_by = state.me.id;
        data.created_at = nowIso();
        data.comments = [];
        const { data: created } = await safeTaskInsert(data);
        const createdId = created ? created.id : Date.now();
        markNotificationTagHandled(`task-new-${createdId}`);
        await logActivity('crear', 'tarea', createdId, `Creó la tarea "${data.title}"`);
        if (!data.is_private && state.me) {
          const assigneeLabel = data.assignee_id ? userName(data.assignee_id) : 'Sin asignar';
          dispatchRemoteWebPush({
            title: '🆕 Nueva tarea creada',
            body: `"${data.title}" · Responsable: ${assigneeLabel}`,
            tag: `task-new-${createdId}`,
            excludeUserId: state.me.id
          });
        }
      }
    }, id ? 'Tarea actualizada' : 'Tarea creada');
  } else if (kind === 'objective') {
    const data = Object.fromEntries(fd.entries());
    ['start_date', 'end_date', 'metric_target'].forEach((k) => { if (!data[k]) data[k] = null; });
    if (data.metric_target) data.metric_target = Number(data.metric_target);
    data.metric_current = Number(data.metric_current) || 0;
    data.updated_at = nowIso();

    ok = await run(async () => {
      if (id) {
        const { error } = await sb.from('objectives').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('editar', 'objetivo', id, `Modificó el objetivo "${data.title}"`);
      } else {
        data.created_by = state.me.id;
        data.created_at = nowIso();
        const { data: created, error } = await sb.from('objectives').insert([data]).select().single();
        if (error) throw new Error(error.message);
        await logActivity('crear', 'objetivo', created.id, `Creó el objetivo "${data.title}"`);
      }
    }, id ? 'Objetivo actualizado' : 'Objetivo creado');
  } else if (kind === 'metric') {
    const o = findItem('objectives', id);
    const total = fd.get('total'), add = fd.get('add');
    let value = null;
    if (total !== '' && total !== null) value = Number(total);
    else if (add !== '' && add !== null) value = (Number(o.metric_current) || 0) + Number(add);
    if (value === null || isNaN(value)) { toast('Escribe un número válido.', 'error'); if (btn) btn.disabled = false; return; }

    ok = await run(async () => {
      const { error } = await sb.from('objectives').update({ metric_current: value, updated_at: nowIso() }).eq('id', id);
      if (error) throw new Error(error.message);
      await logActivity('editar', 'objetivo', id, `Actualizó avance de "${o.title}" a ${value}`);
    }, 'Avance registrado');
  } else if (kind === 'routine') {
    const data = Object.fromEntries(fd.entries());
    data.weekdays = fd.getAll('weekdays').join(',');
    if (!data.weekdays) { toast('Selecciona al menos un día.', 'error'); if (btn) btn.disabled = false; return; }
    ['assignee_id', 'objective_id'].forEach((k) => { if (!data[k]) data[k] = null; });
    if (data.assignee_id) data.assignee_id = Number(data.assignee_id);
    if (data.objective_id) data.objective_id = Number(data.objective_id);
    data.estimated_minutes = Number(data.estimated_minutes) || 0;
    data.updated_at = nowIso();

    ok = await run(async () => {
      const coreRoutine = { ...data };
      delete coreRoutine.zone;
      if (id) {
        const { error } = await sb.from('routines').update(data).eq('id', id);
        if (error) {
          if (/column|schema cache/i.test(error.message)) {
            const { error: err2 } = await sb.from('routines').update(coreRoutine).eq('id', id);
            if (err2) throw new Error(err2.message);
          } else throw new Error(error.message);
        }
        await logActivity('editar', 'rutina', id, `Modificó rutina "${data.title}"`);
      } else {
        data.created_by = state.me.id;
        data.created_at = nowIso();
        coreRoutine.created_by = state.me.id;
        coreRoutine.created_at = data.created_at;
        let createdRes = await sb.from('routines').insert([data]).select().single();
        if (createdRes.error && /column|schema cache/i.test(createdRes.error.message)) {
          createdRes = await sb.from('routines').insert([coreRoutine]).select().single();
        }
        if (createdRes.error) throw new Error(createdRes.error.message);
        await logActivity('crear', 'rutina', createdRes.data.id, `Creó rutina diaria "${data.title}"`);
      }
    }, id ? 'Rutina actualizada' : 'Rutina creada');
  } else if (kind === 'help') {
    const t = findItem('tasks', id);
    const helpNote = fd.get('help_note') || '';
    const helpFile = form.elements.help_photo && form.elements.help_photo.files && form.elements.help_photo.files[0];
    markNotificationTagHandled(`help-${id}`);
    ok = await run(async () => {
      const patch = {
        needs_help: true,
        help_note: helpNote,
        updated_at: nowIso()
      };
      if (helpFile && t) {
        const dataUrl = await compressImageFile(helpFile);
        patch.photos = [
          ...getPhotos(t),
          {
            id: Date.now(),
            url: dataUrl,
            label: 'SOS / Bloqueo',
            by: state.me ? state.me.name : 'Equipo',
            at: nowIso()
          }
        ];
      }
      await safeTaskUpdate(id, patch);
      await logActivity('editar', 'tarea', id, `Pidió ayuda en "${t.title}"`);
      if (t && !t.is_private && state.me) {
        dispatchRemoteWebPush({
          title: '🆘 Piden ayuda con una tarea',
          body: `${state.me.name} necesita apoyo en "${t.title}"${helpNote ? ': ' + helpNote : ''}`,
          tag: `help-${id}`,
          excludeUserId: state.me.id
        });
      }
    }, 'Aviso enviado: tu equipo verá que necesitas ayuda');
  }

  if (ok) closeSheet();
  else if (btn) btn.disabled = false;
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.sheetOpen) closeSheet(); });

/* ---------- Autenticación por Nombre (+ PIN opcional de 4 dígitos) ---------- */
function openPinVerifySheet(user) {
  state._pendingLoginUser = user;
  openSheet(`
  <form data-form="pin-verify" data-userid="${user.id}" class="stack">
    ${sheetHead('🔒 Ingresa tu PIN')}
    <p class="muted" style="margin-top:0;text-align:center">Hola <strong>${esc(user.name)}</strong>, tu cuenta está protegida con un PIN de 4 dígitos.</p>
    <label class="field"><span>PIN de 4 dígitos</span>
      <input type="password" name="pin_code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required class="pin-input-large" placeholder="••••" autofocus>
    </label>
    <p class="muted" style="font-size:.78rem;text-align:center">¿Olvidaste tu PIN? Pídele a un Administrador que lo restablezca en Más → Equipo.</p>
    <div class="sheet-actions">
      <button type="button" class="btn btn-ghost" data-action="close-sheet">Cancelar</button>
      <span class="spacer"></span>
      <button type="submit" class="btn btn-primary">Entrar</button>
    </div>
  </form>`);
}

async function completeLogin(user) {
  try {
    const isoNow = nowIso();
    if (navigator.onLine && sb) {
      await sb.from('users').update({ last_login: isoNow }).eq('id', user.id);
    }
    user.last_login = isoNow;
    state.me = user;
    localStorage.setItem('obj_user', JSON.stringify(user));
    localStorage.setItem(`obj_daily_entry_${user.id}`, todayStr());
    localStorage.setItem(`obj_last_ping_${user.id}`, String(Date.now()));
    state.view = 'hoy';
    await logActivity('login', 'usuario', user.id, 'Entró a la aplicación');
    await refresh();
    toast(`¡Hola, ${user.name}!`, 'ok');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function doLogin(name) {
  name = String(name || '').trim();
  if (name.length < 2) { toast('Escribe tu nombre.', 'error'); return; }
  try {
    assertSupabase();
    // Buscar si el usuario ya existe
    const { data: existing, error: findErr } = await sb.from('users').select('*').ilike('name', name).maybeSingle();
    if (findErr) throw new Error(findErr.message);

    let user = existing;
    if (!user) {
      // Si no existe nadie, el primero es admin
      const { count } = await sb.from('users').select('*', { count: 'exact', head: true });
      const role = count === 0 ? 'admin' : 'colaborador';
      const { data: created, error: createErr } = await sb.from('users').insert([{
        name, role, active: true, created_at: nowIso(), last_login: nowIso()
      }]).select().single();
      if (createErr) throw new Error(createErr.message);
      user = created;
    } else {
      if (!user.active) throw new Error('Tu usuario está desactivado.');
    }

    const pin = getUserPin(user);
    if (pin) {
      openPinVerifySheet(user);
      return;
    }

    await completeLogin(user);
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Suscripción en Tiempo Real (Realtime) ---------- */
function initRealtime() {
  if (!sb) return;
  sb.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      try { handleTaskRealtimeNotification(payload); } catch (e) { console.error('Error notif:', e); }
      refresh();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, () => refresh())
    .subscribe();
}

/* ---------- Arranque ---------- */
(async function init() {
  applyTheme(state.theme);

  window.addEventListener('online', () => {
    state.isOnline = true;
    render();
    flushOfflineQueue();
  });
  window.addEventListener('offline', () => {
    state.isOnline = false;
    render();
  });

  // Registrar Service Worker inmediatamente al arrancar
  ensureServiceWorker();

  if (sb) {
    initRealtime();
    try { await refresh(); } catch (e) { console.error(e); }
    if (navigator.onLine && state.offlineQueue.length) {
      flushOfflineQueue();
    }
  }
  render();
  ensureServiceWorker();

  // Sincronización periódica (cada 12s) para detectar cambios del equipo y tareas por vencer
  setInterval(silentRefresh, 12000);
  setInterval(checkDueTasksForNotification, 30000);
  setTimeout(checkDueTasksForNotification, 2500);

  document.addEventListener('visibilitychange', () => {
    ensureServiceWorker();
    if (!document.hidden) silentRefresh();
  });

  // Capturar evento de instalación nativo
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
  });
})();
