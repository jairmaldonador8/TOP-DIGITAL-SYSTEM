---
name: web-push-ios
description: Use when touching push notifications, the service worker (public/sw.js), the ActivarPush component, the PWA manifest, or fixed/bottom layout that must work in the iPhone home-screen web app.
---

# Web Push en iPhone (web app de inicio)

## Overview

Tadeo usa el sistema como web app agregada a inicio en su iPhone. Push
solo funciona así (iOS 16.4+). Cada push DEBE mostrar una notificación o
Safari revoca la suscripción. Envío con `web-push` desde
`src/lib/push/push-server.ts`.

## When to Use

- Mandar avisos (`enviarPushA`), cambiar `public/sw.js` o `ActivarPush`.
- Pantallas con barra inferior fija o encabezado en modo standalone.
- Cambiar `app/manifest.ts` o `viewport` en `app/layout.tsx`.

## Core Patterns

**Estados en el cliente**
```ts
const standalone =
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true
const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
// iOS sin standalone → tarjeta "Compartir → Agregar a inicio (Abrir como app web)".
// standalone + permission 'default' → botón "Activar avisos".
// 'denied' → "Ajustes → Notificaciones → Top Digital".
// Al abrir: getSubscription() y upsert al servidor.
```
- `Notification.requestPermission()` y `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` dentro del MISMO toque; nada de `await fetch` antes.
- La app de inicio tiene almacenamiento aparte: Tadeo inicia sesión otra vez dentro de ella.

**Service worker**
```js
self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : {}
  e.waitUntil(self.registration.showNotification(d.titulo ?? 'Top Digital', {
    body: d.cuerpo, data: { url: d.url ?? '/' }, tag: d.tag,
  })) // mostrar PRIMERO; cualquier fetch después
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil((async () => {
    const url = e.notification.data?.url ?? '/'
    const [c] = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (c) { await c.navigate(url); return c.focus() }
    return clients.openWindow(url)
  })())
})
```

**Envío**
- `webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: 'high', topic })` — `TTL` > 0 (Apple rechaza 0); `topic` ≤ 32 chars colapsa repetidos (p. ej. `chat-<cliente>`).
- Payload ≤ 4 KB. 404/410 → borrar la suscripción (ya lo hace push-server).

**Layout standalone**
- `viewport: { viewportFit: 'cover', themeColor: '#0d0b10' }` (Next 16 `Viewport`).
- Barra inferior: `padding-bottom: max(12px, env(safe-area-inset-bottom))`.
- `statusBarStyle: 'black-translucent'` → el contenido va debajo del reloj: topbar con `padding-top: env(safe-area-inset-top)`.
- Manifest con `id` fijo (no cambiarlo nunca), `scope: '/'`, `display: 'standalone'`.

## Common Mistakes

- Push sin `showNotification` (o sin `waitUntil`) → iOS revoca tras pocos avisos.
- Pedir permiso al cargar la página o tras un `await` → iOS lo ignora.
- Olvidar `viewportFit: 'cover'`: `env(safe-area-inset-*)` vale 0 y la barra queda bajo el indicador de inicio.
- Rotar llaves VAPID: rompe todas las suscripciones existentes.
- Probar push en una pestaña de Safari: ahí no existe.
