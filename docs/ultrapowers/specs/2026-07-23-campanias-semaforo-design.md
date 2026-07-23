# Spec: Vista de campañas por cliente con semáforo de salud

**Fecha:** 2026-07-23 · **Estado:** Aprobado por el usuario (diseño conversacional)
**Contexto:** tras cargar los 6 clientes reales desde Meta hay 747 campañas; la vista
actual (lista plana) es ruido. Se rediseña la página de Campañas de la agencia.

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Ventana del semáforo | **Últimos 7 días** — el sync trae, además de los totales de vida, gasto y conversaciones de los últimos 7 días por campaña (una llamada extra de insights por cliente). |
| Criterio | **Automático relativo** al promedio histórico del cliente (cero configuración). |
| Navegación | El cuadrito del cliente **se expande en la misma página**; la ficha del cliente (pestaña Campañas) no cambia. |
| Sensibilidad | `gasto_7d` vive en `campania_finanzas` (RLS solo-admin). `conversaciones_7d` vive en `campanias` (los clientes ya ven resultados). El portal no cambia. |

## 2. Semáforo (regla de negocio)

Para cada campaña, con `promedio` = CPL histórico del cliente
(`sum(gasto vida) / sum(conversaciones vida)` sobre todas sus campañas; si el
cliente no tiene conversaciones históricas, `promedio = null`):

Las reglas se evalúan **en orden de prioridad; gana la primera que aplique**
(así no hay traslapes por definición):

| # | Color | Condición |
|---|---|---|
| 1 | ⚪ `gris` | `estado != 'activa'` **o** `gasto_7d == 0` |
| 2 | 🔴 `rojo` | `conversaciones_7d == 0` **o** (`promedio != null` y `cpl_7d > 2 × promedio`) |
| 3 | 🟢 `verde` | `promedio == null` **o** `cpl_7d <= promedio` |
| 4 | 🟠 `ambar` | resto (`promedio < cpl_7d <= 2 × promedio`) |

donde `cpl_7d = gasto_7d / conversaciones_7d`. Notas: `promedio == null` (cliente
sin conversaciones históricas) nunca produce `rojo` por costo — solo por gastar
sin conversaciones (regla 2, primer término); una campaña activa con
conversaciones pero `gasto_7d == 0` (atribución tardía de Meta) es `gris` por la
regla 1. La función es **pura** y va en `src/lib/campanias/salud.ts` con tests
exhaustivos (incluye: promedio null, gasto sin conversaciones, conversaciones
sin gasto, y exactamente 1× y 2× el promedio — bordes inclusivos como en la
tabla).

## 3. Datos

- **Migración 0013:** `campanias.conversaciones_7d int not null default 0`;
  `campania_finanzas.gasto_7d numeric not null default 0`.
- **Sync (`src/lib/meta/sync.ts`):** por cliente, una llamada extra
  `GET /act_<id>/insights?level=campaign&fields=campaign_id,spend,actions&date_preset=last_7d`
  (nombre exacto del preset a confirmar en investigación). Se mapea con las
  mismas funciones puras (`conversacionesDe`, `gastoDe`) y se escribe
  `conversaciones_7d` en el upsert de `campanias` y `gasto_7d` en el de
  `campania_finanzas`. Campaña sin fila en la ventana → 0 y 0.

## 4. UI — página de Campañas (agencia)

- **Cuadrícula por cliente** (2 cols móvil → 4 desktop). Cada cuadrito:
  nombre del negocio, burbuja con nº de campañas **activas**, resumen
  `🟢 n · 🟠 n · 🔴 n` (solo colores con conteo > 0; sin campañas activas →
  texto "Sin campañas activas"; con activas pero todas grises → texto
  "Sin gasto esta semana").
- **Orden de clientes:** con rojas primero (desc por nº de rojas), luego por
  activas desc, luego alfabético.
- **Expansión:** tocar un cuadrito muestra las campañas de ese cliente en la
  misma página (los demás cuadritos se ocultan; botón "← Todos los clientes"
  para volver). Lista ordenada rojo → ámbar → verde → gris, mostrando por
  campaña: punto de color, nombre, badge Meta, conversaciones_7d, gasto_7d y
  cpl_7d (página solo-admin; formatoMoneda existente). Acciones actuales se
  conservan (aviso de solo lectura Meta / pausar campañas manuales).
- **Alcance visible:** por defecto solo campañas activas o con actividad en 7
  días (`gasto_7d > 0` **o** `conversaciones_7d > 0`); el resto en sección
  colapsada "Ver todas (N)" con render diferido
  (cuentas de 200–355 campañas no deben montar cientos de nodos de golpe).
- El encabezado conserva `BotonSincronizar` (última corrida) y "Nueva campaña".
- **Server-side:** la página agrega por cliente y calcula el semáforo en el
  servidor; al componente cliente solo llegan datos ya clasificados.

## 5. Fuera de alcance

- Cambios al portal del cliente y a la ficha del cliente (pestaña Campañas).
- Umbrales configurables por cliente.
- Ventanas adicionales (30 días) o gráficas de tendencia.

## 6. Pruebas

- Unitarias de `salud.ts` (todos los bordes de la tabla §2).
- Unitarias del mapeo de la ventana 7d en el sync (campaña presente/ausente en
  la respuesta de 7 días).
- Suite completa + `tsc` + `eslint` + `next build` verdes.
