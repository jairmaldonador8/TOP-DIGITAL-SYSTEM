-- 0026_equipo_permisos: helpers por puesto, RLS nuevas, ficha para el
-- equipo, congelado ampliado, revision por RPC y desbloqueo de videos.

-- ===== Helpers =====
create or replace function private.puesto_actual()
returns public.puesto_equipo language sql security definer stable set search_path = '' as $$
  select puesto from public.usuarios where user_id = (select auth.uid());
$$;

create or replace function private.cliente_asignado(p_cliente uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.cliente_equipo
    where cliente_id = p_cliente and user_id = (select auth.uid()));
$$;

create or replace function private.es_cliente_agencia(p_cliente uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select coalesce((select es_agencia from public.clientes where id = p_cliente), false);
$$;

create or replace function private.via_rpc()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(current_setting('app.via_rpc', true), '') = 'on';
$$;

create or replace function private.sumar_dias_habiles(p_fecha date, p_dias int)
returns date language plpgsql immutable set search_path = '' as $$
declare
  d date := p_fecha;
  n int := 0;
begin
  while n < p_dias loop
    d := d + 1;
    if extract(isodow from d) < 6 then n := n + 1; end if;
  end loop;
  return d;
end;
$$;

revoke execute on function private.puesto_actual(), private.cliente_asignado(uuid),
  private.es_cliente_agencia(uuid), private.via_rpc(), private.sumar_dias_habiles(date, int)
  from public, anon;
grant execute on function private.puesto_actual(), private.cliente_asignado(uuid),
  private.es_cliente_agencia(uuid), private.via_rpc(), private.sumar_dias_habiles(date, int)
  to authenticated;

-- ===== RLS: cliente_equipo =====
create policy "admin todo cliente_equipo" on public.cliente_equipo
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "equipo ve el equipo de sus clientes" on public.cliente_equipo
  for select to authenticated
  using ((select private.cliente_asignado(cliente_id)));

-- ===== RLS: cliente_archivos =====
create policy "admin todo cliente_archivos" on public.cliente_archivos
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "equipo lee archivos de sus clientes" on public.cliente_archivos
  for select to authenticated
  using ((select private.cliente_asignado(cliente_id)));

-- ===== RLS: ajustes (solo admin) =====
create policy "solo admin ajustes" on public.ajustes
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ===== RLS: encargos =====
-- El WITH CHECK no ve OLD: deja los estados "en manos del trabajador" y la
-- maquina de transiciones vive en el trigger de congelado (abajo).
drop policy "equipo avanza sus encargos" on public.encargos;
create policy "equipo avanza sus encargos" on public.encargos
  for update to authenticated
  using (asignado_a = (select auth.uid()))
  with check (
    asignado_a = (select auth.uid())
    and estado in ('pendiente', 'en_progreso', 'entregado', 'cambios')
  );

-- El PM lee todo lo de sus clientes.
create policy "pm lee encargos de sus clientes" on public.encargos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'project_manager'
    and (select private.cliente_asignado(cliente_id))
  );

-- ===== RLS: adjuntos (material de la dependencia y PM) =====
create policy "equipo lee adjuntos de su dependencia" on public.encargo_adjuntos
  for select to authenticated
  using (
    exists (
      select 1 from public.encargos mio
      where mio.depende_de = encargo_id
        and mio.asignado_a = (select auth.uid())
    )
  );
create policy "pm lee adjuntos de sus clientes" on public.encargo_adjuntos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'project_manager'
    and exists (
      select 1 from public.encargos e
      where e.id = encargo_id and (select private.cliente_asignado(e.cliente_id))
    )
  );

-- ===== RLS: leads y seguimientos del vendedor (solo los de la agencia) =====
create policy "vendedor lee sus prospectos" on public.leads
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
  );
create policy "vendedor crea prospectos" on public.leads
  for insert to authenticated
  with check (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
    and (select private.cliente_asignado(cliente_id))
  );
create policy "vendedor actualiza sus prospectos" on public.leads
  for update to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and asignado_a = (select auth.uid())
    and (select private.es_cliente_agencia(cliente_id))
  )
  with check (asignado_a = (select auth.uid()));

create policy "vendedor lee seguimientos de sus prospectos" on public.seguimientos
  for select to authenticated
  using (
    (select private.puesto_actual()) = 'vendedor'
    and exists (select 1 from public.leads l
      where l.id = lead_id and l.asignado_a = (select auth.uid())
        and (select private.es_cliente_agencia(l.cliente_id)))
  );
create policy "vendedor agrega seguimientos" on public.seguimientos
  for insert to authenticated
  with check (
    (select private.puesto_actual()) = 'vendedor'
    and autor_id = (select auth.uid())
    and exists (select 1 from public.leads l
      where l.id = lead_id and l.asignado_a = (select auth.uid())
        and l.cliente_id = seguimientos.cliente_id
        and (select private.es_cliente_agencia(l.cliente_id)))
  );

-- asignado_a solo tiene sentido en prospectos de la agencia.
create or replace function private.leads_asignado_solo_agencia()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.asignado_a is not null and not private.es_cliente_agencia(new.cliente_id) then
    raise exception 'Solo los prospectos de Top Digital se asignan a un vendedor';
  end if;
  return new;
end;
$$;
create trigger leads_asignado_solo_agencia
  before insert or update of asignado_a, cliente_id on public.leads
  for each row execute function private.leads_asignado_solo_agencia();

-- ===== Ficha para el equipo =====
create or replace function public.ficha_clientes_equipo()
returns table (id uuid, nombre_negocio text, giro text, descripcion_publica text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nombre_negocio, c.giro, c.descripcion_publica
  from public.clientes c
  where (select private.is_admin())
     or ((select private.es_equipo()) and (
           (select private.cliente_asignado(c.id))
           or exists (select 1 from public.encargos e
                      where e.cliente_id = c.id and e.asignado_a = (select auth.uid()))))
$$;

create or replace function public.ficha_cliente_equipo(p_cliente uuid)
returns table (
  id uuid, nombre_negocio text, giro text, descripcion_publica text,
  fecha_arranque date, paquete text, cuota jsonb, kit_marca jsonb
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nombre_negocio, c.giro, c.descripcion_publica,
         c.fecha_arranque, c.paquete, c.cuota, c.kit_marca
  from public.clientes c
  where c.id = p_cliente
    and ((select private.is_admin())
      or ((select private.es_equipo()) and (select private.cliente_asignado(c.id))))
$$;

revoke execute on function public.ficha_cliente_equipo(uuid) from anon, public;
grant execute on function public.ficha_cliente_equipo(uuid) to authenticated;

-- ===== Congelado ampliado (reemplaza la version de 0017) =====
create or replace function private.encargos_congelar_columnas()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Accion referencial de depende_de (ON DELETE SET NULL al borrar la
  -- produccion): solo cambia esa columna a null. Se deja pasar siempre.
  if pg_trigger_depth() > 1
     and new.depende_de is null and old.depende_de is not null
     and (to_jsonb(new) - 'depende_de') = (to_jsonb(old) - 'depende_de') then
    return new;
  end if;

  if old.estado = 'aprobado' then
    raise exception 'Un encargo aprobado ya no se puede modificar';
  end if;

  -- Admin, funciones definer con la bandera, o la secret key (sin auth.uid).
  if (select private.is_admin()) or (select private.via_rpc()) or (select auth.uid()) is null then
    return new;
  end if;

  if new.asignado_a is distinct from old.asignado_a
    or new.cliente_id is distinct from old.cliente_id
    or new.titulo is distinct from old.titulo
    or new.descripcion is distinct from old.descripcion
    or new.prioridad is distinct from old.prioridad
    or new.fecha_limite is distinct from old.fecha_limite
    or new.comentario_revision is distinct from old.comentario_revision
    or new.aprobado_en is distinct from old.aprobado_en
    or new.created_at is distinct from old.created_at
    or new.tipo is distinct from old.tipo
    or new.ciclo is distinct from old.ciclo
    or new.pieza is distinct from old.pieza
    or new.fecha_cliente is distinct from old.fecha_cliente
    or new.depende_de is distinct from old.depende_de
    or new.origen is distinct from old.origen
    or new.brief is distinct from old.brief
    or new.sin_responsable is distinct from old.sin_responsable
    or new.rondas_cambios is distinct from old.rondas_cambios
    or new.fuera_de_ronda is distinct from old.fuera_de_ronda
  then
    raise exception 'Solo puedes cambiar el estado del encargo';
  end if;

  -- Maquina de estados del trabajador (la RLS no ve OLD).
  if new.estado is distinct from old.estado and not (
       (old.estado = 'pendiente'   and new.estado = 'en_progreso')
    or (old.estado = 'cambios'     and new.estado = 'en_progreso')
    or (old.estado = 'en_progreso' and new.estado = 'entregado')
  ) then
    raise exception 'Cambio de estado no permitido (% a %)', old.estado, new.estado;
  end if;

  -- El enlace externo solo se edita mientras la pieza esta en sus manos.
  if new.enlace_externo is distinct from old.enlace_externo
     and old.estado not in ('pendiente', 'en_progreso', 'cambios') then
    raise exception 'El enlace ya no se puede cambiar';
  end if;

  new.entregado_en := old.entregado_en;
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    new.entregado_en := now();
  end if;
  return new;
end;
$$;

-- ===== Revision por RPC (admin o PM del cliente, nunca lo propio) =====
create or replace function public.revisar_encargo(
  p_encargo uuid, p_accion text, p_comentario text default null
)
returns public.estado_encargo
language plpgsql security definer set search_path = '' as $$
declare
  e public.encargos%rowtype;
  nuevo public.estado_encargo;
  previo text := current_setting('app.via_rpc', true);
begin
  select * into e from public.encargos where id = p_encargo for update;
  if not found then raise exception 'Encargo no encontrado'; end if;

  if not (
    (select private.is_admin())
    or ((select private.puesto_actual()) = 'project_manager'
        and (select private.cliente_asignado(e.cliente_id))
        and e.asignado_a <> (select auth.uid()))
  ) then
    raise exception 'No puedes revisar este encargo';
  end if;

  if e.estado <> 'entregado' then
    raise exception 'Solo se revisa lo entregado';
  end if;

  perform set_config('app.via_rpc', 'on', true);

  if p_accion = 'aprobar' then
    nuevo := 'aprobado';
    update public.encargos
      set estado = nuevo, aprobado_en = now(), comentario_revision = p_comentario
      where id = p_encargo;
  elsif p_accion = 'cambios' then
    if coalesce(trim(p_comentario), '') = '' then
      raise exception 'Escribe qué hay que cambiar';
    end if;
    nuevo := 'cambios';
    update public.encargos
      set estado = nuevo,
          comentario_revision = p_comentario,
          rondas_cambios = e.rondas_cambios + 1,
          fuera_de_ronda = (e.rondas_cambios >= 1)
      where id = p_encargo;
  else
    raise exception 'Accion invalida';
  end if;

  perform set_config('app.via_rpc', coalesce(previo, ''), true);
  return nuevo;
end;
$$;

revoke execute on function public.revisar_encargo(uuid, text, text) from anon, public;
grant execute on function public.revisar_encargo(uuid, text, text) to authenticated;

-- ===== Desbloqueo: produccion aprobada -> videos a pendiente =====
create or replace function private.encargos_desbloquear()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requiere boolean;
  arranque date;
  previo text := current_setting('app.via_rpc', true);
begin
  if new.tipo <> 'produccion' then return null; end if;

  select produccion_requiere_revision, fecha_arranque into requiere, arranque
  from public.clientes where id = new.cliente_id;

  perform set_config('app.via_rpc', 'on', true);

  -- Sin revision: se aprueba sola al entregarse (vuelve a disparar el trigger).
  if new.estado = 'entregado' and old.estado is distinct from 'entregado'
     and requiere is false then
    update public.encargos set estado = 'aprobado', aprobado_en = now() where id = new.id;
    perform set_config('app.via_rpc', coalesce(previo, ''), true);
    return null;
  end if;

  if new.estado = 'aprobado' and old.estado is distinct from 'aprobado' then
    update public.encargos d
      set estado = 'pendiente',
          fecha_limite = case
            when arranque is not null and arranque >= current_date - 30
              then private.sumar_dias_habiles(current_date, 2)
            else d.fecha_limite
          end
      where d.depende_de = new.id and d.estado = 'esperando';
  end if;
  perform set_config('app.via_rpc', coalesce(previo, ''), true);
  return null;
end;
$$;

create trigger encargos_desbloquear
  after update of estado on public.encargos
  for each row execute function private.encargos_desbloquear();
