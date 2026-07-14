---
name: supabase-realtime-broadcast
description: Use when building the chat, notification bell, or any live-updating feature in this project — covers private Broadcast channels, DB triggers, reconnection, and unread counts.
---

# Supabase Realtime: Private Broadcast

## Overview
Write to Postgres first (RLS validates), broadcast via `AFTER INSERT` triggers to private channels. Never use `postgres_changes` (legacy; per-subscriber RLS checks don't scale and Supabase recommends against it).

## Core Patterns

**Trigger → broadcast** (chat) and **notification bell**:
```sql
create or replace function public.broadcast_mensaje()
returns trigger security definer set search_path = '' language plpgsql as $$
begin
  perform realtime.broadcast_changes(
    'chat:' || new.cliente_id::text, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, new, old);
  return null;
end $$;
create trigger mensajes_broadcast after insert on public.mensajes
  for each row execute function public.broadcast_mensaje();

-- bell: realtime.send(payload, event, topic, is_public=false)
perform realtime.send(jsonb_build_object('tipo', new.tipo, 'texto', new.texto),
  'nueva_notificacion', 'user:' || new.user_id::text, false);
```

**Channel authorization** — RLS on `realtime.messages` keyed off `realtime.topic()`:
```sql
create policy "miembros reciben chat" on realtime.messages
for select to authenticated using (
  realtime.messages.extension = 'broadcast'
  and ((select realtime.topic()) = 'chat:' || (select private.mi_cliente_id())::text
       or (select private.is_admin()))
);
create policy "canal propio de notificaciones" on realtime.messages
for select to authenticated using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'user:' || (select auth.uid())::text
);
```
No INSERT policy needed — clients never broadcast directly; messages go through normal table inserts.

**Client (React, client component only)**:
```tsx
await supabase.realtime.setAuth()            // REQUIRED before private channels
const channel = supabase
  .channel(`chat:${clienteId}`, { config: { private: true } })
  .on('broadcast', { event: 'INSERT' }, ({ payload }) =>
    setMensajes(m => dedupeById([...m, payload.record])))
  .subscribe((status) => {
    if (status === 'SUBSCRIBED' && wasDropped) refetchSince(lastCreatedAt) // missed msgs are NOT replayed
    if (status !== 'SUBSCRIBED') wasDropped = true
  })
// cleanup: supabase.removeChannel(channel)
```
Create the browser client with `realtime: { worker: true }` (background tabs throttle timers → silent disconnects). One connection per tab, multiplex channels (chat + `user:<uid>`).

**Unread counts**: chat → `participantes.last_read_at`, unread = messages newer than it (RPC `mark_read`); bell → `count(*) where read_at is null`. Increment on broadcast, recount on load/reconnect. Indexes: `mensajes(cliente_id, created_at)`, `notificaciones(user_id, read_at)`.

## Limits (free tier)
200 concurrent connections, 2M messages/month, 100 msg/s — ample for this app's size.

## Common Mistakes
- Forgetting `setAuth()` before subscribing → private channel join fails.
- Assuming reconnect re-delivers missed messages — always refetch on re-`SUBSCRIBED` and dedupe by id.
- Broadcasting from the client instead of persisting first — messages must be rows (source of truth, history, unread math).
- Complex policies on `realtime.messages` — they run at join time; keep them simple and indexed.
