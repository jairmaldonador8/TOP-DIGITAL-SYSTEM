# Notificaciones Web Push — diseño

**Fecha:** 2026-07-25 · **Estado:** aprobado (modo autónomo delegado por el usuario)

## Propósito

Cerrar la brecha de notificaciones (solo campanita in-app): avisos reales en el
dispositivo aunque la pestaña esté cerrada, sin servicios externos de pago
(Web Push estándar + VAPID). Cuando llegue WhatsApp Cloud API convivirán:
push para el equipo interno, WhatsApp para el dueño/clientes.

## Diseño

- **Migración 0022** — `push_suscripciones` (`user_id`, `endpoint unique`,
  `p256dh`, `auth`). RLS: cada usuario gestiona solo las suyas; el envío usa el
  cliente admin y borra endpoints muertos (404/410).
- **`public/sw.js`** — service worker mínimo: `push` → `showNotification`
  (título, cuerpo, ícono de marca) y `notificationclick` → enfoca/abre la URL.
- **`ActivarPush`** (topbar, todos los roles) — registra el SW, pide permiso,
  se suscribe con la llave pública VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) y
  guarda vía server action (`guardarSuscripcionPush`, upsert por endpoint).
  Sin soporte del navegador o sin llaves, el botón no se muestra.
- **`enviarPushA(userIds, {titulo, cuerpo, url})`**
  (`src/lib/push/push-server.ts`) — best-effort: nunca lanza; sin llaves VAPID
  es no-op. `idsAdmins()` para avisos al dueño.
- **Eventos conectados**: encargo creado → trabajador; encargo entregado →
  admins; revisión (aprobado/cambios) → trabajador; mensaje de chat de equipo →
  contraparte; reporte semanal listo (cron) → admins.

## Config requerida en producción (manual)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` deben
agregarse en Vercel (ya están en `.env.local`). Sin ellas la app funciona
igual, sin push.

## Fuera de alcance (YAGNI)

Push a clientes del portal por leads (llegará con WhatsApp), preferencias por
tipo de evento, agrupación/colapso de notificaciones, email.

**Limitación conocida (dispositivo compartido):** cerrar sesión no desuscribe
el navegador; las notificaciones del usuario anterior siguen llegando a ese
dispositivo hasta que alguien toque la campanita para desactivarlas o el
siguiente usuario active las suyas. Aceptado: el equipo usa dispositivos
propios; revisar si algún día hay equipos compartidos.

## Testing

Build + lint; flujo de suscripción y recepción verificado manualmente en el
navegador (requiere HTTPS o localhost). El envío es best-effort y no bloquea
las actions (envuelto en try/catch).
