-- 0014_metricas_diarias: serie dia por dia (ventana 30d de Meta) para el
-- dashboard de campañas por cliente. Retencion: 90 dias (poda en el sync).

create table public.campania_metricas_diarias (
  campania_id uuid not null references public.campanias (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id),
  fecha date not null,
  gasto numeric not null default 0,
  conversaciones int not null default 0,
  primary key (campania_id, fecha)
);

comment on table public.campania_metricas_diarias is
  'Metricas diarias por campania (ventana rodante de 30 dias desde Meta, retencion 90). SENSIBLE: contiene gasto — solo admin.';

create index campania_metricas_diarias_cliente_fecha_idx
  on public.campania_metricas_diarias (cliente_id, fecha);

alter table public.campania_metricas_diarias enable row level security;

-- Mismo patron que campania_finanzas (0002): solo admin, sin ruta de cliente.
create policy "solo admin metricas diarias" on public.campania_metricas_diarias
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
