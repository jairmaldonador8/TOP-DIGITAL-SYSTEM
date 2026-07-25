'use client'

import * as React from 'react'
import {
  FileArchiveIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  PaperclipIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import * as accionesAgencia from '@/app/(app)/agencia/equipo/actions'
import * as accionesEquipo from '@/app/(app)/equipo/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ACCEPT_EVIDENCIA,
  esImagen,
  esMimePermitido,
  formatoTamano,
  MAX_ADJUNTOS_POR_ENCARGO,
  MAX_TAMANO_EVIDENCIA,
  normalizarMime,
} from '@/lib/equipo/evidencia'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type AdjuntoView = {
  id: string
  nombre: string
  mime: string
  tamano: number
  url: string | null
  esMio: boolean
}

function IconoDe({ mime }: { mime: string }) {
  const limpio = normalizarMime(mime)
  const Icono = limpio.startsWith('video/')
    ? FileVideoIcon
    : limpio === 'application/zip'
      ? FileArchiveIcon
      : limpio === 'application/pdf'
        ? FileTextIcon
        : FileIcon
  return <Icono aria-hidden className="size-4 shrink-0 text-muted-foreground" />
}

/**
 * Lista de evidencia de un encargo con subida directa a Storage (URL
 * firmada) y borrado. Se usa en el detalle del trabajador (modo 'equipo')
 * y en la bandeja de revisión del dueño (modo 'admin').
 */
export function EvidenciaEncargo({
  encargoId,
  adjuntos,
  puedeEditar,
  modo,
}: {
  encargoId: string
  adjuntos: AdjuntoView[]
  puedeEditar: boolean
  modo: 'equipo' | 'admin'
}) {
  const acciones = modo === 'admin' ? accionesAgencia : accionesEquipo
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = React.useState(false)
  const [borrando, setBorrando] = React.useState<string | null>(null)
  const [confirmando, setConfirmando] = React.useState<AdjuntoView | null>(null)

  const subir = async (archivo: File) => {
    if (!esMimePermitido(archivo.type)) {
      toast.error('Ese tipo de archivo no está permitido')
      return
    }
    if (archivo.size > MAX_TAMANO_EVIDENCIA) {
      toast.error('El archivo debe pesar 25 MB o menos')
      return
    }
    if (adjuntos.length >= MAX_ADJUNTOS_POR_ENCARGO) {
      toast.error(`Máximo ${MAX_ADJUNTOS_POR_ENCARGO} archivos por encargo`)
      return
    }
    setSubiendo(true)
    try {
      const preparacion = await acciones.prepararSubidaEvidencia(
        encargoId,
        archivo.type,
        archivo.size
      )
      if (!preparacion.ok) {
        toast.error(preparacion.mensaje)
        return
      }
      const { error } = await createClient()
        .storage.from('evidencias')
        .uploadToSignedUrl(preparacion.ruta, preparacion.token, archivo)
      if (error) {
        console.error('Error al subir evidencia:', error)
        toast.error('No se pudo subir el archivo, intenta de nuevo')
        return
      }
      const registro = await acciones.registrarEvidencia(
        encargoId,
        preparacion.ruta,
        archivo.name,
        normalizarMime(archivo.type)
      )
      if (registro.ok) toast.success('Evidencia agregada')
      else toast.error(registro.mensaje)
    } finally {
      setSubiendo(false)
    }
  }

  const borrar = async (adjunto: AdjuntoView) => {
    setConfirmando(null)
    setBorrando(adjunto.id)
    try {
      const resultado = await acciones.borrarEvidencia(adjunto.id)
      if (resultado.ok) toast.success('Archivo eliminado')
      else toast.error(resultado.mensaje)
    } finally {
      setBorrando(null)
    }
  }

  if (adjuntos.length === 0 && !puedeEditar) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <PaperclipIcon aria-hidden className="size-3.5" />
        Evidencia{adjuntos.length > 0 ? ` (${adjuntos.length})` : ''}
      </p>

      {adjuntos.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {adjuntos.map((adjunto) => (
            <li
              key={adjunto.id}
              className="flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-1.5"
            >
              {esImagen(adjunto.mime) && adjunto.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL efímera, sin optimizador
                <img
                  src={adjunto.url}
                  alt=""
                  className="size-9 shrink-0 rounded-md object-cover"
                />
              ) : (
                <IconoDe mime={adjunto.mime} />
              )}
              {adjunto.url ? (
                <a
                  href={adjunto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
                >
                  {adjunto.nombre}
                </a>
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {adjunto.nombre}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatoTamano(adjunto.tamano)}
              </span>
              {puedeEditar && (adjunto.esMio || modo === 'admin') ? (
                <button
                  type="button"
                  onClick={() => setConfirmando(adjunto)}
                  disabled={borrando !== null}
                  aria-label={`Eliminar ${adjunto.nombre}`}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground outline-none transition-colors',
                    'hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/60',
                    borrando === adjunto.id && 'animate-pulse'
                  )}
                >
                  <Trash2Icon aria-hidden className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {puedeEditar ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_EVIDENCIA}
            className="sr-only"
            aria-label="Elegir archivo de evidencia"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              e.target.value = ''
              if (archivo) void subir(archivo)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
            className="self-start"
          >
            <PaperclipIcon data-icon="inline-start" aria-hidden />
            {subiendo ? 'Subiendo…' : 'Agregar evidencia'}
          </Button>
        </>
      ) : null}

      <Dialog
        open={confirmando !== null}
        onOpenChange={(abre) => !abre && setConfirmando(null)}
      >
        <DialogContent className="sm:max-w-sm">
          {confirmando ? (
            <>
              <DialogHeader>
                <DialogTitle>¿Eliminar este archivo?</DialogTitle>
                <DialogDescription>
                  {`"${confirmando.nombre}" se borrará definitivamente.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => void borrar(confirmando)}
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
