-- 0003_auth_hook: Custom Access Token Hook — agrega user_role y cliente_id a los claims del JWT
-- NOTA: el hook NO se habilita aqui; se activa manualmente en el dashboard
-- (Authentication > Hooks > Custom Access Token).

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  v_rol public.rol_usuario;
  v_cliente_id uuid;
begin
  select rol, cliente_id
    into v_rol, v_cliente_id
  from public.usuarios
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(v_rol::text, 'cliente')));

  if v_cliente_id is not null then
    claims := jsonb_set(claims, '{cliente_id}', to_jsonb(v_cliente_id::text));
  else
    claims := jsonb_set(claims, '{cliente_id}', 'null'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Permisos: solo supabase_auth_admin puede ejecutar el hook
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- supabase_auth_admin necesita leer usuarios (y pasar RLS) para resolver rol/cliente
grant select on table public.usuarios to supabase_auth_admin;

create policy "auth admin lee usuarios" on public.usuarios
  as permissive for select
  to supabase_auth_admin
  using (true);
