# Reporte semanal automático (sin IA) — diseño

**Fecha:** 2026-07-25 · **Estado:** aprobado (modo autónomo delegado por el usuario)

## Propósito

Cada lunes por la mañana el dueño recibe un resumen de la semana que terminó:
leads, cierres y monto, seguimientos, encargos (entregados/aprobados/atrasados)
y desglose por cliente — sin escribir nada. Primer paso del plan gratuito
(investigación jul 2026); cuando llegue WhatsApp Cloud API solo cambia el canal
de entrega, y cuando llegue IA solo cambia la redacción.

## Diseño

- **Migración 0021** — tabla `reportes_semanales`: `id`, `semana_inicio date
  unique` (lunes de la semana reportada), `datos jsonb`, `created_at`. RLS:
  solo admin (select). El cron inserta con el cliente admin (bypass).
- **Semana**: lunes 00:00 a domingo 24:00 **hora de México** (UTC-6 fijo).
  `rangoSemanaPasada(ahora)` (pura, testeable) devuelve `{ inicio, fin,
  desdeUtc, hastaUtc }` — fin exclusivo (lunes siguiente 06:00Z).
- **`generarReporteSemanal`** (`src/lib/reportes/semanal.ts`, admin client —
  el cron no tiene sesión): leads con `created_at` en el rango (nuevos),
  `etapa='ganado'` con `fecha_cierre` en el rango (cierres + monto),
  seguimientos del rango, encargos `entregado_en`/`aprobado_en` del rango,
  atrasados hoy (`fecha_limite < hoy` y estado activo), y top de clientes por
  leads/ventas. Upsert por `semana_inicio` (re-ejecutar el cron es idempotente).
- **`textoWhatsApp(datos)`** (pura, testeable): mensaje listo para reenviar.
- **Cron**: `GET /api/cron/reporte-semanal` con el patrón `CRON_SECRET`
  fail-closed de meta-sync; en `vercel.json`: `0 14 * * 1` (8:00 CDMX lunes).
- **UI**: card "Resumen semanal" al inicio de `/agencia/reportes` con el último
  reporte (leído vía RLS con el cliente del usuario) y botón "Compartir por
  WhatsApp" (`https://wa.me/?text=` + texto urlencoded) — server-rendered.

## Fuera de alcance (YAGNI)

Semáforo de campañas en el reporte (depende de métricas Meta con su propio
ciclo), histórico navegable de reportes, envío por email, redacción con IA.

## Testing

Unitarios de `rangoSemanaPasada` (lunes cae bien desde cualquier día/hora,
frontera UTC) y `textoWhatsApp`. Cron y UI verificados con build + ejecución
manual del endpoint.
