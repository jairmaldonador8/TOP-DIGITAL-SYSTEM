import { SeccionCargando } from '@/components/paneles/esqueleto'

export default function CargandoTareas() {
  return (
    <SeccionCargando
      titulo="Tareas"
      descripcion="El trabajo interno de la agencia por cliente."
      conAccion
      filas={5}
    />
  )
}
