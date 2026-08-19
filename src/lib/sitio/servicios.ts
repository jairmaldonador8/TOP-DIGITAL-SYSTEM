/**
 * Catálogo de servicios del sitio público.
 *
 * Cada servicio sigue la misma estructura narrativa acordada con el cliente:
 * frase matadora → el problema y lo que cuesta → cómo lo resolvemos →
 * proceso → entregables → resultados → inversión. Los montos son piso de
 * cotización, no precio cerrado: la propuesta final sale de la videollamada.
 */

export type Servicio = {
  slug: string
  nombre: string
  /** Título corto para tarjetas y navegación. */
  etiqueta: string
  frase: string
  /** El dolor del cliente, en sus palabras. */
  problema: string
  /** Qué le está costando hoy no resolverlo. */
  costo: string
  solucion: string
  proceso: { paso: string; detalle: string }[]
  entregables: string[]
  resultados: string[]
  desde: number
  /** 'unico' = proyecto cerrado; 'mes' = iguala mensual. */
  periodo: 'unico' | 'mes'
  /** Se ofrece dentro del paquete premium de departamento externo. */
  enPremium: boolean
}

export const SERVICIOS: Servicio[] = [
  {
    slug: 'branding',
    nombre: 'Branding e identidad de marca',
    etiqueta: 'Branding',
    frase: 'Una marca que no se entiende, no se compra.',
    problema:
      'Tu marca no tiene orden, estructura ni identidad visual. Cada publicación se ve distinta, tu logo cambia según quién lo use y nada transmite el profesionalismo que sí tiene tu trabajo.',
    costo:
      'Cada cliente que duda de cómo se ve tu negocio es una venta que se va con alguien que se ve mejor — aunque haga peor trabajo que tú.',
    solucion:
      'Construimos tu identidad completa desde la estrategia: qué eres, cómo hablas y cómo te ves. No entregamos un logo bonito, entregamos un sistema con reglas claras para que tu marca se vea igual de sólida en un anuncio, en una playera y en una cotización.',
    proceso: [
      { paso: 'Inmersión', detalle: 'Entendemos tu negocio, tu cliente y tu competencia real.' },
      { paso: 'Territorio', detalle: 'Definimos posicionamiento, personalidad y mensaje.' },
      { paso: 'Diseño', detalle: 'Logo, paleta, tipografías y elementos gráficos propios.' },
      { paso: 'Sistema', detalle: 'Manual de marca con usos correctos e incorrectos.' },
      { paso: 'Aplicaciones', detalle: 'Piezas reales: redes, papelería, uniformes, merch.' },
    ],
    entregables: [
      'Logotipo principal, variantes y versiones para fondos claros y oscuros',
      'Paleta de color y sistema tipográfico',
      'Manual de marca con reglas de uso',
      'Plantillas editables para redes sociales',
      'Diseño de tarjetas de presentación',
      'Archivos en todos los formatos: vector, PNG y para imprenta',
    ],
    resultados: [
      'Tu marca se ve igual de profesional en todos lados',
      'Dejas de improvisar cada pieza de diseño',
      'Puedes cobrar más porque te ves como lo que eres',
    ],
    desde: 3400,
    periodo: 'unico',
    enPremium: true,
  },
  {
    slug: 'paginas-web',
    nombre: 'Páginas web',
    etiqueta: 'Página web',
    frase: 'Si no te encuentran, no existes.',
    problema:
      'Necesitas que tus clientes te encuentren cuando busquen lo que ofreces, y que al llegar entiendan en segundos por qué eres su mejor opción.',
    costo:
      'Cada búsqueda en Google donde no apareces es un cliente que ya estaba listo para comprar y terminó con tu competencia.',
    solucion:
      'Diseñamos y programamos un sitio rápido, claro y pensado para vender: estructura que guía al visitante hasta el contacto, textos que responden sus dudas y una base técnica optimizada para que Google te muestre.',
    proceso: [
      { paso: 'Arquitectura', detalle: 'Definimos secciones, mensajes y el camino a la conversión.' },
      { paso: 'Diseño', detalle: 'Interfaz a la medida de tu marca, no una plantilla.' },
      { paso: 'Desarrollo', detalle: 'Programación optimizada para velocidad y buscadores.' },
      { paso: 'Contenido', detalle: 'Textos, fotos y piezas listas para publicar.' },
      { paso: 'Lanzamiento', detalle: 'Dominio, medición y entrega con capacitación.' },
    ],
    entregables: [
      'Sitio web completo, responsivo en celular y computadora',
      'Textos escritos para vender, no para rellenar',
      'Optimización técnica para buscadores (SEO base)',
      'Formulario de contacto conectado a WhatsApp',
      'Medición con Google Analytics',
      'Capacitación para que puedas editarlo',
    ],
    resultados: [
      'Apareces cuando te buscan',
      'Tu sitio responde las dudas que hoy contestas por WhatsApp',
      'Sabes de dónde llegan tus clientes',
    ],
    desde: 5400,
    periodo: 'unico',
    enPremium: true,
  },
  {
    slug: 'tiendas-online',
    nombre: 'Tiendas online',
    etiqueta: 'Tienda online',
    frase: 'Vender mientras duermes no es un lujo: es la base.',
    problema:
      'Quieres vender tus productos de forma automática las 24 horas a toda la república, sin depender de contestar cada mensaje ni de que alguien esté en el local.',
    costo:
      'Hoy vendes solo el tiempo que tú estás disponible. Tu competencia con tienda online vende también de madrugada, en domingo y en otro estado.',
    solucion:
      'Montamos tu tienda con catálogo, pagos y envíos funcionando de verdad. Configuramos métodos de pago mexicanos, paquetería con cálculo automático y todo el flujo de compra probado hasta el último clic.',
    proceso: [
      { paso: 'Catálogo', detalle: 'Estructura de productos, variantes y categorías.' },
      { paso: 'Diseño', detalle: 'Tienda con tu identidad y fichas que venden.' },
      { paso: 'Pagos y envíos', detalle: 'Tarjeta, transferencia, OXXO y paquetería.' },
      { paso: 'Pruebas', detalle: 'Compramos nosotros mismos para validar todo el flujo.' },
      { paso: 'Lanzamiento', detalle: 'Capacitación para que administres tus pedidos.' },
    ],
    entregables: [
      'Tienda online completa con tu marca',
      'Carga de productos con fotos y descripciones',
      'Pasarela de pagos configurada',
      'Cálculo automático de envíos',
      'Correos automáticos de confirmación al comprador',
      'Panel para administrar pedidos e inventario',
    ],
    resultados: [
      'Vendes 24/7 sin estar presente',
      'Llegas a clientes de todo México',
      'Cada pedido llega ordenado y con sus datos completos',
    ],
    desde: 11400,
    periodo: 'unico',
    enPremium: false,
  },
  {
    slug: 'chatbots-ia',
    nombre: 'Chatbots con inteligencia artificial',
    etiqueta: 'Chatbot con IA',
    frase: 'El cliente que no contestas hoy, mañana ya compró en otro lado.',
    problema:
      'Te saturas de mensajes y pierdes ventas por no contestar a tiempo. En la noche, en fin de semana o cuando estás atendiendo, los mensajes se acumulan.',
    costo:
      'Un cliente espera en promedio menos de 10 minutos una respuesta. Después de eso, escribe al siguiente negocio de la lista.',
    solucion:
      'Entrenamos un asistente con inteligencia artificial que conoce tu negocio: responde precios, horarios y dudas frecuentes al instante, califica al interesado y te pasa la conversación cuando ya está listo para comprar.',
    proceso: [
      { paso: 'Entrenamiento', detalle: 'Cargamos tu catálogo, precios y preguntas frecuentes.' },
      { paso: 'Conversación', detalle: 'Diseñamos cómo habla y cuándo te transfiere el chat.' },
      { paso: 'Conexión', detalle: 'Lo integramos a WhatsApp y a tus redes.' },
      { paso: 'Pruebas', detalle: 'Lo ponemos a prueba con casos reales antes de soltarlo.' },
      { paso: 'Ajuste', detalle: 'Afinamos respuestas con las conversaciones de las primeras semanas.' },
    ],
    entregables: [
      'Asistente entrenado con la información de tu negocio',
      'Conexión con WhatsApp',
      'Respuestas automáticas 24/7',
      'Calificación de interesados antes de pasártelos',
      'Panel para ver todas las conversaciones',
      'Ajustes durante el primer mes',
    ],
    resultados: [
      'Ningún mensaje se queda sin respuesta',
      'Llegas solo a los clientes que ya están listos',
      'Recuperas horas que hoy se te van contestando lo mismo',
    ],
    desde: 17900,
    periodo: 'unico',
    enPremium: false,
  },
  {
    slug: 'sistemas-y-software',
    nombre: 'Sistemas y software a la medida',
    etiqueta: 'Sistemas a la medida',
    frase: 'Tu operación no cabe en una hoja de Excel.',
    problema:
      'Necesitas un sistema personalizado para mejorar procesos y automatizar tareas en tu empresa, porque hoy todo vive en cuadernos, grupos de WhatsApp y archivos que solo una persona entiende.',
    costo:
      'Cada hora que tu equipo pasa capturando datos a mano es una hora que no está vendiendo ni atendiendo — y cada dato perdido es dinero que no cobraste.',
    solucion:
      'Desarrollamos el sistema que tu operación necesita, no el que viene enlatado. Analizamos cómo trabajas hoy, automatizamos lo repetitivo y te entregamos una plataforma propia donde todo tu equipo trabaja en el mismo lugar.',
    proceso: [
      { paso: 'Diagnóstico', detalle: 'Mapeamos tu proceso real, con sus excepciones.' },
      { paso: 'Diseño', detalle: 'Definimos módulos, roles y permisos.' },
      { paso: 'Desarrollo', detalle: 'Construimos por etapas, con entregas que ya puedes usar.' },
      { paso: 'Capacitación', detalle: 'Entrenamos a tu equipo hasta que lo dominen.' },
      { paso: 'Soporte', detalle: 'Acompañamiento y mejoras después del arranque.' },
    ],
    entregables: [
      'Plataforma web a la medida de tu proceso',
      'Accesos por rol para dueño, equipo y clientes',
      'Automatización de las tareas repetitivas',
      'Reportes y tableros con tus números reales',
      'Capacitación al equipo',
      'Soporte y mejoras posteriores',
    ],
    resultados: [
      'Tu operación deja de depender de la memoria de alguien',
      'Sabes en qué va cada trabajo sin preguntar',
      'Escalas sin contratar a alguien solo para capturar datos',
    ],
    desde: 29900,
    periodo: 'unico',
    enPremium: false,
  },
  {
    slug: 'meta-ads',
    nombre: 'Campañas en Meta Ads',
    etiqueta: 'Meta Ads',
    frase: 'Clientes nuevos, mes tras mes, no por suerte.',
    problema:
      'Necesitas adquirir clientes nuevos de forma constante, sin depender de las recomendaciones o de la temporada.',
    costo:
      'Sin campañas, tu mes bueno y tu mes malo los decide el azar. Con campañas mal llevadas, tiras presupuesto en clics que nunca iban a comprar.',
    solucion:
      'Diseñamos y operamos tus campañas en Facebook e Instagram: creativos que detienen el scroll, segmentación de quien sí compra y optimización semanal con base en resultados, no en corazonadas.',
    proceso: [
      { paso: 'Estrategia', detalle: 'Objetivo, oferta y públicos que sí convierten.' },
      { paso: 'Creativos', detalle: 'Producimos anuncios pensados para tu audiencia.' },
      { paso: 'Lanzamiento', detalle: 'Configuración, medición y arranque controlado.' },
      { paso: 'Optimización', detalle: 'Ajustes semanales sobre datos reales.' },
      { paso: 'Reporte', detalle: 'Números claros cada semana, sin humo.' },
    ],
    entregables: [
      'Estrategia y estructura de campañas',
      'Creativos y textos de anuncios cada mes',
      'Configuración de medición y públicos',
      'Optimización continua del presupuesto',
      'Reporte semanal de resultados',
      'Los leads llegan a tu plataforma, no a un Excel',
    ],
    resultados: [
      'Flujo constante de interesados',
      'Sabes cuánto te cuesta cada cliente nuevo',
      'Inviertes donde sí está funcionando',
    ],
    desde: 9000,
    periodo: 'mes',
    enPremium: true,
  },
  {
    slug: 'google-ads',
    nombre: 'Campañas en Google Ads',
    etiqueta: 'Google Ads',
    frase: 'Aparece justo cuando ya te están buscando.',
    problema:
      'Hay gente escribiendo en Google exactamente lo que tú vendes, ahora mismo. Y está encontrando a tu competencia.',
    costo:
      'La búsqueda es la intención más caliente que existe: el cliente ya decidió comprar, solo falta que aparezcas. Cada día sin campañas, esos clics son de alguien más.',
    solucion:
      'Operamos tus campañas de búsqueda: elegimos las palabras que sí traen clientes, escribimos anuncios que ganan el clic y bloqueamos las búsquedas que solo gastan presupuesto.',
    proceso: [
      { paso: 'Investigación', detalle: 'Qué busca tu cliente y cuánto cuesta esa palabra.' },
      { paso: 'Estructura', detalle: 'Campañas y grupos ordenados por intención de compra.' },
      { paso: 'Anuncios', detalle: 'Textos y extensiones que ganan el clic correcto.' },
      { paso: 'Optimización', detalle: 'Palabras negativas, pujas y ajustes semanales.' },
      { paso: 'Reporte', detalle: 'Costo por cliente y retorno, cada semana.' },
    ],
    entregables: [
      'Investigación de palabras clave de tu mercado',
      'Campañas de búsqueda estructuradas',
      'Redacción de anuncios y extensiones',
      'Configuración de conversiones',
      'Optimización y palabras negativas',
      'Reporte semanal de resultados',
    ],
    resultados: [
      'Apareces en el momento exacto de la intención de compra',
      'Dejas de pagar por clics que no compran',
      'Mides el retorno peso por peso',
    ],
    desde: 14000,
    periodo: 'mes',
    enPremium: true,
  },
  {
    slug: 'departamento-marketing',
    nombre: 'Departamento de marketing externo',
    etiqueta: 'Departamento externo',
    frase: 'Todo tu marketing resuelto, sin contratar a nadie.',
    problema:
      'Tu empresa tiene todos estos problemas a la vez y quieres solucionarlos de una vez por todas, con un equipo que responda por los resultados completos.',
    costo:
      'Armar un departamento interno cuesta varios sueldos, prestaciones y meses de curva de aprendizaje — y aun así te faltan especialistas.',
    solucion:
      'Nos volvemos tu departamento de marketing completo: marca, sitio, campañas, contenido y automatización trabajando bajo una sola estrategia y un solo responsable. Solo aceptamos un cliente al mes en este servicio, porque entra todo nuestro equipo.',
    proceso: [
      { paso: 'Auditoría', detalle: 'Revisamos todo tu marketing actual y tus números.' },
      { paso: 'Plan maestro', detalle: 'Estrategia anual con metas medibles por trimestre.' },
      { paso: 'Ejecución', detalle: 'Todo el equipo trabajando: marca, web, campañas y contenido.' },
      { paso: 'Operación', detalle: 'Juntas de seguimiento y ajustes constantes.' },
      { paso: 'Crecimiento', detalle: 'Escalamos lo que funciona, cortamos lo que no.' },
    ],
    entregables: [
      'Estrategia integral de marketing',
      'Branding y piezas de marca',
      'Sitio web y su mantenimiento',
      'Campañas en Meta y Google operadas por nosotros',
      'Contenido para redes cada mes',
      'Plataforma propia para ver todo en tiempo real',
      'Juntas de seguimiento y reportes ejecutivos',
    ],
    resultados: [
      'Un solo responsable de todo tu marketing',
      'Cuesta menos que un equipo interno',
      'Estrategia y ejecución alineadas, sin cabos sueltos',
    ],
    desde: 90000,
    periodo: 'mes',
    enPremium: false,
  },
]

export function servicioPorSlug(slug: string) {
  return SERVICIOS.find((s) => s.slug === slug)
}

/** Formato de precio en pesos, sin centavos. */
export function precioMxn(monto: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto)
}
