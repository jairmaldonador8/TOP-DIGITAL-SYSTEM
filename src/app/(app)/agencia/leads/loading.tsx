import { SeccionCargando } from '@/components/paneles/esqueleto'

export default function CargandoLeads() {
  return (
    <SeccionCargando
      titulo="Leads"
      descripcion="Los leads más recientes de todos tus clientes."
      filas={5}
    />
  )
}
