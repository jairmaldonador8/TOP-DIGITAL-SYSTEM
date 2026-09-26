-- 0023_agenda: citas editables y espejables con Google, pendientes
-- personales, y tablas de soporte para Google (fase 3) y avisos (fase 2).
-- Spec: docs/ultrapowers/specs/2026-09-25-agenda-tadeo-design.md

-- ===== eventos (citas) =====
alter table public.eventos
  add column hora_fin time,
  add column lugar text,
  add column aviso_min int check (aviso_min is null or aviso_min between 0 and 10080),
  add column origen text not null default 'sistema' check (origen in ('sistema', 'google')),
  add column google_event_id text unique,
  add column google_etag text,
  add column google_pendiente boolean not null default false,
  add column borrado_en timestamptz,
  add column actualizado_en timestamptz not null default now();

alter table public.eventos
  add constraint eventos_hora_fin_despues
  check (hora_fin is null or (hora is not null and hora_fin > hora));

create index eventos_vivos_fecha_idx on public.eventos (fecha) where borrado_en is null;

create or replace function private.tocar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger eventos_actualizado_en
  before update on public.eventos
  for each row execute function private.tocar_actualizado_en();

-- ===== tareas (pendientes) =====
-- Pendientes personales sin cliente. La policy "cliente lee sus tareas"
-- compara cliente_id = mi_cliente_id(): con null nunca coincide, así que
-- el portal no los ve (se verifica en el Step 4).
alter table public.tareas
  alter column cliente_id drop not null,
  add column hora time,
  add column completada_en timestamptz;

create or replace function private.sincronizar_completada_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.estado = 'completada' and new.completada_en is null then
    new.completada_en := now();
  elsif new.estado <> 'completada' then
    new.completada_en := null;
  end if;
  return new;
end;
$$;

create trigger tareas_completada_en
  before insert or update of estado on public.tareas
  for each row execute function private.sincronizar_completada_en();

update public.tareas set completada_en = created_at
  where estado = 'completada' and completada_en is null;

-- ===== google_conexiones (fase 3) — fila única, solo service role =====
create table public.google_conexiones (
  id boolean primary key default true check (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  refresh_token_cifrado text not null,
  calendar_id text not null default 'primary',
  sync_token text,
  canal_id text,
  canal_recurso_id text,
  canal_expira timestamptz,
  estado text not null default 'activa' check (estado in ('activa', 'revocada', 'error')),
  ultimo_error text,
  actualizado_en timestamptz not null default now()
);
alter table public.google_conexiones enable row level security;
-- Sin políticas a propósito: solo el cliente admin (service role).

-- ===== avisos_enviados (fase 2) — deduplicación, solo service role =====
create table public.avisos_enviados (
  clave text primary key,
  enviado_en timestamptz not null default now()
);
alter table public.avisos_enviados enable row level security;
-- Sin políticas a propósito: solo el cliente admin (service role).
