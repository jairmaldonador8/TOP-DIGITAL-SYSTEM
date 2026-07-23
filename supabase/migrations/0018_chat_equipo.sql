-- 0018_chat_equipo: chat 1:1 dueño<->trabajador, espejo del patron de
-- mensajes (0002/0006/0007). Hilo por trabajador; canal privado
-- chat:equipo:<trabajador_id> (el prefijo chat: reutiliza la clausula de
-- admin existente en realtime.messages).

create table public.mensajes_equipo (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references auth.users (id),
  autor_id uuid references auth.users (id) on delete set null,
  autor_nombre text not null,
  texto text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index mensajes_equipo_hilo_idx
  on public.mensajes_equipo (trabajador_id, created_at);
create index mensajes_equipo_no_leidos_idx
  on public.mensajes_equipo (trabajador_id) where not leido;

alter table public.mensajes_equipo enable row level security;

create policy "hilo propio o admin lee" on public.mensajes_equipo
  for select to authenticated
  using (
    (select private.is_admin())
    or trabajador_id = (select auth.uid())
  );

create policy "hilo propio o admin escribe" on public.mensajes_equipo
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and (
      (select private.is_admin())
      or trabajador_id = (select auth.uid())
    )
  );

create policy "hilo propio o admin marca leidos" on public.mensajes_equipo
  for update to authenticated
  using (
    (select private.is_admin())
    or trabajador_id = (select auth.uid())
  )
  with check (
    (select private.is_admin())
    or trabajador_id = (select auth.uid())
  );

-- Via API solo la bandera: texto y autoria congelados (patron 0006).
revoke update on public.mensajes_equipo from authenticated;
grant update (leido) on public.mensajes_equipo to authenticated;

-- ===== Trigger de broadcast al canal privado del hilo =====
create or replace function public.broadcast_mensaje_equipo()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'chat:equipo:' || new.trabajador_id::text,
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, new, old
  );
  return null;
end $$;

create trigger mensajes_equipo_broadcast
  after insert on public.mensajes_equipo
  for each row execute function public.broadcast_mensaje_equipo();

revoke execute on function public.broadcast_mensaje_equipo()
  from public, anon, authenticated;

-- ===== El trabajador solo se une a SU canal (el admin ya entra a chat:%) =====
create policy "equipo escucha su chat" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select private.es_equipo())
    and (select realtime.topic()) = 'chat:equipo:' || (select auth.uid())::text
  );
