-- 0021_reportes_semanales: resumen semanal automatico para el dueno
-- (spec 2026-07-25-reporte-semanal-design).

create table public.reportes_semanales (
  id uuid primary key default gen_random_uuid(),
  semana_inicio date not null unique,
  datos jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.reportes_semanales enable row level security;

-- Solo el dueno lo lee; el cron escribe con el cliente admin (bypass RLS).
create policy "solo admin lee reportes" on public.reportes_semanales
  for select to authenticated
  using ((select private.is_admin()));
