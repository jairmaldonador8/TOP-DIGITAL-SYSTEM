# Research Brief: Top Digital CRM — Estado del arte (julio 2026)

## Context

Sistema web CRM multi-portal (spec: `docs/ultrapowers/specs/2026-07-14-top-digital-crm-design.md`). Stack aprobado: Next.js App Router + Supabase en Vercel. Se investigó con 4 agentes paralelos (framework/auth, RLS multi-tenant, Realtime, ecosistema UI/PDF), cruzando docs oficiales y fuentes de los últimos 12 meses.

## Key Findings

### Framework y Auth (Next.js 16 + @supabase/ssr)

- **Next.js 16.2.x es el estable actual** (React 19.2, Node ≥ 20.9). Cambios que afectan el proyecto: APIs de request async obligatorias (`await cookies()`, `await params`), **`proxy.ts` reemplaza a `middleware.ts`** (corre solo en runtime Node — bueno para Supabase), Turbopack por defecto, y caching opt-in explícito (dejar `cacheComponents` off: todo dinámico por defecto, lo correcto para una app auth-heavy).
- **`@supabase/ssr` (v0.12.x) es el paquete correcto**; `auth-helpers` está deprecado. Patrón canónico: browser client + server client por request (nunca singleton) + refresh de tokens en `proxy.ts`.
- **`getClaims()` es el guard recomendado** (verifica firma localmente vía JWKS con las nuevas llaves asimétricas); `getSession()` en servidor NO es confiable para autorización. `getUser()` para mutaciones sensibles.
- **Roles**: tabla `user_roles` + Custom Access Token Auth Hook inyecta `user_role` al JWT; leer con `getClaims()` en proxy (redirect `/agencia` vs `/portal`) y **re-verificar en cada `layout.tsx`** (el middleware no es frontera de seguridad — lección CVE-2025-29927).
- Gotchas: no ejecutar código entre `createServerClient` y `getClaims()` en el proxy; devolver `supabaseResponse` tal cual; Server Components no escriben cookies (auth en Server Actions con `revalidatePath` + `redirect`); claims con staleness ~1h tras cambio de rol.

### Multi-tenancy con RLS

- **Tabla de membresía como fuente de verdad** (`usuarios` con `cliente_id`), no JWT claims solos (staleness). Helper `security definer` en schema privado con `set search_path = ''`, envuelto en `(select ...)` para caching initPlan.
- **Reglas de performance oficiales**: índice en toda columna usada en policies (`cliente_id`), `to authenticated` en cada policy, repetir el filtro `cliente_id` en las queries de la app.
- **Columnas sensibles (gasto, utilidad): tabla separada** (`campania_finanzas`) cuya única policy es admin — default-deny hace imposible el leak vía `select *`. Adicional: `grant update` por columna para congelar `cliente_id` en tablas compartidas.
- **Admin bypass**: policy permisiva `is_admin()` (security definer) para datos normales; service/secret key solo para jobs y provisioning de usuarios.
- **Testing RLS**: pgTAP vía `supabase test db` + helpers de basejump (usuarios reales de prueba), más tests de integración JS con JWTs reales. Crítico: los denials de SELECT devuelven vacío, no error — asertar sobre estado, nunca sobre excepciones. Jamás validar RLS desde el SQL Editor (corre como postgres).
- **Plataforma 2025-26**: migrar a llaves `sb_publishable_`/`sb_secret_` (las legacy se eliminan fin de 2026) y llaves de firma asimétricas. Declarative schemas NO capturan grants/alter policy — mantener RLS en migraciones versionadas clásicas.

### Realtime (chat + notificaciones)

- **Broadcast en canales privados, NO `postgres_changes`** (legacy, no escala: autorización por suscriptor por cambio). Broadcast autoriza una sola vez al unirse al canal.
- **Patrón de persistencia**: insertar el mensaje en Postgres (RLS valida) → trigger `AFTER INSERT` llama `realtime.broadcast_changes()` al canal `chat:<cliente_id>`; para la campanita, trigger con `realtime.send()` al canal `user:<user_id>`.
- **Autorización**: policies RLS sobre `realtime.messages` usando `realtime.topic()` + membresía. Cliente: `channel(topic, { config: { private: true } })` y `await supabase.realtime.setAuth()` antes de suscribirse.
- **Reconexión**: supabase-js reconecta solo con backoff, pero NO re-entrega mensajes perdidos → refetch al volver a `SUBSCRIBED` (dedupe por id). Tabs en background: `realtime: { worker: true }` contra throttling de timers.
- **No leídos**: `last_read_at` por participante (chat) y `read_at is null` (campanita); recontar al cargar/reconectar.
- **Límites free tier**: 200 conexiones concurrentes, 2M mensajes/mes, 100 msg/s — sobra para el tamaño de Top Digital.

### Ecosistema UI / PDF / fechas

- **Tailwind v4.3 (CSS-first, `@theme` con variables CSS)** — estable, default en Next 16; no usar config JS de v3. **shadcn/ui CLI v4**; ojo: desde julio 2026 los proyectos nuevos usan **Base UI** como capa de primitivos (no Radix).
- **Charts: Recharts v3.9 + wrapper `chart` de shadcn** (colores vía `--chart-1..5`). Recharts v2 deprecado. Componentes de charts son client-only (`"use client"`, datos por props desde el server).
- **Kanban: `@dnd-kit/core` 6.3.x + `@dnd-kit/sortable`** (línea estable, NO los paquetes 0.x del rewrite experimental). PointerSensor/TouchSensor dan soporte táctil confiable — clave para el kanban de leads en celular. Updates optimistas + Server Action para persistir.
- **PDF: `@react-pdf/renderer` v4** (`renderToBuffer` en Route Handler) — sin headless browser, arranque rápido, ideal para el reporte mensual con marca. Guardar el PDF en Supabase Storage y servir por URL (límite de respuesta 4.5 MB en Vercel). Fallback si se exige fidelidad exacta de charts: puppeteer-core + @sparticuz/chromium. Gotcha: `serverExternalPackages: ['@react-pdf/renderer']` si hay problemas de bundling.
- **Fechas: date-fns v4 + locale `es`**; `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` para moneda (costo cero de bundle, RSC-safe). Formatear fechas en el servidor para evitar hydration mismatch.

## Recommended Approach

Stack final confirmado por la investigación:

| Capa | Elección | Versión |
|---|---|---|
| Framework | Next.js (App Router, `proxy.ts`, Turbopack) | 16.2.x |
| UI | Tailwind v4 (CSS-first) + shadcn/ui (Base UI) | 4.3 / CLI v4 |
| Auth | @supabase/ssr + getClaims + Custom Access Token Hook | 0.12.x |
| Datos | Postgres + RLS (membresía + security definer + tabla financiera separada) | — |
| Realtime | Broadcast privado + triggers broadcast_changes/send | supabase-js 2.110+ |
| Charts | Recharts + shadcn chart | 3.9 |
| Kanban | @dnd-kit/core + sortable | 6.3.x |
| PDF | @react-pdf/renderer → Supabase Storage | 4.x |
| Fechas/moneda | date-fns (locale es) + Intl | 4.1 |

## Implementation Notes

- Llaves de API nuevas (`sb_publishable_`/`sb_secret_`) desde el día 1; JWT signing keys asimétricas.
- RLS y grants siempre en migraciones versionadas (`supabase/migrations/`), no en declarative schemas.
- Índices obligatorios: `cliente_id` en toda tabla de negocio; `mensajes(cliente_id, created_at)`; `notificaciones(user_id, read_at)`.
- pgTAP en CI (`supabase start` + `supabase test db`) para las pruebas de aislamiento.
- El chat y la campanita comparten una sola conexión realtime multiplexada por pestaña (2 canales).
- Auth hook: si la función del hook falla (grants faltantes a `supabase_auth_admin`), TODO el sign-in falla — probar grants con cuidado.

## Sources

Consolidadas de los 4 reportes (docs oficiales de Next.js, Supabase — auth/RLS/realtime/testing, Tailwind, shadcn, Recharts, dnd-kit, react-pdf, Vercel limits; y guías comunitarias recientes: Makerkit RLS best practices jul-2026, Basejump pgTAP, comparativas 2026 de charts/DnD/fechas). Detalle completo con URLs en los reportes de los agentes de investigación.
