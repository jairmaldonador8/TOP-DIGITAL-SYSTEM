import { SeccionCargando } from '@/components/paneles/esqueleto'

export default function CargandoMisLeads() {
  return (
    <SeccionCargando
      titulo="Mis Leads"
      descripcion="Las personas interesadas en tu negocio."
      filas={5}
    />
  )
}
