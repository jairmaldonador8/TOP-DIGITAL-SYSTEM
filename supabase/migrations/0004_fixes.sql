-- 0004_fixes: on delete set null en FKs a auth.users + checks de montos no negativos
-- NOTA: mensajes.leido intencionalmente NO tiene politica de update todavia;
-- se agregara en Fase 3 junto con el chat (marcar mensajes como leidos).

-- ===== FKs a auth.users: set null al borrar el usuario (columnas nullable) =====
alter table public.leads
  drop constraint leads_creado_por_fkey,
  add constraint leads_creado_por_fkey
    foreign key (creado_por) references auth.users (id) on delete set null;

alter table public.seguimientos
  drop constraint seguimientos_autor_id_fkey,
  add constraint seguimientos_autor_id_fkey
    foreign key (autor_id) references auth.users (id) on delete set null;

alter table public.notificaciones
  drop constraint notificaciones_user_id_fkey,
  add constraint notificaciones_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete set null;

alter table public.mensajes
  drop constraint mensajes_autor_id_fkey,
  add constraint mensajes_autor_id_fkey
    foreign key (autor_id) references auth.users (id) on delete set null;

-- ===== Checks: montos no negativos =====
alter table public.clientes
  add constraint clientes_presupuesto_ads_no_negativo check (presupuesto_ads >= 0),
  add constraint clientes_meta_facturacion_no_negativa check (meta_facturacion >= 0);

alter table public.leads
  add constraint leads_monto_venta_no_negativo check (monto_venta is null or monto_venta >= 0);

alter table public.campania_finanzas
  add constraint campania_finanzas_gasto_no_negativo check (gasto >= 0);

alter table public.campanias
  add constraint campanias_leads_generados_no_negativo check (leads_generados >= 0);
