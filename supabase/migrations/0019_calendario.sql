-- 0019_calendario: eventos manuales del calendario de operacion (solo agencia)

create type public.evento_tipo as enum ('junta','sesion','lanzamiento','pago','otro');

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  cliente_id uuid references public.clientes (id) on delete set null,
  fecha date not null,
  hora time,
  tipo public.evento_tipo not null default 'otro',
  created_at timestamptz not null default now()
);

create index eventos_fecha_idx on public.eventos (fecha);

alter table public.eventos enable row level security;

-- Mismo patron que campania_finanzas (0002): solo admin.
create policy "solo admin eventos" on public.eventos
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
