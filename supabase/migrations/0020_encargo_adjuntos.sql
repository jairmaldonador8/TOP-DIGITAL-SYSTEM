-- 0020_encargo_adjuntos: evidencia de trabajo adjunta a encargos
-- (spec 2026-07-25-encargos-evidencia-design).
--
-- Los archivos viven en el bucket privado 'evidencias' con ruta
-- {encargo_id}/{uuid}.{ext}. El bucket NO tiene politicas de storage:
-- toda subida/lectura pasa por URLs firmadas emitidas en server actions
-- tras validar contra esta tabla (que si tiene RLS).

create table public.encargo_adjuntos (
  id uuid primary key default gen_random_uuid(),
  encargo_id uuid not null references public.encargos (id) on delete cascade,
  subido_por uuid not null references auth.users (id),
  nombre text not null,
  ruta text not null unique,
  mime text not null,
  tamano_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index encargo_adjuntos_encargo_idx on public.encargo_adjuntos (encargo_id);

alter table public.encargo_adjuntos enable row level security;

create policy "admin todo adjuntos" on public.encargo_adjuntos
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "equipo lee adjuntos de sus encargos" on public.encargo_adjuntos
  for select to authenticated
  using (
    exists (
      select 1 from public.encargos e
      where e.id = encargo_id
        and e.asignado_a = (select auth.uid())
    )
  );

-- Solo mientras el encargo esta en manos del trabajador; tras entregar,
-- la evidencia queda congelada para el equipo.
create policy "equipo agrega adjuntos" on public.encargo_adjuntos
  for insert to authenticated
  with check (
    subido_por = (select auth.uid())
    and exists (
      select 1 from public.encargos e
      where e.id = encargo_id
        and e.asignado_a = (select auth.uid())
        and e.estado in ('en_progreso', 'cambios')
    )
  );

create policy "equipo retira sus adjuntos" on public.encargo_adjuntos
  for delete to authenticated
  using (
    subido_por = (select auth.uid())
    and exists (
      select 1 from public.encargos e
      where e.id = encargo_id
        and e.asignado_a = (select auth.uid())
        and e.estado in ('en_progreso', 'cambios')
    )
  );

-- Sin politica de update: los adjuntos son inmutables (se borra y se resube).

-- Bucket privado con limites a nivel Storage (defensa aunque se brinque la
-- action). DML sobre storage.buckets; si el proyecto hosteado lo rechaza,
-- crear via admin API (createBucket) con estos mismos valores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias',
  'evidencias',
  false,
  26214400, -- 25 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/zip-compressed', 'video/mp4'
  ]
)
on conflict (id) do nothing;
