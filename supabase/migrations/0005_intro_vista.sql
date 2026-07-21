-- 0005_intro_vista: bandera del tour de bienvenida del portal
-- Los usuarios nuevos nacen con intro_vista = false y ven el tour una sola
-- vez; los existentes ya conocen el sitio y quedan marcados como vistos.

alter table public.usuarios
  add column intro_vista boolean not null default false;

update public.usuarios set intro_vista = true;

-- Cada usuario puede marcar su propia intro como vista.
create policy "usuario marca su intro vista" on public.usuarios
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Congelar el resto de columnas: via API solo se puede actualizar la bandera
-- (nunca rol ni cliente_id; el aprovisionamiento usa la secret key).
revoke update on public.usuarios from authenticated;
grant update (intro_vista) on public.usuarios to authenticated;
