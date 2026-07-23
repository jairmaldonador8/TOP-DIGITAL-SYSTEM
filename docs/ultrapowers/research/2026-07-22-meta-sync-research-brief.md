# Research Brief: Sincronización de campañas con la Marketing API de Meta

**Fecha:** 2026-07-22 · **Spec:** `docs/ultrapowers/specs/2026-07-22-meta-marketing-api-sync-design.md`
Hallazgos verificados contra developers.facebook.com y vercel.com/docs en julio 2026
(tres agentes de investigación en paralelo; fuentes al final).

## Contexto

Sync de solo lectura de campañas Meta (gasto + resultados) hacia el CRM
(Next.js 16.2.10 + Supabase), con token de usuario de sistema, cron diario de
Vercel y botón manual. La investigación resolvió los puntos que el spec dejó
abiertos y encontró un gotcha crítico del repo.

## Hallazgos clave

### Graph API / Marketing API

- **Versión a fijar: v25.0** (liberada 2026-02-18). La v23 ya expiró (2026-06-09)
  y la v24 muere 2026-10-06. Base URL: `https://graph.facebook.com/v25.0/`.
  Presupuestar bump a v26 (~sep 2026).
- **Campañas:** `GET /act_<id>/campaigns?fields=id,name,objective,status,effective_status,start_time,stop_time&effective_status=["ACTIVE","PAUSED","ARCHIVED"]&limit=100`.
  Valores de `effective_status` relevantes: `ACTIVE`, `PAUSED` (y variantes
  `CAMPAIGN_PAUSED`/`ADSET_PAUSED`), `ARCHIVED`, `DELETED`, `IN_PROCESS`,
  `WITH_ISSUES`. Mapeo: `ACTIVE → activa`, `PAUSED/CAMPAIGN_PAUSED → pausada`,
  `ARCHIVED/DELETED → archivada` (y campañas que dejan de venir en la respuesta →
  archivada).
- **Insights de vida completa:** `GET /act_<id>/insights?level=campaign&fields=campaign_id,spend,actions&date_preset=maximum`
  (una llamada por cuenta, no por campaña — más eficiente en rate limits).
  `date_preset=maximum` reemplazó a `lifetime` y tiene tope de 37 meses
  (irrelevante aquí). `spend` llega como string en moneda de la cuenta.
- **Resultados de clic-a-WhatsApp (CRÍTICO):** lo que Ads Manager muestra como
  "Resultados" en campañas CTWA es "conversaciones de mensajería iniciadas" =
  entrada del arreglo `actions` con
  **`action_type: "onsite_conversion.messaging_conversation_started_7d"`**.
  El campo agregado `results` existe pero su comportamiento a `level=campaign`
  con ad sets mixtos no está bien documentado → parsear `actions` y usar
  `results` solo como verificación cruzada.
- **Listar cuentas publicitarias:** con token de sistema, usar
  `GET /me/adaccounts?fields=id,name,account_id,account_status` — devuelve todas
  las cuentas **asignadas** al usuario de sistema (propias y de clientes) en una
  llamada. `id` viene como `act_<n>`; `account_id` es el número pelón. Evita los
  edges `/{business_id}/owned_ad_accounts` + `client_ad_accounts` (requieren
  `business_management` y el contrato GET de `client_ad_accounts` no se pudo
  confirmar en docs oficiales).
- **Rate limits (BUC, por cuenta, ventana rodante de 1 h):** tier por defecto
  `ads_insights` ≈ `600 + 400 × ads activos` llamadas/hora — de sobra para un
  sync diario. Header `X-Business-Use-Case-Usage` (porcentajes; a 100 hay
  throttle), `estimated_time_to_regain_access` en **minutos**. Errores de
  throttle: `80000` (insights), `80004` (management), `17`/`4` (legacy/app).
  Estrategia: en `80000` dormir `estimated_time_to_regain_access` min + jitter;
  backoff exponencial para `17`/`4`.
- **Paginación:** cursores; seguir `paging.next` hasta que **no venga** (única
  señal fiable de fin — una página puede venir vacía y aún tener `next`). No
  persistir cursores entre corridas.

### Token de usuario de sistema (Business Manager)

- **App de Meta tipo Business** en modo desarrollo basta; Standard Access es
  automático para apps Business → **sin App Review** para uso del propio
  negocio. La app y el usuario de sistema deben pertenecer al mismo portfolio.
- **Usuario de sistema tipo Empleado** (menor privilegio) + asignarle cada
  cuenta publicitaria con permiso de solo lectura ("Ver rendimiento"). Al dar de
  alta un cliente nuevo en Meta hay que acordarse de asignar su cuenta al
  usuario de sistema.
- **Token:** generar con expiración **"Nunca"** (sigue disponible en 2026,
  aunque Meta empuja tokens de 60 días — plausible migración forzada futura;
  agregar verificación mensual con `/debug_token` al cron como salud del token).
  Marcar permisos **`ads_read` + `business_management`** (el segundo por si se
  usan endpoints de Business Manager; `ads_read` solo no lista cuentas vía
  business). El token se muestra **una sola vez**.
- **Seguridad:** guardar solo server-side (`META_SYSTEM_TOKEN` en Vercel).
  Recomendado: activar "Require app secret" y mandar `appsecret_proof`
  (`hmac_sha256(token, app_secret)`) en cada llamada → requiere también
  `META_APP_SECRET` como env var.
- **Qué lo invalida:** revocarlo/regenerarlo, borrar el usuario de sistema,
  quitar la app, resetear el app secret. **No** lo invalidan cambios de
  contraseña ni 2FA de humanos (por eso es la opción correcta).

### Vercel Cron + este repo (Next.js 16.2.10)

- **Config:** agregar al `vercel.json` existente:
  `"crons": [{ "path": "/api/cron/meta-sync", "schedule": "0 11 * * *" }]`.
  Crons corren **solo en UTC**; CDMX es UTC-6 fijo (sin horario de verano desde
  2022) → 11:00 UTC = 5:00 AM. En plan **Hobby**: máximo 1 disparo/día y
  precisión por hora (dispara entre 11:00–11:59 UTC); Pro es por minuto.
  Cambios de cron aplican al siguiente deploy de producción.
- **Método y seguridad:** Vercel invoca con **GET**; si existe la env var
  `CRON_SECRET`, Vercel manda `Authorization: Bearer <CRON_SECRET>`
  automáticamente. Validar con fail-closed (`!cronSecret || header !== ...`).
  Sin reintentos automáticos; corridas duplicadas/perdidas posibles → el sync
  debe ser **idempotente** (upsert por `meta_campaign_id`).
- **GOTCHA CRÍTICO DEL REPO:** `src/proxy.ts` redirige a `/login` toda ruta sin
  sesión y su matcher **no excluye `/api`** (el archivo tiene un comentario
  avisándolo). El cron de Vercel **no sigue redirects** → sin ajustar el
  matcher, el cron muere en silencio con 307. **Obligatorio excluir
  `/api/cron`** del matcher (o early-return en `proxy()`).
- **Duración:** con Fluid Compute el default de `maxDuration` ya es 300 s en
  todos los planes; opcionalmente `export const maxDuration = 300` en la ruta.
- **Next 16 (docs locales en `node_modules/next/dist/docs`):** route handlers
  clásicos (export `GET` → `Response`), dinámicos por default; `params` es
  Promise (no aplica al cron); `await cookies()/headers()`. `cacheComponents`
  está apagado en este repo. Server actions sin cambios de semántica.
- **Patrones existentes a reutilizar:**
  - `createAdminClient()` en `src/lib/supabase/admin.ts` (service role vía
    `SUPABASE_SECRET_KEY`, `server-only`) — el cliente correcto para el cron y
    el sync (RLS de `campania_finanzas`/`sync_runs` es solo-admin).
  - `esAdmin()` + `NO_AUTORIZADO` en `src/lib/acciones.ts` — patrón de guardia
    para las server actions (sincronizar ahora, listar cuentas, vincular).
  - Acciones devuelven `ResultadoAccion` (no lanzan) y cierran con
    `revalidatePath('/agencia', 'layout')`.
  - No existe ningún route handler aún (`src/app/api/` vacío) — el del cron será
    el primero.

## Enfoque recomendado

Confirma el spec sin cambios de arquitectura, con estas precisiones:

1. Pin **v25.0**; cliente HTTP propio y minúsculo (fetch nativo), sin SDK de
   Meta (los SDK oficiales de Node están abandonados/pesados).
2. Insights **a nivel cuenta** (`level=campaign`) — 2 llamadas por cliente
   (campañas + insights) en vez de N+1.
3. Resultados = `actions[action_type="onsite_conversion.messaging_conversation_started_7d"]`,
   con fallback a `results`.
4. Token con `ads_read` + `business_management`, expiración "Nunca",
   `appsecret_proof` activado (env vars `META_SYSTEM_TOKEN` + `META_APP_SECRET`).
5. Cron GET `/api/cron/meta-sync` con `CRON_SECRET`, idempotente, **más ajuste
   del matcher de `src/proxy.ts`**.
6. Selector de cuentas vía `GET /me/adaccounts` en server action solo-admin.

## Notas de implementación / pitfalls

- Upsert por `meta_campaign_id` (unique) — idempotencia ante corridas dobles.
- Campañas presentes en BD (con `meta_campaign_id`) que ya no vengan de la API
  o lleguen `ARCHIVED/DELETED` → `estado = 'archivada'`.
- `spend` es string → parsear a numeric; cuentas en moneda distinta a MXN se
  registran tal cual (v1: asumir MXN; anotar moneda si aparece el caso).
- No detener el loop de clientes ante fallo de una cuenta; registrar en
  `sync_runs.errores` (jsonb).
- Paginación: loop sobre `paging.next`; no confiar en `data` vacío como fin.
- El cron en Hobby puede disparar 5:00–5:59 AM — comunicarlo como "en la
  madrugada", no "a las 5:00".
- `/debug_token` mensual (o en cada corrida, es barato) para detectar token
  próximo a morir o revocado → aviso visible al dueño.

## Fuentes (verificadas julio 2026)

- developers.facebook.com — changelog/versions, marketing-api/reference
  (ad-account/campaigns, ad-account/insights, ads-action-stats),
  graph-api/overview/rate-limiting, marketing-api/overview/authorization,
  business-management-apis/system-users (create, install-apps-and-generate-tokens),
  permissions reference, graph-api/results (paginación).
- vercel.com/docs — cron-jobs, cron-jobs/manage-cron-jobs (CRON_SECRET),
  cron-jobs/usage-and-pricing, functions/configuring-functions/duration.
- Blog oficial de Meta (anuncio v25, 2026-02-18); kitchn.io Q2 2026;
  guías 2025–2026 de Hightouch/Intelitics/singhamandeep (UI de token "Never").
- Docs locales: `node_modules/next/dist/docs` (route handlers, segment config,
  proxy); código del repo (`src/proxy.ts`, `src/lib/supabase/admin.ts`,
  `src/lib/acciones.ts`).

## Incertidumbres señaladas

- Contrato GET oficial de `/{business_id}/client_ad_accounts` (evitado con
  `/me/adaccounts`).
- Comportamiento de `results` a `level=campaign` con metas mixtas (por eso
  `actions` es la fuente primaria).
- Longevidad de la opción de token "Nunca expira" (mitigado con `/debug_token`).
- Si un usuario de sistema *admin* hereda cuentas sin asignación explícita
  (documentado solo para WhatsApp; usamos Empleado + asignación explícita).
