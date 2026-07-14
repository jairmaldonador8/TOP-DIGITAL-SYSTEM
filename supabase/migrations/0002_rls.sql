-- 0002_rls: helpers security definer + RLS en todas las tablas + column grants

-- ===== Helpers en schema privado =====
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.mi_cliente_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select cliente_id from public.usuarios where user_id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios
    where user_id = (select auth.uid()) and rol = 'admin'
  );
$$;

revoke execute on function private.mi_cliente_id(), private.is_admin() from public, anon;
grant execute on function private.mi_cliente_id(), private.is_admin() to authenticated;

-- ===== Habilitar RLS en las 10 tablas =====
alter table public.clientes enable row level security;
alter table public.usuarios enable row level security;
alter table public.campanias enable row level security;
alter table public.campania_finanzas enable row level security;
alter table public.leads enable row level security;
alter table public.seguimientos enable row level security;
alter table public.tareas enable row level security;
alter table public.actividades enable row level security;
alter table public.notificaciones enable row level security;
alter table public.mensajes enable row level security;

-- ===== clientes: cliente ve su propia fila; escrituras solo admin =====
create policy "cliente lee su cliente" on public.clientes
  for select to authenticated
  using (id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "admin inserta clientes" on public.clientes
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "admin actualiza clientes" on public.clientes
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admin elimina clientes" on public.clientes
  for delete to authenticated
  using ((select private.is_admin()));

-- ===== usuarios: cada quien lee su fila; escrituras solo admin =====
create policy "usuario lee su fila" on public.usuarios
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "admin inserta usuarios" on public.usuarios
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "admin actualiza usuarios" on public.usuarios
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admin elimina usuarios" on public.usuarios
  for delete to authenticated
  using ((select private.is_admin()));

-- ===== campanias: lectura tenant; escrituras solo admin =====
create policy "cliente lee sus campanias" on public.campanias
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "admin inserta campanias" on public.campanias
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "admin actualiza campanias" on public.campanias
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admin elimina campanias" on public.campanias
  for delete to authenticated
  using ((select private.is_admin()));

-- ===== campania_finanzas: SOLO admin (sin ruta de cliente) =====
create policy "solo admin finanzas" on public.campania_finanzas
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ===== leads: select/insert/update tenant; sin delete =====
create policy "cliente lee sus leads" on public.leads
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "cliente inserta sus leads" on public.leads
  for insert to authenticated
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "cliente actualiza sus leads" on public.leads
  for update to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()))
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

-- ===== seguimientos: inmutables (solo select/insert) =====
create policy "cliente lee sus seguimientos" on public.seguimientos
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "cliente inserta sus seguimientos" on public.seguimientos
  for insert to authenticated
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

-- ===== tareas: lectura tenant; escrituras solo admin =====
create policy "cliente lee sus tareas" on public.tareas
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "admin inserta tareas" on public.tareas
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "admin actualiza tareas" on public.tareas
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admin elimina tareas" on public.tareas
  for delete to authenticated
  using ((select private.is_admin()));

-- ===== actividades: lectura tenant; escrituras solo admin =====
create policy "cliente lee sus actividades" on public.actividades
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "admin inserta actividades" on public.actividades
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "admin actualiza actividades" on public.actividades
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admin elimina actividades" on public.actividades
  for delete to authenticated
  using ((select private.is_admin()));

-- ===== notificaciones: lectura y marcar leida tenant; insert solo admin =====
create policy "cliente lee sus notificaciones" on public.notificaciones
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "cliente actualiza sus notificaciones" on public.notificaciones
  for update to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()))
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "admin inserta notificaciones" on public.notificaciones
  for insert to authenticated
  with check ((select private.is_admin()));

-- ===== mensajes: select/insert tenant (Fase 3) =====
create policy "cliente lee sus mensajes" on public.mensajes
  for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

create policy "cliente inserta sus mensajes" on public.mensajes
  for insert to authenticated
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));

-- ===== Column grants: congelar campos de propiedad =====
revoke update on public.leads from authenticated;
grant update (nombre, telefono, email, etapa, interes, monto_venta, metodo_cierre,
  venta_dificil, objeciones, responsable, fecha_cierre)
  on public.leads to authenticated;

revoke update on public.notificaciones from authenticated;
grant update (leida) on public.notificaciones to authenticated;
