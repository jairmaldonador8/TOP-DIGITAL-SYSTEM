# Spec: Módulo de equipo — cuentas de trabajadores y encargos (Fase 1)

**Fecha:** 2026-07-23 · **Estado:** Aprobado por el usuario (diseño conversacional)
**Fase 2 (spec aparte, después):** chat dueño↔trabajador en tiempo real.

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Rol | Nuevo valor `equipo` en el enum `rol_usuario` (junto a admin/cliente), con `usuarios.puesto` (texto: "Diseño gráfico", "Editor de video"…). `cliente_id` queda null para equipo. |
| Área | `/equipo` — dashboard propio del trabajador. Guardia de roles existente: equipo no entra a /agencia ni /portal y viceversa. |
| Encargos | Tabla nueva `encargos`, separada de `tareas` (los clientes NUNCA ven encargos). Descripción libre y rica (características, referencias, montos — sin campo de dinero dedicado). |
| Ciclo | `pendiente → en_progreso → entregado → aprobado` o `entregado → cambios → en_progreso` (el dueño revisa; "cambios" lleva comentario obligatorio). **`aprobado` es terminal: ninguna transición sale de él, para ningún rol.** |
| Visibilidad del trabajador | Solo SUS encargos + ficha breve del cliente (nombre, giro, descripción pública) SOLO de clientes donde tiene encargos. Nada de leads/campañas/dinero/notas internas/compañeros. |
| Precios | No hay campo de precio: era ejemplo de contenido libre de la descripción. |
| Notificaciones | v1: contadores derivados (badges) en ambos lados. Sin infra nueva de notificaciones ni push. |

## 2. Modelo de datos (migración 0015)

```sql
alter type public.rol_usuario add value if not exists 'equipo';

alter table public.usuarios add column puesto text;

alter table public.clientes
  add column giro text,
  add column descripcion_publica text;

create type public.prioridad_encargo as enum ('alta', 'media', 'baja');
create type public.estado_encargo as enum
  ('pendiente', 'en_progreso', 'entregado', 'cambios', 'aprobado');

create table public.encargos (
  id uuid primary key default gen_random_uuid(),
  asignado_a uuid not null references auth.users (id),
  cliente_id uuid references public.clientes (id),
  titulo text not null,
  descripcion text,
  prioridad public.prioridad_encargo not null default 'media',
  estado public.estado_encargo not null default 'pendiente',
  fecha_limite date,
  comentario_revision text,
  entregado_en timestamptz,
  aprobado_en timestamptz,
  created_at timestamptz not null default now()
);
create index encargos_asignado_estado_idx on public.encargos (asignado_a, estado);
create index encargos_cliente_id_idx on public.encargos (cliente_id);
```

**Nota de enum:** `alter type ... add value` no puede usarse dentro de la misma
transacción que lo consuma. La migración 0015 solo AGREGA el valor (y las
tablas nuevas usan enums recién creados, no `rol_usuario`), como ya se hizo en
0008 — sin riesgo.

### RLS (seguir el skill `supabase-multitenant-rls`)

- Helper nuevo `private.es_equipo()` — mismo estilo security-definer que los
  helpers de 0002, pero **leyendo el claim `user_role` del JWT como texto**
  (no la tabla ni el enum: así la migración 0015 no consume el valor de enum
  recién agregado en su propia transacción).
- `encargos`: admin todo; equipo `select` con `asignado_a = (select auth.uid())`.
  Para `update` de equipo, **defensa en la base, no solo en actions** (un
  trabajador con su JWT puede llamar PostgREST directo):
  1. Política de update con
     `using ((select private.is_admin()) or asignado_a = (select auth.uid()))` y
     `with check ((select private.is_admin()) or (asignado_a = (select auth.uid()) and estado in ('en_progreso','entregado')))`
     — imposible auto-aprobarse o forjar `cambios` aunque se salte la UI.
  2. **Trigger `before update`**: si NO es admin, congela todas las columnas
     excepto `estado` y `entregado_en`
     (`cliente_id, asignado_a, titulo, descripcion, prioridad, fecha_limite,
     comentario_revision, aprobado_en` deben quedar idénticas o se rechaza) —
     cierra el desvío de reasignar `cliente_id` para espiar la vista de
     clientes.
  Residual aceptado y documentado: un trabajador podría brincar
  `pendiente→entregado` directo por PostgREST (el `with check` no ve el
  estado anterior); es inocuo — solo se salta su propio "en progreso" y la
  server action sigue imponiendo la máquina completa en la UI.
  Sin `insert`/`delete` para equipo.
- `clientes`: SIN política nueva para equipo (no leen la tabla). El contexto
  llega por la **vista** `public.clientes_para_equipo` (vista con derechos del
  owner — `security_invoker` apagado, que es el default de Postgres; no
  existe cláusula "security definer" en vistas): columnas
  `id, nombre_negocio, giro, descripcion_publica`,
  filtrada a `exists (encargo del auth.uid() en ese cliente)` o
  `private.is_admin()`. `revoke` a `anon`; `grant select` a `authenticated`.
  Guardia interna: devuelve filas solo si `es_equipo()` o `is_admin()`.
- `usuarios`: la política actual de "cada quien lee su fila" ya cubre al
  equipo. El hook de claims (0003) es genérico y no cambia.
- **Tests de RLS de integración** (extender `rls.integration.test.ts`, contra
  PostgREST directo con sesión de trabajador): ve solo sus encargos; no ve
  ajenos; la vista solo muestra clientes con encargo suyo (4 columnas); un
  `update` directo a `estado = 'aprobado'` **es rechazado por la política**
  (no por la action); un `update` directo de `cliente_id` **es rechazado por
  el trigger**; no puede leer `clientes` directo (hoy: 0 filas).

## 3. Auth y navegación

- `redirect.ts`: `Rol = 'admin' | 'cliente' | 'equipo'`; `AREA_POR_ROL.equipo
  = '/equipo'`; `rolDesdeClaims` acepta el nuevo valor. Actualizar
  `redirect.test.ts` (nuevos casos: equipo → /equipo, equipo no accede a
  /agencia ni /portal, admin/cliente no acceden a /equipo).
- El proxy no cambia (usa esas funciones).
- Alta de cuentas: server action solo-admin con el patrón existente de crear
  usuarios de cliente (service role `auth.admin.createUser` + fila en
  `usuarios` con rol `equipo`, `puesto`, `cliente_id` null).

## 4. Server actions

`src/app/(app)/agencia/equipo/actions.ts` (solo-admin):
- `crearTrabajador(nombre, puesto, email, password)` — patrón de usuarios existente.
- `crearEncargo(asignado_a, cliente_id?, titulo, descripcion, prioridad, fecha_limite?)` — valida uuid/fecha/prioridad; título obligatorio.
- `editarEncargo(id, campos)` — solo mientras no esté `aprobado`.
- `revisarEncargo(id, veredicto: 'aprobado' | 'cambios', comentario?)` — solo
  desde `entregado`; `cambios` exige comentario; estampa `aprobado_en`.

`src/app/(app)/equipo/actions.ts` (solo-equipo, con `usuarioActual()`):
- `avanzarEncargo(id, a: 'en_progreso' | 'entregado')` — transiciones válidas:
  `pendiente→en_progreso`, `cambios→en_progreso`, `en_progreso→entregado`
  (estampa `entregado_en`). Verifica que el encargo sea suyo. Cualquier otra
  transición → rechazo.

**Máquina de estados como función pura** `src/lib/equipo/transiciones.ts`:
`puedeTransicionar(rol, de, a): boolean` — con tests exhaustivos de la matriz
(equipo y admin, todas las combinaciones). Las actions la usan.

## 5. UI

### `/equipo` (trabajador; mobile-first, PWA, lenguaje visual existente)
- Layout propio en el route group `(app)` con topbar simple (nombre + puesto +
  menú de cuenta con cerrar sesión) — sin sidebar de agencia.
- Dashboard: saludo; 4 stats (pendientes, en progreso, esperando revisión,
  aprobados del mes); lista de encargos agrupada por estado, ordenada
  prioridad (alta primero) y fecha límite (vencidos resaltados en rojo, patrón
  de tareas). Tarjeta de encargo: título, cliente (nombre), prioridad badge,
  fecha, estado.
- Detalle (dialog): descripción completa, ficha breve del cliente (giro +
  descripción pública, desde la vista), comentario de revisión si estado =
  `cambios`, y el botón de acción según estado (Empezar / Entregar /
  Retomar). Encargos `aprobado` en sección colapsable "Aprobados".

### `/agencia/equipo` (dueño)
- Entrada nueva "Equipo" en la navegación de agencia.
- Tarjetas por trabajador: nombre, puesto, activos (pendiente+en_progreso),
  badge "N por revisar" cuando tiene entregados.
- **Bandeja "Por revisar"** arriba: encargos `entregado` de todo el equipo;
  abrir → descripción + aprobar o pedir cambios (comentario obligatorio).
- Dialogs: "Nuevo encargo" (trabajador, cliente opcional, título, descripción,
  prioridad, fecha límite) y "Nuevo integrante" (nombre, puesto, email,
  contraseña) — patrón de forms existente (`ResultadoAccion`, repoblado).
- Badge "por revisar" también en el dashboard principal de agencia (tarjeta o
  punto de atención en `Atencion` si count > 0).
- La ficha del cliente gana los campos giro y descripción pública en su form
  de edición (para alimentar la mini-ficha del equipo).

## 6. Fuera de alcance (Fase 1)

- Chat dueño↔trabajador (Fase 2, spec propio).
- `editarEncargo` (UI y action de edición del dueño) — **diferido a Fase 2**
  (decisión post-review: v1 cubre crear/avanzar/revisar; correcciones se
  comunican por el comentario de cambios).
- Extensión de `rls.integration.test.ts` con los casos de equipo — **diferida**:
  la suite de integración depende de fixtures seed (usuario demo) eliminados
  al cargar los clientes reales; se rehabilitará como chore aparte. Las
  defensas de la base quedaron verificadas en vivo (simulación SQL del
  trigger/política, review final).
- Adjuntos/archivos en encargos (las referencias van como links en la
  descripción).
- Notificaciones push/email; campanita con historial para equipo.
- Editar/desactivar cuentas de trabajadores desde la UI (se hace por Supabase
  si urge; UI de gestión en fase posterior).
- Métricas de productividad del equipo.

## 7. Pruebas

- Unitarias: `transiciones.ts` (matriz completa), `redirect.ts` (rol nuevo).
- Integración RLS: los casos de §2.
- Suite completa + tsc + eslint + build; Playwright en producción: login de un
  trabajador de prueba → ve su dashboard vacío; dueño crea encargo → aparece;
  ciclo completo empezar→entregar→aprobar verificado en vivo.
