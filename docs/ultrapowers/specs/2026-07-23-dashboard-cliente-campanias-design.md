# Spec: Dashboard de campañas por cliente (expansión "another level")

**Fecha:** 2026-07-23 · **Estado:** Aprobado por el usuario (diseño conversacional)
**Contexto:** la expansión del cuadrito de cliente en /agencia/campanias (spec
2026-07-23-campanias-semaforo) se eleva a un mini-dashboard con KPIs, gráficas
de tendencia y track de presupuesto.

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Ubicación | La expansión in-place actual en la vista de Campañas se convierte en el dashboard. Cuadrícula y semáforo quedan igual. |
| Serie diaria | El sync guarda métricas **día por día de los últimos 30 días** por campaña (una llamada extra por cliente, `time_increment=1`). |
| Track de progreso | Gasto acumulado del mes vs `clientes.presupuesto_ads` (campo existente). Sin presupuesto capturado → invitación a configurarlo. |
| Comparativas | Esta semana (últimos 7 días) vs la semana anterior (días 8–14), calculadas de la serie diaria. |
| Visibilidad | Solo agencia. El portal del cliente NO cambia. |
| Gráficas | SVG propio (patrón Dona/sparkline existente), sin librerías nuevas. Cargar el skill `dataviz` antes de escribir el código de gráficas. |

## 2. Datos

### Migración 0014 — `campania_metricas_diarias`

```sql
create table public.campania_metricas_diarias (
  campania_id uuid not null references public.campanias (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id),
  fecha date not null,
  gasto numeric not null default 0,
  conversaciones int not null default 0,
  primary key (campania_id, fecha)
);
create index campania_metricas_diarias_cliente_fecha_idx
  on public.campania_metricas_diarias (cliente_id, fecha);
```

RLS **solo-admin** (mismo patrón `private.is_admin()` de `campania_finanzas`:
contiene gasto). Comentario de tabla: ventana rodante de 30 días desde Meta;
retención 90 días.

### Sync

- Cuarta llamada por cliente:
  `GET /act_<id>/insights?level=campaign&fields=campaign_id,spend,actions&date_preset=last_30d&time_increment=1`
  (verificar shape en vivo antes de implementar: cada fila trae `date_start`).
- `InsightCampania` gana `date_start?: string`.
- Función pura nueva `prepararMetricasDiarias(idPorMeta, clienteId, insightsDiarios)`
  → filas `{ campania_id, cliente_id, fecha, gasto, conversaciones }` usando
  `gastoDe`/`conversacionesDe`; solo campañas presentes en `idPorMeta` (el map
  meta_campaign_id → id interno que devuelve el upsert de campanias). Tests:
  varias fechas por campaña, campaña desconocida se ignora, fila sin acciones.
- Upsert `onConflict: 'campania_id,fecha'` (idempotente).
- **Poda de retención:** UNA vez por corrida, después del loop de clientes
  (paso global, como el cierre de la bitácora): `delete` de filas con
  `fecha < hoy - 90 días`. Su fallo se registra como `{ cliente: null, ... }`
  en `errores` (patrón de fallos de corrida), no atribuido a un cliente.
- El fallo de la llamada diaria o su upsert se registra como error del cliente
  (aislado, como todo lo demás) sin tumbar el resto del sync.

## 3. Módulo puro `src/lib/campanias/metricas.ts`

Entrada: filas diarias del cliente `{ fecha: string; gasto: number; conversaciones: number }[]`
(ya agregadas por día entre todas sus campañas — la página hace esa suma, §5).

- `serieDiaria(filas, dias, hoy)` → arreglo de `dias` puntos consecutivos
  terminando en `hoy` (huecos rellenos con 0), para la gráfica.
- `deltasSemana(filas, hoy)` → `{ conversaciones, gasto, cpl }` de los últimos
  7 días y el porcentaje de cambio vs los 7 anteriores. Delta null cuando la
  semana anterior fue 0 (evitar % infinitos); cpl null sin conversaciones.
- `gastoDelMes(filas, hoy)` → suma del mes calendario en curso (fechas ya en
  hora de México: `hoy` viene de `hoyEnMexico()`).
- `proyeccionMes(gastoMes, hoy)` → gasto proyectado al cierre
  (`gastoMes / díaDelMes × díasDelMes`); null si `gastoMes == 0`.

Todos con tests (huecos, mes con 31/30/29 días vía `hoy` inyectado, semana
anterior en 0).

## 4. UI — `DetalleCliente` se convierte en dashboard

Orden vertical (mobile-first, estética existente: Card, auras, gradientes de
marca, CifraAnimada, formatoMoneda):

1. **Fila de KPIs** (grid 2×2 móvil, 4 en desktop): Conversaciones 7d,
   Gasto 7d, Costo por conversación 7d, Campañas activas. Los tres primeros
   con delta vs semana anterior: flecha + %, verde cuando el cambio es bueno
   para el negocio (conversaciones ↑ verde; gasto/cpl ↑ rojo), gris sin delta
   (semana anterior 0). El tile de Campañas activas NO lleva delta (no hay
   serie histórica de conteo): muestra el mini-conteo del semáforo en su lugar.
2. **Track del mes**: barra de progreso gasto del mes vs `presupuesto_ads`
   (% y monto restante). Estados: sin presupuesto → texto + liga a la ficha
   del cliente ("Configura su presupuesto"); proyección > presupuesto →
   aviso "A este ritmo cerrará en ~$X" en ámbar/rojo.
3. **Gráfica 30 días** (`grafica-area.tsx`): área de conversaciones por día
   (degradado de marca) + barras/línea tenue de gasto diario; eje X con
   fechas cortas; tooltip/valor al tocar un día (aceptable: resaltar el punto
   y mostrar el valor en un caption fijo — sin overlays complejos). Serie
   completa en 0 → estado vacío "Los datos diarios se llenan con la próxima
   sincronización".
4. **Top campañas de la semana** (`barras-campanias.tsx`): barras horizontales
   de las campañas con actividad 7d (máx. 6, orden gasto desc): nombre,
   conversaciones, gasto y su barra proporcional al gasto de la mayor.
5. **Lista de campañas con semáforo** (la actual `FilaCampania`) al final.

Accesibilidad: deltas con texto (no solo color/flecha), gráfica con
`role="img"` y `aria-label` resumen ("Conversaciones por día, promedio X").

## 5. Data flow

La página agrega server-side: consulta `campania_metricas_diarias` desde
**la fecha más antigua entre el día 1 del mes en curso y hoy−29 días** (así
`gastoDelMes` siempre ve el mes completo, incluso el día 31), agrega por
cliente+día, corre `metricas.ts`
y adjunta a cada `ClienteSemaforo` un bloque `dashboard` con: serie de 30
puntos, deltas, gastoMes, proyección, presupuesto y top campañas 7d. El
componente cliente solo pinta. Payload: 6 clientes × 30 puntos + ≤6 top — trivial.

## 6. Fuera de alcance

- Dashboard en el portal del cliente (fase siguiente).
- Métricas adicionales de Meta (alcance, clics, frecuencia).
- Selector de rango (fijo: 7d para KPIs, 30d para la gráfica, mes para budget).
- Librerías de gráficas.

## 7. Pruebas

- Unitarias de `metricas.ts` (todos los bordes de §3) y
  `prepararMetricasDiarias` (§2).
- Suite completa + tsc + eslint + build verdes; verificación visual Playwright
  en producción tras el deploy + sync real.
