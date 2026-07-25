/**
 * Núcleo de servidor de la evidencia de encargos, compartido por las
 * actions del trabajador (/equipo) y del dueño (/agencia/equipo).
 *
 * Los archivos NUNCA pasan por una server action (límite de body):
 * el navegador sube directo a Storage con una URL firmada que aquí se
 * emite tras validar contra `encargos`/`encargo_adjuntos` (con RLS).
 * El bucket 'evidencias' no tiene políticas: solo el cliente admin firma.
 */
import 'server-only'

import { randomUUID } from 'node:crypto'

import { esUuid } from '@/lib/acciones'
import {
  esMimePermitido,
  extensionDe,
  MAX_ADJUNTOS_POR_ENCARGO,
  MAX_TAMANO_EVIDENCIA,
  puedeAdjuntar,
} from '@/lib/equipo/evidencia'
import type { EstadoEncargo } from '@/lib/equipo/transiciones'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'evidencias'

export type PreparacionSubida =
  | { ok: true; ruta: string; token: string }
  | { ok: false; mensaje: string }

export type ResultadoEvidencia = { ok: true } | { ok: false; mensaje: string }

type Rol = 'equipo' | 'admin'

/** Ruta válida emitida por prepararSubida: {encargoId}/{uuid}.{ext} */
const RUTA_ADJUNTO = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/i

/**
 * Carga el encargo con el cliente del usuario (RLS) y verifica que el rol
 * puede adjuntar en su estado actual. Para equipo, RLS ya limita a los
 * propios; el chequeo de asignado_a queda como cinturón extra.
 */
async function encargoAdjuntable(
  rol: Rol,
  uid: string,
  encargoId: string
): Promise<{ ok: true } | { ok: false; mensaje: string }> {
  const supabase = await createClient()
  const { data: encargo } = await supabase
    .from('encargos')
    .select('id, estado, asignado_a')
    .eq('id', encargoId)
    .maybeSingle()

  if (!encargo || (rol === 'equipo' && encargo.asignado_a !== uid)) {
    return { ok: false, mensaje: 'El encargo no existe' }
  }
  if (!puedeAdjuntar(rol, encargo.estado as EstadoEncargo)) {
    return {
      ok: false,
      mensaje:
        rol === 'equipo'
          ? 'Solo puedes adjuntar evidencia mientras el encargo está en tus manos'
          : 'Un encargo aprobado ya no se puede modificar',
    }
  }
  return { ok: true }
}

async function contarAdjuntos(encargoId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('encargo_adjuntos')
    .select('id', { count: 'exact', head: true })
    .eq('encargo_id', encargoId)
  return count ?? 0
}

/** Paso 1: valida y emite la URL firmada de subida (el navegador sube directo). */
export async function prepararSubidaCore(
  rol: Rol,
  uid: string,
  encargoId: string,
  mime: string,
  tamano: number
): Promise<PreparacionSubida> {
  if (!esUuid(encargoId)) return { ok: false, mensaje: 'Solicitud no válida' }
  if (!esMimePermitido(mime)) {
    return { ok: false, mensaje: 'Ese tipo de archivo no está permitido' }
  }
  if (!Number.isFinite(tamano) || tamano <= 0 || tamano > MAX_TAMANO_EVIDENCIA) {
    return { ok: false, mensaje: 'El archivo debe pesar 25 MB o menos' }
  }

  const adjuntable = await encargoAdjuntable(rol, uid, encargoId)
  if (!adjuntable.ok) return adjuntable

  if ((await contarAdjuntos(encargoId)) >= MAX_ADJUNTOS_POR_ENCARGO) {
    return {
      ok: false,
      mensaje: `Máximo ${MAX_ADJUNTOS_POR_ENCARGO} archivos por encargo`,
    }
  }

  const ruta = `${encargoId}/${randomUUID()}.${extensionDe(mime)}`
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(ruta)
  if (error || !data) {
    console.error('Error al firmar subida de evidencia:', error)
    return { ok: false, mensaje: 'No se pudo preparar la subida, intenta de nuevo' }
  }
  return { ok: true, ruta: data.path, token: data.token }
}

/**
 * Paso 3: tras subir, registra la fila. Re-valida todo, comprueba que el
 * objeto realmente existe en Storage (y toma su tamaño real) e inserta con
 * el cliente del usuario para que la RLS de la tabla vuelva a decidir.
 */
export async function registrarCore(
  rol: Rol,
  uid: string,
  encargoId: string,
  ruta: string,
  nombre: string,
  mime: string
): Promise<ResultadoEvidencia> {
  if (
    !esUuid(encargoId) ||
    !RUTA_ADJUNTO.test(ruta) ||
    !ruta.startsWith(`${encargoId}/`) ||
    !esMimePermitido(mime)
  ) {
    return { ok: false, mensaje: 'Solicitud no válida' }
  }
  const nombreLimpio = nombre.trim().slice(0, 200)
  if (!nombreLimpio) return { ok: false, mensaje: 'Solicitud no válida' }

  const adjuntable = await encargoAdjuntable(rol, uid, encargoId)
  if (!adjuntable.ok) return adjuntable

  if ((await contarAdjuntos(encargoId)) >= MAX_ADJUNTOS_POR_ENCARGO) {
    return {
      ok: false,
      mensaje: `Máximo ${MAX_ADJUNTOS_POR_ENCARGO} archivos por encargo`,
    }
  }

  // El objeto debe existir (nadie registra rutas que no subió de verdad).
  const admin = createAdminClient()
  const nombreObjeto = ruta.slice(encargoId.length + 1)
  const { data: objetos, error: errorLista } = await admin.storage
    .from(BUCKET)
    .list(encargoId, { search: nombreObjeto })
  const objeto = (objetos ?? []).find((o) => o.name === nombreObjeto)
  if (errorLista || !objeto) {
    return { ok: false, mensaje: 'El archivo no terminó de subir, intenta de nuevo' }
  }
  const tamanoReal =
    typeof objeto.metadata?.size === 'number' ? objeto.metadata.size : 0

  const supabase = await createClient()
  const { error } = await supabase.from('encargo_adjuntos').insert({
    encargo_id: encargoId,
    subido_por: uid,
    nombre: nombreLimpio,
    ruta,
    mime,
    tamano_bytes: tamanoReal,
  })
  if (error) {
    console.error('Error al registrar evidencia:', error)
    return { ok: false, mensaje: 'No se pudo guardar, intenta de nuevo' }
  }
  return { ok: true }
}

/**
 * Borra un adjunto: PRIMERO la fila (cliente del usuario — la RLS decide
 * de forma atómica, y un delete de 0 filas se trata como fallo) y después
 * el objeto de Storage. Si Storage falla queda un objeto huérfano, el
 * residual aceptado por el spec; el orden inverso dejaría filas muertas
 * visibles en la UI.
 */
export async function borrarCore(
  rol: Rol,
  uid: string,
  adjuntoId: string
): Promise<ResultadoEvidencia> {
  if (!esUuid(adjuntoId)) return { ok: false, mensaje: 'Solicitud no válida' }

  const supabase = await createClient()
  const { data: fila } = await supabase
    .from('encargo_adjuntos')
    .select('id, encargo_id, ruta, subido_por, encargos ( estado, asignado_a )')
    .eq('id', adjuntoId)
    .maybeSingle()
  if (!fila) return { ok: false, mensaje: 'El archivo no existe' }

  const encargo = fila.encargos as unknown as {
    estado: EstadoEncargo
    asignado_a: string
  } | null
  if (rol === 'equipo') {
    if (fila.subido_por !== uid || !encargo || encargo.asignado_a !== uid) {
      return { ok: false, mensaje: 'No puedes borrar este archivo' }
    }
  }
  if (!encargo || !puedeAdjuntar(rol, encargo.estado)) {
    return {
      ok: false,
      mensaje:
        rol === 'equipo'
          ? 'La evidencia entregada ya no se puede retirar'
          : 'Un encargo aprobado ya no se puede modificar',
    }
  }

  const { data: borradas, error } = await supabase
    .from('encargo_adjuntos')
    .delete()
    .eq('id', adjuntoId)
    .select('id')
  if (error || (borradas ?? []).length === 0) {
    // 0 filas = la RLS lo negó (p. ej. el encargo cambió de estado en paralelo).
    if (error) console.error('Error al borrar adjunto:', error)
    return { ok: false, mensaje: 'No se pudo borrar, intenta de nuevo' }
  }

  const admin = createAdminClient()
  const { error: errorStorage } = await admin.storage
    .from(BUCKET)
    .remove([fila.ruta])
  if (errorStorage) {
    // Objeto huérfano en Storage: residual aceptado (spec §errores).
    console.error('Objeto de evidencia huérfano tras borrar fila:', errorStorage)
  }
  return { ok: true }
}

export type FilaAdjunto = {
  id: string
  encargo_id: string
  nombre: string
  ruta: string
  mime: string
  tamano_bytes: number
  subido_por: string
}

export type AdjuntoFirmado = {
  id: string
  encargoId: string
  nombre: string
  mime: string
  tamano: number
  url: string | null
  esMio: boolean
}

/**
 * Firma URLs de lectura (1 h) para filas que la consulta del usuario ya
 * devolvió vía RLS. Se llama desde server components; las páginas son
 * dinámicas, así que la caducidad no compite con el caché.
 */
export async function firmarAdjuntos(
  filas: FilaAdjunto[],
  uid: string | null
): Promise<AdjuntoFirmado[]> {
  if (filas.length === 0) return []
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      filas.map((f) => f.ruta),
      60 * 60
    )
  if (error) console.error('Error al firmar URLs de evidencia:', error)
  const porRuta = new Map(
    (data ?? []).map((u) => [u.path ?? '', u.signedUrl ?? null])
  )
  return filas.map((f) => ({
    id: f.id,
    encargoId: f.encargo_id,
    nombre: f.nombre,
    mime: f.mime,
    tamano: f.tamano_bytes,
    url: porRuta.get(f.ruta) ?? null,
    esMio: uid !== null && f.subido_por === uid,
  }))
}
