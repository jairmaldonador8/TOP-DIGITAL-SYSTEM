-- 0024_tipos_equipo: SOLO tipos. Un valor nuevo de enum no se puede usar en
-- la misma transaccion (55P04); todo lo que los usa va de 0025 en adelante.

alter type public.estado_encargo add value if not exists 'esperando' before 'pendiente';

create type public.puesto_equipo as enum
  ('project_manager', 'media_buyer', 'filmmaker', 'editor', 'disenador', 'vendedor');

create type public.tipo_entregable as enum
  ('imagen', 'carrusel', 'video', 'produccion', 'guion', 'otro');
