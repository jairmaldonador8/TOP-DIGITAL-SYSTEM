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
    titulo: 'La agencia de un vistazo',
    texto:
      'Tus números del mes: leads, ventas cerradas, campañas activas y tareas. Cada tarjeta es un atajo — dale clic y te lleva a su sección.',
  },
  {
    selector: '[data-tour="nav"]',
    titulo: 'Tus 7 secciones',
    texto:
      'En Clientes das de alta negocios y sus accesos, Leads es el CRM global, Campañas lleva gasto y resultados, en Chats respondes a tus clientes y Reportes trae el embudo completo.',
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
