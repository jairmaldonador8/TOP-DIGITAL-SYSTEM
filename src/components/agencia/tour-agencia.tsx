'use client'

import { Tour, type PasoTour } from '@/components/tour/tour'

const PASOS: PasoTour[] = [
  {
    selector: null,
    titulo: '¡Bienvenido a tu centro de mando!',
    texto:
      'Desde aquí administras toda tu agencia: clientes, leads, campañas y la conversación con cada negocio. Te damos un tour de 30 segundos.',
  },
  {
    selector: '[data-tour="metricas"]',
    titulo: 'Tu día de un vistazo',
    texto:
      'Citas, pendientes y entregas del equipo de hoy. Toca el + para agendar algo o anotar un pendiente en segundos.',
  },
  {
    selector: '[data-tour="nav"]',
    titulo: 'Todo a la mano',
    texto:
      'Calendario, Equipo, Clientes, Chats y el Resumen con tus números. En el celular viven en la barra de abajo.',
  },
  {
    selector: '[data-tour="campanita"]',
    titulo: 'Nada se te pasa',
    texto:
      'La campanita junta lo urgente: mensajes de clientes sin responder y tareas vencidas. Cada aviso te lleva directo a resolverlo.',
    redondo: true,
  },
  {
    selector: '[data-tour="cuenta"]',
    titulo: 'Tu cuenta vive aquí',
    texto:
      'Con este circulito ves tu perfil y cierras sesión. Eso es todo — a hacer crecer esos negocios. 🚀',
    redondo: true,
  },
]

/** Tour de bienvenida de la zona agencia (se muestra una sola vez). */
export function TourAgencia({ action }: { action: () => Promise<void> }) {
  return <Tour pasos={PASOS} action={action} />
}
