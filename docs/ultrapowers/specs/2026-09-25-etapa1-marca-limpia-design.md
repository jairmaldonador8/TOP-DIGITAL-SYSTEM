# Etapa 1 — marca nueva, limpia y publicación (25-sep-2026)

Primera de cinco etapas para convertir el calendario en el centro de mando
del dueño (2 organizar, 3 recordatorios, 4 calendario que se llena solo,
5 tracking). Esta deja la base sana antes de tocar el calendario.

## Diagnóstico (25-sep)

- Producción (`main`, último deploy hace 62 días) no tiene las 4 funciones
  de `fase-1`: evidencia en encargos, reporte semanal, push y correo de
  bienvenida. Sus migraciones (0020–0022) ya están aplicadas en la base.
- La `RESEND_API_KEY` local es de la cuenta de Klo-Ser (solo `klo-ser.com`).
  Se abrirá una cuenta de Resend propia de Top Digital.
- Meta sigue bloqueado desde el 23-jul; se deja como está por decisión del
  usuario.
- Código sano: `tsc`, `eslint` y 127 pruebas en verde.

## Alcance

1. **Marca nueva** (aprobada en maqueta): isotipo = cabeza de Topi en blanco
   sobre el degradado de marca (el mismo del favicon del sitio web) +
   wordmark blanco (`public/marca/wordmark.svg`, idéntico al del sitio).
   - Componente `src/components/marca.tsx` (`Isotipo`, `Wordmark`) usado en
     topbar, sidebar, login y landing.
   - `src/app/favicon.ico` del sitio; `icono-192/512.png` y
     `apple-touch-icon.png` regenerados una sola vez desde
     `public/marca/isotipo.svg` con sharp (sin script en el repo: sharp solo
     llega como dependencia transitiva de Next).
   - Correo de bienvenida: encabezado con `/marca/logo-correo.png` servido
     desde el dominio (los clientes de correo no pintan SVG).
2. **Limpia**: borrar los 5 SVG de plantilla de Next en `public/` y
   `components/ui/avatar.tsx` (sin uso). Se conserva `@dnd-kit` (se usará
   para arrastrar en el calendario). `rls.integration.test.ts` se rehabilita
   en la etapa que toque la base.
3. **Resend Top Digital**: cuando el usuario pase la API key, dar de alta
   `topdigital.company`, registros DNS en Cloudflare y actualizar
   `.env.local` + Vercel production.
4. **Publicar**: `fase-1` → `main` (fast-forward), deploy a producción y
   verificación en vivo.

## Fuera de alcance

Meta, sitio web (`sitio-web` y sus migraciones 0023/0024), calendario.

## Pruebas

`tsc`, `eslint`, `vitest` en verde; prueba de la plantilla de bienvenida
actualizada; verificación visual con Playwright de login, topbar y portada
en local y en producción.
