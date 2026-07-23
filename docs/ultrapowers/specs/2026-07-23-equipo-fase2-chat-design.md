# Spec: Módulo de equipo — Fase 2 (chat dueño↔trabajador y edición de encargos)

**Fecha:** 2026-07-23 · **Estado:** aprobado en el diseño del módulo (2026-07-23-equipo-encargos §1 y §5); cierra los diferidos de Fase 1.

## 1. Alcance

1. **Chat 1:1 en tiempo real** entre el dueño y cada trabajador, con la misma
   tecnología del chat con clientes (tabla + RLS + trigger de broadcast a
   canal privado; nunca postgres_changes).
2. **`editarEncargo`**: el dueño edita encargos no aprobados, desde una vista
   de los encargos de cada integrante.
3. Fuera de alcance: chat trabajador↔trabajador, adjuntos, notificaciones
   push, campanita con historial para equipo (los no-leídos del chat bastan).

## 2. Datos (migración 0018_chat_equipo)

Tabla `mensajes_equipo` espejo de `mensajes` con hilo por trabajador:
`id, trabajador_id uuid not null → auth.users (clave del hilo), autor_id uuid → auth.users,
autor_nombre text not null, texto text not null, leido bool default false,
created_at timestamptz default now()`.
Índices: `(trabajador_id, created_at)` y parcial `(trabajador_id) where not leido`.

**RLS** (patrón de `mensajes` 0004/0006):
- select: `is_admin()` **o** `trabajador_id = auth.uid()`.
- insert: `autor_id = auth.uid()` **y** (`is_admin()` **o** `trabajador_id = auth.uid()`).
- update: misma condición que select; a nivel columnas
  `revoke update / grant update (leido)` — texto y autoría congelados.

**Broadcast:** trigger after insert → `realtime.broadcast_changes` al canal
privado **`chat:equipo:<trabajador_id>`**. El prefijo `chat:` es deliberado:
la política existente de `realtime.messages` ya deja al admin unirse a
`chat:%`; se agrega una política para que el trabajador se una **solo** a
`chat:equipo:<su uid>`. `revoke execute` de la función del trigger (patrón
0007). No se toca el canal `chat:agencia` ni el flujo de clientes.

## 3. Server actions

- `src/app/(app)/equipo/actions.ts`: `enviarMensajeEquipo(formData)` — rol
  equipo; inserta `{trabajador_id: mi uid, autor_id: mi uid, autor_nombre, texto}`
  (validación: texto no vacío, ≤ 2000). `marcarMensajesEquipoLeidos()` — marca
  `leido` los mensajes de su hilo con `autor_id != mi uid`.
- `src/app/(app)/agencia/equipo/actions.ts`: `enviarMensajeATrabajador(trabajadorId, formData)`
  y `marcarLeidosDeTrabajador(trabajadorId)` — solo admin, validación uuid.
- `editarEncargo(encargoId, _prev, formData)` — solo admin; mismos campos y
  validación que `crearEncargo`; rechaza si `estado = 'aprobado'` (además la
  base lo bloquea por el trigger 0017). Cambiar `asignado_a` está permitido
  (reasignar); el estado NO se toca aquí.

## 4. UI

### Trabajador (`/equipo`)
- `ChatFlotante` se **parametriza** (props opcionales: `topico`, `titulo`,
  `subtitulo`, `inicialAvatar`, con defaults = comportamiento actual del
  portal, cero cambios para clientes) y se monta en el layout de /equipo:
  hilo con el dueño, globito de no leídos, tiempo real vía
  `useCanalChat('chat:equipo:<mi uid>')`.

### Dueño (`/agencia/equipo`)
- La tarjeta de cada integrante gana: **botón de chat** con globito de no
  leídos (mensajes del trabajador sin leer) que abre un **dialog de
  conversación** (HiloMensajes + FormularioMensaje reutilizados, suscrito al
  canal del trabajador — los hilos llegan del server: últimos 100 por
  trabajador, pocos integrantes), y **click en la tarjeta** que abre el
  dialog "Encargos de X": lista con estado/prioridad y lápiz de edición en
  los no aprobados → form de edición (reutiliza el formulario de encargo con
  valores iniciales y action `editarEncargo`).
- Los no-leídos del dueño también suman al badge de la tarjeta del navegador
  ya existente… (NO: fuera de alcance — solo globito en la tarjeta del
  integrante y refresh en tiempo real de la página).

## 5. Pruebas

- Unitarias: validación de mensaje (módulo puro si aplica) y edición
  (reutiliza validaciones existentes); suite completa + tsc + eslint + build.
- Verificación en vivo (Playwright, cuenta de prueba): trabajador envía
  mensaje → aparece al dueño en tiempo real y viceversa; no-leídos correctos;
  editar un encargo pendiente se refleja al trabajador; borrar datos de
  prueba al final.
- Seguridad en vivo (SQL simulado): un trabajador no lee hilos ajenos; un
  cliente no lee mensajes_equipo.
