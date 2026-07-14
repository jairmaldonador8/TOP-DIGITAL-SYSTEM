---
name: supabase-multitenant-rls
description: Use when writing database migrations, RLS policies, or queries touching tenant data in this project — covers cliente_id isolation, admin bypass, sensitive-column separation, and RLS testing.
---

# Multi-tenant RLS (Supabase)

## Overview
Membership table is the source of truth; every business table carries `cliente_id` with default-deny RLS. Sensitive financials live in a separate admin-only table so they can never leak to client users.

## Core Patterns

**Helper functions** — `security definer` in a private schema, pinned search_path, wrapped in `(select ...)` inside policies (initPlan caches per statement, up to 100x faster):
```sql
create schema if not exists private;
create or replace function private.mi_cliente_id()
returns uuid language sql security definer stable set search_path = '' as $$
  select cliente_id from public.usuarios where user_id = (select auth.uid());
$$;
create or replace function private.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.usuarios
    where user_id = (select auth.uid()) and rol = 'admin');
$$;
revoke execute on function private.mi_cliente_id(), private.is_admin() from anon;
```

**Tenant table policies** (always `to authenticated`; index every policy column):
```sql
alter table public.leads enable row level security;
create policy "cliente lee sus leads" on public.leads for select to authenticated
  using (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));
create policy "cliente inserta sus leads" on public.leads for insert to authenticated
  with check (cliente_id = (select private.mi_cliente_id()) or (select private.is_admin()));
create index on public.leads (cliente_id);
```

**Sensitive columns** (gasto, utilidad): separate table, admin-only policy — default-deny hides it from tenants entirely. Never rely on "the UI doesn't show it":
```sql
create table public.campania_finanzas (
  campania_id uuid primary key references public.campanias(id) on delete cascade,
  cliente_id uuid not null, gasto numeric default 0
);
alter table public.campania_finanzas enable row level security;
create policy "solo admin" on public.campania_finanzas for all to authenticated
  using ((select private.is_admin()));
```

**Freeze ownership fields** on shared tables: `revoke update on public.leads from authenticated; grant update (etapa, notas, ...) on public.leads to authenticated;` (never grant update on `cliente_id`).

**Admin access**: permissive `is_admin()` policies through the normal client. Secret key (`sb_secret_...`) only server-side for jobs and user provisioning (it bypasses RLS entirely; naming service_role in a policy does nothing).

## Migrations & Testing
- RLS policies and grants go in versioned `supabase/migrations/` — declarative schema diff does NOT capture grants/alter policy.
- Test with pgTAP (`supabase test db`) + basejump test helpers; also JS integration tests with real JWTs.
- **RLS SELECT denials return empty rows, not errors** — assert on state (`is_empty`, counts), never expect exceptions.
- Never verify RLS from the SQL Editor (runs as `postgres`, bypasses RLS).

## Common Mistakes
- Unwrapped `auth.uid()` in policies → per-row evaluation (lint `0003_auth_rls_initplan`).
- Subquery on a policied table inside its own policy → infinite recursion (use the security definer helper).
- Views without `security_invoker = true` run as owner and bypass RLS.
- Repeat the `cliente_id` filter in app queries (`.eq('cliente_id', ...)`) even though RLS enforces it — planner performance.
