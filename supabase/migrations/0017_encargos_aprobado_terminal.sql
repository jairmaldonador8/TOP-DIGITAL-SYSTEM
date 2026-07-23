-- 0017_encargos_aprobado_terminal: 'aprobado' es terminal para TODOS los
-- roles (spec §1) y el sello entregado_en no es falsificable (review final).

create or replace function private.encargos_congelar_columnas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Terminal para todos: ni admin ni equipo modifican un aprobado.
  if old.estado = 'aprobado' then
    raise exception 'Un encargo aprobado ya no se puede modificar';
  end if;

  if (select private.is_admin()) then
    return new;
  end if;

  if new.asignado_a  is distinct from old.asignado_a
    or new.cliente_id is distinct from old.cliente_id
    or new.titulo is distinct from old.titulo
    or new.descripcion is distinct from old.descripcion
    or new.prioridad is distinct from old.prioridad
    or new.fecha_limite is distinct from old.fecha_limite
    or new.comentario_revision is distinct from old.comentario_revision
    or new.aprobado_en is distinct from old.aprobado_en
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Solo puedes cambiar el estado del encargo';
  end if;

  -- El sello de entrega lo pone la base, no el cliente: imposible falsear.
  new.entregado_en := old.entregado_en;
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    new.entregado_en := now();
  end if;

  return new;
end;
$$;
