/** Valida que un valor tenga forma de UUID antes de usarlo en una query. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(valor: string): boolean {
  return UUID.test(valor)
}
