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
const ROLE = { admin: 'Administrador', lider: 'Líder', colaborador: 'Colaborador' };
const WEEKDAYS = [['1', 'L'], ['2', 'M'], ['3', 'X'], ['4', 'J'], ['5', 'V'], ['6', 'S'], ['7', 'D']];
const URG_RANK = { overdue: 0, critical: 1, soon: 2, near: 3, ok: 4, none: 5, done: 6 };

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
};

/* ---------- Estado local ---------- */
const state = {
  me: JSON.parse(localStorage.getItem('obj_user') || 'null'),
  users: [], objectives: [], tasks: [], routines: [], activity: [],
  view: localStorage.getItem('obj_view') || 'hoy',
  more: 'menu',
  filters: { person: '', objective: '', status: 'sin_iniciar', activityUser: '' },
  sheetOpen: false,
};

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
  // Si viene en formato ISO o YYYY-MM-DD
  const d = new Date(s.length === 10 ? s + 'T00:00:00-05:00' : (s.includes('Z') || s.includes('+') || s.includes('-') && s.length > 19 ? s : s + '-05:00'));
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
  return d ? d.toLocaleString('es-CO', { timeZone: TIMEZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

/* ---------- Selectores ---------- */
const userById = (id) => state.users.find((u) => u.id === Number(id));
const userName = (id) => (userById(id) || {}).name || 'Sin asignar';
const objById = (id) => state.objectives.find((o) => o.id === Number(id));
const activeUsers = () => state.users.filter((u) => u.active);
const activeTasks = () => state.tasks.filter((t) => t.active);
const activeObjectives = () => state.objectives.filter((o) => o.active);
const isAdmin = () => state.me && state.me.role === 'admin';
const isLead = () => state.me && (state.me.role === 'admin' || state.me.role === 'lider');
const isOpen = (t) => t.status !== 'terminada';
const doneToday = (t) => t.status === 'terminada' && (t.completed_at ? dateStr(new Date(t.completed_at)) === todayStr() : false);

// Funciones para ayudantes
const getHelperIds = (t) => Array.isArray(t.helper_ids) ? t.helper_ids.map(Number) : [];
const isHelper = (t, uid = (state.me && state.me.id)) => getHelperIds(t).includes(Number(uid));
const isAssignedOrHelper = (t, uid = (state.me && state.me.id)) => t.assignee_id === Number(uid) || isHelper(t, uid);

const canEditTask = (t) => isLead() || isAssignedOrHelper(t, state.me.id) || t.created_by === state.me.id;
const canFullEditTask = (t) => !t.id || isLead() || t.created_by === state.me.id;
const canHideTask = (t) => canEditTask(t);


function urgency(t) {
  if (t.status === 'terminada') {
    let label = 'Terminada';
    if (t.completed_at) label += ' ' + fmtDue(t.completed_at.slice(0, 16)).toLowerCase();
    return { level: 'done', label, ts: Infinity };
  }
  const d = parseLocal(t.due_at);
  if (!d) return { level: 'none', label: 'Sin fecha límite', ts: Infinity };
  const ms = d - Date.now();
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
    const ua = urgency(a), ub = urgency(b);
    return URG_RANK[ua.level] - URG_RANK[ub.level]
      || PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
      || ua.ts - ub.ts;
  });
}
const isUrgent = (t) => ['overdue', 'critical'].includes(urgency(t).level);

function objectiveStats(o) {
  const ts = activeTasks().filter((t) => t.objective_id === o.id);
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
   Operaciones en Supabase
   ========================================================================== */
function assertSupabase() {
  if (!sb) throw new Error('Por favor configura la URL y la Anon Key de Supabase en public/config.js');
}

async function logActivity(action, entity, entity_id, summary, details = null) {
  if (!sb) return;
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

async function generateRoutineTasks() {
  if (!sb || !state.routines.length) return;
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
      const { data, error } = await sb.from('tasks').insert([{
        title: r.title,
        description: r.description,
        objective_id: r.objective_id,
        routine_id: r.id,
        routine_date: today,
        assignee_id: r.assignee_id,
        estimated_minutes: r.estimated_minutes,
        priority: r.priority,
        due_at: `${today}T${r.due_time}`,
        created_by: r.created_by,
        created_at: nowIso(),
        updated_at: nowIso()
      }]).select().single();

      if (data) {
        state.tasks.unshift(data);
        await logActivity('crear', 'tarea', data.id, `Generó la tarea diaria "${r.title}" para hoy`);
      }
    }
  }
}

async function refresh() {
  if (!sb) return;
  const [uRes, oRes, tRes, rRes] = await Promise.all([
    sb.from('users').select('*').order('name', { ascending: true }),
    sb.from('objectives').select('*').order('end_date', { ascending: true }),
    sb.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false }),
    sb.from('routines').select('*').order('due_time', { ascending: true })
  ]);

  if (uRes.error) throw new Error(uRes.error.message);
  state.users = uRes.data || [];
  state.objectives = oRes.data || [];
  state.tasks = tRes.data || [];
  state.routines = rRes.data || [];

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

  await generateRoutineTasks();
  if (state.view === 'actividad') await loadActivity(false);
  render();
}

async function loadActivity(rerender = true) {
  if (!sb) return;
  let q = sb.from('activity').select('*').order('id', { ascending: false }).limit(200);
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
    if (okMsg) toast(okMsg, 'ok');
    await refresh();
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

  app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand-row"><div class="brand"><img src="icon.svg" alt=""></div><div><b>${esc(TEAM_NAME)}</b><span>${esc(STORE_NAME)} · Objetivos</span></div></div>
      <nav>${navBtns()}</nav>
      <div class="me"><span class="avatar">${esc(initials(state.me.name))}</span><div><b>${esc(state.me.name)}</b><span>${ROLE[state.me.role]}</span></div>
        <button class="icon-btn" title="Cerrar sesión" data-action="logout">${ICON.logout}</button></div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="brand"><img src="icon.svg" alt=""></div>
        <div class="t"><b>${esc(TEAM_NAME)}</b><span>${esc(STORE_NAME)} · ${ROLE[state.me.role]}</span></div>
        <span class="avatar" data-action="nav" data-view="mas">${esc(initials(state.me.name))}</span>
      </header>
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
  const chips = activeUsers().map((u) => `<button class="chip" data-action="login-pick" data-name="${esc(u.name)}">${esc(u.name)}</button>`).join('');
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
    <p class="login-note small muted">Sin contraseñas: tu nombre registra qué tareas tomas y qué modificas. Si eres la primera persona en entrar, serás Administrador.</p>
  </div></div>`;
}

function taskCard(t) {
  const u = urgency(t);
  const obj = t.objective_id ? objById(t.objective_id) : null;
  const helpers = getHelperIds(t);
  const me = state.me ? state.me.id : null;
  const isMyTask = t.assignee_id === me;
  const amHelper = helpers.includes(me);

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
        if (isMyTask || amHelper) {
          actions.push(t.needs_help
            ? `<button class="btn btn-ghost btn-sm" data-action="help-off" data-id="${t.id}">Ya no necesito ayuda</button>`
            : `<button class="btn btn-warn btn-sm" data-action="help-on" data-id="${t.id}">🆘 Pedir ayuda</button>`);
        }
      }
    }
  }

  let real = '';
  if (t.status === 'terminada' && t.started_at && t.completed_at) {
    const mins = (parseLocal(t.completed_at.slice(0, 16)) - parseLocal(t.started_at.slice(0, 16))) / 60000;
    if (mins >= 0) real = `<span title="Tiempo real">${ICON.timer} real ${fmtMinutes(mins)}</span>`;
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

  return `
  <article class="task u-${u.level} ${t.needs_help && isOpen(t) ? 'needs-help' : ''} ${t.active ? '' : 'is-hidden'}" data-action="open-task" data-id="${t.id}">
    <div class="task-top">
      <span class="pill st-${t.status}">${STATUS[t.status]}</span>
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

function viewToday() {
  const me = state.me.id;
  const all = activeTasks();
  const mine = sortTasks(all.filter((t) => isAssignedOrHelper(t, me) && isOpen(t)));
  const free = sortTasks(all.filter((t) => !t.assignee_id && isOpen(t)));
  const done = all.filter((t) => isAssignedOrHelper(t, me) && doneToday(t));
  const today = todayStr();
  const dueToday = mine.filter((t) => !t.due_at || dateStr(parseLocal(t.due_at)) <= today);
  const loadMin = dueToday.reduce((s, t) => s + (t.estimated_minutes || 0) * (t.status === 'en_progreso' ? 0.5 : 1), 0);
  const loadPct = clamp((loadMin / SHIFT_MINUTES) * 100);
  const loadCls = loadMin > SHIFT_MINUTES ? 'bad' : loadMin > SHIFT_MINUTES * 0.8 ? 'warn' : 'good';
  const urgent = mine.filter(isUrgent).length;
  const hour = Number(getBogotaParts(new Date()).hour);
  const hello = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateLabel = new Date().toLocaleDateString('es-CO', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' });

  return `
  <div class="page-head"><div><h1>${hello}, ${esc(state.me.name.split(' ')[0])}</h1><p class="muted" style="margin:4px 0 0;text-transform:capitalize">${dateLabel}</p></div></div>
  <div class="stats">
    <div class="stat"><b>${mine.length}</b><span>Mis tareas / apoyo</span></div>
    <div class="stat ${urgent ? 'alert' : ''}"><b>${urgent}</b><span>Urgentes / vencidas</span></div>
    <div class="stat"><b>${fmtMinutes(mine.reduce((s, t) => s + (t.estimated_minutes || 0), 0))}</b><span>Tiempo estimado total</span></div>
    <div class="stat good"><b>${done.length}</b><span>Terminadas hoy</span></div>
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
    </div>
    <div>
      <div class="section"><div class="section-head"><h2>Disponibles para tomar <span class="count">${free.length}</span></h2></div>
        ${taskList(free, 'No hay tareas libres en este momento.')}</div>
      <div class="section"><div class="section-head"><h2>Terminadas hoy <span class="count">${done.length}</span></h2></div>
        ${taskList(done, 'Aún no terminas tareas hoy. ¡Vamos! 💪')}</div>
    </div>
  </div>`;
}


function viewBoard() {
  const f = state.filters;
  const all = activeTasks();
  const weekAgo = Date.now() - 7 * 864e5;
  let list = all.filter((t) => isOpen(t) || (parseLocal((t.completed_at || '').slice(0, 16)) || 0) >= weekAgo);
  if (f.person === 'none') list = list.filter((t) => !t.assignee_id && !getHelperIds(t).length);
  else if (f.person) list = list.filter((t) => isAssignedOrHelper(t, Number(f.person)));
  if (f.objective) list = list.filter((t) => String(t.objective_id) === f.objective);

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

  const cols = STATUS_ORDER.map((s) => {
    const items = sortTasks(list.filter((t) => t.status === s));
    return `<section class="col" data-status="${s}">
      <div class="col-head"><span>${STATUS[s]}</span><span class="count">${items.length}</span></div>
      ${taskList(items, s === 'terminada' ? 'Nada terminado recientemente.' : 'Sin tareas aquí.')}
    </section>`;
  }).join('');
  const tabs = STATUS_ORDER.map((s) => `<button class="${f.status === s ? 'on' : ''}" data-action="board-status" data-status="${s}">${STATUS[s]} <span class="count">${list.filter((t) => t.status === s).length}</span></button>`).join('');

  return `
  <div class="page-head"><div><h1>Tablero del equipo</h1><p class="muted" style="margin:4px 0 0">Control en tiempo real de avance, cargas y ayudas.</p></div></div>
  ${helps.length ? `<div class="section help-list" style="margin-top:0"><div class="section-head"><h2>🆘 Piden ayuda <span class="count">${helps.length}</span></h2></div>${taskList(helps, '')}</div>` : ''}
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
    <div class="filters">
      <select data-filter="person"><option value="">Todas las personas</option><option value="none" ${f.person === 'none' ? 'selected' : ''}>Sin asignar</option>
        ${activeUsers().map((u) => `<option value="${u.id}" ${f.person === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
      <select data-filter="objective"><option value="">Todos los objetivos</option>
        ${activeObjectives().map((o) => `<option value="${o.id}" ${f.objective === String(o.id) ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select>
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
        <div class="meta"><span>${ICON.clock} hasta ${esc(r.due_time)}</span><span>${ICON.user} ${r.assignee_id ? esc(userName(r.assignee_id)) : 'Libre'}</span><span>${ICON.timer} ${fmtMinutes(r.estimated_minutes)}</span></div>
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
  const items = state.activity.map((a) => `
    <div class="feed-item"><span class="avatar sm">${esc(initials(a.user_name))}</span>
      <div class="f-body"><b>${esc(a.user_name)}</b> ${esc(lowerFirst(a.summary))}<time>${fmtDateTime(a.created_at.slice(0, 16))}</time></div></div>`).join('');
  return `
  <div class="page-head"><div><h1>Actividad</h1><p class="muted" style="margin:4px 0 0">Auditoría completa de movimientos.</p></div></div>
  <div class="filters"><select data-filter="activityUser"><option value="">Todas las personas</option>
    ${state.users.map((u) => `<option value="${u.id}" ${f.activityUser === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
  <div class="card">${items || '<div class="muted">Sin actividad registrada.</div>'}</div>`;
}
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : '');

function viewMore() {
  if (state.more === 'equipo') return viewUsers();
  if (state.more === 'papelera') return viewTrash();
  if (state.more === 'guia') return viewGuide();
  return `
  <div class="page-head"><h1>Más</h1></div>
  <div class="card row" style="gap:14px"><span class="avatar lg">${esc(initials(state.me.name))}</span>
    <div><b style="font-size:17px">${esc(state.me.name)}</b><div><span class="pill role-${state.me.role}">${ROLE[state.me.role]}</span></div></div></div>
  <div class="card menu-list" style="padding:0;margin-top:14px">
    <button data-action="more" data-sub="equipo">${ICON.users} Equipo y roles</button>
    <button data-action="more" data-sub="papelera">${ICON.eyeOff} Elementos ocultos</button>
    <button data-action="more" data-sub="guia">${ICON.book} Metodología de trabajo</button>
    <button data-action="logout" style="color:var(--u-overdue)">${ICON.logout} Cerrar sesión</button>
  </div>`;
}
const backBtn = () => '<button class="btn btn-sm btn-ghost" data-action="more" data-sub="menu">← Volver</button>';

function viewUsers() {
  const list = isLead() ? state.users : activeUsers();
  const rows = list.map((u) => {
    const self = u.id === state.me.id;
    let actions = '';
    if (isAdmin()) {
      actions = `
        <select data-change="user-role" data-id="${u.id}" style="width:auto;min-height:36px;padding:6px 10px;font-size:14px">
          ${Object.keys(ROLE).map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLE[r]}</option>`).join('')}</select>
        ${self ? '' : `<button class="btn btn-sm ${u.active ? 'btn-ghost' : 'btn-success'}" data-action="user-toggle" data-id="${u.id}">${u.active ? 'Desactivar' : 'Reactivar'}</button>
        <button class="btn btn-sm btn-danger" data-action="user-delete" data-id="${u.id}" title="Eliminar">${ICON.trash}</button>`}`;
    } else if (state.me.role === 'lider' && u.role === 'colaborador') {
      actions = `<button class="btn btn-sm ${u.active ? 'btn-ghost' : 'btn-success'}" data-action="user-toggle" data-id="${u.id}">${u.active ? 'Desactivar' : 'Reactivar'}</button>`;
    }
    return `<div class="user-row ${u.active ? '' : 'off'}"><span class="avatar">${esc(initials(u.name))}</span>
      <div class="u-body"><b>${esc(u.name)}${self ? ' (tú)' : ''}</b><div class="small muted">${isAdmin() ? '' : `<span class="pill role-${u.role}">${ROLE[u.role]}</span> `}${u.active ? `Último ingreso: ${u.last_login ? fmtDateTime(u.last_login.slice(0, 16)) : '—'}` : 'Desactivado'}</div></div>
      <div class="u-actions">${actions}</div></div>`;
  }).join('');
  return `
  <div class="page-head"><div><h1>Equipo y roles</h1><p class="muted" style="margin:4px 0 0">${activeUsers().length} personas activas</p></div>${backBtn()}</div>
  <div class="card">${rows}</div>`;
}

function viewTrash() {
  const me = state.me.id;
  const tasks = state.tasks.filter((t) => !t.active && (isLead() || t.hidden_by === me));
  const objs = isLead() ? state.objectives.filter((o) => !o.active) : [];
  const routines = isLead() ? state.routines.filter((r) => !r.active) : [];
  const row = (kind, item) => `
    <div class="user-row"><div class="u-body"><b>${esc(item.title)}</b>
      <div class="small muted">Oculto por ${esc(userName(item.hidden_by))} · ${fmtDateTime((item.hidden_at || '').slice(0, 16))}</div></div>
      <div class="u-actions"><button class="btn btn-sm btn-success" data-action="restore" data-kind="${kind}" data-id="${item.id}">Restaurar</button>
      ${isAdmin() ? `<button class="btn btn-sm btn-danger" data-action="hard-delete" data-kind="${kind}" data-id="${item.id}">${ICON.trash} Eliminar</button>` : ''}</div></div>`;
  const block = (title, kind, list) => `<div class="section"><div class="section-head"><h2>${title} <span class="count">${list.length}</span></h2></div>
    <div class="card">${list.length ? list.map((i) => row(kind, i)).join('') : '<div class="muted">Nada oculto.</div>'}</div></div>`;
  return `
  <div class="page-head"><div><h1>Elementos ocultos</h1><p class="muted" style="margin:4px 0 0">Papelera: los datos no se pierden, se pueden reactivar.</p></div>${backBtn()}</div>
  ${block('Tareas', 'tasks', tasks)}
  ${isLead() ? block('Objetivos', 'objectives', objs) + block('Rutinas diarias', 'routines', routines) : ''}`;
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
    <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000" ${dis} placeholder="Detalles o ubicación…">${esc(t.description || '')}</textarea></label>
    <div class="field"><span>Estado</span><div class="seg">${STATUS_ORDER.map((s) => radio('status', s, STATUS[s], (t.status || 'sin_iniciar') === s)).join('')}</div></div>
    
    <div class="grid2">
      <label class="field"><span>Responsable principal</span><select name="assignee_id">
        <option value="">— Sin asignar (libre) —</option>
        ${assignees.map((u) => `<option value="${u.id}" ${t.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Fecha y hora límite (Hora Bogotá)</span><input type="datetime-local" name="due_at" value="${esc(toLocalInputDate(t.due_at))}" ${dis}></label>
    </div>

    <!-- Ayudantes / Apoyos -->
    <div class="helpers-box">
      <span style="font-size:13px;font-weight:600;color:var(--muted)">🤝 Colaboradores en apoyo / Ayudantes:</span>
      <div class="helpers-checkboxes">
        ${helpersCheckboxes || '<span class="small muted">No hay colaboradores disponibles.</span>'}
      </div>
      <p class="small muted" style="margin:6px 0 0">Puedes seleccionar varias personas para trabajar en esta tarea.</p>
    </div>

    <div class="field"><span>Tiempo estimado (minutos)</span>
      <input type="number" name="estimated_minutes" min="0" step="5" inputmode="numeric" value="${t.estimated_minutes ?? 30}" ${dis}>
      <div class="chips" style="margin-top:8px">${[15, 30, 60, 120, 240].map((m) => `<button type="button" class="chip" data-action="set-minutes" data-min="${m}" ${dis}>${fmtMinutes(m)}</button>`).join('')}</div></div>
    <div class="field"><span>Prioridad</span><div class="seg">${Object.keys(PRIORITY).map((p) => radio('priority', p, PRIORITY[p], (t.priority || 'media') === p, !full)).join('')}</div></div>
    <label class="field"><span>Objetivo</span><select name="objective_id" ${dis}><option value="">— Ninguno —</option>
      ${objs.map((o) => `<option value="${o.id}" ${t.objective_id === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select></label>
    <div class="help-field">
      <label class="check"><input type="checkbox" name="needs_help" ${t.needs_help ? 'checked' : ''}> 🆘 Necesito ayuda con esta tarea</label>
      <input name="help_note" maxlength="500" placeholder="¿Qué necesitas? (opcional)" value="${esc(t.help_note || '')}">
    </div>
    <div class="sheet-actions">
      ${!isNew && t.active && canHideTask(t) ? `<button type="button" class="btn btn-ghost" data-action="hide" data-kind="tasks" data-id="${t.id}">${ICON.eyeOff} Ocultar</button>` : ''}
      ${!isNew && isAdmin() ? `<button type="button" class="btn btn-danger" data-action="hard-delete" data-kind="tasks" data-id="${t.id}">${ICON.trash}</button>` : ''}
      <span class="spacer"></span>
      <button type="submit" class="btn btn-primary">${isNew ? 'Crear tarea' : 'Guardar'}</button>
    </div>
  </form>`);
}


function openTaskDetail(t) {
  const obj = t.objective_id ? objById(t.objective_id) : null;
  openSheet(`
    ${sheetHead('Detalle de la tarea')}
    <div class="stack">
      ${taskCard(t).replace('data-action="open-task"', '')}
      ${t.description ? `<div class="card" style="box-shadow:none;background:var(--bg)">${esc(t.description)}</div>` : ''}
      <dl class="info-grid">
        <dt>Prioridad</dt><dd>${PRIORITY[t.priority]}</dd>
        <dt>Objetivo</dt><dd>${obj ? esc(obj.title) : '—'}</dd>
        <dt>Creada por</dt><dd>${esc(userName(t.created_by))}</dd>
      </dl>
    </div>`);
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
    <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000">${esc(r.description || '')}</textarea></label>
    <div class="field"><span>Días</span><div class="daypick">${WEEKDAYS.map(([v, l]) => `<label><input type="checkbox" name="weekdays" value="${v}" ${days.includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="grid2">
      <label class="field"><span>Hora límite</span><input type="time" name="due_time" required value="${esc(r.due_time || '12:00')}"></label>
      <label class="field"><span>Tiempo estimado (min)</span><input type="number" name="estimated_minutes" min="0" step="5" value="${r.estimated_minutes ?? 30}"></label>
      <label class="field"><span>Responsable</span><select name="assignee_id"><option value="">— Libre —</option>
        ${activeUsers().map((u) => `<option value="${u.id}" ${r.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Objetivo</span><select name="objective_id"><option value="">— Ninguno —</option>
        ${activeObjectives().map((o) => `<option value="${o.id}" ${r.objective_id === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}</select></label>
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
    case 'nav':
      state.view = el.dataset.view;
      if (state.view === 'mas') state.more = 'menu';
      localStorage.setItem('obj_view', state.view);
      render();
      window.scrollTo(0, 0);
      if (state.view === 'actividad') loadActivity().catch((err) => toast(err.message, 'error'));
      break;
    case 'more':
      state.more = el.dataset.sub; render(); window.scrollTo(0, 0); break;
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
      });
      break;
    case 'open-task': {
      const t = findItem('tasks', id); if (t) openTaskSheet(t); break;
    }
    case 'task-status': {
      e.stopPropagation();
      const status = el.dataset.status;
      const t = findItem('tasks', id);
      const patch = { status, updated_at: nowIso() };
      if (status === 'en_progreso' && !t.started_at) patch.started_at = nowIso();
      if (status === 'terminada') {
        patch.completed_at = nowIso();
        patch.needs_help = false;
      }
      run(async () => {
        const { error } = await sb.from('tasks').update(patch).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('editar', 'tarea', id, `Cambió estado a "${STATUS[status]}" en "${t.title}"`);
      }, status === 'terminada' ? '¡Tarea terminada! ✓' : 'Tarea en progreso');
      break;
    }
    case 'take-task': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      run(async () => {
        const { error } = await sb.from('tasks').update({ assignee_id: state.me.id, updated_at: nowIso() }).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('tomar', 'tarea', id, `Tomó la tarea "${t.title}"`);
      }, 'Tarea tomada. ¡Es tuya!');
      break;
    }
    case 'join-helper': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      const currentHelpers = getHelperIds(t);
      if (!currentHelpers.includes(state.me.id)) {
        const nextHelpers = [...currentHelpers, state.me.id];
        run(async () => {
          const { error } = await sb.from('tasks').update({ helper_ids: nextHelpers, updated_at: nowIso() }).eq('id', id);
          if (error) throw new Error(error.message);
          await logActivity('editar', 'tarea', id, `Se unió como ayudante a la tarea "${t.title}"`);
        }, '¡Te uniste como ayudante a la tarea!');
      }
      break;
    }
    case 'leave-helper': {
      e.stopPropagation();
      closeSheet();
      const t = findItem('tasks', id);
      const currentHelpers = getHelperIds(t);
      const nextHelpers = currentHelpers.filter((hid) => hid !== state.me.id);
      run(async () => {
        const { error } = await sb.from('tasks').update({ helper_ids: nextHelpers, updated_at: nowIso() }).eq('id', id);
        if (error) throw new Error(error.message);
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
      run(async () => {
        const { error } = await sb.from('tasks').update({ needs_help: false, help_note: '', updated_at: nowIso() }).eq('id', id);
        if (error) throw new Error(error.message);
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

    case 'hide': {
      const item = findItem(kind, id);
      if (!item || !confirm(`¿Ocultar "${item.title}"?\nNo se perderá: podrás restaurarlo en Más → Elementos ocultos.`)) return;
      closeSheet();
      run(async () => {
        const { error } = await sb.from(KIND_TABLE[kind]).update({
          active: false, hidden_by: state.me.id, hidden_at: nowIso(), updated_at: nowIso()
        }).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('ocultar', kind === 'tasks' ? 'tarea' : 'objetivo', id, `Ocultó "${item.title}"`);
      }, 'Oculto. Puedes restaurarlo en Elementos ocultos.');
      break;
    }
    case 'restore': {
      const item = findItem(kind, id);
      run(async () => {
        const { error } = await sb.from(KIND_TABLE[kind]).update({
          active: true, hidden_by: null, hidden_at: null, updated_at: nowIso()
        }).eq('id', id);
        if (error) throw new Error(error.message);
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
    if (!isAdmin()) return;
    const uid = Number(el.dataset.id);
    const role = el.value;
    run(async () => {
      const { error } = await sb.from('users').update({ role }).eq('id', uid);
      if (error) throw new Error(error.message);
      await logActivity('editar', 'usuario', uid, `Cambió rol a ${ROLE[role]}`);
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

  if (kind === 'task') {
    const data = Object.fromEntries(fd.entries());
    data.needs_help = form.elements.needs_help.checked;
    if (!data.needs_help) data.help_note = '';

    // Múltiples ayudantes
    const selectedHelpers = fd.getAll('helper_ids').map(Number).filter(Boolean);
    data.helper_ids = selectedHelpers;

    ['assignee_id', 'objective_id', 'due_at'].forEach((k) => { if (!data[k]) data[k] = null; });
    if (data.assignee_id) data.assignee_id = Number(data.assignee_id);
    if (data.objective_id) data.objective_id = Number(data.objective_id);

    // Ajustar due_at con la zona horaria de Bogotá (-05:00) para persistencia correcta en Supabase
    if (data.due_at) {
      if (data.due_at.length === 16) {
        data.due_at = data.due_at + ':00-05:00';
      }
    }

    data.estimated_minutes = Number(data.estimated_minutes) || 0;
    data.updated_at = nowIso();

    ok = await run(async () => {
      if (id) {
        const { error } = await sb.from('tasks').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('editar', 'tarea', id, `Modificó la tarea "${data.title}"`);
      } else {
        data.created_by = state.me.id;
        data.created_at = nowIso();
        const { data: created, error } = await sb.from('tasks').insert([data]).select().single();
        if (error) throw new Error(error.message);
        await logActivity('crear', 'tarea', created.id, `Creó la tarea "${data.title}"`);
      }
    }, id ? 'Tarea actualizada' : 'Tarea creada');
  }
 else if (kind === 'objective') {
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
      if (id) {
        const { error } = await sb.from('routines').update(data).eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity('editar', 'rutina', id, `Modificó rutina "${data.title}"`);
      } else {
        data.created_by = state.me.id;
        data.created_at = nowIso();
        const { data: created, error } = await sb.from('routines').insert([data]).select().single();
        if (error) throw new Error(error.message);
        await logActivity('crear', 'rutina', created.id, `Creó rutina diaria "${data.title}"`);
      }
    }, id ? 'Rutina actualizada' : 'Rutina creada');
  } else if (kind === 'help') {
    const t = findItem('tasks', id);
    ok = await run(async () => {
      const { error } = await sb.from('tasks').update({
        needs_help: true, help_note: fd.get('help_note') || '', updated_at: nowIso()
      }).eq('id', id);
      if (error) throw new Error(error.message);
      await logActivity('editar', 'tarea', id, `Pidió ayuda en "${t.title}"`);
    }, 'Aviso enviado: tu equipo verá que necesitas ayuda');
  }

  if (ok) closeSheet();
  else if (btn) btn.disabled = false;
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.sheetOpen) closeSheet(); });

/* ---------- Autenticación por Nombre ---------- */
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
      await sb.from('users').update({ last_login: nowIso() }).eq('id', user.id);
    }

    state.me = user;
    localStorage.setItem('obj_user', JSON.stringify(user));
    state.view = 'hoy';
    await logActivity('login', 'usuario', user.id, 'Entró a la aplicación');
    await refresh();
    toast(`¡Hola, ${user.name}!`, 'ok');
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Suscripción en Tiempo Real (Realtime) ---------- */
function initRealtime() {
  if (!sb) return;
  sb.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refresh())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, () => refresh())
    .subscribe();
}

/* ---------- Arranque ---------- */
(async function init() {
  if (sb) {
    initRealtime();
    try { await refresh(); } catch (e) { console.error(e); }
  }
  render();
})();
