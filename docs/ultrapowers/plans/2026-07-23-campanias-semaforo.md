# Semáforo de campañas por cliente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:executing-plans (ejecución inline en esta sesión — decidido por presupuesto de tokens; revisión de código final con subagente). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Página de Campañas por cuadritos de cliente con semáforo verde/ámbar/rojo/gris de los últimos 7 días.

**Architecture:** Migración 0013 agrega la ventana 7d (conversaciones en `campanias`, gasto en `campania_finanzas` solo-admin). El sync hace una llamada extra de insights `date_preset=last_7d` (verificado en vivo). `src/lib/campanias/salud.ts` clasifica con reglas puras en orden de prioridad. La página agrega por cliente server-side y un componente cliente nuevo renderiza cuadrícula + expansión.

**Spec:** docs/ultrapowers/specs/2026-07-23-campanias-semaforo-design.md · **Skills:** meta-marketing-api, supabase-multitenant-rls

**Preferencias:** auto-commit ON, auto-push ON. Producción = merge fast-forward a main al final.

---

### Task 1: Migración 0013 + sync de ventana 7d

**Files:** Create `supabase/migrations/0013_ventana_7d.sql` · Modify `src/lib/meta/sync.ts` · Test `src/lib/meta/__tests__/sync.test.ts`

- [ ] Migración: `alter table campanias add column conversaciones_7d int not null default 0;` + `alter table campania_finanzas add column gasto_7d numeric not null default 0;` + comentarios. Aplicar con apply_migration.
- [ ] TDD en `prepararCampanias`: nueva firma con `insights7d: InsightCampania[]` → cada `FilaCampania` gana `conversaciones_7d` y el resultado gana `gastos7d: Map<string, number>`; campaña ausente de la ventana → 0/0. Tests: presente en ambas ventanas, solo en vida, solo en 7d (campaña nueva).
- [ ] `sincronizarCliente`: tercera llamada `obtenerTodos<InsightCampania>('/'+cuenta+'/insights', {..., date_preset: 'last_7d'})`; upserts escriben `conversaciones_7d` (campanias) y `gasto_7d` (campania_finanzas).
- [ ] `npx vitest run` + tsc + eslint verdes. Commit `feat: ventana de 7 dias en el sync (conversaciones y gasto)` + push.

### Task 2: Módulo de salud (pure, TDD)

**Files:** Create `src/lib/campanias/salud.ts` · Test `src/lib/campanias/__tests__/salud.test.ts`

- [ ] `export type Salud = 'verde' | 'ambar' | 'rojo' | 'gris'` y `saludCampania({ estado, gasto7d, conversaciones7d, promedioCliente }): Salud` implementando la tabla §2 del spec EN ORDEN (gris→rojo→verde→ambar, primera que aplique). `promedioCliente: number | null`.
- [ ] `promedioCPL(filas: { gasto: number; conversaciones: number }[]): number | null` — suma vida del cliente; null si 0 conversaciones.
- [ ] Tests de TODOS los bordes del spec: no activa→gris; activa sin gasto (con y sin conversaciones)→gris; gasto sin conversaciones→rojo; promedio null con conversaciones→verde; cpl == promedio→verde; promedio < cpl <= 2×→ambar; cpl == 2×promedio→ambar; cpl > 2×→rojo.
- [ ] Suite verde. Commit `feat: modulo puro de salud de campañas (semaforo 7d)` + push.

### Task 3: UI — cuadrícula por cliente con expansión

**Files:** Create `src/components/campanias/cuadricula-clientes.tsx` · Modify `src/app/(app)/agencia/campanias/page.tsx` (PanelCampanias deja de usarse aquí; sigue vivo en la ficha del cliente)

- [ ] Page (server): query campañas con finanzas (`gasto, gasto_7d`) + `conversaciones_7d` + cliente; `promedioCPL` por cliente; `saludCampania` por campaña; agregar por cliente `{ id, nombre, activas, verdes, ambars, rojas, campanias: [...] }` ordenado rojas desc → activas desc → nombre. Pasa también ultimaSync para `BotonSincronizar` (se conserva junto con el dialog "Nueva campaña").
- [ ] `cuadricula-clientes.tsx` (client): grid `grid-cols-2 lg:grid-cols-4`; cuadrito con nombre, burbuja de activas y chips `🟢/🟠/🔴` solo con conteo > 0; sin activas → "Sin campañas activas"; activas todas grises → "Sin gasto esta semana". Estado `expandido: string | null`: al tocar, la cuadrícula se sustituye por la vista del cliente (botón "← Todos los clientes"). Lista ordenada rojo→ámbar→verde→gris mostrando punto de color, nombre, badge Meta, `conversaciones_7d`, `gasto_7d` (formatoMoneda) y CPL 7d; visibles por defecto solo activas o con actividad 7d (`gasto_7d>0 || conversaciones_7d>0`); resto en `<details>`/colapsable "Ver todas (N)" con render diferido (montar solo al abrir). Acciones existentes: campañas Meta → AvisoMetaDialog (reutilizar el export de panel-campanias o extraerlo); manuales → pausar/archivar como hoy.
- [ ] Estilo: seguir el design system (Card, Badge, colores de marca; puntos de color con `bg-emerald-500`/`bg-amber-500`/`bg-red-500`/`bg-muted-foreground` + texto accesible, no solo color: aria-label por punto).
- [ ] tsc + eslint + vitest + `npx next build` verdes; smoke con Playwright en local o prod tras deploy. Commit `feat: vista de campañas por cliente con semaforo` + push.

### Task 4: Sync real, verificación y producción

- [ ] Disparar sync en prod (curl con CRON_SECRET) tras el deploy de fase-1→main para poblar las columnas 7d.
- [ ] Verificar en SQL: conteos de salud por cliente coherentes (spot-check un CPL a mano).
- [ ] Playwright en prod: cuadrícula visible, expansión funciona, chips correctos; captura para el usuario.
- [ ] Revisión de código final (subagente ultrapowers:code-reviewer sobre el rango completo) y fixes.
- [ ] Merge fast-forward a main + push (publica).
