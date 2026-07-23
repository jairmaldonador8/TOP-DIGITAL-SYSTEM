# Módulo de equipo (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: ultrapowers:executing-plans (inline en esta sesión, revisión final con subagente — mismo modo que semáforo y dashboard). Checkboxes para tracking.

**Goal:** Rol `equipo` con cuentas, encargos con ciclo de revisión y dashboards de ambos lados (spec 2026-07-23-equipo-encargos-design.md).

**Skills:** `supabase-multitenant-rls` (RLS/trigger/vista), `nextjs16-supabase-auth` (roles/proxy). **Preferencias:** auto-commit + auto-push ON; publicar = ff-merge a main.

### Task 1: Migración 0015 (rol, encargos, RLS, trigger, vista)
- [ ] `0015_equipo_encargos.sql` según spec §2 completo: enum equipo, `usuarios.puesto`, `clientes.giro/descripcion_publica`, enums prioridad/estado, tabla `encargos` + índices, `private.es_equipo()` (claim texto), políticas (admin all; equipo select/update con USING/WITH CHECK del spec), trigger `encargos_congelar_columnas` (before update, no-admin: solo estado/entregado_en mutables), vista `clientes_para_equipo` (owner-rights, guardia es_equipo/is_admin, filtro exists encargo propio, revoke anon/grant authenticated). Aplicar con apply_migration + verificar con get_advisors.
- [ ] Commit `feat: migracion 0015 — rol equipo, encargos y defensas RLS`.

### Task 2: Auth + máquina de estados (TDD)
- [ ] `redirect.ts`: Rol + 'equipo', AREA_POR_ROL.equipo='/equipo', rolDesdeClaims; tests nuevos en redirect.test.ts (equipo→/equipo, aislamiento de las 3 áreas cruzado).
- [ ] `src/lib/equipo/transiciones.ts`: `puedeTransicionar(rol: 'admin'|'equipo', de, a)` — matriz del spec §1/§4 (aprobado terminal para todos); tests exhaustivos de la matriz completa (5 estados × 5 × 2 roles, los válidos: equipo pendiente→en_progreso, cambios→en_progreso, en_progreso→entregado; admin entregado→aprobado, entregado→cambios).
- [ ] Commit `feat: rol equipo en auth y maquina de estados de encargos`.

### Task 3: Server actions
- [ ] `src/app/(app)/agencia/equipo/actions.ts` ('use server', esAdmin): `crearTrabajador` (patrón crearUsuarioCliente: admin client createUser + fila usuarios rol equipo/puesto, limpieza de huérfano), `crearEncargo`, `editarEncargo` (no aprobados), `revisarEncargo` (usa puedeTransicionar('admin',…), cambios exige comentario, estampa aprobado_en, limpia/deja comentario_revision).
- [ ] `src/app/(app)/equipo/actions.ts` ('use server'): `avanzarEncargo(id, a)` con usuarioActual() rol equipo + puedeTransicionar('equipo',…) + verificación asignado_a propio + estampa entregado_en al entregar. revalidatePath de ambas áreas donde aplique.
- [ ] tsc/eslint/build; commit `feat: actions de equipo — cuentas, encargos y revision`.

### Task 4: Área /equipo (trabajador)
- [ ] Layout `(app)/equipo/layout.tsx` (base: portal/layout.tsx simplificado — topbar nombre+puesto+cerrar sesión, sin sidebar) + `(inicio)/page.tsx`: saludo, 4 stats, lista agrupada por estado (prioridad alta primero, vencidos rojos con hoyEnMexico), sección Aprobados colapsable.
- [ ] `src/components/equipo/lista-encargos.tsx` + `detalle-encargo.tsx` (dialog: descripción, mini-ficha del cliente desde la vista, comentario de cambios, botón de acción por estado con useTransition+toast).
- [ ] Commit `feat: dashboard del trabajador en /equipo`.

### Task 5: Lado agencia + nav
- [ ] `/agencia/equipo/page.tsx`: bandeja "Por revisar" (entregados: aprobar / pedir cambios con comentario en dialog) + tarjetas de trabajadores (usuarios rol equipo + conteos) + dialogs Nuevo encargo / Nuevo integrante (`src/components/equipo/…-form.tsx`, patrón ResultadoAccion).
- [ ] Entrada "Equipo" en la nav de agencia (buscar el componente de sidebar/nav actual) + punto en `Atencion` del dashboard agencia si hay entregados por revisar.
- [ ] Form de edición del cliente gana giro y descripción pública.
- [ ] Commit `feat: gestion de equipo en agencia — bandeja de revision y altas`.

### Task 6: Verificación, review y producción
- [ ] Suite completa + tsc + eslint + build. Ampliar rls.integration.test.ts con los casos del spec §2 (correr `npm run test:rls` si el entorno lo permite).
- [ ] Revisión final con subagente (rango completo) + fixes.
- [ ] ff-merge a main, deploy, y E2E Playwright en producción: crear trabajador de prueba desde la UI del dueño → login del trabajador → recibe encargo → empezar → entregar → dueño aprueba. Capturas. Borrar datos de prueba al final.
