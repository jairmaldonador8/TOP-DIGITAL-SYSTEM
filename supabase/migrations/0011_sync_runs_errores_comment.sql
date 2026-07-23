-- 0011_sync_runs_errores_comment: cliente null = fallo de la corrida completa (review de Task 4)

comment on column public.sync_runs.errores is
  'Lista de fallos: [{"cliente": uuid | null, "mensaje": text}]; cliente null = fallo de la corrida completa';
