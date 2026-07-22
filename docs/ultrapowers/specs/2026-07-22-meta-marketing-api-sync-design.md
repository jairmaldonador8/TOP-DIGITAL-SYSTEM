# Spec: Sincronización de campañas con la API de Marketing de Meta

**Fecha:** 2026-07-22
**Estado:** Aprobado por el usuario (diseño conversacional)
**Proyecto:** TOP DIGITAL SYSTEM — rama `fase-1`

## 1. Objetivo

Conectar la plataforma a la Graph API de Meta (Marketing API) para que las campañas
y sus métricas (gasto, resultados) de todos los clientes se sincronicen
automáticamente, eliminando la captura manual de campañas. Solo lectura: Meta es la
fuente de verdad y la plataforma nunca escribe cambios en Meta.

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Estructura de cuentas | El dueño administra todas las cuentas publicitarias de los clientes desde su Business Manager. Basta **una sola credencial** (la del dueño). |
| Autenticación | **Token de usuario de sistema** de Business Manager (no expira), permiso `ads_read`, guardado como variable de entorno en Vercel (`META_SYSTEM_TOKEN`). Sin flujo OAuth, sin revisión de app de Meta (uso interno). El token nunca toca el navegador ni la base de datos. |
| Alcance de datos | Solo campañas y métricas. Los **leads NO se sincronizan** (las campañas son de clic a WhatsApp; esos contactos no salen por la Marketing API). La captura rápida manual de leads sigue igual. WhatsApp Cloud API queda como proyecto futuro separado. |
| Dirección | **Solo lectura** (`ads_read`). Los botones pausar/abrir de campañas sincronizadas muestran un aviso: la campaña se administra desde Meta Ads Manager, con liga directa al Ads Manager. No se solicita `ads_management`. |
| Sincronización | Cron de Vercel **diario ~5:00 AM hora de México** + botón **"Sincronizar ahora"** (server action, solo admin) que trae datos frescos de Meta al momento. Ambos ejecutan el mismo módulo. |
| Vínculo cliente ↔ Meta | El dueño elige manualmente la cuenta publicitaria de cada cliente desde un selector en la ficha del cliente (lista de cuentas del Business Manager). |
| Visibilidad del cliente | Igual que hoy: el cliente ve nombre, estado y resultados de sus campañas; **gasto y costo por resultado son solo del dueño** (RLS existente de `campania_finanzas`). |

## 3. Arquitectura

Todo dentro del proyecto Next.js existente; sin servicios nuevos.

```
Vercel Cron (diario 5 AM MX)  ─┐
                               ├─> Módulo de sync (src/lib/meta/) ─> Graph API de Meta
Botón "Sincronizar ahora" ─────┘        │
   (server action, admin)               └─> Supabase (campanias, campania_finanzas, sync_runs)
```

### Componentes

1. **`src/lib/meta/client.ts`** — cliente HTTP mínimo de la Graph API (versión vigente
   al implementar; confirmar en fase de investigación). Autentica con
   `META_SYSTEM_TOKEN`. Maneja paginación y errores de rate limit con reintentos y
   espera exponencial.
2. **`src/lib/meta/sync.ts`** — orquestador: recorre los clientes con
   `meta_ad_account_id`, jala campañas e insights de cada cuenta, mapea y hace
   upsert. El fallo de un cliente no detiene a los demás. Usa el cliente de
   Supabase con **service role** (el cron no lleva sesión de usuario y
   `campania_finanzas` / `sync_runs` son solo-admin bajo RLS; con la anon key las
   escrituras fallarían).
3. **Route handler del cron** — `src/app/api/cron/meta-sync/route.ts`, protegido con
   `CRON_SECRET` (patrón estándar de Vercel Cron). Configurado en `vercel.json`/
   `vercel.ts` con horario equivalente a ~5:00 AM America/Mexico_City.
4. **Server action "Sincronizar ahora"** — verifica rol admin, ejecuta el mismo
   `sync.ts`, devuelve resumen (campañas actualizadas, errores).
5. **Server action "listar cuentas publicitarias"** — para el selector de la ficha
   del cliente: lee las cuentas del Business Manager con el token del sistema.
   Solo admin, con la misma verificación de rol que la acción de sincronizar.

## 4. Modelo de datos (migración `0009_meta_sync.sql`)

- `clientes.meta_ad_account_id text null` — ID de la cuenta publicitaria (`act_…`).
- `campanias.meta_campaign_id text null unique` — distingue campañas sincronizadas
  (no null) de manuales (null). Las manuales existentes no se tocan.
- `campanias.sincronizada_en timestamptz null` — última actualización desde Meta.
- Tabla nueva `sync_runs`: `id`, `disparador` (`cron` | `manual`), `inicio`, `fin`,
  `campanias_actualizadas int`, `errores jsonb`, `exito boolean`. RLS: solo admin.

### Mapeo Meta → tablas

| Meta | Plataforma |
|---|---|
| Campaign `name` | `campanias.nombre` |
| Campaign `effective_status` (ACTIVE / PAUSED) | `campanias.estado` (`activa` / `pausada`) |
| Campaign eliminada o terminada en Meta | `campanias.estado = 'archivada'` (valor del enum `estado_campania` agregado en la migración 0008; no se borra la fila, conserva historial) |
| Insights `spend` (acumulado del rango de vida de la campaña) | `campania_finanzas.gasto` |
| Insights resultados (conversaciones iniciadas / leads según objetivo; campo exacto a confirmar en investigación) | `campanias.leads_generados` |
| Campaign `start_time` | `campanias.fecha_inicio` |
| `plataforma` | `'Meta'` fijo en campañas sincronizadas |

**Precedencia de conteo de leads:** la UI actual muestra `stats?.total ||
campania.leads_generados` (leads vinculados manualmente tienen prioridad sobre el
contador). En campañas sincronizadas se invierte: **el número de Meta
(`leads_generados`) manda** y los leads vinculados manualmente se muestran como
dato secundario ("X registrados en CRM"), porque el dato de Meta es la métrica
real de la campaña y los vinculados son solo los capturados a mano.

**Desvincular cuenta:** si el dueño quita el `meta_ad_account_id` de un cliente,
las campañas ya sincronizadas se conservan tal cual (dejan de actualizarse; su
`sincronizada_en` queda como testigo). No se borran ni se archivan.

## 5. Experiencia de interfaz

- **Ficha de cliente (agencia):** sección "Conexión Meta" — selector de cuenta
  publicitaria (nombre + ID de cuenta), estado del vínculo, opción de desvincular.
- **Tablero de campañas (agencia):** badge "Meta" en campañas sincronizadas; texto
  "Última sincronización: {fecha} ✓/✗" alimentado por `sync_runs`; botón
  "Sincronizar ahora" con spinner y resumen del resultado. En campañas
  sincronizadas, pausar/abrir abre un aviso (no ejecuta nada): "Esta campaña se
  administra desde Meta Ads Manager" + liga al Ads Manager.
- **Portal del cliente:** sin cambios estructurales; sus campañas muestran datos
  reales (nombre, estado, resultados). Nunca gasto.
- **Errores visibles:** token inválido o cuenta sin acceso se muestran como aviso en
  el tablero de la agencia; nunca falla en silencio.

## 6. Manejo de errores

- Sync por cliente aislado: error en una cuenta se registra en `sync_runs.errores`
  y continúa con las demás.
- Rate limits de Meta: reintentos con espera exponencial; si persiste, el cliente
  queda pendiente y se registra el error.
- Token inválido/expirado (p. ej. revocado en Business Manager): la corrida se marca
  `exito = false` con mensaje claro para el dueño.

## 7. Pruebas

- **Unitarias:** mapeo de respuestas de la Graph API (fixtures simuladas) → filas de
  `campanias` / `campania_finanzas`; casos: campaña nueva, actualizada, archivada en
  Meta, cuenta sin campañas, error de rate limit.
- **Integración:** route handler del cron con `CRON_SECRET` correcto/incorrecto;
  server action de sync rechaza a usuarios no admin (RLS + verificación de rol).

## 8. Fuera de alcance

- Captura automática de leads (WhatsApp Cloud API) — proyecto futuro separado.
- Escritura hacia Meta (`ads_management`): pausar/activar/crear campañas.
- Flujo OAuth "Conectar con Meta".
- Métricas adicionales (impresiones, clics, alcance) — se pueden agregar después;
  v1 solo gasto y resultados.
- Sincronización de campañas de otras plataformas (Google, TikTok).

## 9. Configuración inicial (una sola vez, guiada con el dueño)

1. Crear app de Meta tipo Business en developers.facebook.com (del Business Manager
   del dueño).
2. Crear usuario de sistema en Business Manager, asignarle las cuentas
   publicitarias con acceso de lectura.
3. Generar token del usuario de sistema con permiso `ads_read` y sin expiración.
4. Guardar como `META_SYSTEM_TOKEN` en variables de entorno de Vercel (production
   + preview) y `.env.local`.
5. Definir `CRON_SECRET` si no existe.
