-- 0009_meta_sync: vinculo cliente<->cuenta Meta, campos de sync y bitacora

alter table public.clientes
  add column meta_ad_account_id text;

alter table public.campanias
  add column meta_campaign_id text unique,
  add column sincronizada_en timestamptz;

-- Bitacora de corridas de sincronizacion (SENSIBLE: solo admin)
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  disparador text not null check (disparador in ('cron', 'manual')),
  inicio timestamptz not null default now(),
  fin timestamptz,
  campanias_actualizadas int not null default 0,
  errores jsonb not null default '[]'::jsonb,
  exito boolean not null default false
);

alter table public.sync_runs enable row level security;

-- Mismo patron que campania_finanzas (0002): solo admin, sin ruta de cliente.
create policy "solo admin sync_runs" on public.sync_runs
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
