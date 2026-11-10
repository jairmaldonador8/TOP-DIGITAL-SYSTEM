-- Punto de control del Plan 1: simula cada puesto contra la base real.
-- Todo corre en UN bloque que termina con RAISE EXCEPTION: el mensaje trae
-- los resultados y la excepcion revierte cualquier dato de prueba.
-- Correr como postgres (MCP execute_sql). Esperado: todas las lineas "OK".
do $$
declare
  r text[] := '{}';
  ok boolean;
  n int;
  est text;
  a uuid := gen_random_uuid();   -- cliente A (asignado)
  b uuid := gen_random_uuid();   -- cliente B (ajeno)
  ag uuid;                       -- cliente agencia
  e uuid := gen_random_uuid();   -- editor
  p uuid := gen_random_uuid();   -- project manager
  v uuid := gen_random_uuid();   -- vendedor
  f uuid := gen_random_uuid();   -- filmmaker
  prod uuid := gen_random_uuid();
  vid uuid := gen_random_uuid();
  vid2 uuid := gen_random_uuid();

begin
  select id into ag from public.clientes where es_agencia limit 1;
  if ag is null then
    ag := gen_random_uuid();
    insert into public.clientes (id, nombre_negocio, es_agencia) values (ag, 'Agencia prueba', true);
  end if;

  insert into public.clientes (id, nombre_negocio) values (a, 'Prueba A'), (b, 'Prueba B');
  insert into auth.users (id, email, aud, role)
  values (e, 'e@prueba.local', 'authenticated', 'authenticated'),
         (p, 'p@prueba.local', 'authenticated', 'authenticated'),
         (v, 'v@prueba.local', 'authenticated', 'authenticated'),
         (f, 'f@prueba.local', 'authenticated', 'authenticated');
  insert into public.usuarios (user_id, rol, nombre, puesto) values
    (e, 'equipo', 'Editor prueba', 'editor'),
    (p, 'equipo', 'PM prueba', 'project_manager'),
    (v, 'equipo', 'Vendedor prueba', 'vendedor'),
    (f, 'equipo', 'Filmmaker prueba', 'filmmaker');
  insert into public.cliente_equipo (cliente_id, user_id, puesto) values
    (a, e, 'editor'), (a, p, 'project_manager'), (a, f, 'filmmaker'), (ag, v, 'vendedor');

  insert into public.encargos (id, asignado_a, cliente_id, titulo, tipo, estado, origen, ciclo, pieza) values
    (prod, f, a, 'Producción 1', 'produccion', 'entregado', 'ciclo', '2026-12-01', 1);
  insert into public.encargos (id, asignado_a, cliente_id, titulo, tipo, estado, origen, ciclo, pieza, depende_de) values
    (vid, e, a, 'Video 1', 'video', 'esperando', 'ciclo', '2026-12-01', 1, prod);
  insert into public.encargos (id, asignado_a, cliente_id, titulo, tipo, estado) values
    (vid2, e, a, 'Video suelto', 'video', 'en_progreso'),
    (gen_random_uuid(), f, b, 'Encargo de B', 'otro', 'pendiente');

  insert into public.leads (cliente_id, nombre, fuente, asignado_a) values
    (ag, 'Prospecto de V', 'meta_ads', v);
  insert into public.leads (cliente_id, nombre, fuente) values (a, 'Lead de A', 'whatsapp');

  -- ===== Como EDITOR =====
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated', 'user_role', 'equipo')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.ficha_clientes_equipo();
  r := r || format('%s editor ve 1 ficha (vio %s)', case when n = 1 then 'OK' else 'FALLA' end, n);
  select count(*) into n from public.clientes;
  r := r || format('%s editor no lee clientes directo (vio %s)', case when n = 0 then 'OK' else 'FALLA' end, n);
  select count(*) into n from public.campania_finanzas;
  r := r || format('%s editor no ve finanzas (vio %s)', case when n = 0 then 'OK' else 'FALLA' end, n);
  select count(*) into n from public.leads;
  r := r || format('%s editor no ve leads (vio %s)', case when n = 0 then 'OK' else 'FALLA' end, n);
  select count(*) into n from public.ficha_cliente_equipo(b);
  r := r || format('%s editor no ve la ficha de B (vio %s)', case when n = 0 then 'OK' else 'FALLA' end, n);

  ok := false;
  begin
    update public.encargos set estado = 'en_progreso' where id = vid;
    get diagnostics n = row_count;
    ok := (n = 0);
  exception when others then ok := true;
  end;
  r := r || format('%s editor no se salta "esperando"', case when ok then 'OK' else 'FALLA' end);

  ok := false;
  begin
    update public.encargos set depende_de = prod where id = vid2;
    get diagnostics n = row_count;
    ok := (n = 0);
  exception when others then ok := true;
  end;
  r := r || format('%s editor no cambia depende_de', case when ok then 'OK' else 'FALLA' end);

  ok := false;
  begin
    perform public.revisar_encargo(prod, 'aprobar', null);
  exception when others then ok := true;
  end;
  r := r || format('%s editor no puede revisar', case when ok then 'OK' else 'FALLA' end);

  ok := false;
  begin
    update public.encargos set enlace_externo = 'https://drive.google.com/x' where id = vid2;
    get diagnostics n = row_count;
    ok := (n = 1);
  exception when others then ok := false;
  end;
  r := r || format('%s editor guarda enlace en su pieza en progreso', case when ok then 'OK' else 'FALLA' end);

  -- ===== Como PM =====
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'user_role', 'equipo')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.encargos where cliente_id = a;
  r := r || format('%s PM ve las 3 piezas de A (vio %s)', case when n = 3 then 'OK' else 'FALLA' end, n);
  select count(*) into n from public.encargos where cliente_id = b;
  r := r || format('%s PM no ve piezas de B (vio %s)', case when n = 0 then 'OK' else 'FALLA' end, n);

  ok := true;
  begin
    perform public.revisar_encargo(prod, 'aprobar', 'Buen material');
  exception when others then ok := false; r := r || ('  error PM: ' || sqlerrm);
  end;
  r := r || format('%s PM aprueba la producción', case when ok then 'OK' else 'FALLA' end);

  perform set_config('role', 'none', true);
  select estado::text into est from public.encargos where id = vid;
  r := r || format('%s el video se desbloquea (quedó %s)', case when est = 'pendiente' then 'OK' else 'FALLA' end, est);

  -- ===== Como VENDEDOR =====
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated', 'user_role', 'equipo')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.leads;
  r := r || format('%s vendedor ve solo su prospecto (vio %s)', case when n = 1 then 'OK' else 'FALLA' end, n);

  ok := false;
  begin
    insert into public.leads (cliente_id, nombre, fuente, asignado_a) values (a, 'Intruso', 'referido', v);
  exception when others then ok := true;
  end;
  r := r || format('%s vendedor no crea leads de otro cliente', case when ok then 'OK' else 'FALLA' end);

  ok := true;
  begin
    insert into public.leads (cliente_id, nombre, fuente, asignado_a) values (ag, 'Nuevo prospecto', 'referido', v);
  exception when others then ok := false; r := r || ('  error vendedor: ' || sqlerrm);
  end;
  r := r || format('%s vendedor crea prospectos de Top Digital', case when ok then 'OK' else 'FALLA' end);

  perform set_config('role', 'none', true);
  raise exception E'RESULTADOS (todo se revierte):\n%', array_to_string(r, E'\n');
end;
$$;
