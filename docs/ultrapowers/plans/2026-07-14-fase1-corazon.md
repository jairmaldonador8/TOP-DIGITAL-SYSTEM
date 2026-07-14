# Top Digital CRM — Fase 1 "El corazón" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sitio web funcional corriendo en localhost con login por roles, CRUD de clientes, CRM de leads (kanban + captura rápida + seguimientos + cierre de venta) y campañas con activar/pausar que generan notificaciones internas.

**Architecture:** Una app Next.js 16 (App Router, `proxy.ts`, todo dinámico — sin `cacheComponents`) con dos zonas: `/agencia` (rol admin) y `/portal` (rol cliente). Supabase como backend: Postgres con RLS multi-tenant (todas las tablas llevan `cliente_id`; financieros en tabla separada admin-only), Auth con custom claim `user_role`, mutaciones vía Server Actions. UI en español con Tailwind v4 + shadcn/ui.

**Tech Stack:** next@16.2, react@19.2, @supabase/ssr@0.12, @supabase/supabase-js@2.110+, tailwindcss@4.3, shadcn CLI v4 (Base UI), @dnd-kit/core@6.3 + @dnd-kit/sortable, date-fns@4 (locale es), vitest + testing-library, Supabase cloud (free tier) + supabase CLI para migraciones.

**Skills a consultar durante ejecución:**
- @.claude/skills/nextjs16-supabase-auth/SKILL.md — TODO lo de auth, clients, proxy, guards
- @.claude/skills/supabase-multitenant-rls/SKILL.md — TODO lo de migraciones, policies, queries de tenant
- @.claude/skills/supabase-realtime-broadcast/SKILL.md — solo Fase 3 (referencia futura)
- Plugins instalados: `vercel:nextjs`, `vercel:shadcn`, `supabase:supabase-postgres-best-practices`, `ultrapowers-dev:typescript-best-practices`, `ultrapowers-dev:testing-tdd`

**Preferencias del usuario:** auto-commit ON, auto-push ON → ejecutar TODOS los pasos de commit y push.

**Nota de entorno:** Windows 11. Docker no está garantizado → los tests de RLS se hacen como integración JS contra el proyecto Supabase cloud (dos usuarios de prueba con JWTs reales), no pgTAP. Si `supabase start` no está disponible, usar `supabase db push` contra el proyecto cloud linked.

---

## Task 0: Prerequisitos (interactivo — requiere al usuario)

**Objetivo:** proyecto Supabase cloud + credenciales en `.env.local`.

- [ ] **Step 1:** Verificar herramientas: `node --version` (≥ 20.9), `npx supabase --version` (instalar CLI si falta: `npm i -g supabase` NO está soportado — usar `npx supabase@latest` o scoop). Si falta Node ≥ 20.9, detener y pedir al usuario instalarlo.
- [ ] **Step 2:** Pedir al usuario crear (o crear vía MCP de Supabase si está autenticado) un proyecto en supabase.com (región us-east, free tier, nombre `top-digital-crm`). Obtener: Project URL, publishable key (`sb_publishable_...`), secret key (`sb_secret_...`), database password, y project ref.
- [ ] **Step 3:** `npx supabase login` (interactivo — el usuario puede correrlo con `! npx supabase login`) y `npx supabase link --project-ref <ref>` desde la raíz del repo.

## Task 1: Scaffold Next.js 16 + Tailwind v4 + shadcn

**Files:**
- Create: proyecto Next en la raíz del repo (app/, package.json, etc.)
- Create: `.env.local`, `.env.example`
- Modify: `.gitignore` (ya excluye `.env*` y `node_modules`)

- [ ] **Step 1:** Scaffold en la raíz (el repo ya tiene docs/ y .claude/ — usar un dir temporal y mover, o `create-next-app .` que tolera archivos no conflictivos): `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --yes` (acepta Turbopack default). Verificar que genera `src/app/`.
- [ ] **Step 2:** `npx shadcn@latest init --yes` (Base UI por defecto en CLI v4; tema neutral). Luego `npx shadcn@latest add button card input label table badge dialog select textarea tabs sonner avatar dropdown-menu sheet`.
- [ ] **Step 3:** Instalar deps: `npm i @supabase/supabase-js @supabase/ssr date-fns @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` y dev: `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom dotenv`.
- [ ] **Step 4:** Crear `.env.example` con `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`, `SUPABASE_SECRET_KEY=` y `.env.local` con los valores reales de Task 0 (SECRET solo server-side, nunca `NEXT_PUBLIC_`).
- [ ] **Step 5:** Configurar vitest: `vitest.config.ts` con `environment: 'jsdom'`, setup file con `@testing-library/jest-dom`, y un test humo `src/lib/__tests__/smoke.test.ts` (`expect(1+1).toBe(2)`). Run: `npx vitest run` → PASS.
- [ ] **Step 6:** `npm run dev` en background, verificar `http://localhost:3000` responde 200. Matar el proceso.
- [ ] **Step 7 (commit):** `git add -A && git commit -m "feat: scaffold Next.js 16 + Tailwind v4 + shadcn" && git push`

## Task 2: Migración 001 — schema completo + RLS

**Files:**
- Create: `supabase/migrations/0001_schema.sql`
- Create: `supabase/migrations/0002_rls.sql`
- Create: `supabase/migrations/0003_auth_hook.sql`

Consultar @.claude/skills/supabase-multitenant-rls/SKILL.md para los patrones exactos (helpers security definer, wrapping `(select ...)`, tabla financiera).

- [ ] **Step 1:** Escribir `0001_schema.sql`. Enums: `rol_usuario ('admin','cliente')`, `etapa_lead ('nuevo','contactado','interesado','cotizado','ganado','perdido')`, `fuente_lead ('meta_ads','whatsapp','referido','organico')`, `nivel_interes ('alto','medio','bajo')`, `metodo_cierre ('whatsapp','llamada','reunion','checkout')`, `estado_campania ('activa','pausada')`, `estado_cliente ('activo','pausado','inactivo')`, `estado_tarea ('pendiente','en_progreso','completada')`. Tablas (todas con `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`):
  - `clientes` (nombre_negocio, contacto_nombre, email, telefono, presupuesto_ads numeric default 0, meta_facturacion numeric default 0, estado estado_cliente default 'activo', es_agencia boolean default false, notas text)
  - `usuarios` (user_id uuid unique references auth.users on delete cascade, cliente_id uuid references clientes, rol rol_usuario not null, nombre text not null) — admin tiene cliente_id null
  - `leads` (cliente_id not null → clientes, nombre, telefono, email, fuente fuente_lead not null, campania_id uuid null → campanias, etapa etapa_lead default 'nuevo', interes nivel_interes, monto_venta numeric, metodo_cierre metodo_cierre, venta_dificil boolean default false, objeciones text[] default '{}', responsable text, fecha_cierre timestamptz, creado_por uuid references auth.users)
  - `seguimientos` (lead_id not null → leads on delete cascade, cliente_id not null, autor_id uuid references auth.users, autor_nombre text, nota text not null) — sin UPDATE/DELETE grants (inmutable)
  - `campanias` (cliente_id not null, nombre, plataforma text, estado estado_campania default 'pausada', fecha_inicio date, leads_generados int default 0)
  - `campania_finanzas` (campania_id pk → campanias on delete cascade, cliente_id not null, gasto numeric default 0) — **tabla separada admin-only**
  - `tareas` (cliente_id not null, titulo, descripcion, estado estado_tarea default 'pendiente', fecha_limite date)
  - `actividades` (cliente_id not null, tipo text not null, texto text not null)
  - `notificaciones` (cliente_id not null, user_id uuid null, tipo text, texto text not null, leida boolean default false)
  - `mensajes` (cliente_id not null, autor_id uuid, autor_nombre text, texto text not null, leido boolean default false) — Fase 3 la usa, crear ya
  - Índices: `cliente_id` en TODAS las tablas de negocio; `leads(cliente_id, etapa)`; `seguimientos(lead_id)`; `notificaciones(cliente_id, leida)`; `mensajes(cliente_id, created_at)`.
  - Nota: `campanias` se referencia desde `leads` — crear `campanias` antes que `leads` en el SQL.
- [ ] **Step 2:** Escribir `0002_rls.sql`: schema `private`; funciones `private.mi_cliente_id()` y `private.is_admin()` (security definer, `set search_path = ''`, stable, revoke from anon — código exacto en la skill). `alter table ... enable row level security` en TODAS. Policies por tabla (todas `to authenticated`, con `(select ...)` wrapping):
  - Patrón general select/insert/update: `cliente_id = (select private.mi_cliente_id()) or (select private.is_admin())`
  - `clientes`: select para el propio (`id = (select private.mi_cliente_id())`) o admin; insert/update/delete solo admin.
  - `usuarios`: select propio registro o admin; escrituras solo admin (provisioning vía secret key igualmente).
  - `campania_finanzas`: única policy `for all` con `(select private.is_admin())` — **ninguna vía para clientes**.
  - `campanias`, `tareas`, `actividades`: escrituras solo admin; select patrón general.
  - `seguimientos`: select/insert patrón general; sin policies de update/delete (inmutable).
  - `notificaciones`: select/update(leida) patrón general; insert solo admin (v1: las genera el servidor).
  - Grants de columna: `revoke update on public.leads from authenticated; grant update (etapa, interes, monto_venta, metodo_cierre, venta_dificil, objeciones, responsable, fecha_cierre, nombre, telefono, email) on public.leads to authenticated;` (congela `cliente_id`).
- [ ] **Step 3:** Escribir `0003_auth_hook.sql`: `public.custom_access_token_hook(event jsonb)` (plpgsql, stable) que lee `usuarios.rol` y `usuarios.cliente_id` por `(event->>'user_id')::uuid` y hace `jsonb_set` de claims `user_role` (default `'cliente'`) y `cliente_id` en `event->'claims'`, devolviendo el event modificado (patrón estándar del Custom Access Token Hook de Supabase); grants a `supabase_auth_admin` (usage schema public, execute function, select on usuarios) y revoke from authenticated/anon. La skill @.claude/skills/nextjs16-supabase-auth/SKILL.md describe requisitos y gotchas del hook.
- [ ] **Step 4:** `npx supabase db push` → aplica las 3 migraciones al proyecto cloud sin errores.
- [ ] **Step 5:** Habilitar el hook: Dashboard → Authentication → Hooks → Custom Access Token → `custom_access_token_hook` (pedir al usuario o vía Management API). **Verificar después que el sign-in sigue funcionando** (si el hook falla, TODO login falla).
- [ ] **Step 6 (commit):** `git add supabase/ && git commit -m "feat: schema multi-tenant con RLS y auth hook" && git push`

## Task 3: Clientes de Supabase + proxy + login

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`
- Create: `src/proxy.ts`
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`
- Modify: `src/app/page.tsx` (redirect según sesión/rol)

Código exacto de clients y proxy en @.claude/skills/nextjs16-supabase-auth/SKILL.md.

- [ ] **Step 1:** `client.ts` (createBrowserClient), `server.ts` (createServerClient con `await cookies()`, try/catch en setAll), `admin.ts` (createClient de supabase-js con `SUPABASE_SECRET_KEY`, `auth: { persistSession: false }` — SOLO importar desde código server; nombrar el archivo con sufijo `.server.ts` si ESLint lo permite o comentar la restricción).
- [ ] **Step 2:** `src/proxy.ts` con refresh + redirects por rol (`/agencia` ↔ admin, `/portal` ↔ cliente, sin sesión → `/login`), matcher que excluye estáticos. OJO: con `--src-dir`, proxy.ts va en `src/`.
- [ ] **Step 3:** Login: página con formulario (email/contraseña, en español, estilo simple por ahora) que llama Server Action `iniciarSesion` → `supabase.auth.signInWithPassword` → si error, volver con mensaje "Correo o contraseña incorrectos" → si ok, `revalidatePath('/', 'layout')` + `redirect('/')`. `src/app/page.tsx`: server component que lee `getClaims()` y redirige a `/agencia`, `/portal` o `/login`. Action `cerrarSesion` (signOut + redirect a /login).
- [ ] **Step 4:** Test (vitest) de la lógica de redirect por rol: extraer `destinoPorRol(claims)` a `src/lib/auth/redirect.ts` puro y testear: sin claims → `/login`, admin → `/agencia`, cliente → `/portal`. Run: `npx vitest run` → PASS.
- [ ] **Step 5 (commit):** `git add -A && git commit -m "feat: auth con roles, proxy y login" && git push`

## Task 4: Seed — admin + cliente demo

**Files:**
- Create: `scripts/seed.ts` (tsx), `package.json` script `"seed": "npx tsx scripts/seed.ts"`

- [ ] **Step 1:** `npm i -D tsx`. Script con el admin client (secret key + dotenv `.env.local`): crea (idempotente — busca por email primero) (1) fila `clientes` `es_agencia=true` "Top Digital"; (2) auth user `admin@topdigital.mx` password `TopDigital2026!` + fila `usuarios` rol admin; (3) cliente demo "Tacos El Patrón" + auth user `demo@tacoselpatron.mx` password `Demo2026!` + fila `usuarios` rol cliente; (4) 2 campañas (1 activa con finanzas gasto=3500, 1 pausada), 5 leads en etapas variadas con 2 seguimientos, 3 tareas, 3 actividades, 2 notificaciones.
- [ ] **Step 2:** `npm run seed` → termina sin error. Verificar con una query (admin client) que hay 2 clientes y 5 leads.
- [ ] **Step 3:** Verificación manual de login: `npm run dev`, entrar con admin → redirige a `/agencia` (404 por ahora está bien, la ruta aún no existe — verificar el redirect en la URL); entrar con demo → `/portal`.
- [ ] **Step 4 (commit):** `git add -A && git commit -m "feat: seed de datos demo" && git push`

## Task 5: Test de integración RLS (crítico)

**Files:**
- Create: `src/lib/__tests__/rls.integration.test.ts`
- Modify: `package.json` script `"test:rls": "vitest run rls.integration"`

- [ ] **Step 1:** Test con DOS clients reales (supabase-js con publishable key + `signInWithPassword` de demo y admin): (a) demo lee `leads` → solo recibe filas de su cliente_id; (b) demo `select` a `campania_finanzas` → **0 filas, sin error**; (c) demo insert lead con `cliente_id` ajeno → falla o RLS lo rechaza (asertar que NO existe después); (d) admin lee `leads` → ve filas de ≥ 2 clientes… en seed solo Tacos tiene leads: asertar que admin ve las mismas 5 + acceso a finanzas (1 fila). Recordar: denials de SELECT = vacío, no excepción (asertar sobre estado).
- [ ] **Step 2:** `npm run test:rls` → PASS. Si (b) devuelve filas: DETENER — bug de seguridad, revisar policies antes de seguir.
- [ ] **Step 3 (commit):** `git add -A && git commit -m "test: aislamiento RLS multi-tenant" && git push`

## Task 6: Layout base de ambas zonas

**Files:**
- Create: `src/app/(app)/agencia/layout.tsx`, `src/app/(app)/portal/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`, `src/components/layout/topbar.tsx`
- Modify: `src/app/globals.css` (tokens `@theme`: sidebar azul marino #0F172A-ish, fondo claro, acentos lima/rosa según referencia visual del usuario)

- [ ] **Step 1:** Sidebar reutilizable (props: items con icono+label+href, logo "TOP DIGITAL", usuario abajo con menú cerrar sesión). Items agencia: Dashboard, Clientes, Campañas, Tareas, Leads, Chats, Reportes (los no implementados → href con página "Próximamente"). Items portal: Dashboard, Mis Leads, Campañas, Chat. Topbar: título de página + campanita (badge estático por ahora, se conecta en Task 9).
- [ ] **Step 2:** Ambos layouts: server components que re-verifican `getClaims()` + rol (defensa en profundidad — redirect si no corresponde) y obtienen `usuarios.nombre` para el sidebar. Páginas índice placeholder `/agencia` y `/portal` ("Dashboard — próximamente" con Card).
- [ ] **Step 3:** Verificar en navegador: login admin → sidebar agencia; login demo → sidebar portal; URLs cruzadas redirigen.
- [ ] **Step 4 (commit):** `git add -A && git commit -m "feat: layouts con sidebar por rol" && git push`

## Task 7: CRUD de Clientes (agencia)

**Files:**
- Create: `src/app/(app)/agencia/clientes/page.tsx` (tabla), `src/app/(app)/agencia/clientes/[id]/page.tsx` (perfil), `src/app/(app)/agencia/clientes/actions.ts`
- Create: `src/components/clientes/cliente-form.tsx` (dialog crear/editar), `src/components/clientes/usuario-form.tsx`

- [ ] **Step 1:** Tabla de clientes (server component, query con server client): nombre, contacto, estado (badge), # leads. Botón "+ Nuevo cliente" → dialog con formulario → Server Action `crearCliente` (validar nombre requerido; insert vía server client — RLS admin permite).
- [ ] **Step 2:** Perfil `[id]`: datos del cliente + tabs (Resumen con presupuesto/meta/notas, Usuarios, y placeholders Leads/Campañas que se llenan en Tasks 8/9). Actions `actualizarCliente`, `desactivarCliente` (estado → inactivo, NUNCA delete).
- [ ] **Step 3:** Alta de usuario del cliente: form (nombre, email, password temporal) → Server Action que usa el **admin client** (`supabase.auth.admin.createUser` con `email_confirm: true`) + insert en `usuarios` rol cliente. Listar usuarios del cliente en el tab.
- [ ] **Step 4:** Test unitario de validación del form action (extraer `validarCliente(input)` puro). `npx vitest run` → PASS. Verificación manual: crear un cliente nuevo + un usuario, login con ese usuario en incógnito → ve `/portal` vacío (sin datos de Tacos — RLS en acción).
- [ ] **Step 5 (commit):** `git add -A && git commit -m "feat: CRUD de clientes y usuarios" && git push`

## Task 8: CRM de Leads (kanban + captura + detalle)

**Files:**
- Create: `src/app/(app)/portal/leads/page.tsx`, `src/components/leads/kanban.tsx`, `src/components/leads/lead-card.tsx`, `src/components/leads/captura-rapida.tsx`, `src/components/leads/lead-detalle.tsx` (Sheet), `src/app/(app)/portal/leads/actions.ts`
- Create: `src/app/(app)/agencia/leads/page.tsx` (vista global con filtros)
- Create: `src/lib/leads/etapas.ts` (constantes: orden de etapas, labels es-MX, colores, y catálogo de objeciones: Precio, Tiempo, Confianza, Necesita pensarlo, Ubicación)

- [ ] **Step 1:** Constantes + helpers puros (`puedeMoverA`, `esCerrado`) con tests vitest. PASS.
- [ ] **Step 2:** Captura rápida: botón grande "+ Registrar lead" → dialog con SOLO nombre, teléfono, fuente (select) → action `crearLead` (el `cliente_id` sale del claim server-side, NUNCA del form). Mobile-first (botón full-width, inputs grandes).
- [ ] **Step 3:** Kanban con @dnd-kit (client component): columnas por etapa, `PointerSensor` + `KeyboardSensor`, `closestCorners`; al soltar → update optimista + Server Action `moverLead(id, etapa)`; si la action falla → revertir + toast. Si etapa destino = `ganado` → abrir dialog de cierre (monto, método, venta difícil) antes de confirmar.
- [ ] **Step 4:** Detalle (Sheet al click en card): datos editables (interés, responsable, objeciones multi-select, email), historial de seguimientos (inmutables, autor + fecha con date-fns es), form "Agregar seguimiento" → action `agregarSeguimiento`.
- [ ] **Step 5:** Vista agencia `/agencia/leads`: tabla global (RLS admin ve todo) con filtros por cliente (select), etapa, campaña y fuente vía searchParams. Reusar `lead-detalle`.
- [ ] **Step 6:** Verificación manual completa: como demo → registrar lead, moverlo por etapas hasta ganado con monto; como admin → verlo en la vista global con el seguimiento.
- [ ] **Step 7 (commit):** `git add -A && git commit -m "feat: CRM de leads con kanban y seguimientos" && git push`

## Task 9: Campañas + notificaciones internas

**Files:**
- Create: `src/app/(app)/agencia/campanias/page.tsx`, `src/app/(app)/agencia/campanias/actions.ts`, `src/components/campanias/campania-form.tsx`
- Create: `src/app/(app)/portal/campanias/page.tsx` (solo lectura, SIN finanzas)
- Create: `src/components/layout/campanita.tsx` + `src/app/(app)/portal/notificaciones/actions.ts`

- [ ] **Step 1:** Agencia: tabla de campañas agrupadas por cliente (join con `campania_finanzas` para mostrar gasto y CPL = gasto/leads_generados — solo aquí). Form crear/editar (cliente, nombre, plataforma, fecha, gasto, leads_generados). Gasto se escribe en `campania_finanzas` (upsert).
- [ ] **Step 2:** Switch activar/pausar → Server Action `cambiarEstadoCampania` que en UNA función: update estado + insert `notificaciones` (cliente_id, tipo `campania`, texto "Se activó la campaña «X» 🚀" / "Se pausó la campaña «X»") + insert `actividades` (tipo `campania`, mismo texto). Test unitario del builder de textos. PASS.
- [ ] **Step 3:** Portal del cliente `/portal/campanias`: cards con nombre, plataforma, estado (badge). **Verificar que la query selecciona columnas explícitas** — nunca `select('*')` con joins a finanzas; el test RLS de Task 5 ya cubre el acceso directo.
- [ ] **Step 4:** Campanita (topbar portal): server component que cuenta `notificaciones` no leídas + dropdown con las últimas 10 (texto + fecha relativa date-fns es) + action `marcarLeidas`. Sin realtime en Fase 1 — se actualiza por navegación/refresh (realtime llega en Fase 3 con @.claude/skills/supabase-realtime-broadcast/SKILL.md).
- [ ] **Step 5:** Verificación manual: admin activa campaña → login demo → campanita con badge 1 → abrir → texto correcto → marcar leída → badge 0. Cliente NO ve gasto/CPL en ninguna pantalla.
- [ ] **Step 6 (commit):** `git add -A && git commit -m "feat: campañas con notificaciones al cliente" && git push`

## Task 10: Verificación final de Fase 1

- [ ] **Step 1:** `npx vitest run` completo → todo PASS. `npm run test:rls` → PASS. `npm run build` → sin errores.
- [ ] **Step 2:** Recorrido E2E manual con el usuario (localhost:3000): login admin → crear cliente → crear usuario → crear campaña → activarla; login cliente → ver notificación → registrar lead → moverlo a ganado con monto; admin → verlo en leads global. Documentar cualquier fallo como tarea nueva.
- [ ] **Step 3 (commit):** `git add -A && git commit -m "chore: fase 1 completa y verificada" && git push`

---

## Fuera de este plan (Fases 2 y 3 — planes futuros)
Dashboards con KPIs/gráficas/semáforo, timeline de marca, tareas de agencia, chat realtime, reportes PDF, alertas de leads sin atender, recuperación de contraseña, y deploy a Vercel (el spec dice que cada fase termina desplegada; para Fase 1 el usuario pidió verlo en localhost — el deploy se hará al inicio del plan de Fase 2).
