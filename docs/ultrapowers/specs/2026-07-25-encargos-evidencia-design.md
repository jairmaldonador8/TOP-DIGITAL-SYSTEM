# Evidencia de trabajo en encargos — diseño

**Fecha:** 2026-07-25 · **Estado:** aprobado (modo autónomo delegado por el usuario)

## Contexto y propósito

Los encargos del equipo (migración 0015, spec 2026-07-23) hoy se entregan "a ciegas":
el trabajador marca `entregado` y el dueño aprueba o pide cambios sin ver el trabajo
dentro del sistema. La investigación de mercado (jul 2026) mostró que las fotos y
archivos de evidencia adjuntos al trabajo son funcionalidad estándar en todos los
líderes del sector (Jobber, Housecall Pro, Connecteam).

Meta: el trabajador adjunta archivos de evidencia a su encargo; el dueño los ve al
revisar. Sin cambios para el rol `cliente` (los encargos siguen siendo internos).

## Alcance

- **Sí:** adjuntos por encargo (subir, listar, descargar, borrar), UI en el detalle
  del encargo del trabajador y en la bandeja de revisión + gestión del dueño.
- **No (YAGNI):** evidencia obligatoria para entregar, comentarios por adjunto,
  versionado, visibilidad para el cliente, compresión de imágenes en cliente.

## Modelo de datos (migración 0020)

Tabla `public.encargo_adjuntos`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `encargo_id` | uuid not null | FK → `encargos(id)` **on delete cascade** |
| `subido_por` | uuid not null | FK → `auth.users(id)` |
| `nombre` | text not null | nombre original mostrado en UI |
| `ruta` | text not null unique | ruta en Storage: `{encargo_id}/{uuid}.{ext}` |
| `mime` | text not null | validado en la action |
| `tamano_bytes` | bigint not null | validado ≤ 25 MB |
| `created_at` | timestamptz | `now()` |

Índice por `encargo_id`.

**Bucket privado `evidencias`** (Storage), con `file_size_limit` = 25 MB y
`allowed_mime_types` fijados a nivel bucket (defensa aunque se brinque la action).
Se crea con DML (`insert into storage.buckets ... on conflict do nothing`) en la
migración; si el proyecto hosteado rechaza ese insert, se crea vía API de admin
(`createBucket`) y la migración solo documenta. **Sin políticas en
`storage.objects`**: el bucket queda default-deny y todo acceso pasa por URLs
firmadas emitidas en server actions (ver abajo) — esto evita el problema de que
en Supabase hosteado el rol `postgres` ya no puede crear políticas sobre el
esquema `storage` desde migraciones.

### RLS (patrón del proyecto: admin todo; equipo solo lo suyo)

`encargo_adjuntos`:
- `select`/`insert`/`delete` admin: `private.is_admin()`.
- `select` equipo: existe encargo con `id = encargo_id` y `asignado_a = auth.uid()`.
- `insert` equipo: mismo encargo propio **y** `estado in ('en_progreso','cambios')`
  y `subido_por = auth.uid()`.
- `delete` equipo: adjunto propio (`subido_por = auth.uid()`) de encargo propio con
  `estado in ('en_progreso','cambios')` (tras entregar ya no se retira evidencia).
- Sin `update` para nadie (los adjuntos son inmutables; se borra y se resube).

## Server actions y transporte de archivos

**Los archivos NO pasan por server actions** (el body de una action está limitado
y proxearlos gasta cómputo): el navegador sube directo a Storage con una URL
firmada de subida. El cliente admin existente (`src/lib/supabase/admin.ts`,
`SUPABASE_SECRET_KEY`) firma; la autorización real se valida antes en la action
contra la tabla `encargos`/`encargo_adjuntos` (que sí tienen RLS).

Flujo de subida (trabajador, en `src/app/(app)/equipo/actions.ts`; el admin tiene
las mismas actions en `src/app/(app)/agencia/equipo/actions.ts` sin la
restricción de estado):

1. `prepararSubidaEvidencia(encargoId, nombre, mime, tamano)` → valida rol,
   encargo propio, `estado in ('en_progreso','cambios')` (solo equipo), mime
   permitido, tamaño ≤ 25 MB, máximo 10 adjuntos; genera ruta
   `{encargoId}/{uuid}.{ext}` y devuelve `createSignedUploadUrl` (admin client).
2. El navegador sube con `uploadToSignedUrl(ruta, token, file)`.
3. `registrarEvidencia(encargoId, ruta, nombre, mime, tamano)` → re-valida todo,
   verifica que la ruta pertenece al encargo (prefijo) y que el objeto existe en
   Storage (admin client), e inserta la fila con el cliente del usuario (la RLS
   de la tabla vuelve a imponer permisos). `revalidatePath` al final.

- `borrarEvidencia(adjuntoId)` → lee la fila con el cliente del usuario (RLS),
  valida estado para equipo; borra primero el objeto (admin client) y luego la
  fila; si Storage falla, no borra la fila y reporta error.
- Descargas/vistas: los server components de las páginas generan signed URLs de
  1 hora (admin client) para las filas que la consulta del usuario ya devolvió
  vía RLS — no hay action de descarga; las páginas son dinámicas.

Objeto huérfano (subido pero nunca registrado): aceptado como residual — el
bucket impone tipo/tamaño y la ruta caduca; limpieza manual si algún día estorba.

Tipos permitidos: imágenes (`jpeg/png/webp/gif`), `pdf`, `zip`, `mp4`.
Resultado `{ ok, ... } | { ok:false, mensaje }` como `ResultadoAvance` existente.

Lógica pura compartida en `src/lib/equipo/evidencia.ts`: lista de mimes, límites,
`puedeAdjuntar(rol, estado)`, sanitización de extensión — con tests unitarios.

## UI

- **Trabajador — `DetalleEncargo` (`lista-encargos.tsx`):** sección "Evidencia"
  dentro del dialog: miniaturas/íconos + nombre, botón "Agregar evidencia"
  (input file) visible solo cuando `puedeAdjuntar('equipo', estado)`; borrar con
  confirmación mientras pueda adjuntar. Toasts de éxito/error como el resto.
- **Dueño — `BandejaRevision`:** en cada entrega, contador y lista de adjuntos
  con enlace (signed URL) para abrirlos antes de aprobar/pedir cambios.
- Las imágenes se muestran como miniatura (img con signed URL); el resto con
  ícono por tipo + nombre.
- Los adjuntos viajan al server component padre en la consulta de encargos
  (join a `encargo_adjuntos`) para no pedir datos desde el cliente.

## Errores y casos borde

- Archivo rechazado (tipo/tamaño/límite de 10): mensaje claro en toast, sin subir.
- Encargo aprobado o entregado: sin botón de subir para equipo (y RLS lo respalda).
- Subida directa interrumpida (URL firmada emitida, objeto nunca subido o nunca
  registrado): residual aceptado; el bucket impone tipo/tamaño.
- Fila huérfana (objeto borrado a mano): la UI muestra el adjunto; al abrirlo la
  signed URL falla — aceptable, el admin puede borrarlo.

## Testing

- Unitarios (`vitest`): `evidencia.ts` (mimes, límites, `puedeAdjuntar`,
  sanitización de extensión).
- Integración RLS (`test:rls`, patrón existente `rls.integration`): equipo no lee
  adjuntos ajenos; no inserta en encargo ajeno ni en estado `entregado/aprobado`;
  admin todo; cliente nada.
- Manual: build + flujo completo en dev.
