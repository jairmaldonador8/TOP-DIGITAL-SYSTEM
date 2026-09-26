# Agenda de Tadeo · Fase 1 (Mi día) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tadeo abre la web app en su iPhone y ve "Mi día" (citas, pendientes, entregas del equipo), agenda con un botón +, navega con una barra inferior y usa un calendario pensado para el celular; las citas se pueden editar.

**Architecture:** Migración 0023 amplía `eventos` (citas) y `tareas` (pendientes) y crea las tablas que usarán las fases 2 y 3 (`google_conexiones`, `avisos_enviados`). La lógica de "qué va en Mi día" y la validación de citas son funciones puras en `src/lib/agenda/` con pruebas; las páginas (Server Components) cargan datos y los componentes cliente solo pintan e interactúan. El dashboard actual se muda a `/agencia/resumen` y `/agencia` pasa a ser Mi día.

**Tech Stack:** Next.js 16 App Router (Server Actions, `useActionState`, `after`), React 19, Supabase (Postgres + RLS), Tailwind v4 + shadcn sobre Base UI, sonner, vitest + Testing Library, Playwright (verificación).

**Spec:** `docs/ultrapowers/specs/2026-09-25-agenda-tadeo-design.md` · **Research:** `docs/ultrapowers/research/2026-09-25-agenda-tadeo-research.md`

**Reglas del proyecto (leer antes de empezar):**
- `AGENTS.md`: Next 16 tiene cambios; consulta `node_modules/next/dist/docs/` antes de usar APIs nuevas.
- Mobile first (390 px) y branding Top Digital: fondo `bg-background` (#0d0b10), degradado `bg-marca`, tokens `marca-violeta|magenta|naranja`, `Isotipo`/`Wordmark` de `src/components/marca.tsx`.
- El `Button` de shadcn es Base UI: enlaces con `render={<Link …/>}` + `nativeButton={false}`; `DropdownMenuGroupLabel` exige `DropdownMenuGroup`.
- Fechas SIEMPRE con `src/lib/formato.ts` (zona America/Mexico_City; `hoyEnMexico()`), nunca `toISOString()` para "hoy".
- Server Actions re-verifican `esAdmin()` y validan UUIDs con `esUuid()` (`src/lib/acciones.ts`).
- Comandos Bash: la guarda del worktree rechaza líneas que contengan la palabra "digital" junto a otras cosas; pon URLs/rutas con ese texto dentro de scripts.
- Workflow: auto-commit y auto-push **activados** (`.claude/ultrapowers-preferences.json`) — commit al final de cada tarea, push a `fase-1`. **No** hacer push a `main` hasta la Tarea 12.

**Skills:** @supabase-multitenant-rls (Tarea 1), @nextjs16-supabase-auth (Tareas 4, 6), @web-push-ios (Tarea 9, layout standalone), @ultrapowers-dev:testing-tdd (Tareas 2, 3, 5), @ultrapowers-dev:typescript-best-practices, @ultrapowers-dev:nextjs-patterns.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/0023_agenda.sql` (crear) | Columnas nuevas de `eventos`/`tareas`, triggers, `google_conexiones`, `avisos_enviados` |
| `src/lib/agenda/tipos.ts` (crear) | Tipos `CitaDia`, `PendienteDia`, `EntregaDia`, `MiDia` |
| `src/lib/agenda/mi-dia.ts` (crear) | `construirMiDia()` puro: filtra/ordena/cuenta para Mi día |
| `src/lib/agenda/cita.ts` (crear) | `validarCita()` y `validarPendiente()` puros (FormData → datos o errores) |
| `src/lib/agenda/mi-dia-server.ts` (crear) | `cargarMiDia(supabase, hoy)`: las consultas + `construirMiDia` |
| `src/lib/agenda/__tests__/*.test.ts` (crear) | Pruebas de lo anterior |
| `src/app/(app)/agencia/agenda/actions.ts` (crear) | `crearCita`, `editarCita`, `eliminarCita`, `crearPendiente` |
| `src/app/(app)/agencia/calendario/actions.ts` (borrar) | Reemplazado por `agenda/actions.ts` |
| `src/lib/calendario/{tipos,fuentes}.ts` (modificar) | `borrado_en is null`, campos `horaFin/lugar/origen/avisoMin`, tareas con hora |
| `src/app/(app)/agencia/resumen/{page,loading}.tsx` (mover desde `(inicio)/`) | El dashboard de números |
| `src/app/(app)/agencia/(inicio)/{page,loading}.tsx` (reescribir) | Mi día |
| `src/components/agenda/mi-dia/*.tsx` (crear) | `TarjetaDia`, `LineaCitas`, `ListaPendientes`, `EntregasEquipo` |
| `src/components/agenda/cita-form.tsx` (crear) | Formulario de cita (crear/editar) |
| `src/components/agenda/pendiente-form.tsx` (crear) | Formulario de pendiente rápido |
| `src/components/agenda/hoja-agregar.tsx` (crear) | Hoja del botón + (Cita · Pendiente · Encargo) |
| `src/components/layout/barra-inferior.tsx` (crear) | Barra inferior móvil con + y "Más" |
| `src/components/calendario/evento-form.tsx` (borrar) | Reemplazado por `cita-form.tsx` |
| `src/components/calendario/vista-calendario.tsx` (modificar) | Agenda por defecto en móvil, franja de semana, tocar cita = editar |
| `src/app/(app)/agencia/layout.tsx`, `src/components/layout/topbar.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts`, `src/components/agencia/tour-agencia.tsx` (modificar) | Navegación, safe areas, manifest `id`, tour |

---

### Task 1: Migración 0023 — modelo de la agenda

**Files:**
- Create: `supabase/migrations/0023_agenda.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0023_agenda: citas editables y espejables con Google, pendientes
-- personales, y tablas de soporte para Google (fase 3) y avisos (fase 2).
-- Spec: docs/ultrapowers/specs/2026-09-25-agenda-tadeo-design.md

-- ===== eventos (citas) =====
alter table public.eventos
  add column hora_fin time,
  add column lugar text,
  add column aviso_min int check (aviso_min is null or aviso_min between 0 and 10080),
  add column origen text not null default 'sistema' check (origen in ('sistema', 'google')),
  add column google_event_id text unique,
  add column google_etag text,
  add column google_pendiente boolean not null default false,
  add column borrado_en timestamptz,
  add column actualizado_en timestamptz not null default now();

alter table public.eventos
  add constraint eventos_hora_fin_despues
  check (hora_fin is null or (hora is not null and hora_fin > hora));

create index eventos_vivos_fecha_idx on public.eventos (fecha) where borrado_en is null;

create or replace function private.tocar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger eventos_actualizado_en
  before update on public.eventos
  for each row execute function private.tocar_actualizado_en();

-- ===== tareas (pendientes) =====
-- Pendientes personales sin cliente. La policy "cliente lee sus tareas"
-- compara cliente_id = mi_cliente_id(): con null nunca coincide, así que
-- el portal no los ve (se verifica en el Step 4).
alter table public.tareas
  alter column cliente_id drop not null,
  add column hora time,
  add column completada_en timestamptz;

create or replace function private.sincronizar_completada_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.estado = 'completada' and new.completada_en is null then
    new.completada_en := now();
  elsif new.estado <> 'completada' then
    new.completada_en := null;
  end if;
  return new;
end;
$$;

create trigger tareas_completada_en
  before insert or update of estado on public.tareas
  for each row execute function private.sincronizar_completada_en();

update public.tareas set completada_en = created_at
  where estado = 'completada' and completada_en is null;

-- ===== google_conexiones (fase 3) — fila única, solo service role =====
create table public.google_conexiones (
  id boolean primary key default true check (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  refresh_token_cifrado text not null,
  calendar_id text not null default 'primary',
  sync_token text,
  canal_id text,
  canal_recurso_id text,
  canal_expira timestamptz,
  estado text not null default 'activa' check (estado in ('activa', 'revocada', 'error')),
  ultimo_error text,
  actualizado_en timestamptz not null default now()
);
alter table public.google_conexiones enable row level security;
-- Sin políticas a propósito: solo el cliente admin (service role).

-- ===== avisos_enviados (fase 2) — deduplicación, solo service role =====
create table public.avisos_enviados (
  clave text primary key,
  enviado_en timestamptz not null default now()
);
alter table public.avisos_enviados enable row level security;
-- Sin políticas a propósito: solo el cliente admin (service role).
```

- [ ] **Step 2: Aplicar en Supabase**

Requiere el MCP de Supabase autenticado (si pide OAuth, pásale el enlace al usuario y espera). Aplica con la herramienta `apply_migration` del MCP (project ref `wvbjdwkfkeejinggeljx`, name `0023_agenda`, query = contenido del archivo).
Expected: éxito sin errores.

- [ ] **Step 3: Verificar el esquema**

Con `execute_sql`:
```sql
select column_name, is_nullable, data_type from information_schema.columns
where table_schema='public' and table_name in ('eventos','tareas')
  and column_name in ('hora_fin','lugar','aviso_min','origen','google_event_id','borrado_en','actualizado_en','cliente_id','hora','completada_en')
order by table_name, column_name;
```
Expected: 10 filas; `tareas.cliente_id` con `is_nullable = YES`.

- [ ] **Step 4: Verificar RLS (simulación)**

Con `execute_sql` (un uid ficticio con rol cliente — los 2 usuarios reales son admin/equipo):
```sql
begin;
insert into public.tareas (titulo) values ('prueba rls personal');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","user_role":"cliente","cliente_id":"00000000-0000-0000-0000-0000000000aa"}', true);
select count(*) as visibles from public.tareas where titulo = 'prueba rls personal';
select count(*) as conexiones from public.google_conexiones;
select count(*) as avisos from public.avisos_enviados;
rollback;
```
Expected: `visibles = 0`, `conexiones = 0`, `avisos = 0` (sin error: RLS sin políticas devuelve vacío).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0023_agenda.sql
git commit -m "feat(db): citas editables y pendientes personales para la agenda (0023)"
```

---

### Task 2: Lógica pura de Mi día

**Files:**
- Create: `src/lib/agenda/tipos.ts`, `src/lib/agenda/mi-dia.ts`
- Test: `src/lib/agenda/__tests__/mi-dia.test.ts`

- [ ] **Step 1: Tipos**

```ts
// src/lib/agenda/tipos.ts
/** Piezas de la pantalla Mi día (spec 2026-09-25-agenda-tadeo). */

export type CitaDia = {
  id: string
  titulo: string
  fecha: string // YYYY-MM-DD
  hora: string | null // HH:MM (null = todo el día)
  horaFin: string | null
  lugar: string | null
  cliente: string | null
  origen: 'sistema' | 'google'
  avisoMin: number | null
  descripcion: string | null
  clienteId: string | null
  tipo: string // evento_tipo: junta | sesion | lanzamiento | pago | otro
}

export type PendienteDia = {
  id: string
  titulo: string
  fecha: string | null
  hora: string | null
  cliente: string | null
  atrasado: boolean
}

export type EntregaDia = {
  id: string
  titulo: string
  fecha: string
  integrante: string
  atrasada: boolean
}

export type MiDia = {
  citas: CitaDia[]
  pendientes: PendienteDia[]
  entregas: EntregaDia[]
  conteo: { citas: number; pendientes: number; entregasHoy: number; atrasados: number }
}
```

- [ ] **Step 2: Escribir las pruebas (fallan)**

```ts
// src/lib/agenda/__tests__/mi-dia.test.ts
import { describe, expect, it } from 'vitest'

import { construirMiDia } from '../mi-dia'
import type { CitaDia } from '../tipos'

const HOY = '2026-09-26'

const cita = (p: Partial<CitaDia>): CitaDia => ({
  id: 'c', titulo: 'Cita', fecha: HOY, hora: '10:00', horaFin: null, lugar: null,
  cliente: null, origen: 'sistema', avisoMin: 30, descripcion: null, clienteId: null, tipo: 'junta', ...p,
})

describe('construirMiDia', () => {
  it('solo muestra citas de hoy: primero las de todo el día, luego por hora', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [
        cita({ id: 'b', hora: '13:30' }),
        cita({ id: 'x', fecha: '2026-09-27' }),
        cita({ id: 'a', hora: '09:00' }),
        cita({ id: 't', hora: null }),
      ],
      pendientes: [],
      entregas: [],
    })
    expect(r.citas.map((c) => c.id)).toEqual(['t', 'a', 'b'])
    expect(r.conteo.citas).toBe(3)
  })

  it('pendientes: atrasados primero, luego hoy (por hora), luego sin fecha; oculta futuros', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [],
      pendientes: [
        { id: 'sin', titulo: 'Sin fecha', fecha: null, hora: null, cliente: null },
        { id: 'fut', titulo: 'Mañana', fecha: '2026-09-27', hora: null, cliente: null },
        { id: 'hoy2', titulo: 'Hoy tarde', fecha: HOY, hora: '18:00', cliente: null },
        { id: 'hoy1', titulo: 'Hoy', fecha: HOY, hora: null, cliente: 'OfficeTure' },
        { id: 'atr', titulo: 'Atrasado', fecha: '2026-09-20', hora: null, cliente: null },
      ],
      entregas: [],
    })
    expect(r.pendientes.map((p) => p.id)).toEqual(['atr', 'hoy1', 'hoy2', 'sin'])
    expect(r.pendientes[0].atrasado).toBe(true)
    expect(r.pendientes[1].atrasado).toBe(false)
    expect(r.conteo.pendientes).toBe(4)
    expect(r.conteo.atrasados).toBe(1)
  })

  it('entregas: solo las de hoy o atrasadas; las atrasadas suman a atrasados', () => {
    const r = construirMiDia({
      hoy: HOY,
      citas: [],
      pendientes: [],
      entregas: [
        { id: 'e1', titulo: 'Landing', fecha: HOY, integrante: 'Jair' },
        { id: 'e2', titulo: 'Posts', fecha: '2026-09-24', integrante: 'Jair' },
        { id: 'e3', titulo: 'Video', fecha: '2026-10-01', integrante: 'Jair' },
      ],
    })
    expect(r.entregas.map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(r.conteo.entregasHoy).toBe(1)
    expect(r.conteo.atrasados).toBe(1)
  })
})
```

- [ ] **Step 3: Correr y ver que falla**

Run: `npx vitest run src/lib/agenda/__tests__/mi-dia.test.ts`
Expected: FAIL — `Failed to resolve import "../mi-dia"`.

- [ ] **Step 4: Implementar**

```ts
// src/lib/agenda/mi-dia.ts
/**
 * Arma la pantalla Mi día a partir de filas ya cargadas (función pura:
 * recibe `hoy` en hora de México para ser determinista en pruebas).
 */
import type { CitaDia, EntregaDia, MiDia, PendienteDia } from './tipos'

type PendienteCrudo = Omit<PendienteDia, 'atrasado'>
type EntregaCruda = Omit<EntregaDia, 'atrasada'>

export function construirMiDia(entrada: {
  hoy: string
  citas: CitaDia[]
  pendientes: PendienteCrudo[]
  entregas: EntregaCruda[]
}): MiDia {
  const { hoy } = entrada

  const citas = entrada.citas
    .filter((c) => c.fecha === hoy)
    .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? '') || a.titulo.localeCompare(b.titulo, 'es'))

  const rango = (p: PendienteCrudo) => (p.fecha === null ? 2 : p.fecha < hoy ? 0 : 1)
  const pendientes: PendienteDia[] = entrada.pendientes
    .filter((p) => p.fecha === null || p.fecha <= hoy)
    .map((p) => ({ ...p, atrasado: p.fecha !== null && p.fecha < hoy }))
    .sort(
      (a, b) =>
        rango(a) - rango(b) ||
        (a.fecha ?? '').localeCompare(b.fecha ?? '') ||
        // Sin hora primero (como las citas de todo el día), luego por hora.
        (a.hora ?? '').localeCompare(b.hora ?? '') ||
        a.titulo.localeCompare(b.titulo, 'es')
    )

  const entregas: EntregaDia[] = entrada.entregas
    .filter((e) => e.fecha <= hoy)
    .map((e) => ({ ...e, atrasada: e.fecha < hoy }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es'))

  return {
    citas,
    pendientes,
    entregas,
    conteo: {
      citas: citas.length,
      pendientes: pendientes.length,
      entregasHoy: entregas.filter((e) => !e.atrasada).length,
      atrasados:
        pendientes.filter((p) => p.atrasado).length + entregas.filter((e) => e.atrasada).length,
    },
  }
}
```

- [ ] **Step 5: Correr y ver que pasa**

Run: `npx vitest run src/lib/agenda/__tests__/mi-dia.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/agenda
git commit -m "feat(agenda): lógica pura de Mi día con pruebas"
```

---

### Task 3: Validación pura de citas y pendientes

**Files:**
- Create: `src/lib/agenda/cita.ts`
- Test: `src/lib/agenda/__tests__/cita.test.ts`

- [ ] **Step 1: Escribir las pruebas (fallan)**

```ts
// src/lib/agenda/__tests__/cita.test.ts
import { describe, expect, it } from 'vitest'

import { AVISOS_MIN, validarCita, validarPendiente } from '../cita'

const UUID = '3f2b8c1e-1d2a-4b5c-9d8e-7f6a5b4c3d2e'

describe('validarCita', () => {
  it('acepta una cita completa y normaliza vacíos a null', () => {
    const r = validarCita({
      titulo: '  Junta OfficeTure ', fecha: '2026-09-26', hora: '10:00', hora_fin: '11:00',
      lugar: '', aviso_min: '30', cliente_id: UUID, descripcion: '', tipo: 'junta',
    })
    expect(r).toEqual({
      ok: true,
      datos: {
        titulo: 'Junta OfficeTure', fecha: '2026-09-26', hora: '10:00', hora_fin: '11:00',
        lugar: null, aviso_min: 30, cliente_id: UUID, descripcion: null, tipo: 'junta',
      },
    })
  })

  it('todo el día: sin hora no hay hora_fin ni aviso previo', () => {
    const r = validarCita({ titulo: 'Pago', fecha: '2026-09-26', hora: '', hora_fin: '12:00', aviso_min: '30' })
    expect(r.ok && r.datos).toMatchObject({ hora: null, hora_fin: null, aviso_min: null })
  })

  it('rechaza título vacío, fecha inválida, fin antes del inicio y aviso fuera de lista', () => {
    const r = validarCita({ titulo: ' ', fecha: '26/09', hora: '10:00', hora_fin: '09:00', aviso_min: '7' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(['aviso_min', 'fecha', 'hora_fin', 'titulo'])
    }
  })

  it('las opciones de aviso incluyen "sin aviso"', () => {
    expect(AVISOS_MIN.map((a) => a.value)).toContain('')
  })
})

describe('validarPendiente', () => {
  it('cliente y fecha opcionales', () => {
    expect(validarPendiente({ titulo: 'Pagar tarjeta' })).toEqual({
      ok: true,
      datos: { titulo: 'Pagar tarjeta', fecha_limite: null, hora: null, cliente_id: null },
    })
  })

  it('rechaza cliente con forma inválida', () => {
    const r = validarPendiente({ titulo: 'x', cliente_id: 'nope' })
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run src/lib/agenda/__tests__/cita.test.ts`
Expected: FAIL — no resuelve `../cita`.

- [ ] **Step 3: Implementar**

```ts
// src/lib/agenda/cita.ts
/**
 * Validación pura de citas y pendientes (Server Actions de la agenda).
 * Recibe los valores de texto del formulario y devuelve datos listos para
 * insertar o errores por campo.
 */
import { esUuid } from '@/lib/uuid'

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export const TIPOS_CITA = [
  { value: 'junta', label: 'Junta' },
  { value: 'sesion', label: 'Sesión' },
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'pago', label: 'Pago' },
  { value: 'otro', label: 'Otro' },
] as const
export type TipoCita = (typeof TIPOS_CITA)[number]['value']

export const AVISOS_MIN = [
  { value: '', label: 'Sin aviso' },
  { value: '10', label: '10 min antes' },
  { value: '30', label: '30 min antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 día antes' },
] as const

export type DatosCita = {
  titulo: string
  fecha: string
  hora: string | null
  hora_fin: string | null
  lugar: string | null
  aviso_min: number | null
  cliente_id: string | null
  descripcion: string | null
  tipo: TipoCita
}

export type DatosPendiente = {
  titulo: string
  fecha_limite: string | null
  hora: string | null
  cliente_id: string | null
}

type Resultado<T> = { ok: true; datos: T } | { ok: false; errores: Record<string, string> }

const texto = (v: string | undefined) => (v ?? '').trim()
const nulo = (v: string | undefined) => texto(v) || null

export function validarCita(v: Record<string, string>): Resultado<DatosCita> {
  const errores: Record<string, string> = {}

  const titulo = texto(v.titulo)
  if (!titulo) errores.titulo = 'Ponle título a la cita'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const fecha = texto(v.fecha)
  if (!FECHA.test(fecha)) errores.fecha = 'Elige el día'

  const hora = nulo(v.hora)
  if (hora && !HORA.test(hora)) errores.hora = 'Hora no válida'

  // Sin hora = todo el día: no aplica hora de fin ni aviso previo.
  let horaFin = hora ? nulo(v.hora_fin) : null
  if (horaFin && !HORA.test(horaFin)) errores.hora_fin = 'Hora no válida'
  else if (horaFin && hora && horaFin <= hora) errores.hora_fin = 'Debe terminar después de empezar'
  if (errores.hora_fin) horaFin = null

  const avisoTexto = texto(v.aviso_min)
  if (!AVISOS_MIN.some((a) => a.value === avisoTexto)) errores.aviso_min = 'Opción no válida'
  const avisoMin = hora && avisoTexto ? Number(avisoTexto) : null

  const clienteId = nulo(v.cliente_id)
  if (clienteId && !esUuid(clienteId)) errores.cliente_id = 'Cliente no válido'

  const tipo = (texto(v.tipo) || 'junta') as TipoCita
  if (!TIPOS_CITA.some((t) => t.value === tipo)) errores.tipo = 'Tipo no válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return {
    ok: true,
    datos: {
      titulo, fecha, hora, hora_fin: horaFin, lugar: nulo(v.lugar), aviso_min: avisoMin,
      cliente_id: clienteId, descripcion: nulo(v.descripcion), tipo,
    },
  }
}

export function validarPendiente(v: Record<string, string>): Resultado<DatosPendiente> {
  const errores: Record<string, string> = {}

  const titulo = texto(v.titulo)
  if (!titulo) errores.titulo = 'Escribe el pendiente'
  else if (titulo.length > 200) errores.titulo = 'Máximo 200 caracteres'

  const fecha = nulo(v.fecha_limite)
  if (fecha && !FECHA.test(fecha)) errores.fecha_limite = 'Fecha no válida'

  const hora = nulo(v.hora)
  if (hora && !HORA.test(hora)) errores.hora = 'Hora no válida'

  const clienteId = nulo(v.cliente_id)
  if (clienteId && !esUuid(clienteId)) errores.cliente_id = 'Cliente no válido'

  if (Object.keys(errores).length > 0) return { ok: false, errores }
  return { ok: true, datos: { titulo, fecha_limite: fecha, hora, cliente_id: clienteId } }
}
```

Nota: la prueba "rechaza…" espera exactamente `['aviso_min','fecha','hora_fin','titulo']`; con `hora='10:00'` y `hora_fin='09:00'` sale `hora_fin`, y `'7'` no está en la lista.

- [ ] **Step 4: Correr y ver que pasa**

Run: `npx vitest run src/lib/agenda/__tests__/cita.test.ts`
Expected: PASS (6 tests).

**Antes del Step 3** (para no arrastrar `next/headers` a una función pura): mueve `esUuid` y la regex `UUID` de `src/lib/acciones.ts` a `src/lib/uuid.ts` (sin imports), deja en `acciones.ts` `export { esUuid } from './uuid'`, y en `cita.ts` importa `import { esUuid } from '@/lib/uuid'` (no desde `acciones`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/agenda src/lib/uuid.ts src/lib/acciones.ts
git commit -m "feat(agenda): validación pura de citas y pendientes"
```

---

### Task 4: Server Actions de la agenda

**Files:**
- Create: `src/app/(app)/agencia/agenda/actions.ts`
- Delete: `src/app/(app)/agencia/calendario/actions.ts` (lo usan `evento-form.tsx` y `vista-calendario.tsx`; se reemplazan en Tareas 7 y 10 — hasta entonces deja el archivo viejo y bórralo en la Tarea 10)

- [ ] **Step 1: Implementar**

```ts
// src/app/(app)/agencia/agenda/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

import { esAdmin, esUuid, NO_AUTORIZADO, valoresDe, type ResultadoAccion } from '@/lib/acciones'
import { validarCita, validarPendiente } from '@/lib/agenda/cita'
import { createClient } from '@/lib/supabase/server'

const CAMPOS_CITA = ['titulo', 'fecha', 'hora', 'hora_fin', 'lugar', 'aviso_min', 'cliente_id', 'descripcion', 'tipo']
const CAMPOS_PENDIENTE = ['titulo', 'fecha_limite', 'hora', 'cliente_id']

function revalidar() {
  // Mi día, calendario, campanita y feed leen citas/pendientes.
  revalidatePath('/agencia', 'layout')
}

export async function crearCita(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const valores = valoresDe(formData, CAMPOS_CITA)
  const r = validarCita(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('eventos').insert(r.datos)
  if (error) {
    console.error('Error al crear cita:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar la cita, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}

export async function editarCita(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const id = String(formData.get('id') ?? '')
  const valores = valoresDe(formData, CAMPOS_CITA)
  if (!esUuid(id)) return { ok: false, errores: { _form: 'Solicitud no válida' }, valores }
  const r = validarCita(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos')
    .update(r.datos)
    .eq('id', id)
    .is('borrado_en', null)
    .select('id')
    .maybeSingle()
  if (error || !data) {
    console.error('Error al editar cita:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar el cambio, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}

export type ResultadoSimple = { ok: true } | { ok: false; mensaje: string }

/**
 * Borra una cita. Si ya vive en Google (google_event_id), es borrado suave:
 * la fase 3 la quita de Google y luego la elimina. Si no, se va de una vez.
 */
export async function eliminarCita(id: string): Promise<ResultadoSimple> {
  if (!(await esAdmin())) return { ok: false, mensaje: 'No tienes permiso para realizar esta acción' }
  if (!esUuid(id)) return { ok: false, mensaje: 'Solicitud no válida' }

  const supabase = await createClient()
  const { data: fila } = await supabase.from('eventos').select('google_event_id').eq('id', id).maybeSingle()
  const { error } = fila?.google_event_id
    ? await supabase.from('eventos').update({ borrado_en: new Date().toISOString(), google_pendiente: true }).eq('id', id)
    : await supabase.from('eventos').delete().eq('id', id)
  if (error) {
    console.error('Error al eliminar cita:', error)
    return { ok: false, mensaje: 'No se pudo eliminar, intenta de nuevo' }
  }
  revalidar()
  return { ok: true }
}

export async function crearPendiente(_prev: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  if (!(await esAdmin())) return NO_AUTORIZADO
  const valores = valoresDe(formData, CAMPOS_PENDIENTE)
  const r = validarPendiente(valores)
  if (!r.ok) return { ok: false, errores: r.errores, valores }

  const supabase = await createClient()
  const { error } = await supabase.from('tareas').insert(r.datos)
  if (error) {
    console.error('Error al crear pendiente:', error)
    return { ok: false, errores: { _form: 'No se pudo guardar el pendiente, intenta de nuevo' }, valores }
  }
  revalidar()
  return { ok: true }
}
```

Completar/descompletar pendientes reutiliza `cambiarEstadoTarea` de `src/app/(app)/agencia/tareas/actions.ts` (el trigger de la 0023 llena `completada_en`).

- [ ] **Step 2: Verificar tipos y lint**

Run: `npx tsc --noEmit && npx eslint src/app/\(app\)/agencia/agenda`
Expected: sin salida (éxito).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/agencia/agenda/actions.ts"
git commit -m "feat(agenda): server actions de citas y pendientes"
```

---

### Task 5: Fuentes del calendario conscientes de la agenda

**Files:**
- Modify: `src/lib/calendario/tipos.ts`, `src/lib/calendario/fuentes.ts`
- Test: `src/lib/calendario/__tests__/fuentes.test.ts`

- [ ] **Step 1: Prueba nueva (falla)** — agrega al final de `fuentes.test.ts`:

```ts
  it('las citas llevan horaFin, lugar, origen y avisoMin; el detalle incluye el lugar', () => {
    const [cita] = construirElementos({
      ...base,
      eventos: [
        {
          id: 'v9', titulo: 'Junta', descripcion: null, fecha: '2026-09-26', hora: '10:00:00',
          hora_fin: '11:00:00', lugar: 'Oficina', aviso_min: 30, origen: 'google', tipo: 'junta',
          cliente_id: null, clientes: { nombre_negocio: 'OfficeTure' },
        },
      ],
    })
    expect(cita).toMatchObject({
      hora: '10:00', horaFin: '11:00', lugar: 'Oficina', origen: 'google', avisoMin: 30,
      detalle: 'OfficeTure · Oficina',
    })
  })
```

Actualiza también los objetos de `eventos` que ya existen en el archivo agregando `hora_fin: null, lugar: null, aviso_min: null, origen: 'sistema', cliente_id: null` para que compilen.

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run src/lib/calendario/__tests__/fuentes.test.ts`
Expected: FAIL (propiedades inexistentes / tipos).

- [ ] **Step 3: Implementar**

En `tipos.ts` agrega a `ElementoCalendario`:
```ts
  /** Solo citas (tipo 'evento'): HH:MM de fin. */
  horaFin: string | null
  lugar: string | null
  origen: 'sistema' | 'google' | null
  avisoMin: number | null
  /** Solo citas: datos crudos para abrir el formulario de edición. */
  descripcion: string | null
  clienteId: string | null
```
En `fuentes.ts`:
- `FilaEvento` suma `hora_fin: string | null; lugar: string | null; aviso_min: number | null; origen: 'sistema' | 'google'; cliente_id: string | null`.
- Campañas/encargos/tareas empujan `horaFin: null, lugar: null, origen: null, avisoMin: null, descripcion: null, clienteId: null`.
- Tareas: agrega `hora` al select y al tipo (`hora: string | null`) y usa `hora: tarea.hora ? tarea.hora.slice(0, 5) : null`.
- Eventos:
```ts
      hora: evento.hora ? evento.hora.slice(0, 5) : null,
      horaFin: evento.hora_fin ? evento.hora_fin.slice(0, 5) : null,
      lugar: evento.lugar,
      origen: evento.origen,
      avisoMin: evento.aviso_min,
      descripcion: evento.descripcion,
      clienteId: evento.cliente_id,
      detalle: [evento.clientes?.nombre_negocio, evento.lugar].filter(Boolean).join(' · ') || null,
```
  (la descripción ya no va en `detalle`; se ve al abrir la cita).
- Consulta de eventos: `select('id, titulo, descripcion, fecha, hora, hora_fin, lugar, aviso_min, origen, tipo, cliente_id, clientes ( nombre_negocio )')` + `.is('borrado_en', null)`.
- Consulta de tareas: `select('id, titulo, fecha_limite, hora, clientes ( nombre_negocio )')`.

Si la prueba existente de detalle de evento esperaba `'Cliente · descripción'`, actualízala a la nueva regla (cliente · lugar).

- [ ] **Step 4: Correr pruebas del calendario e ICS**

Run: `npx vitest run src/lib/calendario`
Expected: PASS. Si `ics.test.ts` construye elementos a mano, agrega los campos nuevos en `null`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendario
git commit -m "feat(calendario): citas con fin, lugar y origen; oculta borradas"
```

---

### Task 6: Mudar el dashboard a /agencia/resumen

**Files:**
- Move: `src/app/(app)/agencia/(inicio)/page.tsx` → `src/app/(app)/agencia/resumen/page.tsx`
- Move: `src/app/(app)/agencia/(inicio)/loading.tsx` → `src/app/(app)/agencia/resumen/loading.tsx`
- Modify: `src/app/(app)/agencia/layout.tsx:28-38`

- [ ] **Step 1: Mover con git**

```bash
mkdir -p "src/app/(app)/agencia/resumen"
git mv "src/app/(app)/agencia/(inicio)/page.tsx" "src/app/(app)/agencia/resumen/page.tsx"
git mv "src/app/(app)/agencia/(inicio)/loading.tsx" "src/app/(app)/agencia/resumen/loading.tsx"
```
En `resumen/page.tsx` cambia `export const metadata` (o agrégalo) a `{ title: 'Resumen' }` y quita `data-tour="metricas"` (pasa a Mi día en la Tarea 8). Revisa enlaces internos que apunten a `/agencia` esperando el dashboard: `grep -rn "'/agencia'" src` — los de "volver al inicio" pueden quedarse (ahora llevan a Mi día).

- [ ] **Step 2: Navegación**

En `layout.tsx` reemplaza `ELEMENTOS_AGENCIA`:
```ts
const ELEMENTOS_AGENCIA: ElementoNav[] = [
  { icono: 'midia', label: 'Mi día', href: '/agencia' },
  { icono: 'calendario', label: 'Calendario', href: '/agencia/calendario' },
  { icono: 'equipo', label: 'Equipo', href: '/agencia/equipo' },
  { icono: 'clientes', label: 'Clientes', href: '/agencia/clientes' },
  { icono: 'chats', label: 'Chats', href: '/agencia/chats' },
  { icono: 'tareas', label: 'Tareas', href: '/agencia/tareas' },
  { icono: 'campanias', label: 'Campañas', href: '/agencia/campanias' },
  { icono: 'leads', label: 'Leads', href: '/agencia/leads' },
  { icono: 'dashboard', label: 'Resumen', href: '/agencia/resumen' },
  { icono: 'reportes', label: 'Reportes', href: '/agencia/reportes' },
]
```
En `src/components/layout/sidebar.tsx` agrega a `ICONOS`: `midia: Sun` (importa `Sun` de `lucide-react`).

- [ ] **Step 3: Página temporal de Mi día** (para que `/agencia` no quede en 404 entre tareas)

`src/app/(app)/agencia/(inicio)/page.tsx`:
```tsx
export default function MiDia() {
  return <h1 className="text-2xl font-semibold">Mi día</h1>
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npx eslint && npx vitest run`
Expected: todo en verde.

- [ ] **Step 5: Commit**

```bash
git add -A "src/app/(app)/agencia" src/components/layout/sidebar.tsx
git commit -m "refactor(agencia): el dashboard se muda a Resumen; Mi día toma el inicio"
```

---

### Task 7: Formularios de cita y pendiente + hoja del botón +

**Files:**
- Create: `src/components/agenda/cita-form.tsx`, `src/components/agenda/pendiente-form.tsx`, `src/components/agenda/hoja-agregar.tsx`
- Modify: `src/components/equipo/formularios-equipo.tsx` (exportar `FormularioEncargo` si no lo está)

- [ ] **Step 1: `cita-form.tsx`**

Basado en `FormularioEvento` de `src/components/calendario/evento-form.tsx` (misma estructura `useActionState` + `Campo` + `describedBy`; copia esos helpers locales). Diferencias:
- Props: `{ clientes: ClienteOpcionCita[]; cita?: CitaEditable; alExito: () => void }` con
  `export type ClienteOpcionCita = { id: string; nombre_negocio: string }` y
  `export type CitaEditable = { id: string; titulo: string; fecha: string; hora: string | null; horaFin: string | null; lugar: string | null; avisoMin: number | null; clienteId: string | null; descripcion: string | null; tipo: string; origen: 'sistema' | 'google' }`.
- Action: `cita ? editarCita : crearCita` (de `@/app/(app)/agencia/agenda/actions`); en edición, `<input type="hidden" name="id" value={cita.id} />`.
- Campos en este orden (mobile first, una columna; `sm:grid-cols-2` solo para pares hora/fin y tipo/aviso): Título · Cliente (Select con opción "Sin cliente" = '') · Día (`type="date"`) · Hora y Termina (`type="time"`) · Lugar · Tipo (`TIPOS_CITA`) · Avisarme (`AVISOS_MIN`, default `'30'`) · Notas (`Textarea name="descripcion"`).
- Inputs con `className="h-11 text-base"` (evita el zoom de iOS con < 16 px y da objetivo táctil ≥ 44 px).
- Si `cita?.origen === 'google'`: nota pequeña "Viene de tu Google Calendar" (los cambios se espejean en la fase 3).
- Botón enviar a lo ancho: `className="bg-marca h-12 w-full rounded-full text-base font-semibold text-white"`, textos "Guardar" / "Guardando…".
- En edición, además un botón secundario "Eliminar cita" que llama `eliminarCita(cita.id)` con confirmación (`AlertDialog`, patrón existente en el repo) y luego `alExito()`; toasts con `sonner`.

- [ ] **Step 2: `pendiente-form.tsx`**

Formulario corto con `crearPendiente`: Título (autoFocus) · Día (opcional, default `hoyEnMexico()` pasado por prop `hoy`) · Hora (opcional) · Cliente (opcional). Mismas clases táctiles. Éxito → `toast.success('Pendiente anotado ✅')` y `alExito()`.

- [ ] **Step 3: `hoja-agregar.tsx`**

```tsx
'use client'

/**
 * Hoja del botón +: agendar una cita, anotar un pendiente o asignar un
 * encargo. Controlada desde afuera (la abren la barra inferior y los
 * botones de Mi día/Calendario). Hoja inferior en móvil, centrada y
 * angosta en pantallas grandes.
 */
import * as React from 'react'

import { CitaForm, type ClienteOpcionCita } from '@/components/agenda/cita-form'
import { PendienteForm } from '@/components/agenda/pendiente-form'
import { FormularioEncargo, type TrabajadorOpcion } from '@/components/equipo/formularios-equipo'
import { crearEncargo } from '@/app/(app)/agencia/equipo/actions'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type PestanaAgregar = 'cita' | 'pendiente' | 'encargo'

export type DatosHojaAgregar = {
  clientes: ClienteOpcionCita[]
  trabajadores: TrabajadorOpcion[]
  hoy: string
}

export function HojaAgregar({
  abierta, alCambiar, datos, inicial = 'cita',
}: {
  abierta: boolean
  alCambiar: (abierta: boolean) => void
  datos: DatosHojaAgregar
  inicial?: PestanaAgregar
}) {
  const [pestana, setPestana] = React.useState<PestanaAgregar>(inicial)
  const [epoca, setEpoca] = React.useState(0)
  const cerrar = React.useCallback(() => alCambiar(false), [alCambiar])

  // La abren desde afuera con alCambiar(true) (onOpenChange no se dispara):
  // al abrirse, formularios limpios y la pestaña inicial. Patrón "ajustar
  // estado cuando cambia una prop" (sin efecto).
  const [abiertaPrevia, setAbiertaPrevia] = React.useState(abierta)
  if (abierta !== abiertaPrevia) {
    setAbiertaPrevia(abierta)
    if (abierta) { setEpoca((n) => n + 1); setPestana(inicial) }
  }

  const cambiar = (abierta: boolean) => alCambiar(abierta)

  const PESTANAS: { id: PestanaAgregar; label: string }[] = [
    { id: 'cita', label: 'Cita' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'encargo', label: 'Encargo' },
  ]

  return (
    <Sheet open={abierta} onOpenChange={cambiar}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-0 bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0">
          <SheetTitle>Agregar</SheetTitle>
          <SheetDescription className="sr-only">Agenda una cita, anota un pendiente o asigna un encargo</SheetDescription>
        </SheetHeader>
        <div role="tablist" className="mb-4 flex gap-2">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              type="button"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={cn(
                'h-10 rounded-full px-4 text-sm font-semibold transition-colors',
                pestana === p.id ? 'bg-marca text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {pestana === 'cita' && <CitaForm key={`c${epoca}`} clientes={datos.clientes} alExito={cerrar} />}
        {pestana === 'pendiente' && <PendienteForm key={`p${epoca}`} clientes={datos.clientes} hoy={datos.hoy} alExito={cerrar} />}
        {pestana === 'encargo' && (
          <FormularioEncargo
            key={`e${epoca}`}
            action={crearEncargo}
            etiquetas={{ enviando: 'Asignando…', enviar: 'Asignar encargo' }}
            trabajadores={datos.trabajadores}
            clientes={datos.clientes}
            alExito={cerrar}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
```
Verifica en `formularios-equipo.tsx` los nombres reales (`FormularioEncargo`, `TrabajadorOpcion`, `ClienteOpcionEquipo`) y exporta lo que falte sin cambiar su comportamiento. Si los tipos de cliente difieren solo de nombre, usa el mismo shape `{ id, nombre_negocio }`.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npx eslint src/components/agenda src/components/equipo`
Expected: éxito.

- [ ] **Step 5: Commit**

```bash
git add src/components/agenda src/components/equipo/formularios-equipo.tsx
git commit -m "feat(agenda): hoja + con formularios de cita, pendiente y encargo"
```

---

### Task 8: Pantalla Mi día

**Files:**
- Create: `src/lib/agenda/mi-dia-server.ts`, `src/components/agenda/mi-dia/tarjeta-dia.tsx`, `linea-citas.tsx`, `lista-pendientes.tsx`, `entregas-equipo.tsx`, `src/components/agenda/mi-dia/boton-agregar.tsx`
- Rewrite: `src/app/(app)/agencia/(inicio)/page.tsx`, create `src/app/(app)/agencia/(inicio)/loading.tsx`
- Modify: `src/components/agencia/tour-agencia.tsx`

- [ ] **Step 1: `mi-dia-server.ts`**

```ts
// src/lib/agenda/mi-dia-server.ts
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { construirMiDia } from './mi-dia'
import type { CitaDia, MiDia } from './tipos'

type Rel = { nombre_negocio: string } | { nombre_negocio: string }[] | null
const negocio = (r: Rel) => (Array.isArray(r) ? r[0]?.nombre_negocio : r?.nombre_negocio) ?? null
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null)

/** Las 4 consultas de Mi día (sesión admin) + armado puro. */
export async function cargarMiDia(supabase: SupabaseClient, hoy: string): Promise<MiDia> {
  const [citas, tareas, encargos, integrantes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, titulo, descripcion, fecha, hora, hora_fin, lugar, aviso_min, origen, tipo, cliente_id, clientes ( nombre_negocio )')
      .eq('fecha', hoy)
      .is('borrado_en', null),
    supabase
      .from('tareas')
      .select('id, titulo, fecha_limite, hora, clientes ( nombre_negocio )')
      .neq('estado', 'completada')
      .or(`fecha_limite.is.null,fecha_limite.lte.${hoy}`),
    supabase
      .from('encargos')
      .select('id, titulo, fecha_limite, asignado_a')
      .neq('estado', 'aprobado')
      .lte('fecha_limite', hoy),
    supabase.from('usuarios').select('user_id, nombre').eq('rol', 'equipo'),
  ])
  for (const r of [citas, tareas, encargos, integrantes]) if (r.error) console.error('Error al cargar Mi día:', r.error)

  const nombres = new Map(((integrantes.data ?? []) as { user_id: string; nombre: string | null }[]).map((u) => [u.user_id, u.nombre ?? 'Integrante']))

  return construirMiDia({
    hoy,
    citas: ((citas.data ?? []) as unknown as Array<Record<string, unknown> & { clientes: Rel }>).map((c) => ({
      id: c.id as string,
      titulo: c.titulo as string,
      fecha: c.fecha as string,
      hora: hhmm(c.hora as string | null),
      horaFin: hhmm(c.hora_fin as string | null),
      lugar: (c.lugar as string | null) ?? null,
      cliente: negocio(c.clientes),
      origen: c.origen as CitaDia['origen'],
      avisoMin: (c.aviso_min as number | null) ?? null,
      descripcion: (c.descripcion as string | null) ?? null,
      clienteId: (c.cliente_id as string | null) ?? null,
      tipo: c.tipo as string,
    })),
    pendientes: ((tareas.data ?? []) as unknown as { id: string; titulo: string; fecha_limite: string | null; hora: string | null; clientes: Rel }[]).map((t) => ({
      id: t.id, titulo: t.titulo, fecha: t.fecha_limite, hora: hhmm(t.hora), cliente: negocio(t.clientes),
    })),
    entregas: ((encargos.data ?? []) as { id: string; titulo: string; fecha_limite: string; asignado_a: string }[]).map((e) => ({
      id: e.id, titulo: e.titulo, fecha: e.fecha_limite, integrante: nombres.get(e.asignado_a) ?? 'Integrante',
    })),
  })
}
```
(`tipo` ya viene en `CitaDia` desde la Tarea 2: colorea la fila y alimenta `CitaEditable.tipo`.)

- [ ] **Step 2: Componentes** (todos mobile first, branding de la maqueta aprobada `.ultrapowers/brainstorm/*/agenda-tadeo.html`)

- `tarjeta-dia.tsx` (server): tarjeta `bg-marca rounded-3xl p-5 text-white` con `data-tour="metricas"`; línea grande "`N citas · M pendientes`" y debajo "`X entregas vencen hoy · Y atrasados`" (omitir las partes en 0; si todo es 0: "Día libre ✨").
- `linea-citas.tsx` (client): lista de `CitaDia`; cada fila `min-h-14` con hora (`text-xs text-muted-foreground w-12`; "Todo el día" si `hora` null) y tarjeta `rounded-2xl bg-card border-l-[3px]` (color por tipo: junta magenta, sesión naranja, resto violeta), título, `cliente · lugar · duración` (duración en min/h desde `hora`→`horaFin`), badge "Google" si `origen==='google'`. Tocar abre un `Sheet side="bottom"` con `CitaForm` en modo edición. Vacío: "Sin citas hoy" + botón "Agendar" que abre la `HojaAgregar` en pestaña cita.
- `lista-pendientes.tsx` (client): filas `min-h-12` con palomita circular de 24 px (botón con `aria-label="Completar <título>"`); al tocar: marca optimista (tachado + opacidad), llama `cambiarEstadoTarea(id,'completada')`, toast "Listo ✅" con acción "Deshacer" → `cambiarEstadoTarea(id,'pendiente')`. Chips: `atrasado` naranja, "hoy <hora>" si hay hora, nombre del cliente si hay. Reusa `restaurarDesdeToast`-style de `lista-tareas.tsx`.
- `entregas-equipo.tsx` (server): lista corta "`<integrante> · <título>`" con chip "vence hoy"/"atrasada" y enlace a `/agencia/equipo`. No se renderiza si está vacía.
- `boton-agregar.tsx` (client): props `{ datos: DatosHojaAgregar; inicial?: PestanaAgregar; etiqueta?: string }` (default `inicial='cita'`, `etiqueta='Agregar'`); botón `bg-marca rounded-full` con ícono + y la etiqueta, que abre `HojaAgregar` con ese `inicial`. En móvil lo cubre la barra inferior, así que solo se muestra `hidden lg:inline-flex`. (En desktop la hoja sale centrada y angosta desde abajo en vez de un Dialog: desviación menor aceptada de la spec.)
- La tarjeta "Instala la app y activa avisos" (spec §4) **no** va en esta fase: llega en la fase 2 junto con los avisos.

- [ ] **Step 3: Página**

```tsx
// src/app/(app)/agencia/(inicio)/page.tsx
import type { Metadata } from 'next'

import { BotonAgregar } from '@/components/agenda/mi-dia/boton-agregar'
import { EntregasEquipo } from '@/components/agenda/mi-dia/entregas-equipo'
import { LineaCitas } from '@/components/agenda/mi-dia/linea-citas'
import { ListaPendientes } from '@/components/agenda/mi-dia/lista-pendientes'
import { TarjetaDia } from '@/components/agenda/mi-dia/tarjeta-dia'
import { cargarDatosHojaAgregar } from '@/lib/agenda/hoja-server'
import { cargarMiDia } from '@/lib/agenda/mi-dia-server'
import { usuarioActual } from '@/lib/auth/usuario-actual'
import { formatoFechaLarga, hoyEnMexico } from '@/lib/formato'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mi día' }

export default async function PaginaMiDia() {
  const hoy = hoyEnMexico()
  const supabase = await createClient()
  const [actual, dia, hoja] = await Promise.all([
    usuarioActual(),
    cargarMiDia(supabase, hoy),
    cargarDatosHojaAgregar(supabase, hoy),
  ])
  const nombre = (actual.nombre ?? 'Tadeo').split(' ')[0]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{formatoFechaLarga()}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Buen día, <span className="text-marca">{nombre}</span>
          </h1>
        </div>
        <BotonAgregar datos={hoja} />
      </header>
      <TarjetaDia conteo={dia.conteo} />
      <section aria-labelledby="t-citas" className="flex flex-col gap-2">
        <h2 id="t-citas" className="font-semibold">Citas</h2>
        <LineaCitas citas={dia.citas} datos={hoja} />
      </section>
      <section aria-labelledby="t-pend" className="flex flex-col gap-2">
        <h2 id="t-pend" className="font-semibold">Pendientes</h2>
        <ListaPendientes pendientes={dia.pendientes} />
      </section>
      <EntregasEquipo entregas={dia.entregas} />
    </div>
  )
}
```
Crea `src/lib/agenda/hoja-server.ts` con `cargarDatosHojaAgregar(supabase, hoy)` que consulta clientes activos (`id, nombre_negocio`, `estado='activo'`) y trabajadores (`usuarios` con `rol='equipo'` → shape `TrabajadorOpcion` que usa `formularios-equipo.tsx`) y devuelve `DatosHojaAgregar`. Revisa si `text-marca` existe como utilidad de texto con degradado en `globals.css`; si no, usa `bg-marca bg-clip-text text-transparent`.

`loading.tsx`: copia el patrón de `resumen/loading.tsx` con `SeccionCargando titulo="Mi día"` y 3 `Esqueleto` (tarjeta alta + 2 listas).

- [ ] **Step 4: Tour**

En `tour-agencia.tsx`, paso `metricas`: título "Tu día de un vistazo", texto "Citas, pendientes y entregas del equipo de hoy. Toca el + para agendar algo o anotar un pendiente en segundos." Paso `nav`: título "Todo a la mano", texto "Calendario, Equipo, Clientes, Chats y el Resumen con tus números. En el celular viven en la barra de abajo."

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npx eslint && npx vitest run`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add -A src/lib/agenda src/components/agenda "src/app/(app)/agencia/(inicio)" src/components/agencia/tour-agencia.tsx
git commit -m "feat(agenda): pantalla Mi día con citas, pendientes y entregas"
```

---

### Task 9: Barra inferior móvil y modo standalone

**Files:**
- Create: `src/components/layout/barra-inferior.tsx`
- Modify: `src/app/(app)/agencia/layout.tsx`, `src/components/layout/topbar.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts`

- [ ] **Step 1: `barra-inferior.tsx`** (@web-push-ios, sección Layout standalone)

```tsx
'use client'

/**
 * Barra inferior de la zona agencia en móvil (< lg): Mi día · Calendario ·
 * + · Equipo · Más. Respeta el área segura del iPhone (requiere
 * viewportFit 'cover' en app/layout.tsx).
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Menu, Plus, Sun, UsersRound } from 'lucide-react'

import { HojaAgregar, type DatosHojaAgregar } from '@/components/agenda/hoja-agregar'
import { Sidebar, elementoActivo, type ElementoNav } from '@/components/layout/sidebar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const PRINCIPALES = [
  { href: '/agencia', label: 'Mi día', Icono: Sun },
  { href: '/agencia/calendario', label: 'Calendario', Icono: CalendarDays },
] as const
const SECUNDARIOS = [{ href: '/agencia/equipo', label: 'Equipo', Icono: UsersRound }] as const

// A nivel de módulo (no dentro del render): la regla
// react-hooks/static-components prohíbe crear componentes durante el render.
function Enlace({
  href, label, Icono, activo,
}: { href: string; label: string; Icono: typeof Sun; activo: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex min-w-14 flex-col items-center gap-1 py-1 text-[11px] font-medium',
        activo ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <Icono aria-hidden className={cn('size-6', activo && 'text-marca-magenta')} />
      {label}
    </Link>
  )
}

function MasTrigger() {
  return (
    <SheetTrigger
      render={
        <button
          type="button"
          className="flex min-w-14 flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground"
        />
      }
    >
      <Menu aria-hidden className="size-6" />
      Más
    </SheetTrigger>
  )
}

export function BarraInferior({
  items, usuarioNombre, datos,
}: {
  items: ElementoNav[]
  usuarioNombre: string
  datos: DatosHojaAgregar
}) {
  const pathname = usePathname()
  const activo = elementoActivo(items, pathname)
  const [agregar, setAgregar] = React.useState(false)

  return (
    <>
      <nav
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-end justify-around">
          {PRINCIPALES.map((e) => <Enlace key={e.href} {...e} activo={activo?.href === e.href} />)}
          <button
            type="button"
            onClick={() => setAgregar(true)}
            aria-label="Agregar cita, pendiente o encargo"
            className="bg-marca -mt-5 flex size-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-marca-magenta/30"
          >
            <Plus aria-hidden className="size-7" />
          </button>
          {SECUNDARIOS.map((e) => <Enlace key={e.href} {...e} activo={activo?.href === e.href} />)}
          <Sheet key={pathname}>
            <MasTrigger />
            <SheetContent side="left" showCloseButton={false} className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Más secciones</SheetTitle>
              <Sidebar items={items} usuarioNombre={usuarioNombre} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <HojaAgregar abierta={agregar} alCambiar={setAgregar} datos={datos} />
    </>
  )
}
```
Importa también `SheetTrigger` de `@/components/ui/sheet` (mismo patrón `render` que `topbar.tsx:64-75`).

- [ ] **Step 2: Layout de agencia**

En `layout.tsx`: carga `const hoja = await cargarDatosHojaAgregar(supabase, hoy)` (ya existe `hoy`), renderiza `<BarraInferior items={ELEMENTOS_AGENCIA} usuarioNombre={nombre} datos={hoja} />` después de `<main>`, y cambia la clase de `main` a `flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8` para que la barra no tape contenido. Los flotantes deben subir en móvil para no chocar con la barra: en `src/components/chat/notificaciones-agencia.tsx` y `src/components/chat/chat-flotante.tsx` cambia `bottom-4` por `bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-4`, y el panel de `chat-flotante.tsx` (`bottom-24`) por `bottom-[calc(10rem+env(safe-area-inset-bottom))] lg:bottom-24`. Como `ChatFlotante` también lo usa el portal (sin barra), agrégale una prop `conBarraInferior?: boolean` y aplica esas clases solo cuando sea `true`.

- [ ] **Step 3: Topbar**

En `topbar.tsx`: oculta el `Sheet` hamburguesa en la zona agencia (la barra inferior lo reemplaza) con una prop `sinMenuMovil?: boolean` que el layout de agencia pasa en `true` (el portal y la zona equipo lo conservan). Agrega `pt-[env(safe-area-inset-top)]` y cambia `h-16` por `min-h-16` en el `<header>` (el status bar es `black-translucent`).

- [ ] **Step 4: Viewport y manifest**

`src/app/layout.tsx`:
```ts
export const viewport: Viewport = {
  themeColor: '#0d0b10',
  viewportFit: 'cover',
}
```
(importa `type Viewport` de `next`). `src/app/manifest.ts`: agrega `id: '/'`, `scope: '/'`, `start_url: '/agencia'` **no** (el portal también instala): deja `start_url: '/'` (el proxy redirige por rol).

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npx eslint && npx vitest run`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/layout src/app/layout.tsx src/app/manifest.ts "src/app/(app)/agencia/layout.tsx" src/components/chat
git commit -m "feat(agencia): barra inferior móvil con botón + y áreas seguras del iPhone"
```

---

### Task 10: Calendario pensado para el celular

**Files:**
- Modify: `src/components/calendario/vista-calendario.tsx`, `src/app/(app)/agencia/calendario/page.tsx`
- Delete: `src/components/calendario/evento-form.tsx`, `src/app/(app)/agencia/calendario/actions.ts`

- [ ] **Step 1: Vista**

En `vista-calendario.tsx`:
- Estado `vista: 'agenda' | 'mes'`, inicial `'agenda'`; en `lg+` se muestran ambas como hoy (usa clases `lg:block`), en móvil un control segmentado "Agenda | Mes" arriba.
- **Franja de semana** arriba de la agenda (móvil): 7 botones del lunes al domingo de la semana del día seleccionado, `size-11 rounded-2xl`, día seleccionado `bg-marca text-white`, puntito si el día tiene elementos; flechas ‹ › mueven una semana (navegan con `?mes=` cuando cruzan de mes, igual que las flechas actuales).
- La agenda lista el día seleccionado (default hoy) y los siguientes 6 días con encabezado por día.
- Tocar un elemento `tipo==='evento'` abre `Sheet side="bottom"` con `CitaForm` en edición (mapear `ElementoCalendario` → `CitaEditable` con `id, titulo, fecha, hora, horaFin, lugar, avisoMin, clienteId, descripcion, subtipo→tipo, origen`). Los demás tipos siguen navegando a su `href`.
- Quita el uso de `eliminarEvento` (borrar vive en `CitaForm`).
- Objetivos táctiles ≥ 44 px en filas y celdas.

- [ ] **Step 2: Página**

En `calendario/page.tsx` reemplaza `EventoFormDialog` por un botón "Agendar" (`hidden lg:inline-flex`) que abre `HojaAgregar` en pestaña cita (usa `BotonAgregar` de la Tarea 8 con prop `inicial="cita"`) y pasa `clientes` a `VistaCalendario` para el `CitaForm` de edición.

- [ ] **Step 3: Borrar lo viejo**

```bash
git rm src/components/calendario/evento-form.tsx "src/app/(app)/agencia/calendario/actions.ts"
grep -rn "calendario/actions\|evento-form" src
```
Expected: sin resultados.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npx eslint && npx vitest run`
Expected: verde.

- [ ] **Step 5: Commit**

```bash
git add -A src/components/calendario "src/app/(app)/agencia/calendario"
git commit -m "feat(calendario): agenda por defecto en móvil, franja de semana y citas editables"
```

---

### Task 11: Verificación en viewport de iPhone

**Files:**
- Create (scratchpad, no se commitea): `verificar-fase1.cjs`

- [ ] **Step 1: Cuenta temporal de admin**

No existe cuenta de prueba (se borró en la limpia del 25-sep). Crea una temporal con el cliente admin: `auth.admin.createUser({ email: 'prueba-agenda@topdigital.invalid', password: <aleatoria>, email_confirm: true })` + fila en `usuarios` con `rol='admin'`, `nombre='Prueba Agenda'`, `intro_vista=true` (revisa `scripts/seed.ts` para las columnas exactas). Guarda la contraseña solo en memoria del script.

- [ ] **Step 2: Script Playwright** (viewport 390×844, `isMobile: true`, `hasTouch: true`, contra `npx next dev -p 3100`)

Flujo: login → `/agencia` muestra "Mi día" y la tarjeta → barra inferior visible y dentro de la pantalla (`boundingBox().y + height <= 844`) → tocar + → pestaña Pendiente → "Probar agenda" → guardar → aparece en Pendientes → palomita → desaparece con toast "Listo" → tocar + → Cita "Junta prueba" hoy 10:00–11:00 → aparece en Citas con "1 h" → tocarla → cambiar a 12:00–13:00 → guardar → se ve 12:00 → Calendario → la cita aparece en la agenda de hoy → abrirla → Eliminar → confirmar → desaparece. Capturas en cada paso al scratchpad y revísalas visualmente (marca, sin desbordes horizontales: `document.documentElement.scrollWidth <= 390`).

- [ ] **Step 3: Limpieza**

Borra la cuenta temporal (`auth.admin.deleteUser`) y cualquier fila de prueba (`tareas`/`eventos` con título "Probar agenda"/"Junta prueba").

- [ ] **Step 4: Desktop**

Mismo login a 1280×800: topbar con píldoras, sin barra inferior, "Agendar" visible en Mi día y Calendario.

---

### Task 12: Publicar

- [ ] **Step 1: Suite completa y build**

Run: `npx tsc --noEmit && npx eslint && npx vitest run && npx next build`
Expected: todo en verde (detén cualquier `next dev` antes del build: lock EPERM en Windows/OneDrive).

- [ ] **Step 2: Revisión de código**

Usa @ultrapowers:requesting-code-review sobre el diff `main..fase-1`.

- [ ] **Step 3: Publicar**

```bash
git push origin fase-1
git push origin fase-1:main
```
El push a `main` despliega solo el proyecto `top-digital-system` (el del sitio ignora todo lo que no sea `sitio-web`). Espera el deploy con `vercel inspect <url>` (script en scratchpad) y verifica en producción con el mismo script de la Tarea 11 apuntando a `https://www.` + dominio del sistema (cuenta temporal creada y borrada otra vez).
