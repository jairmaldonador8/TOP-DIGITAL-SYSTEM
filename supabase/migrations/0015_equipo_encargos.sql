-- 0015_equipo_encargos: rol de equipo, encargos con ciclo de revision y
-- defensas RLS (spec 2026-07-23-equipo-encargos-design).

-- ===== Rol nuevo =====
-- Solo se AGREGA el valor; nada en esta migracion lo consume (seguro en
-- una transaccion, mismo patron que 0008).
alter type public.rol_usuario add value if not exists 'equipo';

alter table public.usuarios add column puesto text;
comment on column public.usuarios.puesto is
  'Puesto del integrante de equipo (Diseño gráfico, Editor de video...); null para admin/cliente';

-- ===== Ficha breve del cliente para el equipo =====
alter table public.clientes
  add column giro text,
  add column descripcion_publica text;
comment on column public.clientes.descripcion_publica is
  'Descripcion visible para el equipo via clientes_para_equipo; NO poner datos sensibles';

-- ===== Encargos =====
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

-- ===== Helper: es_equipo lee el claim como TEXTO (no el enum: el valor
-- 'equipo' se agrego arriba en esta misma transaccion) =====
create or replace function private.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() ->> 'user_role') = 'equipo',
    false
  )
$$;

revoke execute on function private.es_equipo() from anon, public;
grant execute on function private.es_equipo() to authenticated;

-- ===== RLS de encargos =====
alter table public.encargos enable row level security;

create policy "admin todo encargos" on public.encargos
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "equipo lee sus encargos" on public.encargos
  for select to authenticated
  using (asignado_a = (select auth.uid()));

-- El WITH CHECK impide que un trabajador se auto-apruebe o forje 'cambios'
-- aunque llame PostgREST directo. (Residual aceptado: podria brincar
-- pendiente->entregado; inocuo, la action impone la maquina completa.)
create policy "equipo avanza sus encargos" on public.encargos
  for update to authenticated
  using (asignado_a = (select auth.uid()))
  with check (
    asignado_a = (select auth.uid())
    and estado in ('en_progreso', 'entregado')
  );

-- ===== Trigger: para no-admin, solo estado y entregado_en son mutables
-- (cierra el desvio de reasignar cliente_id para espiar la vista) =====
create or replace function private.encargos_congelar_columnas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select private.is_admin()) then
    return new;
  end if;
  if new.asignado_a  is distinct from old.asignado_a
    or new.cliente_id is distinct from old.cliente_id
    or new.titulo is distinct from old.titulo
    or new.descripcion is distinct from old.descripcion
    or new.prioridad is distinct from old.prioridad
    or new.fecha_limite is distinct from old.fecha_limite
    or new.comentario_revision is distinct from old.comentario_revision
    or new.aprobado_en is distinct from old.aprobado_en
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Solo puedes cambiar el estado del encargo';
  end if;
  return new;
end;
$$;

create trigger encargos_congelar_columnas
  before update on public.encargos
  for each row execute function private.encargos_congelar_columnas();

-- ===== Vista de clientes para el equipo (derechos del owner; expone SOLO
-- columnas seguras y SOLO clientes donde el trabajador tiene encargos) =====
create view public.clientes_para_equipo as
select c.id, c.nombre_negocio, c.giro, c.descripcion_publica
from public.clientes c
where
  (select private.is_admin())
  or (
    (select private.es_equipo())
    and exists (
      select 1 from public.encargos e
      where e.cliente_id = c.id
        and e.asignado_a = (select auth.uid())
    )
  );

revoke all on public.clientes_para_equipo from anon, public;
grant select on public.clientes_para_equipo to authenticated;
