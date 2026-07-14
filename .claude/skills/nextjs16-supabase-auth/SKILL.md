---
name: nextjs16-supabase-auth
description: Use when writing auth, session, routing-guard, or Supabase client code in this Next.js 16 project — covers @supabase/ssr setup, proxy.ts token refresh, getClaims, and role-based redirects.
---

# Next.js 16 + Supabase Auth

## Overview
Next.js 16 + `@supabase/ssr` (auth-helpers is deprecated). Verify sessions with `getClaims()`, refresh tokens in `proxy.ts`, and never trust `getSession()` on the server.

## Versions (July 2026)
`next@16.2.x`, `react@19.2`, `@supabase/supabase-js@^2.110`, `@supabase/ssr@^0.12`, Node ≥ 20.9. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`, not legacy anon).

## Next 16 rules
- Request APIs are async: `await cookies()`, `const { id } = await params`.
- `proxy.ts` replaces `middleware.ts` (exported `proxy(request)`, Node runtime only).
- Turbopack is default; leave `cacheComponents` off — everything dynamic by default is correct for this auth-heavy app.
- No `next lint`; `images.remotePatterns` not `domains`.

## Core Patterns

**Server client** (new client per request, never module-level singleton):
```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(URL, KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (all) => { try { all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
    },
  })
}
```

**proxy.ts** — token refresh + role redirect. No code between `createServerClient` and `getClaims()`; always return `supabaseResponse` (or copy its cookies):
```ts
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(URL, KEY, { cookies: { getAll: () => request.cookies.getAll(),
    setAll: (all) => { all.forEach(({ name, value }) => request.cookies.set(name, value))
      supabaseResponse = NextResponse.next({ request })
      all.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)) } } })
  const { data } = await supabase.auth.getClaims()
  const role = data?.claims?.user_role
  const path = request.nextUrl.pathname
  if (!data?.claims && path !== '/login') return NextResponse.redirect(new URL('/login', request.url))
  if (path.startsWith('/agencia') && role !== 'admin') return NextResponse.redirect(new URL('/portal', request.url))
  if (path.startsWith('/portal') && role !== 'cliente') return NextResponse.redirect(new URL('/agencia', request.url))
  return supabaseResponse
}
```

**Roles**: store in `app_metadata` / `user_roles` table (NEVER `user_metadata` — user-editable). Custom Access Token Hook injects `user_role` claim; grant execute to `supabase_auth_admin` (missing grants block ALL sign-ins). Claims are stale until token refresh (~1h) after a role change.

**Defense in depth**: re-check `getClaims()` + role in each area's `layout.tsx` — proxy alone is not a security boundary (CVE-2025-29927 lesson). Use `getUser()` before sensitive mutations.

**Auth mutations** (sign in/out) go in Server Actions (they can write cookies; Server Components can't) followed by `revalidatePath('/', 'layout')` + `redirect()`.

## Common Mistakes
- Trusting `supabase.auth.getSession()` in server code — reads unverified cookies.
- Forgetting `await` on `cookies()`/`params` (Next 15 snippets break on 16).
- Creating the server client once at module scope.
- Running logic between client creation and `getClaims()` in proxy → random logouts.
