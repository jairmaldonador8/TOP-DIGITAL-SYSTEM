# Equipo por puesto y flujo de entregables — diseño

Fecha: 2026-11-09 · Rama: `fase-1` · Estado: aprobado por el usuario en el chat (A + B + vendedor)

## Por qué

Tadeo atiende 12 clientes fijos de Meta Ads y la meta es llegar a 25 a fin de año con un equipo de un puesto por persona. Hoy pierde unos 30 min diarios persiguiendo entregables y además organiza a mano el material del filmmaker para mandárselo al editor. Este diseño cubre las piezas A (perfiles del equipo) y B (flujo de entregables), más el perfil del vendedor. Las piezas C (vigilante de CPR), D (estrategia con IA) y E (brief creativo con IA) llevan su propio ciclo después.

## Alcance

Dentro:
1. Puestos: `project_manager`, `media_buyer`, `filmmaker`, `editor`, `disenador`, `vendedor`.
2. Perfil profesional de cada integrante (foto, nombre, puesto, bio, especialidades).
3. Asignación del equipo por cliente; cada integrante ve solo a sus clientes.
4. Ficha de cliente nueva con cuota mensual configurable y kit de marca.
5. Limpieza de los clientes actuales y carga nueva.
6. Entregables por ciclo (días 1 y 15) generados solos desde la cuota.
7. Cadena filmmaker → editor sin intermediarios.
8. Tablero de producción con semáforo, recordatorios automáticos y botón «Pedir».
9. Revisión con vista previa del archivo, una ronda de cambios.
10. CRM de ventas de Top Digital para el vendedor.

Fuera (ciclos posteriores): portal del cliente para aprobar, paquetes reales con sus valores (se capturan al final), Drive integrado, comisiones, IA, Meta.

## Decisiones

- **Se amplía `encargos`** en vez de crear una tabla `entregables`: se reutilizan el ciclo de estados, `encargo_adjuntos`, el chat, el push, la bandeja «Por revisar» y el trigger que hace terminal a `aprobado`.
- **Un solo rol de base (`equipo`) + `puesto`** decide qué ve cada quien. El JWT ya trae `user_role`; el puesto se lee de `usuarios` en las políticas mediante un helper `private.puesto_actual()`.
- **Bandeja común con acciones por puesto**: mismo esqueleto para todos, las acciones y el filtro cambian según el puesto.
- **Cuota configurable por cliente** (jsonb) con valores por defecto vacíos; los paquetes con nombre se agregan al final sin cambiar el modelo.
- **Tick cada 5 min con pg_cron + pg_net** hacia `/api/cron/tick` (diseño ya previsto en la Fase 2 de la agenda; skill `supabase-cron-tick`). Así no depende del plan de Vercel.

## Modelo de datos (migración 0024 en adelante)

### Puestos y perfil
- `create type public.puesto_equipo as enum ('project_manager','media_buyer','filmmaker','editor','disenador','vendedor')`.
- `usuarios.puesto` (hoy `text` libre) pasa a `puesto_equipo`; los valores existentes se migran o se vuelven null.
- Columnas nuevas en `usuarios`: `foto_ruta text`, `bio text`, `especialidades text[] default '{}'`, `capacidad_semanal int` (para la pieza de carga, opcional ahora).
- La foto vive en un bucket privado nuevo `perfiles`, servida por URL firmada.

### Asignación por cliente
```
cliente_equipo (
  cliente_id uuid references clientes on delete cascade,
  user_id uuid references auth.users on delete cascade,
  puesto puesto_equipo not null,
  primary key (cliente_id, puesto)      -- un responsable por puesto y cliente
)
```
Un integrante puede estar en muchos clientes. Helper `private.cliente_asignado(cliente_id)`: true si el usuario actual está en `cliente_equipo` para ese cliente.

### Ficha de cliente
Columnas nuevas en `clientes`:
- `fecha_arranque date`, `dia_cobro smallint`, `paquete text` (nombre libre por ahora).
- `cuota jsonb not null default '{}'`: `{ "imagen": n, "carrusel": n, "video": n, "produccion": n, "guion": n }` por ciclo.
- `kit_marca jsonb not null default '{}'`: `colores[]`, `tipografias[]`, `tono`, `notas`; los logos y fotos aprobadas viven en un bucket privado `marca` con una tabla `cliente_archivos (cliente_id, tipo 'logo'|'foto', ruta, nombre, mime)`.
- `es_nuevo` se deriva: `fecha_arranque` a 30 días o menos → prioridad.

### Entregables (ampliación de `encargos`)
- `tipo` enum `tipo_entregable` (`imagen`,`carrusel`,`video`,`produccion`,`guion`,`otro`), default `otro` para los encargos sueltos de hoy.
- `ciclo date` (día 1 o 15 al que pertenece; null en encargos sueltos).
- `fecha_cliente date` (la del ciclo) y `fecha_limite` pasa a ser la **fecha interna** = 2 días hábiles antes.
- `depende_de uuid references encargos` (video → su producción).
- `origen text check in ('manual','ciclo')`.
- `brief text`, `enlace_externo text` (Drive para videos pesados).
- Estado nuevo `esperando` al frente del enum: tarea creada pero bloqueada por su dependencia. Al aprobarse la producción, sus videos pasan a `pendiente`.
- Índice único `(cliente_id, ciclo, tipo, n)` con `n` = número de pieza, para que generar un ciclo dos veces no duplique.

### Leads de Top Digital
- `leads.asignado_a uuid references auth.users` (vendedor). Los prospectos de la agencia son los leads del cliente con `es_agencia = true`.

## Permisos (RLS)

| Puesto | Clientes | Entregables | Adjuntos | Leads | Finanzas |
|---|---|---|---|---|---|
| Admin (Tadeo) | todos | todos | todos | todos | sí |
| PM | asignados | todos los de sus clientes (lee); los suyos (avanza) | de sus clientes | no | no |
| Media buyer, filmmaker, editor, diseñador | asignados (ficha y kit, solo lectura) | los suyos | los suyos + los de su dependencia (el editor ve el material del filmmaker) | no | no |
| Vendedor | solo la ficha de la agencia | los suyos | los suyos | los de la agencia con `asignado_a` = él | no |

- El equipo nunca lee `campania_finanzas`, `presupuesto_ads` ni `meta_facturacion`: la ficha para el equipo se sirve con una RPC `ficha_cliente_equipo(cliente_id)` (security definer) que devuelve solo campos públicos y el kit; extiende la `ficha_clientes_equipo` actual.
- Se mantienen el WITH CHECK y el trigger que impiden autoaprobarse.
- Verificación: simulación SQL en vivo con uid ficticio por puesto (como en 0015–0018) y prueba de que un editor no lee un cliente que no tiene asignado.

## Generador de ciclos (lógica pura + server)

- `src/lib/entregables/ciclo.ts` (puro, testeado):
  - `fechaInterna(fechaCliente)`: resta 2 días hábiles (lun–vie, zona America/Mexico_City; sin feriados por ahora).
  - `siguientesCiclos(hoy)`: próximos días 1 y 15.
  - `piezasDelCiclo(cuota, equipoAsignado)`: lista de piezas con tipo, número, responsable por puesto (`imagen`/`carrusel` → diseñador, `video` → editor, `produccion` → filmmaker, `guion` → PM) y dependencias (cada video depende de la producción del ciclo si existe).
  - Cliente nuevo: los plazos del editor se acortan a 2 días y la prioridad pasa a `alta`.
- `generarCiclo(clienteId, ciclo)` en servidor: inserta con `on conflict do nothing`. Se dispara (a) solo desde el tick, 7 días antes de cada ciclo, y (b) a mano con un botón «Generar ciclo» en la ficha.
- Si falta el responsable de un puesto, la pieza se crea asignada a Tadeo y marcada «sin responsable» para que se vea en el tablero.

## Cadena filmmaker → editor

1. El filmmaker abre su producción, sube el material (archivos o enlace) y marca «Material listo» (= `entregado`).
2. Al aprobarla Tadeo o el PM (o automáticamente si la producción no requiere revisión: flag por cliente, default true), los videos `esperando` de ese ciclo pasan a `pendiente` y se le avisa al editor.
3. El editor ve el material de la producción dentro de su tarea, sin pedirlo por chat.

## Fin de «pedir entregables»

- **Semáforo** por pieza: verde (a tiempo), amarillo (fecha interna en 1 día hábil o menos y sin entregar), rojo (fecha interna vencida), gris (esperando dependencia o al cliente).
- **Tablero de producción** (`/agencia/produccion`): filas por cliente, columnas por tipo, del ciclo actual y el siguiente; tocar una celda abre las piezas. Filtro por puesto e integrante.
- **Recordatorios** desde el tick: push al responsable 2 días hábiles antes de la fecha interna y el mismo día a las 9:00; se registran en `avisos_enviados` para no repetir.
- **Mi día de Tadeo** suma la tarjeta «Atrasado» con lo rojo.
- **Botón «Pedir»** en cada pieza: un toque manda push y deja un mensaje automático en el chat del integrante («Tadeo pregunta por: …»).

## Revisión

- La bandeja «Por revisar» muestra la vista previa (imagen, video con `<video>`, enlace de Drive) dentro de la tarjeta.
- Aprobar o «Pedir cambios» con comentario. Una sola ronda: si una pieza ya tuvo cambios, el segundo «Pedir cambios» pide confirmación y la marca «fuera de ronda».
- El PM también puede revisar las piezas de sus clientes.

## Pantallas (mobile first, marca Top Digital)

Equipo (barra inferior): **Mi trabajo** · **Chat** · **Clientes** · **Perfil**.
- Mi trabajo: secciones Hoy / Esta semana / Esperando, tarjetas con cliente, tipo, semáforo y la acción del puesto («Subir material», «Entregar video», «Entregar post», «Entregar guion»).
- Detalle de pieza: brief, kit de marca del cliente, material de la dependencia, archivos propios, historial y comentario de revisión.
- Vendedor: su barra cambia **Clientes** por **Prospectos** (pipeline por etapa con arrastre; ya existe `@dnd-kit`).

Tadeo: **Producción** (tablero nuevo) en la barra o en «Más», ficha de cliente nueva con pestañas Datos · Kit · Equipo · Cuota, y «Equipo» con perfiles y asignaciones.

## Limpieza y carga

- Respaldo en JSON de `clientes` y tablas relacionadas antes de borrar (carpeta `Documents/Respaldos Top Digital/`).
- Borrado de los 5 clientes actuales salvo el registro `es_agencia` (se necesita para los prospectos). Requiere confirmación del usuario antes de ejecutarse.
- Carga nueva desde la ficha (formulario) y, para la carga masiva, un script `scripts/cargar-clientes.ts` que lee un CSV.

## Errores y bordes

- Generar un ciclo dos veces no duplica (índice único).
- Cambiar la cuota a media quincena solo afecta ciclos no generados.
- Quitar a un integrante de un cliente reasigna sus piezas abiertas a Tadeo con aviso.
- El tick responde 200 aunque falle un cliente y registra el error; un fallo no frena a los demás.
- Archivos: límite por archivo según el plan (50 MB en el plan gratis); videos más pesados van por enlace.

## Pruebas

- Unitarias: `fechaInterna`, `siguientesCiclos`, `piezasDelCiclo`, semáforo.
- RLS: simulación SQL por puesto en la base real.
- E2E con Playwright a 390×844 en producción, con cuentas temporales que se borran al terminar: Tadeo crea un cliente con cuota y equipo → genera el ciclo → el filmmaker sube material → el video se desbloquea → el editor entrega → Tadeo pide cambios → el editor corrige → Tadeo aprueba; el vendedor mueve un prospecto; un editor no ve un cliente ajeno.

## Orden de construcción

1. Migraciones: puestos, perfil, `cliente_equipo`, ficha, ampliación de encargos, leads.asignado_a, RLS y RPC.
2. Lógica pura del ciclo con pruebas.
3. Ficha de cliente nueva y equipo/asignaciones (Tadeo).
4. Limpieza y carga.
5. Mi trabajo del equipo con acciones por puesto y detalle de pieza.
6. Cadena filmmaker → editor.
7. Tablero de producción, semáforo, «Pedir».
8. Tick con pg_cron: generación automática y recordatorios.
9. Revisión con vista previa.
10. Prospectos del vendedor.
11. E2E y publicación.

## Precisiones tras la revisión del spec

Estas reglas mandan sobre cualquier frase anterior que las contradiga.

**Migraciones**
- `0024` solo agrega valores de enum: `alter type estado_encargo add value 'esperando' before 'pendiente'` y crea `puesto_equipo` y `tipo_entregable`. Nada en 0024 usa esos valores; todo lo demás va de `0025` en adelante (misma razón que `equipo` en 0015).
- Mapeo de `usuarios.puesto` texto → enum, por coincidencia sin acentos ni mayúsculas: contiene «dise» → `disenador`; «edit» → `editor`; «film» o «video» sin «edit» → `filmmaker`; «project» o «pm» → `project_manager`; «media» → `media_buyer`; «vend» → `vendedor`; cualquier otro → null. Un `check` exige `puesto` no nulo para los usuarios de rol `equipo` creados desde ahora (los existentes en null se avisan en Equipo para completarlos).
- Trigger en `cliente_equipo` que exige que `puesto` coincida con `usuarios.puesto` del integrante.

**Columnas que faltaban en `encargos`**
- `pieza smallint` (número de pieza dentro del ciclo y tipo); índice único `(cliente_id, ciclo, tipo, pieza) where origen = 'ciclo'`.
- `sin_responsable boolean not null default false`.
- `rondas_cambios smallint not null default 0` y `fuera_de_ronda boolean not null default false`.
- El trigger `encargos_congelar_columnas` (0017) se amplía: para no-admins quedan congeladas también `tipo`, `ciclo`, `pieza`, `fecha_cliente`, `depende_de`, `origen`, `brief`, `sin_responsable`, `rondas_cambios`, `fuera_de_ronda` y `cliente_id`. `enlace_externo` sí lo puede cambiar el responsable mientras la pieza está en sus manos.

**Revisión y desbloqueo (fuera de la RLS directa)**
- La revisión pasa por una RPC `security definer` `revisar_encargo(encargo_id, accion 'aprobar'|'cambios', comentario)`. Permitido a admin y al PM asignado al cliente de la pieza, nunca sobre una pieza propia. Lleva la ronda: el primer «cambios» suma 1 a `rondas_cambios`; uno posterior marca `fuera_de_ronda = true`.
- El desbloqueo es un trigger `AFTER UPDATE` `security definer` en `encargos`: cuando una pieza `produccion` pasa a `aprobado`, sus dependientes en `esperando` pasan a `pendiente` y su `fecha_limite` se recalcula. El aviso push al editor lo manda el servidor después del cambio.
- Columna nueva `clientes.produccion_requiere_revision boolean not null default true` (true = Tadeo o el PM revisa el material). Con false, el mismo trigger aprueba la producción en cuanto el filmmaker la entrega.
- Cliente nuevo: el plazo del editor es 2 días hábiles contados desde la aprobación de la producción.

**Archivos**
- El bucket `evidencias` sube a 50 MB por archivo (el máximo del plan gratis) y acepta además `video/quicktime`, `image/heic` e `image/webp`. Al pasar a Supabase Pro se sube a 500 MB. Lo más pesado va por `enlace_externo`.
- `cliente_archivos`: RLS admin todo; lectura para quien tenga `cliente_asignado`. Los buckets `marca` y `perfiles` siguen el patrón de 0020: sin políticas de storage, URLs firmadas emitidas en el servidor tras validar contra la tabla.

**Fichas y vendedor**
- La RPC vieja `ficha_clientes_equipo()` cambia su filtro a `cliente_asignado(id)`; la nueva `ficha_cliente_equipo(cliente_id)` devuelve una sola ficha con su kit.
- El vendedor entra a la agencia con una fila en `cliente_equipo` (cliente `es_agencia`, puesto `vendedor`). Puede leer, crear y actualizar los leads y `seguimientos` de la agencia cuyo `asignado_a` sea él; al crear, `asignado_a` se fuerza a su uid. No los puede borrar.

**Responsable por defecto y limpieza**
- Tabla `ajustes (clave text primary key, valor jsonb)` solo-admin; `responsable_por_defecto` guarda el uid de Tadeo. Las piezas sin responsable se le asignan a él.
- La limpieza borra en orden: `encargo_adjuntos` → `encargos` → `seguimientos` → `leads` → `campania_metricas_diarias` → `campania_finanzas` → `campanias` → `mensajes` → `notificaciones` → `reportes_semanales` → `usuarios` de rol cliente → `clientes`, conservando el cliente `es_agencia`.

**Punto de control**
- Después de los pasos 1 a 4 (esquema, lógica del ciclo, ficha y limpieza) se valida la RLS con la simulación por puesto antes de construir las pantallas del equipo.
