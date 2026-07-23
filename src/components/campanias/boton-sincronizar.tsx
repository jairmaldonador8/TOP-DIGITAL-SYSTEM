'use client'

import { useTransition } from 'react'
import { RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { sincronizarAhora } from '@/app/(app)/agencia/campanias/actions'
import { Button } from '@/components/ui/button'
import { formatoFechaHora } from '@/lib/formato'
import { cn } from '@/lib/utils'

/**
 * Dispara la sincronización con Meta a mano y muestra cuándo corrió la
 * última (con ✓/✗ según haya terminado limpia o con errores).
 */
export function BotonSincronizar({
  ultimaSync,
}: {
  ultimaSync: { fin: string | null; exito: boolean } | null
}) {
  const [pendiente, iniciarTransicion] = useTransition()

  const sincronizar = () => {
    iniciarTransicion(async () => {
      const resultado = await sincronizarAhora()
      if (!resultado.ok) {
        toast.error(resultado.mensaje)
        return
      }
      toast.success(`${resultado.campaniasActualizadas} campañas actualizadas`)
      if (resultado.errores.length > 0) {
        const [primero, ...resto] = resultado.errores
        toast.warning(
          resto.length > 0
            ? `${primero} (y ${resto.length} errores más)`
            : primero
        )
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pendiente}
        onClick={sincronizar}
      >
        <RefreshCwIcon
          data-icon="inline-start"
          className={cn(pendiente && 'animate-spin')}
        />
        {pendiente ? 'Sincronizando…' : 'Sincronizar ahora'}
      </Button>
      <p className="text-xs text-muted-foreground">
        {ultimaSync === null
          ? 'Sin sincronizar aún'
          : ultimaSync.fin === null
            ? 'Sincronización en curso…'
            : `Última sincronización: ${formatoFechaHora(ultimaSync.fin)} ${
                ultimaSync.exito ? '✓' : '✗'
              }`}
      </p>
    </div>
  )
}
