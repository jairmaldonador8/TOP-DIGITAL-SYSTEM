---
name: google-calendar-sync
description: Use when writing or debugging code that talks to Google Calendar in this project — OAuth connect/callback, refresh tokens, events.list incremental sync, events.watch webhook channels, or mirroring citas (eventos) to Google.
---

# Google Calendar — sincronización en dos sentidos

## Overview

Una sola conexión por agencia (`google_conexiones`, fila única) espejea la
tabla `eventos` con el calendario `primary` de Tadeo. Fetch directo a la
REST API v3 (sin SDK). Google es la verdad salvo que la fila tenga
`google_pendiente=true`.

## When to Use

- Conectar/reconectar Google (OAuth), guardar o usar el refresh token.
- Sincronizar Google → sistema (tick o webhook) o sistema → Google (actions).
- Renovar o detener el canal push.

## Core Patterns

**OAuth (web server flow)**
- Authorize: `https://accounts.google.com/o/oauth2/v2/auth` con
  `response_type=code`, `scope=https://www.googleapis.com/auth/calendar.events`,
  `access_type=offline`, `prompt=consent`, `include_granted_scopes=true`,
  `state` firmado (HMAC, incluye user_id, expira 10 min).
- Token/refresh: `POST https://oauth2.googleapis.com/token` (form-encoded).
  El `refresh_token` solo llega con `prompt=consent`. Verifica que el
  `scope` devuelto incluya `calendar.events` (consentimiento granular).
- Revocado/caducado → 400 `{"error":"invalid_grant"}` → `estado='revocada'`
  + un push deduplicado "Reconecta Google Calendar".
- La app de Google Cloud debe estar **In production** (en Testing el
  refresh token muere a los 7 días). Sin verificar funciona (<100 usuarios,
  pantalla de advertencia una vez).

**Sincronización incremental**
```ts
// Inicial: ventana + singleEvents. Incremental: SOLO syncToken + singleEvents.
const p = new URLSearchParams({ singleEvents: 'true', maxResults: '250' })
if (syncToken) p.set('syncToken', syncToken)
else { p.set('timeMin', hace30d); p.set('timeMax', en180d) }
if (pageToken) p.set('pageToken', pageToken)
// Seguir nextPageToken; nextSyncToken solo viene en la ÚLTIMA página.
// 410 → sync_token = null y resincronizar desde cero.
```
- Con `syncToken` están PROHIBIDOS `timeMin/timeMax/orderBy/q/updatedMin/privateExtendedProperty` (400).
- `singleEvents=true` en TODAS las llamadas.
- Cancelados (`status:'cancelled'`) llegan casi solo con `id`: procesarlos antes de leer otros campos.
- Los incrementales pueden caer fuera de la ventana: filtrar en memoria.

**Escribir en Google**
- Insert con **id propio** derivado del uuid de la cita (base32hex `a-v0-9`, 5–1024 chars) → idempotente; además `extendedProperties.private.td_id`.
- Con hora: `{ dateTime: '2026-09-25T10:00:00', timeZone: 'America/Mexico_City' }`.
  Todo el día: `{ date }` con `end.date` **exclusivo** (+1 día).
- `update`/`delete` con `If-Match: <etag>` → 412 = conflicto; `sendUpdates=none`.
- Guardar el `etag` devuelto en `google_etag` y limpiar `google_pendiente` en el mismo update.

**Webhook (`events.watch`)**
- Body: `{ id: uuid, type: 'web_hook', address: 'https://www.topdigital.company/api/google/webhook', token: <secreto>, params: { ttl: '604800' } }`; guardar `resourceId` y `expiration`.
- Validar `X-Goog-Channel-Token` y `X-Goog-Resource-ID`; `X-Goog-Resource-State: sync` → 200 e ignorar; body vacío: solo dispara la sincronización. Responder 2xx rápido.
- Renovar = canal nuevo + `POST /calendar/v3/channels/stop` del viejo cuando falten < 24 h.

## Common Mistakes

- Reenviar `timeMin` con `syncToken` (400) u omitir `singleEvents` en el incremental.
- Tratar nuestro propio cambio como externo: si `etag === google_etag`, ignorar (eco).
- Fin de evento de todo el día inclusivo (queda un día corto).
- Registrar el webhook en un preview de Vercel (protegido): usar producción.
- Dejar la app en Testing: Tadeo tendría que reconectar cada semana.
