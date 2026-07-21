'use client'

import { Tour, type PasoTour } from '@/components/tour/tour'

const PASOS: PasoTour[] = [
  {
    selector: null,
    titulo: '¡Bienvenido a tu portal!',
    texto:
      'Aquí verás en tiempo real lo que Top Digital está logrando para tu negocio: tus leads, tus campañas y tus ventas. Te damos un tour de 30 segundos.',
  },
  {
    selector: '[data-tour="perfil"]',
    titulo: 'Tu negocio, al centro',
    texto:
      'Esta es la tarjeta de tu cuenta, junto a tus resultados del mes: leads nuevos, ventas, campañas activas y conversión.',
  },
  {
    selector: '[data-tour="nav"]',
    titulo: 'Todo en 3 secciones',
    texto:
      'Dashboard es tu resumen, en Mis Leads ves a cada persona interesada y en Campañas el estado de tu publicidad.',
  },
  {
    selector: '[data-tour="chat"]',
    titulo: 'Habla directo con Tadeo',
    texto:
      'Este botón abre el chat con Tadeo, el dueño de la agencia. Escríbele lo que necesites y te responde personalmente.',
    redondo: true,
  },
  {
    selector: '[data-tour="cuenta"]',
    titulo: 'Tu cuenta vive aquí',
    texto:
      'Dale clic a este circulito para ver tu perfil, el negocio al que perteneces y cerrar sesión cuando termines.',
    redondo: true,
  },
]

/** Tour de bienvenida del portal del cliente (se muestra una sola vez). */
export function TourPortal({ action }: { action: () => Promise<void> }) {
  return <Tour pasos={PASOS} action={action} />
}
