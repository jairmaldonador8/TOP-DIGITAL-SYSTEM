-- 0023_sitio_publico: prospectos y suscriptores que llegan del sitio web
-- de la agencia (topdigital.company).
--
-- Ojo: NO se reutiliza public.leads porque esa tabla es multi-tenant (vive
-- colgada de clientes.id y guarda los leads DE los clientes). Estos son
-- prospectos de la agencia misma, así que viven aparte.

create type public.etapa_solicitud as enum (
  'nueva',
  'contactada',
  'agendada',
  'ganada',
  'perdida'
);

create table public.solicitudes_sitio (
  id uuid primary key default gen_random_uuid(),
  -- Contacto
  nombre text not null,
  email text not null,
  telefono text not null,
  empresa text,
  sitio_actual text,
  -- Perfil del negocio
  giro text,
  facturacion text,
  es_dueno text,
  -- Intención
  servicios text[] not null default '{}',
  problema text,
  presupuesto text,
  arranque text,
  -- Seguimiento interno
  etapa public.etapa_solicitud not null default 'nueva',
  notas text,
  -- Atribución
  origen text,
  created_at timestamptz not null default now()
);

create index solicitudes_sitio_etapa_idx
  on public.solicitudes_sitio (etapa, created_at desc);

alter table public.solicitudes_sitio enable row level security;

-- Solo los admins de la agencia leen y administran las solicitudes. El
-- alta la hace el Server Action con el cliente admin (bypass RLS), así
-- que NO existe policy de insert para anon: el formulario público nunca
-- escribe directo contra la base.
create policy "admin gestiona solicitudes del sitio" on public.solicitudes_sitio
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create table public.suscriptores_sitio (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  origen text,
  created_at timestamptz not null default now()
);

alter table public.suscriptores_sitio enable row level security;

create policy "admin gestiona suscriptores del sitio" on public.suscriptores_sitio
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
