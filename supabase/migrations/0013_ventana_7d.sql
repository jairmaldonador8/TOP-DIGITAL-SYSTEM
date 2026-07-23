-- 0013_ventana_7d: metricas de los ultimos 7 dias para el semaforo de campañas

alter table public.campanias
  add column conversaciones_7d int not null default 0;

comment on column public.campanias.conversaciones_7d is
  'Conversaciones de mensajeria iniciadas en los ultimos 7 dias (Meta insights last_7d)';

alter table public.campania_finanzas
  add column gasto_7d numeric not null default 0;

comment on column public.campania_finanzas.gasto_7d is
  'Gasto de los ultimos 7 dias (SENSIBLE: solo admin, igual que gasto)';
