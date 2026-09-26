# Agenda de Tadeo — Mi día, Google Calendar y avisos al iPhone (25-sep-2026)

Primera pieza del plan acordado el 25-sep (1 agenda de Tadeo · 2 avisos de
movimiento · 3 contenido y cobros que se agendan solos · 4 finanzas
personales). Esta spec cubre la pieza 1 y el aviso de mensajes de clientes
de la pieza 2. Maqueta aprobada: `.ultrapowers/brainstorm/…/agenda-tadeo.html`.

**Reglas transversales:** mobile first (se diseña a 390 px y se verifica en
viewport de iPhone antes que en desktop) y branding Top Digital (fondo
#0d0b10, degradado violeta→magenta→naranja, `Isotipo`/`Wordmark` de
`src/components/marca.tsx`). Meta no se toca. Nada se conecta con Klo-Ser.

## Objetivo

Tadeo (rol `admin`) organiza su día desde la web app instalada en su
iPhone: ve citas y pendientes, agenda con un botón, todo queda espejeado en
su Google Calendar en ambos sentidos, y le llegan avisos push de lo que
importa. Éxito = Tadeo crea una cita en el celular, la ve en Google
Calendar en segundos, recibe el recordatorio a tiempo, y una cita creada en
Google aparece en Mi día.

## Alcance

### 1. Mi día (`/agencia`, pantalla de inicio del admin)

- El dashboard actual (`src/app/(app)/agencia/(inicio)/page.tsx`) se muda
  a `/agencia/resumen` (mismo contenido, nuevo lugar en la navegación). `/agencia` pasa a ser **Mi día**:
  - Encabezado: fecha larga en México + saludo con el nombre.
  - Tarjeta de degradado con el conteo: citas de hoy, pendientes, entregas
    del equipo que vencen hoy y atrasados.
  - **Citas de hoy** en línea de tiempo (hora, título, cliente/lugar,
    duración, origen "desde Google Calendar" cuando aplique).
  - **Pendientes**: de hoy + atrasados + sin fecha, con palomita que
    completa en un toque (optimista, con Deshacer en toast; reutiliza el
    patrón de tareas de julio).
  - **Entregas del equipo** que vencen hoy o están atrasadas (encargos no
    aprobados), con liga a la bandeja de revisión.
  - Tarjeta "Instala la app y activa avisos" (ver §4) mientras falte.
- **Navegación móvil**: barra inferior fija (`< lg`): Mi día · Calendario ·
  **+** (botón de degradado al centro) · Equipo · Más (hoja con el resto de
  secciones). En `lg+` se conserva la topbar de píldoras y el botón + vive
  en Mi día y Calendario. Respeta `safe-area-inset-bottom`.
- **Botón +** abre una hoja inferior (Sheet `side="bottom"` en móvil,
  Dialog en desktop) con tres pestañas: **Cita**, **Pendiente**,
  **Encargo** (este último reutiliza el formulario de encargos existente).

### 2. Modelo de datos (migración 0023 del sistema)

> Numeración: la rama `sitio-web` también tiene una 0023/0024 **no
> aplicadas**; al unir ramas se renumeran las del sitio.

- **Un solo calendario de Google por agencia.** Las citas (`eventos`) son
  de la agencia, no de un usuario: se espejean con UNA conexión de Google
  (la de Tadeo). `google_conexiones` es de fila única (ver abajo). Los
  avisos de citas van a todos los admins (`idsAdmins()`; hoy solo Tadeo).
- `eventos` (citas) gana:
  - `hora_fin time` (null = sin duración; si `hora` es null es de todo el día)
  - `lugar text`
  - `aviso_min int` (minutos antes; **null = sin aviso previo**; sin
    default en la base: el formulario propone 30 para citas con hora; las
    de todo el día no tienen aviso previo y solo salen en el resumen de
    las 8:00; las importadas de Google con hora reciben 30, las de todo el
    día null)
  - `origen text not null default 'sistema'` check in (`sistema`,`google`)
  - `google_event_id text unique` (null hasta que se espejea)
  - `google_etag text`
  - `google_pendiente boolean not null default false` (hay un cambio local
    que Google aún no recibió; el tick lo reintenta)
  - `borrado_en timestamptz` (borrado suave: la fila se oculta en la UI y
    se borra de verdad cuando Google confirma el delete o si nunca tuvo
    `google_event_id`)
  - `actualizado_en timestamptz not null default now()` mantenido por
    **trigger** `before update` (no depende de las actions)
- `tareas` (pendientes):
  - `cliente_id` pasa a **nullable** (pendientes personales).
  - `hora time` opcional, `completada_en timestamptz`.
  - La palomita pone `estado='completada'` **y** `completada_en=now()`;
    desmarcar regresa a `pendiente` y limpia `completada_en` (un trigger
    mantiene `completada_en` coherente con `estado`).
  - Mi día muestra **todas** las tareas no completadas (personales y de
    clientes); las de cliente llevan chip con el nombre del negocio.
  - RLS: la política actual por cliente sigue; los pendientes sin cliente
    son solo de admin (revisar la policy para que `cliente_id is null` no
    quede expuesto al portal — la guarda del portal filtra por
    `cliente_id = claim`, así que null nunca coincide; se agrega prueba).
- `google_conexiones` (**fila única**: `id boolean primary key default
  true check (id)`): `user_id uuid → auth.users on delete cascade` (quién
  conectó), `email text`,
  `refresh_token_cifrado text` (AES-256-GCM, llave `GOOGLE_TOKEN_KEY`),
  `calendar_id text default 'primary'`, `sync_token text`,
  `canal_id text`, `canal_recurso_id text`, `canal_expira timestamptz`,
  `estado text` (`activa`|`revocada`|`error`), `ultimo_error text`,
  `actualizado_en`. **RLS activada sin políticas**: solo el cliente admin
  (service role) la lee/escribe.
- `avisos_enviados` (deduplicación): `clave text primary key` (p. ej.
  `cita:<id>:<fecha>:<aviso_min>`, `resumen:<fecha>:<user>`,
  `vencido:tarea:<id>:<fecha>`), `enviado_en timestamptz default now()`.
  RLS sin políticas. Limpieza: el tick borra claves de más de 30 días.

### 3. Google Calendar en dos sentidos

- **OAuth** (`/api/google/conectar` → consentimiento → `/api/google/callback`):
  scope `https://www.googleapis.com/auth/calendar.events`,
  `access_type=offline`, `prompt=consent`, parámetro `state` firmado
  (HMAC con `GOOGLE_TOKEN_KEY`, incluye `user_id` y expira en 10 min).
  Solo admin. Se guarda el refresh token cifrado; el access token vive en
  memoria (se renueva en cada tick/uso).
- **Sistema → Google**: crear/editar/borrar cita llama a Events
  insert/patch/delete en el calendario de Tadeo y guarda
  `google_event_id`/`google_etag`. Si Google falla, la cita se guarda
  igual y queda marcada para reintento en el siguiente tick (columna
  `google_pendiente boolean`). Las citas guardan en
  `extendedProperties.private.topdigital_id` el id del sistema.
- **Google → sistema**: sincronización incremental con `syncToken` y
  `singleEvents=true` (las citas recurrentes de Google llegan como
  **instancias separadas**, una fila por ocurrencia; editar una desde el
  sistema cambia solo esa instancia; crear citas recurrentes desde el
  sistema queda fuera de alcance). Primera sincronización: ventana
  −30/+180 días (verificar en la investigación que Google entregue
  `nextSyncToken` con `timeMin`; si no, sincronización inicial completa
  filtrando la ventana en memoria). Eventos con `topdigital_id` se
  reconcilian con su fila; los demás se insertan como `origen='google'`.
  Eventos de varios días se recortan al primer día con "(varios días)" en
  el detalle. Borrados en Google (`status=cancelled`) borran la fila.
  **Eco propio**: si el `etag` recibido es igual a `google_etag`, se
  ignora (es nuestro propio patch que regresa). **Conflicto**: si la fila
  tiene `google_pendiente=true`, gana el cambio local (se reenvía); si no,
  gana Google. 410 Gone → resync completo.
- **Aviso inmediato**: canal `events.watch` hacia `/api/google/webhook`
  (valida `X-Goog-Channel-Token` y `X-Goog-Resource-ID`; responde 200 y
  sincroniza). El tick renueva el canal cuando falten < 24 h para expirar.
- **Respaldo**: el tick sincroniza cada 5 min aunque no llegue webhook.
- **Revocación**: `invalid_grant` → `estado='revocada'`, push "Reconecta
  Google Calendar" (una vez, deduplicado) y banner en Mi día. Las citas se
  conservan.
- El feed ICS existente se mantiene (lo usan otros calendarios).

### 4. Avisos push

- **Tick** `/api/cron/tick` (**POST a propósito**, distinto de los crons
  GET de Vercel; `Authorization: Bearer CRON_SECRET`; excluido del proxy
  como `api/cron/`), disparado **cada 5 min por `pg_cron` + `pg_net`**
  desde Supabase contra `https://www.topdigital.company/api/cron/tick`
  con `timeout_milliseconds` de 55 s (el secreto vive en Supabase Vault;
  migración que crea el job). Cada corrida, en orden e independientes
  (un fallo no detiene a los demás, se registra):
  1. Sincroniza Google (y reintenta `google_pendiente`, renueva canal).
  2. **Recordatorios**: citas con `aviso_min` cuyo inicio − aviso cae en
     la ventana `(ahora − 10 min, ahora + 5 min]` y sin clave enviada.
  3. **Resumen del día** a las 8:00 America/Mexico_City (primer tick con
     hora local ≥ 8:00 del día sin clave): "Tu día: N citas, M pendientes.
     Atrasado: …".
  4. **Vencidos**: pendientes y entregas que vencen hoy o están
     atrasados → incluidos en el resumen; además, primer tick con hora
     local ≥ 18:00: un solo aviso "Te quedan N cosas de hoy" si hay
     pendientes/entregas de hoy abiertos (clave `cierre:<fecha>`).
  5. Limpieza de `avisos_enviados` > 30 días.
- **Al momento** (ya existen para encargos y chat de equipo): se agrega
  push a admins cuando un **cliente** escribe en el chat del portal
  (`lib/chat/enviar-mensaje.ts`, solo si el autor no es admin, agrupado:
  máx. uno por cliente cada 10 min vía `avisos_enviados`). Leads nuevos
  quedan para cuando exista su vía de entrada (hoy no hay).
- Toda la lógica de "qué toca avisar" vive en funciones puras en
  `src/lib/agenda/` (reciben datos + `ahora`, devuelven avisos con clave);
  el route handler solo carga datos, llama y envía.
- **iPhone**: el push web solo funciona con la app agregada a inicio
  (iOS 16.4+). Tarjeta en Mi día que detecta `display-mode: standalone` y
  permiso: no instalada → pasos Compartir → Agregar a inicio; instalada
  sin permiso → botón "Activar avisos" (reusa `ActivarPush`); todo listo →
  no se muestra.

### 5. Calendario (`/agencia/calendario`)

- Mobile first: en móvil abre en **agenda** (lista por día) con selector
  de semana deslizable; el mes queda como vista secundaria.
- Tocar una cita abre la hoja de edición (editar, mover de día/hora,
  borrar). Las citas `origen='google'` también se editan y se espejean.
- Las cuatro fuentes existentes siguen (campañas, encargos, tareas,
  eventos) y los pendientes con fecha aparecen.

## Variables y servicios nuevos

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY` (32 bytes
  base64) en `.env.local` y Vercel production.
- Proyecto de Google Cloud (lo crea el usuario con guía): Calendar API
  habilitada, pantalla de consentimiento **en producción** (en modo
  prueba los refresh tokens caducan a los 7 días), cliente OAuth web con
  redirect `https://www.topdigital.company/api/google/callback` y
  `http://localhost:3000/api/google/callback`.
- Supabase: extensiones `pg_cron` y `pg_net`, secreto del tick en Vault.

## Errores y bordes

- **Borrado suave en todos los lectores**: `borrado_en is null` en
  `lib/calendario/fuentes.ts`, el feed ICS, las consultas del tick y los
  conteos de Mi día. Sin conexión de Google (fase 1), borrar elimina la
  fila de inmediato.
- Un reintento exitoso a Google limpia `google_pendiente` y guarda el
  `etag` nuevo en el mismo update (así el eco se reconoce).
- Si Tadeo cambia `aviso_min` después de que ya salió el aviso, sale uno
  nuevo con el tiempo nuevo (intencional: la clave incluye `aviso_min`).

- Zona horaria: todo cálculo de "hoy", 8:00 y ventanas usa
  America/Mexico_City (`lib/formato.ts`); Google recibe `timeZone`
  explícito.
- Tick idempotente: la clave de `avisos_enviados` se inserta **antes** de
  enviar (insert … on conflict do nothing; si no insertó, no se envía).
- Sin llaves VAPID o sin suscripción: no-op silencioso (patrón actual).
- Sin conexión a Google: todo funciona local; la sincronización se omite.
- El webhook nunca confía en el cuerpo: solo dispara una sincronización.

## Pruebas

- Unitarias (vitest) en `src/lib/agenda/`: ventana de recordatorios,
  resumen del día (texto y conteos), vencidos, mapeo cita ↔ evento de
  Google (todo el día, con hora, sin fin, cancelado), resolución de
  conflictos, claves de deduplicación, cifrado/descifrado del token y
  firma del `state`.
- Prueba RLS: pendiente sin cliente invisible para un usuario de portal;
  `google_conexiones` y `avisos_enviados` ilegibles para `authenticated`.
- E2E Playwright en viewport iPhone (390×844): Mi día, botón +, crear y
  palomear pendiente, crear/editar cita, barra inferior.
- Verificación real con el usuario: cita creada en el iPhone aparece en
  Google Calendar; cita creada en Google aparece en Mi día; llega el
  recordatorio.

## Fases de entrega (cada una se publica sola)

1. Modelo de datos + Mi día + botón + + barra inferior + calendario móvil.
2. Tick con pg_cron + recordatorios, resumen, cierre y push de chat de
   clientes + tarjeta de instalación en iPhone.
3. Google Calendar en dos sentidos (requiere el proyecto de Google Cloud).

## Fuera de alcance

Contenido y cobros automáticos (pieza 3), finanzas personales (pieza 4),
leads push (sin vía de entrada aún), Google Tasks, invitados/Meet en las
citas, calendarios de otros integrantes.
