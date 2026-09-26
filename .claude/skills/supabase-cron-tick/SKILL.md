---
name: supabase-cron-tick
description: Use when scheduling recurring work more often than daily in this project (Vercel Hobby crons are daily-only) — the pg_cron + pg_net job that POSTs /api/cron/tick, its Vault secret, the tick route handler, or debugging why a tick did not run.
---

# Tick cada 5 min con Supabase (pg_cron + pg_net + Vault)

## Overview

Vercel Hobby solo corre crons diarios. Supabase dispara
`POST https://www.topdigital.company/api/cron/tick` cada 5 min con
`Authorization: Bearer <cron_secret de Vault>`. El handler responde 202 al
instante y trabaja en `after()`. Todo lo que haga el tick es idempotente
(`avisos_enviados`).

## When to Use

- Agregar trabajo periódico (recordatorios, sync de Google, limpieza).
- Crear/cambiar la migración del job o rotar el secreto.
- Diagnosticar ticks que no llegan.

## Core Patterns

**Migración (sin el valor del secreto — el repo es público)**
```sql
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule('agenda-tick', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://www.topdigital.company/api/cron/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret
        from vault.decrypted_secrets where name = 'cron_secret')),
    body := jsonb_build_object('at', now()),
    timeout_milliseconds := 60000);
$$);

select cron.schedule('limpiar-cron-historial', '0 9 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);
```
`cron.schedule` con el mismo nombre sobrescribe → la migración es idempotente.

**Secreto (fuera de la migración, una vez, vía SQL editor o MCP)**
```sql
select vault.create_secret('<mismo valor que CRON_SECRET en Vercel>', 'cron_secret', 'Bearer de /api/cron/tick');
-- rotar: select vault.update_secret((select id from vault.secrets where name='cron_secret'), '<nuevo>');
```

**Handler**
```ts
export const maxDuration = 60
export async function POST(request: NextRequest) {
  const secreto = process.env.CRON_SECRET
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`)
    return new Response('No autorizado', { status: 401 })
  after(() => correrTick(new Date())) // cada paso en su try/catch
  return new Response(null, { status: 202 })
}
```
La ruta vive bajo `api/cron/`, que el matcher de `src/proxy.ts` ya excluye.

**Diagnóstico**
```sql
select status_code, timed_out, error_msg, created from net._http_response order by created desc limit 10; -- vive 6 h
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 10;
```

## Common Mistakes

- Confiar en `cron.job_run_details = succeeded`: solo dice que se encoló el HTTP; el resultado real está en `net._http_response`.
- Timeout por defecto (2–5 s según versión) con un handler lento → pasar `timeout_milliseconds` y responder 202 rápido.
- Poner el secreto en la migración (repo público).
- Horas en UTC: `*/5` da igual, pero cualquier "8:00" se calcula en el handler con America/Mexico_City, no en la expresión cron.
- Olvidar la limpieza de `cron.job_run_details` (~288 filas/día).
