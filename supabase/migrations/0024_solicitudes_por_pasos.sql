-- 0024_solicitudes_por_pasos: el formulario de agendar pasa a capturarse
-- en tres pasos y guarda desde el primero.
--
-- Antes la solicitud se insertaba completa al final: si el prospecto
-- abandonaba a media captura, su contacto se perdía por completo. Ahora
-- el paso 1 inserta la fila y los pasos 2 y 3 la actualizan, así que un
-- abandono deja igual un lead con WhatsApp y correo.

alter table public.solicitudes_sitio
  add column apellido text,
  -- Secreto que acompaña al id para completar los pasos siguientes. El
  -- formulario es anónimo: sin esto, conocer un id bastaría para
  -- sobrescribir la solicitud de alguien más.
  add column token uuid not null default gen_random_uuid(),
  -- Hasta dónde llegó: 1 solo contacto, 2 con negocio, 3 completa.
  add column paso smallint not null default 1,
  add column actualizado_at timestamptz not null default now();

alter table public.solicitudes_sitio
  add constraint solicitudes_sitio_paso_valido check (paso between 1 and 3);

-- Los updates de los pasos 2 y 3 siempre buscan por id + token.
create index solicitudes_sitio_token_idx
  on public.solicitudes_sitio (id, token);

-- La bandeja del equipo ordena por qué tan completa está la solicitud.
create index solicitudes_sitio_paso_idx
  on public.solicitudes_sitio (paso, created_at desc);

comment on column public.solicitudes_sitio.paso is
  'Hasta dónde llegó el prospecto: 1 solo contacto, 2 con negocio, 3 completa.';
comment on column public.solicitudes_sitio.token is
  'Secreto que el navegador guarda entre pasos; nunca se expone en la bandeja.';
