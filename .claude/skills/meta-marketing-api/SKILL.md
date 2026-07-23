---
name: meta-marketing-api
description: Use when writing or debugging code that calls the Meta Marketing API in this project — campaign/insights sync, system user token, rate limits, or bumping the pinned Graph API version.
---

# Meta Marketing API (sync de solo lectura)

## Overview

Sync de campañas y métricas desde la Graph API **v25.0** (pin explícito; v24
expira 2026-10-06, presupuestar bump a v26 ~sep 2026). Token de usuario de
sistema del Business Manager del dueño, permisos `ads_read` +
`business_management`, env vars `META_SYSTEM_TOKEN` y `META_APP_SECRET`.

## Endpoints (base `https://graph.facebook.com/v25.0`)

```
# Cuentas asignadas al usuario de sistema (selector de vínculo cliente↔cuenta)
GET /me/adaccounts?fields=id,name,account_id,account_status
#   id = "act_123", account_id = "123"

# Campañas de una cuenta (2 llamadas por cliente: esta + insights)
GET /act_<id>/campaigns?fields=id,name,objective,status,effective_status,start_time,stop_time
    &effective_status=["ACTIVE","PAUSED","ARCHIVED"]&limit=100

# Insights de vida completa, nivel campaña (una sola llamada por cuenta)
GET /act_<id>/insights?level=campaign&fields=campaign_id,spend,actions&date_preset=maximum
```

- Mapeo de estado: `ACTIVE → activa`; `PAUSED`/`CAMPAIGN_PAUSED` → `pausada`;
  `ARCHIVED`/`DELETED` o ausente de la respuesta → `estado = 'archivada'`.
- **Resultados CTWA** (= columna "Resultados" de Ads Manager): entrada de
  `actions` con `action_type = "onsite_conversion.messaging_conversation_started_7d"`.
  El campo `results` solo como verificación cruzada (comportamiento no
  documentado a `level=campaign`).
- `spend` llega como **string** en la moneda de la cuenta → parsear a numeric.
- `date_preset=maximum` = "lifetime" moderno, tope 37 meses.
- Mandar `appsecret_proof = hmac_sha256(token, META_APP_SECRET)` en cada llamada.

## Paginación

Seguir `paging.next` hasta que **no exista** — única señal fiable de fin; una
página puede venir con `data` vacío y aún tener `next`. No persistir cursores
entre corridas.

## Rate limits (BUC, por cuenta, ventana 1 h)

- Tier default de `ads_insights`: ≈ `600 + 400 × ads activos` llamadas/hora —
  holgado para sync diario.
- Header `X-Business-Use-Case-Usage`: porcentajes; a 100 hay throttle;
  `estimated_time_to_regain_access` viene en **minutos**.
- Errores de throttle: `80000` (insights) y `80004` (management) → dormir los
  minutos indicados + jitter; `17`/`4` (legacy/app) → backoff exponencial.

## Token de usuario de sistema

- App **tipo Business** en modo desarrollo basta (Standard Access automático,
  sin App Review para cuentas del propio portfolio).
- Usuario de sistema **Empleado** + asignarle cada cuenta con "Ver rendimiento".
  Cliente nuevo en Meta ⇒ **asignar su cuenta al usuario de sistema** o no
  aparecerá en `/me/adaccounts`.
- Token con expiración "Nunca"; se muestra **una sola vez**. Verificar salud con
  `GET /debug_token?input_token=<t>` en cada corrida del sync (barato) y avisar
  al dueño si está revocado/próximo a morir.
- Lo invalidan: revocarlo, borrar el usuario de sistema, quitar la app, resetear
  el app secret. NO lo invalidan contraseñas/2FA de humanos.

## Common Mistakes

- **`src/proxy.ts` intercepta `/api`**: el matcher debe excluir `/api/cron` o el
  cron de Vercel muere en un 307 a /login (Vercel cron no sigue redirects).
- Sync no idempotente: upsert por `meta_campaign_id` (unique) — Vercel puede
  duplicar o saltarse corridas.
- Confiar en `data: []` como fin de paginación (falso fin) o parar el loop de
  clientes cuando una cuenta falla (aislar por cliente, registrar en
  `sync_runs.errores`).
- Escribir con el cliente anon: `campania_finanzas` y `sync_runs` son solo-admin
  bajo RLS → usar `createAdminClient()` (`src/lib/supabase/admin.ts`).
- Cron Hobby dispara entre 11:00–11:59 UTC (5:00–5:59 AM CDMX, UTC-6 fijo):
  comunicar "en la madrugada", no "a las 5:00".

Detalle completo y fuentes: `docs/ultrapowers/research/2026-07-22-meta-sync-research-brief.md`.
