-- 0006_chat_realtime: broadcast de mensajes + marcado de leídos (Fase 3)
-- Patrón: el mensaje se inserta primero (la RLS valida) y un trigger lo
-- difunde a canales privados de Realtime. Nunca postgres_changes.

-- ===== leido: el destinatario marca los mensajes del otro lado =====
-- (0004 dejó esta política pendiente para la Fase 3.)
create policy "cliente marca leidos sus mensajes" on public.mensajes
  for update to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()))
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

-- Vía API solo se puede actualizar la bandera (texto y autoría quedan congelados).
revoke update on public.mensajes from authenticated;
grant update (leido) on public.mensajes to authenticated;

-- Conteos de no leídos: índice parcial (la mayoría de mensajes ya están leídos).
create index mensajes_no_leidos_idx on public.mensajes (cliente_id) where not leido;

-- ===== Trigger: difundir cada mensaje nuevo =====
create or replace function public.broadcast_mensaje()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
declare
  negocio text;
begin
  -- Canal del hilo del cliente (lo escucha su portal).
  perform realtime.broadcast_changes(
    'chat:' || new.cliente_id::text,
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, new, old
  );

  -- Canal de la agencia: aviso enriquecido para las notificaciones de Tadeo.
  select nombre_negocio into negocio
    from public.clientes where id = new.cliente_id;
  perform realtime.send(
    jsonb_build_object(
      'cliente_id', new.cliente_id,
      'nombre_negocio', negocio,
      'autor_id', new.autor_id,
      'autor_nombre', new.autor_nombre,
      'texto', left(new.texto, 140)
    ),
    'nuevo_mensaje',
    'chat:agencia',
    true -- private: el canal de la agencia es privado (RLS decide quién entra)
  );
  return null;
end $$;

create trigger mensajes_broadcast
  after insert on public.mensajes
  for each row execute function public.broadcast_mensaje();

-- ===== Autorización de canales privados (RLS sobre realtime.messages) =====
-- El cliente solo puede unirse a su propio 'chat:<cliente_id>'; el admin a
-- cualquier canal de chat, incluido 'chat:agencia'. Sin política de INSERT:
-- nadie difunde desde el navegador, todo pasa por la tabla.
create policy "miembros escuchan su chat" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (
      (select realtime.topic()) = 'chat:' || (select private.mi_cliente_id())::text
      or ((select private.is_admin()) and (select realtime.topic()) like 'chat:%')
    )
  );
