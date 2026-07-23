# Spec: Calendario de operación de la agencia + suscripción iCal

**Fecha:** 2026-07-24 · **Estado:** Aprobado por el usuario (diseño conversacional)

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Enfoque | Calendario de **operación** (planeación), no sistema de citas. Benchmark GHL analizado: su calendario es booking; queda como fase futura aparte. |
| Visibilidad | Solo agencia (`/agencia/calendario`, entrada nueva en la nav). Equipo/portal: fases futuras. |
| Google Calendar | **Suscripción iCal (ICS)** con URL secreta — sin OAuth, sin verificación de Google, sin tokens que caducan. Google refresca cada pocas horas (aceptable para planeación). |
| Fuentes | 4: campañas (fecha_inicio), encargos (fecha_limite + nombre del integrante), tareas no completadas (fecha_limite), eventos manuales (tabla nueva). |
| Eventos manuales | título, descripción/notas, cliente opcional, fecha, hora opcional (sin hora = todo el día), tipo: `junta, sesion, lanzamiento, pago, otro`. v1: crear y eliminar (editar = fase siguiente). |
| Zona horaria | Fechas date-only ancladas a mediodía (patrón #418, helpers de `lib/formato`). En ICS: eventos de día completo `VALUE=DATE`; con hora → hora local flotante (sin TZID/Z) — correcto para un dueño en México. |

## 2. Datos (migración 0019_calendario)

```sql
create type public.evento_tipo as enum ('junta','sesion','lanzamiento','pago','otro');

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  cliente_id uuid references public.clientes (id) on delete set null,
  fecha date not null,
  hora time,
  tipo public.evento_tipo not null default 'otro',
  created_at timestamptz not null default now()
);
create index eventos_fecha_idx on public.eventos (fecha);
```

RLS **solo-admin** (patrón `campania_finanzas`: `for all ... using/with check (private.is_admin())`).

## 3. Módulos

- **`src/lib/calendario/fuentes.ts`** (server-only): `cargarElementos(supabase, desde, hasta)` — **5 consultas**: las 4 fuentes más `usuarios (user_id, nombre)` para el nombre del integrante (OJO: `encargos.asignado_a` referencia `auth.users`, no expuesto a PostgREST — el embed falla; hacer join en memoria con el mismo patrón de `agencia/equipo/page.tsx`). Encargos: solo `estado != 'aprobado'` (los aprobados ya no son pendientes de agenda). Devuelve `ElementoCalendario[]`:
  `{ id, uid ('campania:<id>'|'encargo:<id>'|'tarea:<id>'|'evento:<id>'), fecha, hora: string|null, titulo, detalle (cliente/integrante), tipo: 'campania'|'encargo'|'tarea'|'evento', subtipo (evento_tipo cuando aplique), href (liga interna) }`.
  Acepta cualquier cliente de Supabase (sesión en la página, admin en el ICS). Mapeos puros extraídos y testeados.
- **`src/lib/calendario/ics.ts`** (puro, TDD): `generarICS(elementos): string` — VCALENDAR/VEVENT RFC 5545: `UID` estable (el `uid` del elemento + dominio), `DTSTART;VALUE=DATE` para día completo, `DTSTART:<local flotante>` + DURATION 1h cuando hay hora, `SUMMARY` con prefijo por tipo (📣 campaña, 🎬 entrega, ✅ tarea, 📅 evento), `DESCRIPTION` con detalle, escapado RFC (comas, `;`, saltos), líneas CRLF, plegado a 75 octetos **sin partir caracteres multibyte** (los prefijos emoji lo vuelven caso real) y `X-WR-CALNAME:Top Digital` como **propiedad del VCALENDAR** (no header HTTP). Tests: escapado, día completo vs hora, UID estable, plegado multibyte, calendario vacío válido.

## 4. Feed ICS

- Route handler `GET /api/calendario/ics` — valida `?token=` contra env `ICS_SECRET` (fail-closed como el cron); usa `createAdminClient()` (Google no trae sesión); rango: hoy−60 días a hoy+365; responde `text/calendar; charset=utf-8` con `Cache-Control: private, max-age=300`.
- `src/proxy.ts`: excluir `api/calendario/` del matcher (igual que `api/cron/` — Google no sigue el redirect a /login).
- `ICS_SECRET`: generar aleatorio, en Vercel (prod+preview) y `.env.local`.

## 5. UI — `/agencia/calendario`

- Entrada "Calendario" en la nav de agencia (ícono calendario).
- **Vista de mes** navegable (`?mes=YYYY-MM`, server component lee searchParams; flechas ← → y "Hoy"): grid de 7 columnas lun–dom; móvil: puntitos de color por tipo en cada día; desktop: chips con texto truncado. Hoy resaltado (anillo de marca); días de otros meses atenuados.
- **Agenda del mes** debajo: lista cronológica de los elementos del mes con punto de color, título, detalle y liga (campaña → Campañas expandido no requerido: liga a /agencia/campanias; encargo → /agencia/equipo; tarea → /agencia/tareas; evento → dialog de detalle con botón eliminar).
- Tocar un día (móvil o desktop) abre dialog con los elementos de ese día.
- **"+ Evento"**: dialog con el patrón de forms existente (`ResultadoAccion`): título, tipo (Select), cliente (Select opcional), fecha, hora opcional, notas.
- **"Ver en Google Calendar"**: dialog con la URL de suscripción (`https://www.topdigital.company/api/calendario/ics?token=…` — el token llega del server como prop, página solo-admin), botón copiar y los 2 pasos de Google. Aviso: "Google tarda unas horas en reflejar cambios".
- Leyenda de colores fija: campaña violeta, encargo magenta, tarea naranja, evento por subtipo (junta azul?, resto gris de marca) — definir en implementación con el design system; texto siempre acompaña al color (a11y).

## 6. Server actions (`/agencia/calendario/actions.ts`, solo-admin)

- `crearEvento(_prev, formData)` — valida título obligatorio (≤200), tipo en enum, fecha `YYYY-MM-DD`, hora `HH:MM` opcional, cliente uuid opcional existente. `revalidatePath('/agencia/calendario')`.
- `eliminarEvento(id)` — uuid válido; resultado `{ ok, mensaje? }`.

## 7. Fuera de alcance

- Sistema de citas/booking (GHL-style), OAuth bidireccional, arrastrar para mover, editar eventos (v2), calendarios para equipo/portal, recordatorios/notificaciones.

## 8. Pruebas

- Unitarias: `ics.ts` completo; mapeos de `fuentes.ts` (funciones puras).
- Suite + tsc + eslint + build verdes.
- Verificación en vivo: curl del feed ICS (401 sin token, 200 con token y VCALENDAR válido con elementos reales); Playwright: página del calendario con elementos, crear evento manual, verlo en el mes y en el feed; captura para el usuario.
