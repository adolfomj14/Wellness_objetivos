// ==============================================================================
// SUPABASE EDGE FUNCTION: send-push (Web Push Nativo con VAPID)
// ==============================================================================
// Cómo instalarla desde el navegador sin usar consola:
// 1. Entra a tu proyecto en https://supabase.com/dashboard
// 2. En el menú izquierdo ve a: Edge Functions -> "Deploy a new function" -> "Via Editor"
// 3. En Function Name escribe: send-push
// 4. Pega todo este código y haz clic en "Deploy function".
// 5. En la configuración de la función, desactiva "Enforce JWT Verification" (o déjalo accesible para anon).
// ==============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VAPID_PUBLIC_KEY =
  Deno.env.get("VAPID_PUBLIC_KEY") ||
  "BAKsGKOnwhZPA69o7_YwR25xO0sz0vd4EBFoIBMxcS_A_3IpZ8NaYl-kXwr28BqYGrb7nLynWIbzQjtcx5uMf04";

const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY") ||
  "wAMkVW6azYS8-yt8nqW3R9LEF7AiAYxutzMobWjc9LE";

const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:wellness.movilidad@decathlon.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();

    let title = payload.title || "🔔 Objetivos · Wellness";
    let body = payload.body || "";
    let tag = payload.tag || `push-${Date.now()}`;
    let targetUserIds: number[] | null = Array.isArray(payload.targetUserIds) ? payload.targetUserIds.map(Number) : null;
    let excludeUserId: number | null = payload.excludeUserId ? Number(payload.excludeUserId) : null;

    // Soporte automático si se invoca desde un Database Webhook de Supabase en la tabla 'tasks'
    if (payload.type && payload.table === "tasks" && payload.record) {
      const row = payload.record;
      const old = payload.old_record || {};

      // Respetar privacidad de tareas privadas
      if (row.is_private) {
        targetUserIds = row.created_by ? [Number(row.created_by)] : [];
      }

      if (payload.type === "INSERT") {
        title = "📌 Nueva tarea en el equipo";
        body = `Se creó la tarea: "${row.title}"`;
        tag = `task-new-${row.id}`;
        if (row.created_by && !row.is_private) {
          excludeUserId = Number(row.created_by);
        }
      } else if (payload.type === "UPDATE") {
        if (row.status === "terminada" && old.status !== "terminada") {
          title = "✅ Tarea finalizada";
          body = `Se completó la tarea: "${row.title}"`;
          tag = `done-${row.id}-terminada`;
          if (row.completed_by && !row.is_private) excludeUserId = Number(row.completed_by);
        } else if (row.assignee_id && row.assignee_id !== old.assignee_id) {
          title = "👤 Tarea tomada / asignada";
          body = `Tarea asignada: "${row.title}"`;
          tag = `taken-${row.id}`;
        } else if (row.needs_help && !old.needs_help) {
          title = "🆘 Piden ayuda con una tarea";
          body = `Necesitan apoyo en: "${row.title}"${row.help_note ? " (" + row.help_note + ")" : ""}`;
          tag = `help-${row.id}`;
        } else {
          return new Response(JSON.stringify({ skipped: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Obtener todas las suscripciones activas
    let query = supabase.from("push_subscriptions").select("*");
    if (targetUserIds && targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    }
    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    // Deduplicar por endpoint por seguridad
    const seenEndpoints = new Set<string>();
    const uniqueSubs = (subs || []).filter((s: any) => {
      if (!s.endpoint || seenEndpoints.has(s.endpoint)) return false;
      seenEndpoints.add(s.endpoint);
      return true;
    });

    const pushPayload = JSON.stringify({ title, body, tag });
    let sent = 0;
    let removed = 0;

    for (const sub of uniqueSubs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload, {
          TTL: 86400,
          urgency: "high",
        });
        sent++;
      } catch (err: any) {
        // Si el dispositivo desinstaló o revocó el permiso (404 / 410), limpiar la suscripción
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          removed++;
        } else {
          console.error("Error enviando push a", sub.id, err?.message || err);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, removed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
