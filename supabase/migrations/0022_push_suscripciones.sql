-- 0022_push_suscripciones: suscripciones Web Push por usuario
-- (spec 2026-07-25-notificaciones-push-design).

create table public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_suscripciones_user_idx on public.push_suscripciones (user_id);

alter table public.push_suscripciones enable row level security;

-- Cada quien administra SOLO sus suscripciones; el envio usa el cliente
-- admin del servidor (bypass RLS) y limpia endpoints muertos.
create policy "usuario gestiona sus push" on public.push_suscripciones
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
