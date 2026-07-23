-- 0016_ficha_clientes_rpc: la vista clientes_para_equipo se reemplaza por
-- una funcion RPC (misma logica y guardias) — el linter de Supabase marca
-- ERROR toda vista security-definer sin poder ver sus guardias internas.

drop view if exists public.clientes_para_equipo;

create or replace function public.ficha_clientes_equipo()
returns table (
  id uuid,
  nombre_negocio text,
  giro text,
  descripcion_publica text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.nombre_negocio, c.giro, c.descripcion_publica
  from public.clientes c
  where
    (select private.is_admin())
    or (
      (select private.es_equipo())
      and exists (
        select 1 from public.encargos e
        where e.cliente_id = c.id
          and e.asignado_a = (select auth.uid())
      )
    )
$$;

revoke execute on function public.ficha_clientes_equipo() from anon, public;
grant execute on function public.ficha_clientes_equipo() to authenticated;
