-- 0010_meta_sync_ajustes: enum, indices y comentarios para la bitacora (review de 0009)

create type public.disparador_sync as enum ('cron', 'manual');

alter table public.sync_runs
  drop constraint sync_runs_disparador_check;

alter table public.sync_runs
  alter column disparador type public.disparador_sync
  using disparador::public.disparador_sync;

create index sync_runs_inicio_idx on public.sync_runs (inicio desc);
create index clientes_meta_ad_account_id_idx on public.clientes (meta_ad_account_id)
  where meta_ad_account_id is not null;

comment on column public.sync_runs.errores is
  'Lista de fallos por cliente: [{"cliente": uuid, "mensaje": text}]';
comment on table public.sync_runs is
  'Corrida global del sync de Meta (recorre todos los clientes vinculados); por eso no lleva cliente_id';
