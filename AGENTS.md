<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Esta rama es solo de la landing

`sitio-web` es la rama del sitio público de la agencia y **no se mergea**: ni
hacia `fase-1`/`main` ni desde ellas. El sitio y el CRM comparten repositorio
por historia, no por diseño, y cada uno vive en su propio proyecto de Vercel:

|         | rama        | proyecto de Vercel   | dominio                  |
| ------- | ----------- | -------------------- | ------------------------ |
| Sitio   | `sitio-web` | `top-digital-sitio`  | www.somostopdigital.com  |
| Sistema | `fase-1`    | `top-digital-system` | www.topdigital.company   |

Aquí se toca el sitio: `src/app/(sitio)`, `src/components/sitio`,
`src/lib/sitio`, `public/marca`, `public/sitio` y `src/app/favicon.ico`.

**No se tocan** las piezas del sistema aunque vivan en el mismo árbol:
`src/app/(app)`, las rutas de `src/app/api`, los crons de `vercel.json`, el
manifest y sus iconos (`public/apple-touch-icon.png`, `public/icono-192.png`,
`public/icono-512.png`). Si algo de eso estorba, se arregla en la rama del
sistema, no aquí.

El sitio sí depende de Supabase: el formulario de `/agendar` guarda los leads
en la misma base del CRM, y `src/proxy.ts` manda a la plataforma todo lo que no
sea ruta del sitio cuando `NEXT_PUBLIC_URL_PLATAFORMA` está definida (solo en
el proyecto del sitio). Eso es a propósito y no es motivo para traerse más
código del sistema a esta rama.
