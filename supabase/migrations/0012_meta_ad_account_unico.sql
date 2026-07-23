-- 0012_meta_ad_account_unico: una cuenta publicitaria de Meta solo puede
-- pertenecer a un cliente (evita que el sync mezcle campañas entre tenants).
drop index if exists clientes_meta_ad_account_id_idx;
create unique index clientes_meta_ad_account_id_idx
  on public.clientes (meta_ad_account_id)
  where meta_ad_account_id is not null;
