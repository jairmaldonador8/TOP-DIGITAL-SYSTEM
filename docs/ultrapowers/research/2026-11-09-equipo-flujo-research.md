# Research Brief: equipo por puesto y flujo de entregables

Spec: `docs/ultrapowers/specs/2026-11-09-equipo-y-flujo-entregables-design.md`

## Context
Antes del plan se verificaron los puntos técnicos con riesgo: enums nuevos, el trigger que congela columnas, el tick periódico y la subida de video del filmmaker.

## Key Findings
- **Enums (PG17):** un valor agregado con `ALTER TYPE ... ADD VALUE` (con o sin `BEFORE`) no se puede usar en la misma transacción (`55P04`). Cada archivo de migración corre en una sola transacción (`supabase db push`, y en la práctica `apply_migration`). → 0024 solo con los `ADD VALUE`/`CREATE TYPE`; el uso desde 0025. [postgresql.org/docs/17/sql-altertype.html]
- **Trigger y RPCs security definer:** `private.is_admin()` lee el JWT, así que dentro de una RPC definer el PM sigue sin ser admin y el trigger `encargos_congelar_columnas` lo frena. → La RPC `revisar_encargo` y el trigger de desbloqueo encienden una bandera local de transacción (`set_config('app.via_rpc','on', true)`) que el trigger respeta. Solo funciones definer del esquema `private`/`public` la ponen; `set_config` desde PostgREST no es alcanzable porque el cliente no puede ejecutar SQL arbitrario.
- **Tick cada 5 min:** patrón ya documentado en la skill de proyecto `supabase-cron-tick` (pg_cron + pg_net + Vault, respuesta 202 y trabajo en `after()`, idempotencia con `avisos_enviados`).
- **Storage, plan gratis:** 50 MB por archivo sin posibilidad de subirlo y 1 GB de almacenamiento total; egress de 5 GB. Las transformaciones de imagen solo en Pro. [supabase.com/docs/guides/storage/uploads/file-limits, …/manage-your-usage/storage-size, …/egress]
- **Storage, Pro:** límite global configurable hasta 500 GB; 100 GB incluidos; egress 250 GB.
- **Subidas grandes:** la subida estándar es para archivos de hasta unos 6 MB; arriba de eso se recomienda TUS (resumable, trozos de 6 MB). `createSignedUploadUrl` da un token que también sirve para TUS en el header `x-signature`. [supabase.com/docs/guides/storage/uploads/resumable-uploads]
- **MIME:** el bucket compara contra el Content-Type que manda el cliente. iPhone .mov = `video/quicktime`; HEIC en escritorio llega con tipo vacío → mapear por extensión antes de subir y pasar `contentType` explícito.

## Recommended Approach
- V1 en plan gratis: imágenes, carruseles y videos editados ≤ 50 MB se suben al bucket; el **material crudo del filmmaker y cualquier video pesado va por `enlace_externo` (Drive)**, obligatorio en la pieza `produccion`. El bucket `evidencias` queda en 50 MB y acepta `video/quicktime`, `image/heic`, `image/webp`.
- Al contratar Supabase Pro: subir el límite global a ~2 GB y cambiar la subida de video a TUS con el token firmado (tarea aparte, fuera de este plan).

## Implementation Notes
- Migraciones: 0024 tipos; 0025 esquema y datos; 0026 RLS, RPC y triggers; 0027 tick (sin secreto en el repo).
- Mapear extensión → MIME en el cliente; siempre pasar `contentType`.
- Revisión y desbloqueo solo por funciones definer con la bandera `app.via_rpc`.

## Sources
- PostgreSQL 17 ALTER TYPE — regla de transacción del nuevo valor.
- Supabase CLI `migration-apply.ts` — una transacción por archivo.
- Supabase Storage docs: file limits, standard/resumable uploads, egress, storage size, image transformations.
- Skill de proyecto `supabase-cron-tick` (investigación del 25-sep-2026).
