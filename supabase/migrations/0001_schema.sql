-- 0001_schema: enums + tablas del CRM multi-tenant Top Digital

-- ===== Enums =====
create type public.rol_usuario as enum ('admin', 'cliente');
create type public.etapa_lead as enum ('nuevo', 'contactado', 'interesado', 'cotizado', 'ganado', 'perdido');
create type public.fuente_lead as enum ('meta_ads', 'whatsapp', 'referido', 'organico');
create type public.nivel_interes as enum ('alto', 'medio', 'bajo');
create type public.metodo_cierre as enum ('whatsapp', 'llamada', 'reunion', 'checkout');
create type public.estado_campania as enum ('activa', 'pausada');
create type public.estado_cliente as enum ('activo', 'pausado', 'inactivo');
create type public.estado_tarea as enum ('pendiente', 'en_progreso', 'completada');

-- ===== Tablas =====

-- Tenants (negocios cliente de la agencia)
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  contacto_nombre text,
  email text,
  telefono text,
  presupuesto_ads numeric not null default 0,
  meta_facturacion numeric not null default 0,
  estado public.estado_cliente not null default 'activo',
  es_agencia boolean not null default false,
  notas text,
  created_at timestamptz not null default now()
);

-- Membresia: mapea auth.users -> tenant + rol (admins tienen cliente_id null)
create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  cliente_id uuid references public.clientes (id),
  rol public.rol_usuario not null,
  nombre text not null,
  created_at timestamptz not null default now()
);

create index usuarios_cliente_id_idx on public.usuarios (cliente_id);

-- Campanias publicitarias (antes que leads: leads la referencia)
create table public.campanias (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  nombre text not null,
  plataforma text,
  estado public.estado_campania not null default 'pausada',
  fecha_inicio date,
  leads_generados int not null default 0,
  created_at timestamptz not null default now()
);

create index campanias_cliente_id_idx on public.campanias (cliente_id);

-- Finanzas de campania (SENSIBLE: solo admin, ver 0002_rls)
create table public.campania_finanzas (
  campania_id uuid primary key references public.campanias (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id),
  gasto numeric not null default 0,
  created_at timestamptz not null default now()
);

create index campania_finanzas_cliente_id_idx on public.campania_finanzas (cliente_id);

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  nombre text not null,
  telefono text,
  email text,
  fuente public.fuente_lead not null,
  campania_id uuid references public.campanias (id),
  etapa public.etapa_lead not null default 'nuevo',
  interes public.nivel_interes,
  monto_venta numeric,
  metodo_cierre public.metodo_cierre,
  venta_dificil boolean not null default false,
  objeciones text[] not null default '{}',
  responsable text,
  fecha_cierre timestamptz,
  creado_por uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index leads_cliente_id_etapa_idx on public.leads (cliente_id, etapa);
create index leads_campania_id_idx on public.leads (campania_id);
create index leads_creado_por_idx on public.leads (creado_por);

-- Seguimientos de lead (inmutables: sin update/delete, ver 0002_rls)
create table public.seguimientos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id),
  autor_id uuid references auth.users (id),
  autor_nombre text,
  nota text not null,
  created_at timestamptz not null default now()
);

create index seguimientos_cliente_id_idx on public.seguimientos (cliente_id);
create index seguimientos_lead_id_idx on public.seguimientos (lead_id);
create index seguimientos_autor_id_idx on public.seguimientos (autor_id);

-- Tareas internas por cliente
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  titulo text not null,
  descripcion text,
  estado public.estado_tarea not null default 'pendiente',
  fecha_limite date,
  created_at timestamptz not null default now()
);

create index tareas_cliente_id_idx on public.tareas (cliente_id);

-- Registro de actividades (timeline)
create table public.actividades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  tipo text not null,
  texto text not null,
  created_at timestamptz not null default now()
);

create index actividades_cliente_id_idx on public.actividades (cliente_id);

-- Notificaciones
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  user_id uuid references auth.users (id),
  tipo text,
  texto text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index notificaciones_cliente_id_leida_idx on public.notificaciones (cliente_id, leida);
create index notificaciones_user_id_idx on public.notificaciones (user_id);

-- Mensajes (chat, Fase 3)
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  autor_id uuid references auth.users (id),
  autor_nombre text,
  texto text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index mensajes_cliente_id_created_at_idx on public.mensajes (cliente_id, created_at);
create index mensajes_autor_id_idx on public.mensajes (autor_id);
