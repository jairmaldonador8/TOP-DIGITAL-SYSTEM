/**
 * Service worker de notificaciones push (spec 2026-07-25). Solo push:
 * sin caché ni intercepción de red.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return
  let datos = {}
  try {
    datos = event.data.json()
  } catch {
    datos = { titulo: 'Top Digital', cuerpo: event.data.text() }
  }
  const titulo = datos.titulo || 'Top Digital'
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: '/icono-192.png',
      badge: '/icono-192.png',
      data: { url: datos.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abiertas) => {
      for (const ventana of abiertas) {
        if (ventana.url.includes(self.location.origin) && 'focus' in ventana) {
          // navigate() falla en pestañas no controladas por este SW:
          // en ese caso se abre una ventana nueva.
          return ventana
            .focus()
            .then(() => ventana.navigate(url))
            .catch(() => clients.openWindow(url))
        }
      }
      return clients.openWindow(url)
    })
  )
})
