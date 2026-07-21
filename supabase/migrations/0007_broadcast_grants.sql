-- 0007: cerrar EXECUTE de broadcast_mensaje (advisor de seguridad)
-- La función es un trigger security definer; el disparo del trigger no
-- requiere EXECUTE del que inserta, así que nadie pierde funcionalidad.
-- Sin esto, cualquier usuario (incluso anon) podía invocarla vía
-- /rest/v1/rpc/broadcast_mensaje.

revoke execute on function public.broadcast_mensaje()
  from public, anon, authenticated;
