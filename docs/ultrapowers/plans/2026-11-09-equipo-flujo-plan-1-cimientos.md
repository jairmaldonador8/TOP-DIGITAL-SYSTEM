# Equipo y flujo de entregables — Plan 1: cimientos

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el esquema, los permisos por puesto, la lógica de ciclos, la ficha de cliente con equipo asignado y la base limpia, validado con simulación de RLS, para construir encima las pantallas del equipo (Plan 2).

**Architecture:** Se amplía `encargos` (no hay tabla nueva de entregables). Los puestos viven en `usuarios.puesto` (enum) y la asignación en `cliente_equipo`. La lógica de fechas y piezas es TypeScript puro y probado; el servidor solo inserta. La revisión y el desbloqueo pasan por funciones `security definer` que encienden `app.via_rpc` para atravesar el trigger de congelado.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres 17 (RLS, triggers, RPC), supabase-js 2, Vitest 4, Tailwind 4, Base UI (shadcn).

**Spec:** `docs/ultrapowers/specs/2026-11-09-equipo-y-flujo-entregables-design.md` · **Research:** `docs/ultrapowers/research/2026-11-09-equipo-flujo-research.md`

**Preferencias:** auto-commit ON, auto-push ON (a `fase-1`; **nunca** a `main` sin pedirlo: `main` despliega a producción).

**Cómo aplicar migraciones:** con el MCP de Supabase (`apply_migration`, proyecto `gjiiuzbjrdpucgubvxhj`) usando el mismo nombre y contenido del archivo. Si el MCP no está autenticado, pedir al usuario `/mcp`.

---

## Correcciones tras la revisión del plan

- Los archivos `supabase/migrations/0024`–`0026` ya escritos **mandan** sobre el SQL de este plan. Incluyen: RLS activada al crear cada tabla en 0025; trigger de INSERT en vez de `CHECK NOT VALID`; `grant update (asignado_a)` en leads; la política de update del equipo ampliada, con la máquina de estados del trabajador movida al trigger (impide saltarse `esperando`); paso libre para la acción `ON DELETE SET NULL` de `depende_de` y para la secret key; restauración de `app.via_rpc`; seguimientos y `asignado_a` limitados a la agencia; ficha del equipo compatible con los encargos actuales.
- Task 10: `reportes_semanales` no tiene `cliente_id` (solo se respalda); faltan `tareas` y `actividades` en el borrado; paginar los respaldos con `.range()`, lanzar error en cualquier `error` y revisar cada `deleteUser`.
- Task 11: cada error esperado va en un bloque `DO … EXCEPTION`; probar `depende_de` con una pieza `en_progreso`; incluir admin, la fila del vendedor en `cliente_equipo` de la agencia y un prospecto asignado.
- Producción comparte base: después de aplicar 0025, `crearTrabajador` en `main` falla con puestos en texto libre hasta publicar la Task 9. Publicar `fase-1` → `main` justo al terminar la Task 9.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/0024_tipos_equipo.sql` | Solo enums nuevos |
| `supabase/migrations/0025_equipo_esquema.sql` | Columnas, tablas, buckets, mapeo de puesto |
| `supabase/migrations/0026_equipo_permisos.sql` | Helpers, RLS, RPCs, triggers |
| `src/lib/entregables/fechas.ts` | Días hábiles y ciclos (puro) |
| `src/lib/entregables/ciclo.ts` | Piezas de un ciclo desde la cuota (puro) |
| `src/lib/entregables/semaforo.ts` | Color de cada pieza (puro) |
| `src/lib/entregables/__tests__/*.test.ts` | Pruebas de los tres anteriores |
| `src/lib/equipo/puestos.ts` | Catálogo de puestos: etiqueta, acción, tipos que atiende |
| `src/lib/equipo/transiciones.ts` | + estado `esperando` |
| `src/lib/clientes/ficha.ts` | Validación de cuota y kit (puro) + tests |
| `src/app/(app)/agencia/clientes/ficha-actions.ts` | Guardar ficha, cuota, kit, equipo asignado |
| `src/components/clientes/ficha-tabs.tsx` y hermanos | UI de la ficha (Datos · Kit · Equipo · Cuota) |
| `src/app/(app)/agencia/equipo/actions.ts` | Alta con puesto enum y perfil |
| `scripts/limpiar-clientes.ts` | Respaldo + borrado ordenado (con `--confirmar`) |
| `scripts/simular-rls-puestos.sql` | Punto de control de permisos |

---

### Task 1: Migración 0024 — tipos

**Skills:** @supabase-multitenant-rls

**Files:** Create `supabase/migrations/0024_tipos_equipo.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0024_tipos_equipo: SOLO tipos. Un valor nuevo de enum no se puede usar en
-- la misma transaccion (55P04); todo lo que los usa va de 0025 en adelante.

alter type public.estado_encargo add value if not exists 'esperando' before 'pendiente';

create type public.puesto_equipo as enum
  ('project_manager', 'media_buyer', 'filmmaker', 'editor', 'disenador', 'vendedor');

create type public.tipo_entregable as enum
  ('imagen', 'carrusel', 'video', 'produccion', 'guion', 'otro');
```

- [ ] **Step 2: Aplicar** con `apply_migration` (name `0024_tipos_equipo`). Esperado: éxito.
- [ ] **Step 3: Verificar**: `select enum_range(null::public.estado_encargo);` → `{esperando,pendiente,en_progreso,entregado,cambios,aprobado}`.
- [ ] **Step 4: Commit** `feat(db): tipos de puesto, entregable y estado esperando`

---

### Task 2: Migración 0025 — esquema

**Skills:** @supabase-multitenant-rls

**Files:** Create `supabase/migrations/0025_equipo_esquema.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0025_equipo_esquema: puestos, perfil, asignacion por cliente, ficha,
-- ampliacion de encargos, vendedor en leads, ajustes y buckets.

-- ===== usuarios.puesto: texto -> enum (mapeo del spec) =====
alter table public.usuarios add column puesto_nuevo public.puesto_equipo;

update public.usuarios set puesto_nuevo = (case
    when puesto is null then null
    when lower(puesto) like '%dise%' then 'disenador'
    when lower(puesto) like '%edit%' then 'editor'
    when lower(puesto) like '%film%' or lower(puesto) like '%video%' then 'filmmaker'
    when lower(puesto) like '%project%' or lower(puesto) ~ '\mpm\M' then 'project_manager'
    when lower(puesto) like '%media%' then 'media_buyer'
    when lower(puesto) like '%vend%' then 'vendedor'
    else null
  end)::public.puesto_equipo;

alter table public.usuarios drop column puesto;
alter table public.usuarios rename column puesto_nuevo to puesto;
comment on column public.usuarios.puesto is 'Puesto del integrante (rol equipo). Decide su bandeja y permisos.';

-- Nuevos integrantes de equipo deben traer puesto; los viejos en null se
-- completan desde Equipo (NOT VALID no revisa filas existentes).
alter table public.usuarios
  add constraint usuarios_equipo_con_puesto
  check (rol <> 'equipo' or puesto is not null) not valid;

-- ===== Perfil profesional =====
alter table public.usuarios
  add column foto_ruta text,
  add column bio text,
  add column especialidades text[] not null default '{}',
  add column capacidad_semanal smallint;

-- ===== Asignacion del equipo por cliente =====
create table public.cliente_equipo (
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  puesto public.puesto_equipo not null,
  created_at timestamptz not null default now(),
  primary key (cliente_id, puesto)
);
create index cliente_equipo_user_idx on public.cliente_equipo (user_id);

create or replace function private.cliente_equipo_puesto_coincide()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.usuarios u
    where u.user_id = new.user_id and u.rol = 'equipo' and u.puesto = new.puesto
  ) then
    raise exception 'El integrante no tiene el puesto %', new.puesto;
  end if;
  return new;
end;
$$;
create trigger cliente_equipo_puesto_coincide
  before insert or update on public.cliente_equipo
  for each row execute function private.cliente_equipo_puesto_coincide();

-- ===== Ficha de cliente =====
alter table public.clientes
  add column fecha_arranque date,
  add column dia_cobro smallint check (dia_cobro between 1 and 31),
  add column paquete text,
  add column cuota jsonb not null default '{}'::jsonb,
  add column kit_marca jsonb not null default '{}'::jsonb,
  add column produccion_requiere_revision boolean not null default true;

create table public.cliente_archivos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo text not null check (tipo in ('logo', 'foto')),
  nombre text not null,
  ruta text not null unique,
  mime text not null,
  tamano_bytes bigint not null,
  subido_por uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index cliente_archivos_cliente_idx on public.cliente_archivos (cliente_id);

-- ===== Entregables: ampliacion de encargos =====
alter table public.encargos
  add column tipo public.tipo_entregable not null default 'otro',
  add column ciclo date,
  add column pieza smallint,
  add column fecha_cliente date,
  add column depende_de uuid references public.encargos (id) on delete set null,
  add column origen text not null default 'manual' check (origen in ('manual', 'ciclo')),
  add column brief text,
  add column enlace_externo text,
  add column sin_responsable boolean not null default false,
  add column rondas_cambios smallint not null default 0,
  add column fuera_de_ronda boolean not null default false;

comment on column public.encargos.fecha_limite is 'Fecha INTERNA (2 dias habiles antes de fecha_cliente en piezas de ciclo).';

create unique index encargos_pieza_de_ciclo_uniq
  on public.encargos (cliente_id, ciclo, tipo, pieza) where origen = 'ciclo';
create index encargos_depende_de_idx on public.encargos (depende_de);
create index encargos_ciclo_idx on public.encargos (ciclo);

-- ===== Vendedor en leads =====
alter table public.leads add column asignado_a uuid references auth.users (id);
create index leads_asignado_a_idx on public.leads (asignado_a);

-- ===== Ajustes de la agencia (solo admin) =====
create table public.ajustes (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

-- ===== Buckets =====
update storage.buckets
set file_size_limit = 52428800, -- 50 MB: maximo del plan gratis
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
      'application/pdf', 'application/zip', 'application/x-zip-compressed',
      'application/zip-compressed', 'video/mp4', 'video/quicktime'
    ]
where id = 'evidencias';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('marca', 'marca', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']),
  ('perfiles', 'perfiles', false, 5242880,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
```

- [ ] **Step 2: Antes de aplicar**, revisar los puestos actuales: `select nombre, puesto from public.usuarios where rol = 'equipo';` y anotar cómo quedarán con el mapeo.
- [ ] **Step 3: Aplicar** (`0025_equipo_esquema`). Esperado: éxito.
- [ ] **Step 4: Verificar**: `select nombre, puesto from public.usuarios where rol='equipo';` y `select id, file_size_limit from storage.buckets;` (evidencias 52428800, marca y perfiles creados).
- [ ] **Step 5: Commit** `feat(db): esquema de puestos, ficha de cliente y entregables`

---

### Task 3: Migración 0026 — permisos, RPCs y triggers

**Skills:** @supabase-multitenant-rls

**Files:** Create `supabase/migrations/0026_equipo_permisos.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0026_equipo_permisos: helpers por puesto, RLS nuevas, ficha para el
-- equipo, congelado ampliado, revision por RPC y desbloqueo de videos.

-- ===== Helpers =====
create or replace function private.puesto_actual()
returns public.puesto_equipo language sql security definer stable set search_path = '' as $$
  select puesto from public.usuarios where user_id = (select auth.uid());
$$;

create or replace function private.cliente_asignado(p_cliente uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.cliente_equipo
    where cliente_id = p_cliente and user_id = (select auth.uid()));
$$;

create or replace function private.es_cliente_agencia(p_cliente uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select coalesce((select es_agencia from public.clientes where id = p_cliente), false);
$$;

create or replace function private.via_rpc()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(current_setting('app.via_rpc', true), '') = 'on';
$$;

create or replace function private.sumar_dias_habiles(p_fecha date, p_dias int)
returns date language plpgsql immutable set search_path = '' as $$
declare
  d date := p_fecha;
  n int := 0;
begin
  while n < p_dias loop
    d := d + 1;
    if extract(isodow from d) < 6 then n := n + 1; end if;
  end loop;
  return d;
end;
$$;

revoke execute on function private.puesto_actual(), private.cliente_asignado(uuid),
  private.es_cliente_agencia(uuid), private.via_rpc(), private.sumar_dias_habiles(date, int)
  from public, anon;
grant execute on function private.puesto_actual(), private.cliente_asignado(uuid),
  private.es_cliente_agencia(uuid), private.via_rpc(), private.sumar_dias_habiles(date, int)
  to authenticated;

-- ===== RLS: cliente_equipo =====
alter table public.cliente_equipo enable row level security;
create policy "admin todo cliente_equipo" on public.cliente_equipo
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "equipo ve el equipo de sus clientes" on public.cliente_equipo
  for select to authenticated
  using ((select private.cliente_asignado(cliente_id)));

-- ===== RLS: cliente_archivos =====
alter table public.cliente_archivos enable row level security;
create policy "admin todo cliente_archivos" on public.cliente_archivos
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "equipo lee archivos de sus clientes" on public.cliente_archivos
  for select to authenticated
  using ((select private.cliente_asignado(cliente_id)));

-- ===== RLS: ajustes (solo admin) =====
alter table public.ajustes enable row level security;
create policy "solo admin ajustes" on public.ajustes
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ===== RLS: encargos (el PM lee todo lo de sus clientes) =====
create policy "pm lee encargos de sus clientes" on public.encargos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'project_manager'
    and (select private.cliente_asignado(cliente_id))
  );

-- ===== RLS: adjuntos (material de la dependencia y PM) =====
create policy "equipo lee adjuntos de su dependencia" on public.encargo_adjuntos
  for select to authenticated
  using (
    exists (
      select 1 from public.encargos mio
      where mio.depende_de = encargo_id
        and mio.asignado_a = (select auth.uid())
    )
  );
create policy "pm lee adjuntos de sus clientes" on public.encargo_adjuntos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'project_manager'
    and exists (
      select 1 from public.encargos e
      where e.id = encargo_id and (select private.cliente_asignado(e.cliente_id))
    )
  );

-- ===== RLS: leads y seguimientos del vendedor (solo los de la agencia) =====
create policy "vendedor lee sus prospectos" on public.leads
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
  );
create policy "vendedor crea prospectos" on public.leads
  for insert to authenticated
  with check (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
    and (select private.cliente_asignado(cliente_id))
  );
create policy "vendedor actualiza sus prospectos" on public.leads
  for update to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
  )
  with check (asignado_a = (select auth.uid()));

create policy "vendedor lee seguimientos de sus prospectos" on public.seguimientos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and exists (select 1 from public.leads l
      where l.id = lead_id and l.asignado_a = (select auth.uid()))
  );
create policy "vendedor agrega seguimientos" on public.seguimientos
  for insert to authenticated
  with check (
    (select private.puesto_actual()) = 'vendedor'
    and autor_id = (select auth.uid())
    and exists (select 1 from public.leads l
      where l.id = lead_id and l.asignado_a = (select auth.uid())
        and l.cliente_id = seguimientos.cliente_id)
  );

-- ===== Ficha para el equipo =====
create or replace function public.ficha_clientes_equipo()
returns table (id uuid, nombre_negocio text, giro text, descripcion_publica text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nombre_negocio, c.giro, c.descripcion_publica
  from public.clientes c
  where (select private.is_admin())
     or ((select private.es_equipo()) and (select private.cliente_asignado(c.id)))
$$;

create or replace function public.ficha_cliente_equipo(p_cliente uuid)
returns table (
  id uuid, nombre_negocio text, giro text, descripcion_publica text,
  fecha_arranque date, paquete text, cuota jsonb, kit_marca jsonb
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nombre_negocio, c.giro, c.descripcion_publica,
         c.fecha_arranque, c.paquete, c.cuota, c.kit_marca
  from public.clientes c
  where c.id = p_cliente
    and ((select private.is_admin())
      or ((select private.es_equipo()) and (select private.cliente_asignado(c.id))))
$$;

revoke execute on function public.ficha_cliente_equipo(uuid) from anon, public;
grant execute on function public.ficha_cliente_equipo(uuid) to authenticated;

-- ===== Congelado ampliado (reemplaza la version de 0017) =====
create or replace function private.encargos_congelar_columnas()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.estado = 'aprobado' then
    raise exception 'Un encargo aprobado ya no se puede modificar';
  end if;

  if (select private.is_admin()) or (select private.via_rpc()) then
    return new;
  end if;

  if new.asignado_a is distinct from old.asignado_a
    or new.cliente_id is distinct from old.cliente_id
    or new.titulo is distinct from old.titulo
    or new.descripcion is distinct from old.descripcion
    or new.prioridad is distinct from old.prioridad
    or new.fecha_limite is distinct from old.fecha_limite
    or new.comentario_revision is distinct from old.comentario_revision
    or new.aprobado_en is distinct from old.aprobado_en
    or new.created_at is distinct from old.created_at
    or new.tipo is distinct from old.tipo
    or new.ciclo is distinct from old.ciclo
    or new.pieza is distinct from old.pieza
    or new.fecha_cliente is distinct from old.fecha_cliente
    or new.depende_de is distinct from old.depende_de
    or new.origen is distinct from old.origen
    or new.brief is distinct from old.brief
    or new.sin_responsable is distinct from old.sin_responsable
    or new.rondas_cambios is distinct from old.rondas_cambios
    or new.fuera_de_ronda is distinct from old.fuera_de_ronda
  then
    raise exception 'Solo puedes cambiar el estado del encargo';
  end if;

  -- El enlace externo solo se edita mientras la pieza esta en sus manos.
  if new.enlace_externo is distinct from old.enlace_externo
     and old.estado not in ('pendiente', 'en_progreso', 'cambios') then
    raise exception 'El enlace ya no se puede cambiar';
  end if;

  new.entregado_en := old.entregado_en;
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    new.entregado_en := now();
  end if;
  return new;
end;
$$;

-- ===== Revision por RPC (admin o PM del cliente, nunca lo propio) =====
create or replace function public.revisar_encargo(
  p_encargo uuid, p_accion text, p_comentario text default null
)
returns public.estado_encargo
language plpgsql security definer set search_path = '' as $$
declare
  e public.encargos%rowtype;
  nuevo public.estado_encargo;
begin
  select * into e from public.encargos where id = p_encargo for update;
  if not found then raise exception 'Encargo no encontrado'; end if;

  if not (
    (select private.is_admin())
    or ((select private.puesto_actual()) = 'project_manager'
        and (select private.cliente_asignado(e.cliente_id))
        and e.asignado_a <> (select auth.uid()))
  ) then
    raise exception 'No puedes revisar este encargo';
  end if;

  if e.estado <> 'entregado' then
    raise exception 'Solo se revisa lo entregado';
  end if;

  perform set_config('app.via_rpc', 'on', true);

  if p_accion = 'aprobar' then
    nuevo := 'aprobado';
    update public.encargos
      set estado = nuevo, aprobado_en = now(), comentario_revision = p_comentario
      where id = p_encargo;
  elsif p_accion = 'cambios' then
    if coalesce(trim(p_comentario), '') = '' then
      raise exception 'Escribe qué hay que cambiar';
    end if;
    nuevo := 'cambios';
    update public.encargos
      set estado = nuevo,
          comentario_revision = p_comentario,
          rondas_cambios = e.rondas_cambios + 1,
          fuera_de_ronda = (e.rondas_cambios >= 1)
      where id = p_encargo;
  else
    raise exception 'Accion invalida';
  end if;

  return nuevo;
end;
$$;

revoke execute on function public.revisar_encargo(uuid, text, text) from anon, public;
grant execute on function public.revisar_encargo(uuid, text, text) to authenticated;

-- ===== Desbloqueo: produccion aprobada -> videos a pendiente =====
create or replace function private.encargos_desbloquear()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requiere boolean;
  arranque date;
begin
  if new.tipo <> 'produccion' then return null; end if;

  select produccion_requiere_revision, fecha_arranque into requiere, arranque
  from public.clientes where id = new.cliente_id;

  perform set_config('app.via_rpc', 'on', true);

  -- Sin revision: se aprueba sola al entregarse (vuelve a disparar el trigger).
  if new.estado = 'entregado' and old.estado is distinct from 'entregado'
     and requiere is false then
    update public.encargos set estado = 'aprobado', aprobado_en = now() where id = new.id;
    return null;
  end if;

  if new.estado = 'aprobado' and old.estado is distinct from 'aprobado' then
    update public.encargos d
      set estado = 'pendiente',
          fecha_limite = case
            when arranque is not null and arranque >= current_date - 30
              then private.sumar_dias_habiles(current_date, 2)
            else d.fecha_limite
          end
      where d.depende_de = new.id and d.estado = 'esperando';
  end if;
  return null;
end;
$$;

create trigger encargos_desbloquear
  after update of estado on public.encargos
  for each row execute function private.encargos_desbloquear();
```

- [ ] **Step 2: Aplicar** (`0026_equipo_permisos`). Esperado: éxito. Correr `get_advisors` (security) y revisar que no haya errores nuevos.
- [ ] **Step 3: Commit** `feat(db): permisos por puesto, revisión por RPC y desbloqueo de videos`

---

### Task 4: Fechas hábiles y ciclos (puro)

**Skills:** @testing-tdd, @typescript-best-practices

**Files:** Create `src/lib/entregables/fechas.ts`, Test `src/lib/entregables/__tests__/fechas.test.ts`

- [ ] **Step 1: Prueba que falla**

```ts
import { describe, expect, it } from 'vitest'

import { fechaInterna, restarDiasHabiles, siguientesCiclos, sumarDiasHabiles } from '../fechas'

describe('días hábiles', () => {
  it('resta saltando fines de semana', () => {
    expect(restarDiasHabiles('2026-12-01', 2)).toBe('2026-11-27') // mar → vie
    expect(restarDiasHabiles('2026-11-16', 2)).toBe('2026-11-12') // lun → jue
  })
  it('suma saltando fines de semana', () => {
    expect(sumarDiasHabiles('2026-11-13', 2)).toBe('2026-11-17') // vie → mar
  })
  it('fecha interna = 2 días hábiles antes', () => {
    expect(fechaInterna('2026-11-15')).toBe('2026-11-12') // dom → jue
  })
})

describe('siguientesCiclos', () => {
  it('devuelve los próximos días 1 y 15 desde hoy (incluido)', () => {
    expect(siguientesCiclos('2026-11-09', 3)).toEqual(['2026-11-15', '2026-12-01', '2026-12-15'])
    expect(siguientesCiclos('2026-11-15', 2)).toEqual(['2026-11-15', '2026-12-01'])
    expect(siguientesCiclos('2026-12-20', 2)).toEqual(['2027-01-01', '2027-01-15'])
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/entregables/__tests__/fechas.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implementación**

```ts
/**
 * Fechas de entregables (spec 2026-11-09 §Generador). Trabaja con cadenas
 * YYYY-MM-DD ancladas a mediodía UTC para no correrse por zona horaria.
 * Días hábiles = lunes a viernes, sin feriados por ahora.
 */
const DIA = 86_400_000

function aFecha(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d, 12))
}
function aIso(f: Date): string {
  return f.toISOString().slice(0, 10)
}
function esHabil(f: Date): boolean {
  const d = f.getUTCDay()
  return d !== 0 && d !== 6
}

function moverDiasHabiles(iso: string, dias: number, signo: 1 | -1): string {
  let f = aFecha(iso)
  let n = 0
  while (n < dias) {
    f = new Date(f.getTime() + signo * DIA)
    if (esHabil(f)) n++
  }
  return aIso(f)
}

export const sumarDiasHabiles = (iso: string, dias: number) => moverDiasHabiles(iso, dias, 1)
export const restarDiasHabiles = (iso: string, dias: number) => moverDiasHabiles(iso, dias, -1)

/** Fecha interna del equipo: 2 días hábiles antes de la fecha al cliente. */
export const fechaInterna = (fechaCliente: string) => restarDiasHabiles(fechaCliente, 2)

/** Días hábiles desde `desde` hasta `hasta` (negativo si `hasta` ya pasó). */
export function diasHabilesEntre(desde: string, hasta: string): number {
  const a = aFecha(desde)
  const b = aFecha(hasta)
  const signo = b >= a ? 1 : -1
  let f = a
  let n = 0
  while (aIso(f) !== aIso(b)) {
    f = new Date(f.getTime() + signo * DIA)
    if (esHabil(f)) n += signo
  }
  return n
}

/** Próximos `cuantos` ciclos (días 1 y 15) a partir de `hoy`, incluido. */
export function siguientesCiclos(hoy: string, cuantos = 2): string[] {
  const [a, m, d] = hoy.split('-').map(Number)
  const salida: string[] = []
  let anio = a
  let mes = m
  let dia = d <= 1 ? 1 : d <= 15 ? 15 : 0
  while (salida.length < cuantos) {
    if (dia === 0) {
      mes++
      if (mes > 12) { mes = 1; anio++ }
      dia = 1
    }
    salida.push(`${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)
    dia = dia === 1 ? 15 : 0
  }
  return salida
}
```

- [ ] **Step 4:** correr la prueba → PASS.
- [ ] **Step 5: Commit** `feat(entregables): días hábiles y ciclos 1/15`

---

### Task 5: Piezas del ciclo y semáforo (puro)

**Skills:** @testing-tdd

**Files:** Create `src/lib/equipo/puestos.ts`, `src/lib/entregables/ciclo.ts`, `src/lib/entregables/semaforo.ts`; Tests `src/lib/entregables/__tests__/ciclo.test.ts`, `semaforo.test.ts`

- [ ] **Step 1: Catálogo de puestos** (`src/lib/equipo/puestos.ts`)

```ts
export const PUESTOS = [
  'project_manager', 'media_buyer', 'filmmaker', 'editor', 'disenador', 'vendedor',
] as const
export type Puesto = (typeof PUESTOS)[number]

export const TIPOS_ENTREGABLE = ['imagen', 'carrusel', 'video', 'produccion', 'guion'] as const
export type TipoEntregable = (typeof TIPOS_ENTREGABLE)[number] | 'otro'

export const ETIQUETA_PUESTO: Record<Puesto, string> = {
  project_manager: 'Project Manager',
  media_buyer: 'Media buyer',
  filmmaker: 'Filmmaker',
  editor: 'Editor',
  disenador: 'Diseñador gráfico',
  vendedor: 'Vendedor',
}

export const ETIQUETA_TIPO: Record<TipoEntregable, string> = {
  imagen: 'Imagen', carrusel: 'Carrusel', video: 'Video',
  produccion: 'Producción', guion: 'Guion', otro: 'Encargo',
}

/** Quién atiende cada tipo de pieza de ciclo. */
export const PUESTO_POR_TIPO: Record<Exclude<TipoEntregable, 'otro'>, Puesto> = {
  imagen: 'disenador', carrusel: 'disenador', video: 'editor',
  produccion: 'filmmaker', guion: 'project_manager',
}

/** Verbo del botón principal en la bandeja, según el tipo de pieza. */
export const ACCION_POR_TIPO: Record<TipoEntregable, string> = {
  imagen: 'Entregar post', carrusel: 'Entregar carrusel', video: 'Entregar video',
  produccion: 'Subir material', guion: 'Entregar guion', otro: 'Entregar',
}

export function esPuesto(v: unknown): v is Puesto {
  return typeof v === 'string' && (PUESTOS as readonly string[]).includes(v)
}
```

- [ ] **Step 2: Prueba que falla** (`ciclo.test.ts`)

```ts
import { describe, expect, it } from 'vitest'

import { piezasDelCiclo } from '../ciclo'

const equipo = { disenador: 'u-dis', editor: 'u-edi', filmmaker: 'u-fil', project_manager: 'u-pm' }

describe('piezasDelCiclo', () => {
  it('crea una pieza por unidad de cuota con su responsable y fechas', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: 2, video: 1, produccion: 1 },
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p.map((x) => `${x.tipo}#${x.pieza}`)).toEqual([
      'produccion#1', 'imagen#1', 'imagen#2', 'video#1',
    ])
    const img = p.find((x) => x.tipo === 'imagen')!
    expect(img.asignadoA).toBe('u-dis')
    expect(img.fechaCliente).toBe('2026-12-01')
    expect(img.fechaLimite).toBe('2026-11-27')
    expect(img.estadoInicial).toBe('pendiente')
  })

  it('los videos esperan a la producción del ciclo si existe', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { video: 2, produccion: 1 },
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    for (const v of p.filter((x) => x.tipo === 'video')) {
      expect(v.estadoInicial).toBe('esperando')
      expect(v.dependeDeProduccion).toBe(true)
    }
  })

  it('sin producción en la cuota, el video arranca pendiente', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { video: 1 }, equipo,
      responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p[0].estadoInicial).toBe('pendiente')
    expect(p[0].dependeDeProduccion).toBe(false)
  })

  it('sin responsable del puesto, se asigna al de por defecto y se marca', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { carrusel: 1 }, equipo: {},
      responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p[0].asignadoA).toBe('u-tadeo')
    expect(p[0].sinResponsable).toBe(true)
  })

  it('cliente nuevo: prioridad alta', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: 1 }, equipo,
      responsablePorDefecto: 'u-tadeo', esNuevo: true,
    })
    expect(p[0].prioridad).toBe('alta')
  })

  it('ignora valores inválidos de cuota', () => {
    const p = piezasDelCiclo({
      ciclo: '2026-12-01', cuota: { imagen: -1, video: 1.5, otro: 3 } as never,
      equipo, responsablePorDefecto: 'u-tadeo', esNuevo: false,
    })
    expect(p).toEqual([])
  })
})
```

- [ ] **Step 3:** correr → FAIL.
- [ ] **Step 4: Implementación** (`ciclo.ts`)

```ts
import { ETIQUETA_TIPO, PUESTO_POR_TIPO, type Puesto } from '@/lib/equipo/puestos'

import { fechaInterna } from './fechas'

export type TipoCiclo = keyof typeof PUESTO_POR_TIPO
export type Cuota = Partial<Record<TipoCiclo, number>>

/** Orden de creación: la producción primero para que los videos la referencien. */
const ORDEN: TipoCiclo[] = ['produccion', 'guion', 'imagen', 'carrusel', 'video']

export type PiezaCiclo = {
  tipo: TipoCiclo
  pieza: number
  titulo: string
  puesto: Puesto
  asignadoA: string
  sinResponsable: boolean
  fechaCliente: string
  fechaLimite: string
  prioridad: 'alta' | 'media'
  estadoInicial: 'pendiente' | 'esperando'
  dependeDeProduccion: boolean
}

export function cantidadValida(v: unknown): number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 50 ? v : 0
}

export function piezasDelCiclo(args: {
  ciclo: string
  cuota: Cuota
  equipo: Partial<Record<Puesto, string>>
  responsablePorDefecto: string
  esNuevo: boolean
}): PiezaCiclo[] {
  const { ciclo, cuota, equipo, responsablePorDefecto, esNuevo } = args
  const hayProduccion = cantidadValida(cuota.produccion) > 0
  const salida: PiezaCiclo[] = []

  for (const tipo of ORDEN) {
    const n = cantidadValida(cuota[tipo])
    const puesto = PUESTO_POR_TIPO[tipo]
    const responsable = equipo[puesto]
    for (let i = 1; i <= n; i++) {
      const esperando = tipo === 'video' && hayProduccion
      salida.push({
        tipo,
        pieza: i,
        titulo: `${ETIQUETA_TIPO[tipo]} ${i}`,
        puesto,
        asignadoA: responsable ?? responsablePorDefecto,
        sinResponsable: !responsable,
        fechaCliente: ciclo,
        fechaLimite: fechaInterna(ciclo),
        prioridad: esNuevo ? 'alta' : 'media',
        estadoInicial: esperando ? 'esperando' : 'pendiente',
        dependeDeProduccion: esperando,
      })
    }
  }
  return salida
}
```

- [ ] **Step 5:** correr → PASS.
- [ ] **Step 6: Prueba que falla** (`semaforo.test.ts`)

```ts
import { describe, expect, it } from 'vitest'

import { semaforo } from '../semaforo'

const HOY = '2026-11-10' // martes

describe('semaforo', () => {
  it('gris si espera a otro', () => {
    expect(semaforo({ estado: 'esperando', fechaLimite: '2026-11-01', hoy: HOY })).toBe('gris')
  })
  it('verde si ya se entregó o aprobó aunque la fecha pasara', () => {
    expect(semaforo({ estado: 'entregado', fechaLimite: '2026-11-01', hoy: HOY })).toBe('verde')
    expect(semaforo({ estado: 'aprobado', fechaLimite: '2026-11-01', hoy: HOY })).toBe('verde')
  })
  it('rojo si la fecha interna ya pasó', () => {
    expect(semaforo({ estado: 'en_progreso', fechaLimite: '2026-11-09', hoy: HOY })).toBe('rojo')
  })
  it('amarillo si vence hoy o el siguiente día hábil', () => {
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-10', hoy: HOY })).toBe('amarillo')
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-11', hoy: HOY })).toBe('amarillo')
  })
  it('verde con margen o sin fecha', () => {
    expect(semaforo({ estado: 'pendiente', fechaLimite: '2026-11-13', hoy: HOY })).toBe('verde')
    expect(semaforo({ estado: 'pendiente', fechaLimite: null, hoy: HOY })).toBe('verde')
  })
  it('cambios cuenta como trabajo abierto', () => {
    expect(semaforo({ estado: 'cambios', fechaLimite: '2026-11-09', hoy: HOY })).toBe('rojo')
  })
})
```

- [ ] **Step 7: Implementación** (`semaforo.ts`)

```ts
import { diasHabilesEntre } from './fechas'

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'

export function semaforo(args: {
  estado: string
  fechaLimite: string | null
  hoy: string
}): Semaforo {
  const { estado, fechaLimite, hoy } = args
  if (estado === 'esperando') return 'gris'
  if (estado === 'entregado' || estado === 'aprobado') return 'verde'
  if (!fechaLimite) return 'verde'
  if (fechaLimite < hoy) return 'rojo'
  return diasHabilesEntre(hoy, fechaLimite) <= 1 ? 'amarillo' : 'verde'
}
```

- [ ] **Step 8:** `npx vitest run src/lib/entregables` → PASS.
- [ ] **Step 9:** agregar `'esperando'` al inicio de `ESTADOS_ENCARGO` en `src/lib/equipo/transiciones.ts` (sin transiciones manuales: lo mueve la base). Correr `npx vitest run src/lib/equipo` y `npx tsc --noEmit` → PASS; arreglar los `Record<EstadoEncargo, …>` que el compilador marque (etiqueta «Esperando», color gris).
- [ ] **Step 10: Commit** `feat(entregables): piezas por ciclo, semáforo y catálogo de puestos`

---

### Task 6: Validación de ficha (puro)

**Skills:** @testing-tdd

**Files:** Create `src/lib/clientes/ficha.ts`, Test `src/lib/clientes/__tests__/ficha.test.ts`

- [ ] **Step 1: Prueba que falla**

```ts
import { describe, expect, it } from 'vitest'

import { leerCuota, leerKit } from '../ficha'

describe('leerCuota', () => {
  it('toma enteros 0–50 de cada tipo y omite los vacíos', () => {
    const fd = new FormData()
    fd.set('cuota_imagen', '6'); fd.set('cuota_video', '2'); fd.set('cuota_carrusel', '')
    expect(leerCuota(fd)).toEqual({ ok: true, cuota: { imagen: 6, video: 2 } })
  })
  it('rechaza negativos, decimales y más de 50', () => {
    const fd = new FormData()
    fd.set('cuota_imagen', '-1'); fd.set('cuota_video', '1.5'); fd.set('cuota_guion', '99')
    const r = leerCuota(fd)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['cuota_guion', 'cuota_imagen', 'cuota_video'])
  })
})

describe('leerKit', () => {
  it('separa colores hex válidos y tipografías por coma', () => {
    const fd = new FormData()
    fd.set('colores', '#921817, #FFF, rojo'); fd.set('tipografias', 'Poppins, DM Serif')
    fd.set('tono', 'Cercano'); fd.set('notas_marca', '')
    expect(leerKit(fd)).toEqual({
      colores: ['#921817', '#FFF'], tipografias: ['Poppins', 'DM Serif'], tono: 'Cercano', notas: null,
    })
  })
})
```

- [ ] **Step 2:** correr → FAIL.
- [ ] **Step 3: Implementación**

```ts
import { cantidadValida, type Cuota } from '@/lib/entregables/ciclo'
import { TIPOS_ENTREGABLE } from '@/lib/equipo/puestos'

export type KitMarca = {
  colores: string[]
  tipografias: string[]
  tono: string | null
  notas: string | null
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function leerCuota(
  fd: FormData
): { ok: true; cuota: Cuota } | { ok: false; errores: Record<string, string> } {
  const cuota: Cuota = {}
  const errores: Record<string, string> = {}
  for (const tipo of TIPOS_ENTREGABLE) {
    const crudo = String(fd.get(`cuota_${tipo}`) ?? '').trim()
    if (crudo === '' || crudo === '0') continue
    const n = Number(crudo)
    if (!cantidadValida(n)) {
      errores[`cuota_${tipo}`] = 'Un número entero entre 0 y 50'
      continue
    }
    cuota[tipo] = n
  }
  return Object.keys(errores).length ? { ok: false, errores } : { ok: true, cuota }
}

function lista(v: FormDataEntryValue | null): string[] {
  return String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}
function texto(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

export function leerKit(fd: FormData): KitMarca {
  return {
    colores: lista(fd.get('colores')).filter((c) => HEX.test(c)),
    tipografias: lista(fd.get('tipografias')),
    tono: texto(fd.get('tono')),
    notas: texto(fd.get('notas_marca')),
  }
}
```

- [ ] **Step 4:** correr → PASS.
- [ ] **Step 5: Commit** `feat(clientes): validación de cuota y kit de marca`

---

### Task 7: Acciones de ficha y asignación

**Skills:** @nextjs16-supabase-auth, @supabase-multitenant-rls

**Files:** Create `src/app/(app)/agencia/clientes/ficha-actions.ts`

- [ ] **Step 1: Escribir las acciones** (patrón de `clientes/actions.ts`: `'use server'`, `esAdmin()`, `ResultadoAccion`, `revalidatePath`)

```ts
'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin, esUuid, NO_AUTORIZADO, type ResultadoAccion } from '@/lib/acciones'
import { leerCuota, leerKit } from '@/lib/clientes/ficha'
import { esPuesto, PUESTOS } from '@/lib/equipo/puestos'
import { createClient } from '@/lib/supabase/server'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function revalidarFicha(id: string) {
  revalidatePath(`/agencia/clientes/${id}`)
  revalidatePath('/agencia/clientes')
}

/** Datos de operación: arranque, cobro, paquete, cuota y revisión de producción. */
export async function guardarOperacion(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const valores = Object.fromEntries(
    [...fd.entries()].filter(([, v]) => typeof v === 'string')
  ) as Record<string, string>
  const errores: Record<string, string> = {}

  const arranque = (valores.fecha_arranque ?? '').trim()
  if (arranque && !FECHA.test(arranque)) errores.fecha_arranque = 'Fecha inválida'
  const cobroTxt = (valores.dia_cobro ?? '').trim()
  const cobro = cobroTxt === '' ? null : Number(cobroTxt)
  if (cobro !== null && !(Number.isInteger(cobro) && cobro >= 1 && cobro <= 31)) {
    errores.dia_cobro = 'Un día del 1 al 31'
  }
  const cuota = leerCuota(fd)
  if (!cuota.ok) Object.assign(errores, cuota.errores)
  if (Object.keys(errores).length || !cuota.ok) return { ok: false, errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update({
    fecha_arranque: arranque || null,
    dia_cobro: cobro,
    paquete: (valores.paquete ?? '').trim() || null,
    cuota: cuota.cuota,
    produccion_requiere_revision: fd.get('produccion_requiere_revision') === 'on',
  }).eq('id', clienteId)
  if (error) {
    console.error('guardarOperacion:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar' }, valores }
  }
  revalidarFicha(clienteId)
  return { ok: true }
}

export async function guardarKit(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const supabase = await createClient()
  const { error } = await supabase.from('clientes')
    .update({ kit_marca: leerKit(fd) }).eq('id', clienteId)
  if (error) {
    console.error('guardarKit:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar' }, valores: {} }
  }
  revalidarFicha(clienteId)
  return { ok: true }
}

/** Un responsable por puesto. Campo vacío = quitar al responsable de ese puesto. */
export async function guardarEquipoCliente(
  clienteId: string, _prev: ResultadoAccion, fd: FormData
): Promise<ResultadoAccion> {
  if (!(await esAdmin()) || !esUuid(clienteId)) return NO_AUTORIZADO
  const supabase = await createClient()
  const errores: Record<string, string> = {}

  for (const puesto of PUESTOS) {
    if (!esPuesto(puesto)) continue
    const uid = String(fd.get(`equipo_${puesto}`) ?? '').trim()
    if (uid === '') {
      await supabase.from('cliente_equipo').delete()
        .eq('cliente_id', clienteId).eq('puesto', puesto)
      continue
    }
    if (!esUuid(uid)) { errores[`equipo_${puesto}`] = 'Integrante inválido'; continue }
    const { error } = await supabase.from('cliente_equipo').upsert(
      { cliente_id: clienteId, user_id: uid, puesto },
      { onConflict: 'cliente_id,puesto' }
    )
    if (error) errores[`equipo_${puesto}`] = 'Ese integrante no tiene este puesto'
  }
  if (Object.keys(errores).length) return { ok: false, errores, valores: {} }
  revalidarFicha(clienteId)
  revalidatePath('/equipo', 'layout')
  return { ok: true }
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → sin errores.
- [ ] **Step 3: Commit** `feat(clientes): acciones de ficha, kit y equipo asignado`

---

### Task 8: UI de la ficha (Datos · Operación · Kit · Equipo)

**Skills:** @mobile-first-marca (memoria), @ui-typography

**Files:**
- Modify: `src/app/(app)/agencia/clientes/[id]/page.tsx` (consulta + pestañas)
- Create: `src/components/clientes/ficha-operacion.tsx`, `ficha-kit.tsx`, `ficha-equipo.tsx`

- [ ] **Step 1:** En `page.tsx`, ampliar el `select` de `clientes` con `fecha_arranque, dia_cobro, paquete, cuota, kit_marca, produccion_requiere_revision`. Consultar también `cliente_equipo (puesto, user_id)` del cliente y la lista `usuarios` con `rol = 'equipo'` (`user_id, nombre, puesto`).
- [ ] **Step 2:** `ficha-operacion.tsx` (client component con `useActionState(guardarOperacion.bind(null, id), null)`): fecha de arranque (`type=date`), día de cobro (`inputMode=numeric`), paquete (texto), cinco campos de cuota por ciclo (Imágenes, Carruseles, Videos, Producciones, Guiones; `inputMode=numeric`, `min=0 max=50`), switch «La producción pasa por revisión». Botón Guardar; `toast` de sonner al `ok`. Errores con `aria-describedby` como en `cliente-form.tsx`.
- [ ] **Step 3:** `ficha-kit.tsx`: colores (texto con comas, más fila de muestras de color), tipografías, tono, notas → `guardarKit`.
- [ ] **Step 4:** `ficha-equipo.tsx`: un `Select` (Base UI con `items`) por puesto, cuyas opciones son solo los integrantes con ese puesto, más la opción «Sin asignar» → `guardarEquipoCliente`.
- [ ] **Step 5:** Integrar como pestañas en `page.tsx` siguiendo las pestañas existentes del detalle (Leads/Campañas). A 390 px las pestañas se desplazan horizontalmente y los objetivos táctiles miden 44 px o más.
- [ ] **Step 6:** `npm run lint && npx tsc --noEmit` → limpio. Abrir `npm run dev` y revisar a 390 px.
- [ ] **Step 7: Commit** `feat(clientes): ficha con operación, kit de marca y equipo asignado`

---

### Task 9: Alta del equipo con puesto y perfil

**Files:** Modify `src/app/(app)/agencia/equipo/actions.ts` (`crearTrabajador` y edición), `src/components/equipo/formularios-equipo.tsx`, `src/app/(app)/agencia/equipo/page.tsx`

- [ ] **Step 1:** En `crearTrabajador`, cambiar el texto libre `puesto` por `esPuesto(puesto)`, con el error «Elige un puesto». Insertar `puesto` (enum) y, si vienen, `bio` y `especialidades` (lista separada por comas).
- [ ] **Step 2:** En el formulario, cambiar el input de puesto por un `Select` con `ETIQUETA_PUESTO`, y agregar Bio (`textarea`, 280 caracteres como máximo) y Especialidades.
- [ ] **Step 3:** Acción nueva `editarPerfilTrabajador(userId, fd)` (solo admin) para puesto, bio y especialidades. Un cambio de puesto borra las filas de `cliente_equipo` de ese usuario con el puesto anterior (con admin client) y lo dice en el toast.
- [ ] **Step 4:** En `page.tsx`, mostrar `ETIQUETA_PUESTO[puesto]` y una insignia «Falta puesto» cuando es null.
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint` → limpio.
- [ ] **Step 6: Commit** `feat(equipo): alta y edición con puesto y perfil profesional`

---

### Task 10: Limpieza de clientes (respaldo + borrado)

**Files:** Create `scripts/limpiar-clientes.ts`

- [ ] **Step 1: Script** (lee `.env.local` con dotenv y usa la secret key; por defecto en seco)

```ts
/**
 * Respaldo + borrado de los clientes actuales (spec 2026-11-09 §Limpieza).
 * Uso: npx tsx scripts/limpiar-clientes.ts            (en seco: respalda y cuenta)
 *      npx tsx scripts/limpiar-clientes.ts --confirmar (borra)
 * Conserva el cliente es_agencia. Correr desde la raíz del repo.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
)
const confirmar = process.argv.includes('--confirmar')

const ORDEN = [
  'encargo_adjuntos', 'encargos', 'seguimientos', 'leads', 'campania_metricas_diarias',
  'campania_finanzas', 'campanias', 'mensajes', 'notificaciones', 'reportes_semanales',
] as const

async function main() {
  const { data: clientes, error } = await supabase.from('clientes').select('*')
  if (error) throw error
  const borrar = clientes!.filter((c) => !c.es_agencia).map((c) => c.id as string)
  const respaldo: Record<string, unknown> = { clientes }
  for (const t of [...ORDEN, 'usuarios'] as const) {
    const { data } = await supabase.from(t).select('*')
    respaldo[t] = data
  }
  const dir = join(homedir(), 'OneDrive', 'Documents', 'Respaldos Top Digital')
  mkdirSync(dir, { recursive: true })
  const archivo = join(dir, `clientes-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.json`)
  writeFileSync(archivo, JSON.stringify(respaldo, null, 2))
  console.log(`Respaldo: ${archivo}`)
  console.log(`Clientes a borrar (${borrar.length}):`, clientes!.filter((c) => !c.es_agencia).map((c) => c.nombre_negocio))
  if (!confirmar) { console.log('En seco. Repite con --confirmar para borrar.'); return }

  const { data: encargos } = await supabase.from('encargos').select('id').in('cliente_id', borrar)
  const idsEncargos = (encargos ?? []).map((e) => e.id)
  if (idsEncargos.length) await supabase.from('encargo_adjuntos').delete().in('encargo_id', idsEncargos)
  for (const t of ORDEN.slice(1)) {
    const { error: e } = await supabase.from(t).delete().in('cliente_id', borrar)
    if (e) throw new Error(`${t}: ${e.message}`)
  }
  const { data: usuariosCliente } = await supabase.from('usuarios')
    .select('user_id').eq('rol', 'cliente').in('cliente_id', borrar)
  for (const u of usuariosCliente ?? []) await supabase.auth.admin.deleteUser(u.user_id)
  const { error: eCli } = await supabase.from('clientes').delete().in('id', borrar)
  if (eCli) throw eCli
  console.log('Listo.')
}
main().catch((e) => { console.error(e); process.exit(1) })
```

Antes de correrlo, confirmar en `0001`–`0023` que cada tabla de `ORDEN` tiene columna `cliente_id`. `campania_metricas_diarias` y `campania_finanzas` sí la tienen; si alguna no, borrar por `campania_id`.

- [ ] **Step 2:** Correr en seco y mostrarle al usuario la lista de clientes que se borrarían.
- [ ] **Step 3: PEDIR CONFIRMACIÓN EXPLÍCITA** al usuario y, solo con su sí, correr con `--confirmar`.
- [ ] **Step 4:** Guardar en `ajustes` el responsable por defecto: `insert into public.ajustes (clave, valor) values ('responsable_por_defecto', to_jsonb('<uid de Tadeo>'::text)) on conflict (clave) do update set valor = excluded.valor;`, con el uid sacado de `auth.users` por el correo de Tadeo.
- [ ] **Step 5: Commit** `chore(scripts): respaldo y limpieza de clientes`

---

### Task 11: Punto de control — simulación de RLS por puesto

**Skills:** @supabase-multitenant-rls

**Files:** Create `scripts/simular-rls-puestos.sql`

- [ ] **Step 1:** Escribir un script SQL que, dentro de `begin … rollback`, haga lo siguiente:
  1. Crear con uids ficticios dos clientes de prueba (A y B), un editor E, un PM P y un vendedor V (filas en `auth.users` mínimas y en `usuarios`).
  2. Asignar E y P solo al cliente A.
  3. Crear una producción de A asignada a otro uid ficticio F (filmmaker) y un video de A asignado a E, con `depende_de` apuntando a la producción y estado `esperando`.
  4. Simular cada usuario con `set local role authenticated; set local request.jwt.claims = '{"sub":"<uid>","user_role":"equipo"}';` y comprobar con `select count(*)`:
     - E ve 1 ficha (`ficha_clientes_equipo`) y 0 de B.
     - E no puede leer `clientes` directamente: 0 filas (solo admin y cliente propio).
     - E no ve `campania_finanzas`.
     - P ve todos los encargos de A y ninguno de B.
     - V no ve leads de A ni de B y sí los de la agencia que tiene asignados.
     - E no puede cambiar `depende_de` de su video: error esperado.
     - `revisar_encargo` llamado por E sobre la producción: error esperado.
     - Como admin, aprobar la producción vía `revisar_encargo` deja el video de E en `pendiente`.
- [ ] **Step 2:** Correr con `execute_sql` del MCP. Todas las aserciones como esperado. Si alguna falla, arreglarla con una migración `0027_*` antes de seguir.
- [ ] **Step 3:** Correr `npx vitest run` (toda la suite) y `npx tsc --noEmit`: PASS.
- [ ] **Step 4: Commit** `test(db): simulación de permisos por puesto` y **push** a `fase-1`.
- [ ] **Step 5:** Reportar al usuario y pasar al Plan 2 (pantallas del equipo, cadena, tablero, tick, revisión, prospectos).
