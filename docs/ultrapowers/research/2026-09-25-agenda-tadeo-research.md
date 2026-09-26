# Research Brief: Agenda de Tadeo (25-sep-2026)

Spec: `docs/ultrapowers/specs/2026-09-25-agenda-tadeo-design.md`. Tres
investigaciones en paralelo (Google Calendar, Web Push en iOS, Supabase
pg_cron/pg_net) + docs locales de Next 16.

## Decisiones que cambian o afinan la spec

1. **El tick responde 202 al instante y trabaja con `after()`.** pg_net es
   asíncrono y solo espera `timeout_milliseconds`; `cron.job_run_details`
   marca "succeeded" aunque el HTTP falle. Se pasa `timeout_milliseconds :=
   60000` de todos modos y `maxDuration = 60` en el route. Diagnóstico en
   `net._http_response` (vive 6 h).
2. **El secreto NO va en la migración** (repo público): la migración lee
   `vault.decrypted_secrets where name='cron_secret'`; el valor se crea
   aparte con `vault.create_secret(...)` vía SQL editor/MCP. Sin secreto →
   header nulo → 401 visible en `net._http_response`.
3. **Limpieza de `cron.job_run_details`** (crece ~288 filas/día): segundo
   job diario que borra > 7 días.
4. **Google en producción, sin verificar.** En "Testing" el refresh token
   caduca a los 7 días; en producción sin verificar funciona para < 100
   usuarios con la pantalla "app no verificada" una sola vez. No hay tipo
   "Internal" para @gmail.
5. **Sincronización**: `timeMin` sí se permite en la sincronización inicial
   y la última página trae `nextSyncToken`. `singleEvents=true` debe ir en
   TODAS las llamadas (inicial e incrementales). Con `syncToken` están
   prohibidos `timeMin/timeMax/orderBy/q/updatedMin/privateExtendedProperty`.
   Los cambios incrementales pueden caer fuera de la ventana → filtrar en
   memoria. Cancelados llegan con casi solo `id`. 410 → borrar
   `sync_token` y resincronizar.
6. **Canal push**: ttl por defecto 7 días (sin máximo documentado); se
   renueva creando canal nuevo (id nuevo) y deteniendo el viejo con
   `channels/stop`. Estado `sync` al crear → responder 200 e ignorar. Ya no
   se requiere verificar el dominio. Usar el dominio de producción (los
   previews tienen protección de Vercel).
7. **Nuestros propios cambios regresan por el webhook** → regla de eco por
   `etag` (ya en la spec). Crear eventos con **id propio** (base32hex
   a–v0–9, derivado del uuid de la cita) hace el insert idempotente;
   además `extendedProperties.private.td_id`. Update/delete con `If-Match`
   → 412 si hubo conflicto. Usar `sendUpdates=none`. Preferir
   `events.update` completo sobre `patch` (Google lo recomienda).
8. **iOS Web Push**: iOS 16.4+ y app abierta desde inicio (en iOS 26 "Abrir
   como app web" viene activado por defecto). Permiso y `subscribe` dentro
   del mismo toque, sin `await` de red antes. **Cada push DEBE mostrar
   notificación** (`event.waitUntil(showNotification)` primero; si no,
   Safari revoca la suscripción). `notificationclick`: `matchAll` →
   `navigate+focus` o `openWindow`. Badge con `setAppBadge`. La app de
   inicio tiene almacenamiento aparte: hay que volver a iniciar sesión
   dentro de ella. Al abrir, re-verificar `getSubscription()` y hacer
   upsert.
9. **Envío con web-push**: `TTL` > 0 (Apple rechaza 0), `urgency:'high'`
   para recordatorios, `topic` (≤32 chars) para colapsar repetidos (p. ej.
   chat por cliente). Payload ≤ 4 KB. 410/404 → borrar suscripción (ya se
   hace). `VAPID_SUBJECT` debe ser `mailto:` real (lo es).
10. **Layout standalone**: `viewport.viewportFit = 'cover'` (Next 16 lo
    soporta en `Viewport`); barra inferior con
    `padding-bottom: max(12px, env(safe-area-inset-bottom))`; como el
    status bar es `black-translucent`, la topbar necesita
    `padding-top: env(safe-area-inset-top)`. Manifest con `id` fijo y
    `scope`.

## Implementación (notas)

- OAuth: `https://accounts.google.com/o/oauth2/v2/auth` con
  `access_type=offline&prompt=consent&include_granted_scopes=true&state=…`;
  token/refresh en `https://oauth2.googleapis.com/token`; revocado =
  400 `invalid_grant`. Verificar que el `scope` devuelto incluya
  `calendar.events` (consentimiento granular).
- Hora con zona: `{"dateTime":"2026-09-25T10:00:00","timeZone":"America/Mexico_City"}`;
  todo el día: `{"date":…}` con fin **exclusivo** (+1 día).
- Cuotas holgadas (600 req/min por usuario); backoff exponencial en
  403 `usageLimits`/429.
- SQL canónico del job:
  `select cron.schedule('agenda-tick','*/5 * * * *', $$ select net.http_post(url := 'https://www.topdigital.company/api/cron/tick', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='cron_secret')), body := jsonb_build_object('at', now()), timeout_milliseconds := 60000); $$);`
  (`cron.schedule` con el mismo nombre sobrescribe → migración idempotente).
- Extensiones: `create extension if not exists pg_cron with schema pg_catalog;`
  `create extension if not exists pg_net with schema extensions;`

## Sources

- Google OAuth web server / refresh expiration: developers.google.com/identity/protocols/oauth2/web-server, …/oauth2
- Publishing status / unverified apps: support.google.com/cloud/answer/15549945, 13464323, 7454865
- Calendar sync, events.list, push, extended properties, quotas: developers.google.com/workspace/calendar/api/guides/{sync,push,extended-properties,quota}, …/v3/reference/events/{list,watch,patch}
- Web Push iOS: webkit.org/blog/13878, 12945, 16535 (Declarative Web Push), 17333 (Safari 26); developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers; MDN notificationclick; github.com/web-push-libs/web-push
- Safe areas: webkit.org/blog/7929; Next 16 `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md` + `extra-types.d.ts` (`viewportFit`)
- Supabase: supabase.com/docs/guides/cron/install, …/functions/schedule-functions, …/database/extensions/pg_net, …/database/vault; github.com/supabase/pg_net (firma y timeout 5000 ms por defecto), issue #74
