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
  end)::public.puesto_equipo
where puesto is not null;

-- La columna de texto se conserva como referencia (no se borra datos).
alter table public.usuarios rename column puesto to puesto_texto;
comment on column public.usuarios.puesto_texto is 'OBSOLETA: puesto en texto libre previo a 0025. No usar.';
alter table public.usuarios rename column puesto_nuevo to puesto;
comment on column public.usuarios.puesto is 'Puesto del integrante (rol equipo). Decide su bandeja y permisos.';

-- Nuevos integrantes de equipo deben traer puesto. Trigger solo en INSERT
-- (un CHECK NOT VALID se sigue evaluando en cada UPDATE y romperia las
-- filas viejas sin puesto, p. ej. al marcar intro_vista).
create or replace function private.usuarios_equipo_con_puesto()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.rol = 'equipo' and new.puesto is null then
    raise exception 'Un integrante del equipo necesita puesto';
  end if;
  return new;
end;
$$;
create trigger usuarios_equipo_con_puesto
  before insert on public.usuarios
  for each row execute function private.usuarios_equipo_con_puesto();

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
alter table public.cliente_equipo enable row level security; -- politicas en 0026

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
alter table public.cliente_archivos enable row level security; -- politicas en 0026

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
-- 0002 congelo leads por columnas; el admin (cliente normal) necesita asignar.
grant update (asignado_a) on public.leads to authenticated;

-- ===== Ajustes de la agencia (solo admin) =====
create table public.ajustes (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.ajustes enable row level security; -- politicas en 0026

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
