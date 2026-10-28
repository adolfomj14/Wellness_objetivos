// ==============================================================================
// CONFIGURACIÓN DE SUPABASE Y EQUIPO
// ==============================================================================
// Obtén estos dos valores en: https://supabase.com/dashboard
// Entra a tu proyecto -> Project Settings (icono de engranaje) -> API
// ==============================================================================

const SUPABASE_CONFIG = {
  // Reemplaza con la URL de tu proyecto Supabase (ej: 'https://abcdefghijklm.supabase.co')
  url: 'https://dgqdjopswnidhilzifgj.supabase.co',

  // Reemplaza con tu clave anon / public (comienza con 'eyJ...')
  anonKey: 'sb_publishable_lCqvOjqUeHFErvOi9QcDIg_N6P44bZQ',

  // Clave pública VAPID para notificaciones Web Push en segundo plano
  vapidPublicKey: 'BAKsGKOnwhZPA69o7_YwR25xO0sz0vd4EBFoIBMxcS_A_3IpZ8NaYl-kXwr28BqYGrb7nLynWIbzQjtcx5uMf04',

  // Datos del equipo
  teamName: 'Wellness Movilidad',
  storeName: 'Decathlon',
  shiftMinutes: 480,   // Jornada de 8h para medir la carga
  defaultDueHour: 19   // Hora límite por defecto (19:00)
};
