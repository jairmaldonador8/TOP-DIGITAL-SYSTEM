/**
 * Contenido editorial del sitio público.
 *
 * Reseñas, casos y publicaciones traen datos MARCADOS COMO PENDIENTES a
 * propósito: se reemplazan con material real del cliente (reseñas de su
 * página de Facebook, fotos y cifras de proyectos entregados). Nada aquí
 * pretende ser un testimonio real.
 */

export const CONTACTO = {
  whatsapp: '5212206020831',
  whatsappVisible: '+52 1 220 602 0831',
  correo: 'equipo@topdigital.company',
  sitio: 'www.topdigital.company',
  facebook: 'https://www.facebook.com/profile.php?id=100063772477801',
  facebookResenas:
    'https://www.facebook.com/profile.php?id=100063772477801&sk=reviews&locale=es_LA',
  instagram: 'https://www.instagram.com/topdigital.mx',
  tiktok: 'https://www.tiktok.com/@topdigital.mx',
  linkedin: 'https://www.linkedin.com/company/topdigitalmx',
  youtube: 'https://www.youtube.com/@topdigital.mx',
}

/** Mensaje con el que abre el chat desde los CTA del sitio. */
export const WHATSAPP_URL = `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(
  'Hola, quiero agendar mi videollamada de diagnóstico gratis.'
)}`

export const METRICAS = [
  { cifra: '+5', unidad: 'años', etiqueta: 'de experiencia' },
  { cifra: '+$1M', unidad: 'mxn', etiqueta: 'invertidos en anuncios' },
  { cifra: '+100', unidad: 'empresas', etiqueta: 'que confían en nosotros' },
  { cifra: '5.0', unidad: '★', etiqueta: 'en reseñas de Facebook' },
]

export const CERTIFICACIONES = [
  { nombre: 'Google Partner', detalle: 'Google Ads' },
  { nombre: 'Meta Business Partner', detalle: 'Meta Ads' },
  { nombre: 'Shopify Partner', detalle: 'Comercio electrónico' },
  { nombre: 'Google Analytics', detalle: 'Certificación oficial' },
]

/**
 * Problemas reales de negocio y el servicio que los resuelve. Es la
 * sección que traduce "lo que me duele" a "lo que necesito comprar".
 */
export const PROBLEMAS = [
  {
    problema:
      'Mi marca no tiene orden, estructura ni identidad visual, y no transmite profesionalismo.',
    servicio: 'branding',
  },
  {
    problema:
      'Necesito que mis clientes me encuentren cuando busquen de mí y sepan qué ofrecemos.',
    servicio: 'paginas-web',
  },
  {
    problema:
      'Me gustaría vender mis productos de forma automática 24/7 a toda la república.',
    servicio: 'tiendas-online',
  },
  {
    problema:
      'Me saturo de mensajes y pierdo muchas ventas por no contestar a tiempo.',
    servicio: 'chatbots-ia',
  },
  {
    problema:
      'Necesito un sistema personalizado para mejorar procesos y automatizar tareas.',
    servicio: 'sistemas-y-software',
  },
  {
    problema: 'Necesito adquirir clientes nuevos en mi empresa mes tras mes.',
    servicio: 'meta-ads',
  },
]

export type Caso = {
  slug: string
  cliente: string
  giro: string
  servicios: string[]
  reto: string
  hicimos: string
  resultados: { cifra: string; etiqueta: string }[]
  /** Ruta en /public. Vacío = aún sin foto real del cliente. */
  imagen: string
  pendiente: boolean
}

/** PENDIENTE: reemplazar con casos y fotos reales de proyectos entregados. */
export const CASOS: Caso[] = [
  {
    slug: 'caso-1',
    cliente: 'Nombre del cliente',
    giro: 'Giro · ciudad',
    servicios: ['branding', 'paginas-web', 'meta-ads'],
    reto: 'Aquí va el reto con el que llegó el cliente, en una o dos líneas.',
    hicimos:
      'Aquí va lo que realizamos para resolverlo: los servicios entregados y el enfoque.',
    resultados: [
      { cifra: '—', etiqueta: 'leads al mes' },
      { cifra: '—', etiqueta: 'costo por lead' },
      { cifra: '—', etiqueta: 'crecimiento en ventas' },
    ],
    imagen: '',
    pendiente: true,
  },
  {
    slug: 'caso-2',
    cliente: 'Nombre del cliente',
    giro: 'Giro · ciudad',
    servicios: ['tiendas-online', 'google-ads'],
    reto: 'Aquí va el reto con el que llegó el cliente, en una o dos líneas.',
    hicimos:
      'Aquí va lo que realizamos para resolverlo: los servicios entregados y el enfoque.',
    resultados: [
      { cifra: '—', etiqueta: 'ventas en línea' },
      { cifra: '—', etiqueta: 'ticket promedio' },
      { cifra: '—', etiqueta: 'retorno de inversión' },
    ],
    imagen: '',
    pendiente: true,
  },
  {
    slug: 'caso-3',
    cliente: 'Nombre del cliente',
    giro: 'Giro · ciudad',
    servicios: ['chatbots-ia', 'sistemas-y-software'],
    reto: 'Aquí va el reto con el que llegó el cliente, en una o dos líneas.',
    hicimos:
      'Aquí va lo que realizamos para resolverlo: los servicios entregados y el enfoque.',
    resultados: [
      { cifra: '—', etiqueta: 'tiempo de respuesta' },
      { cifra: '—', etiqueta: 'mensajes atendidos' },
      { cifra: '—', etiqueta: 'horas ahorradas' },
    ],
    imagen: '',
    pendiente: true,
  },
]

export type Resena = {
  autor: string
  negocio: string
  texto: string
  estrellas: number
  pendiente: boolean
}

/** PENDIENTE: copiar las reseñas reales desde la página de Facebook. */
export const RESENAS: Resena[] = [
  {
    autor: 'Nombre del cliente',
    negocio: 'Su negocio',
    texto:
      'Aquí va la reseña textual que dejó el cliente en Facebook, sin editar.',
    estrellas: 5,
    pendiente: true,
  },
  {
    autor: 'Nombre del cliente',
    negocio: 'Su negocio',
    texto:
      'Aquí va la reseña textual que dejó el cliente en Facebook, sin editar.',
    estrellas: 5,
    pendiente: true,
  },
  {
    autor: 'Nombre del cliente',
    negocio: 'Su negocio',
    texto:
      'Aquí va la reseña textual que dejó el cliente en Facebook, sin editar.',
    estrellas: 5,
    pendiente: true,
  },
]

export type Faq = {
  pregunta: string
  respuesta: string
  /** Términos extra que debe reconocer el buscador de Topi. */
  claves: string[]
}

export const FAQS: Faq[] = [
  {
    pregunta: '¿Cuánto cuesta trabajar con ustedes?',
    respuesta:
      'Depende del servicio. El branding empieza en $3,400 MXN, una página web en $5,400 y las campañas en Meta desde $9,000 al mes. Todos los montos son un punto de partida: la propuesta final la definimos juntos en la videollamada, según tu objetivo y tu mercado.',
    claves: [
      'precio',
      'costo',
      'cuánto',
      'cuesta',
      'caro',
      'barato',
      'tarifa',
      'inversión',
      'cobran',
      'presupuesto',
      'cotización',
    ],
  },
  {
    pregunta: '¿La videollamada de diagnóstico realmente es gratis?',
    respuesta:
      'Sí, es gratis y sin compromiso. Son entre 30 y 45 minutos donde revisamos tu situación actual, detectamos qué te está frenando y te decimos con honestidad qué haríamos. Si no somos la mejor opción para ti, te lo decimos.',
    claves: ['gratis', 'videollamada', 'diagnóstico', 'llamada', 'cita', 'agendar', 'reunión'],
  },
  {
    pregunta: '¿En cuánto tiempo veo resultados?',
    respuesta:
      'Las campañas empiezan a traer interesados desde la primera semana, aunque el mes uno es de aprendizaje y ajuste. Un branding toma de 3 a 4 semanas y una página web entre 3 y 6 semanas, según el alcance. Te damos fechas concretas en la propuesta.',
    claves: ['tiempo', 'resultados', 'cuándo', 'tarda', 'plazo', 'entrega', 'semanas'],
  },
  {
    pregunta: '¿Trabajan con negocios de mi giro?',
    respuesta:
      'Hemos trabajado con más de 100 empresas de giros muy distintos: restaurantes, inmobiliarias, salud, servicios profesionales, tiendas y más. Lo que cambia es la estrategia, no el método. En la videollamada te decimos si tu caso es de los que sabemos resolver.',
    claves: ['giro', 'industria', 'sector', 'negocio', 'rubro', 'experiencia'],
  },
  {
    pregunta: '¿Necesito invertir en anuncios además de su servicio?',
    respuesta:
      'Sí. El pago de nuestro servicio es por la estrategia, los creativos y la operación; el presupuesto de anuncios se paga aparte y directo a Meta o Google. Te recomendamos un presupuesto según tu objetivo y siempre queda a tu nombre y bajo tu control.',
    claves: ['presupuesto', 'anuncios', 'ads', 'pauta', 'aparte', 'meta', 'google', 'inversión'],
  },
  {
    pregunta: '¿Puedo ver cómo van mis campañas?',
    respuesta:
      'Sí. Te damos acceso a nuestra plataforma donde ves tus campañas, tus leads y tus resultados en tiempo real, además de un reporte cada semana. No trabajamos a ciegas ni escondemos números.',
    claves: ['plataforma', 'reportes', 'ver', 'seguimiento', 'acceso', 'transparencia', 'crm'],
  },
  {
    pregunta: '¿Hay contrato o permanencia forzosa?',
    respuesta:
      'Los proyectos como branding, web o tienda son de alcance cerrado, sin permanencia. Los servicios de campañas se trabajan mes a mes con un mínimo recomendado de 3 meses, porque antes de eso las campañas todavía están aprendiendo.',
    claves: ['contrato', 'permanencia', 'meses', 'cancelar', 'compromiso', 'plazo forzoso'],
  },
  {
    pregunta: '¿Qué es el departamento de marketing externo?',
    respuesta:
      'Es nuestro servicio premium: nos volvemos tu departamento de marketing completo — marca, sitio, campañas, contenido y automatización bajo una sola estrategia. Solo aceptamos un cliente al mes porque entra todo el equipo. Empieza en $90,000 MXN al mes.',
    claves: ['premium', 'departamento', 'externo', 'completo', 'todo', 'integral'],
  },
  {
    pregunta: '¿Atienden fuera de mi ciudad?',
    respuesta:
      'Sí. Trabajamos con clientes de todo México de forma remota, con videollamadas y nuestra plataforma. Para grabaciones y sesiones de fotos coordinamos la logística según dónde estés.',
    claves: ['ciudad', 'remoto', 'distancia', 'foráneo', 'méxico', 'presencial', 'dónde'],
  },
  {
    pregunta: '¿Cómo son los pagos?',
    respuesta:
      'Los proyectos llevan 50% de anticipo para arrancar y 50% contra entrega. Los servicios mensuales se pagan por adelantado cada mes. Aceptamos transferencia y tarjeta, y siempre entregamos comprobante.',
    claves: ['pago', 'pagar', 'anticipo', 'facturación', 'factura', 'transferencia', 'tarjeta'],
  },
]

export type Publicacion = {
  slug: string
  titulo: string
  resumen: string
  categoria: string
  fecha: string
  lectura: string
  cuerpo: string[]
  pendiente: boolean
}

/** PENDIENTE: reemplazar por artículos reales del equipo. */
export const PUBLICACIONES: Publicacion[] = [
  {
    slug: 'cuanto-invertir-en-anuncios',
    titulo: '¿Cuánto debo invertir en anuncios para empezar?',
    resumen:
      'La pregunta que nos hacen en cada videollamada, respondida con números y sin rodeos.',
    categoria: 'Campañas',
    fecha: '2026-08-10',
    lectura: '4 min',
    cuerpo: [
      'Este es un artículo de ejemplo con la estructura del blog. Aquí va la entrada real escrita por el equipo.',
      'Cada publicación abre con el problema del lector, desarrolla la respuesta con datos propios y cierra invitando a la videollamada de diagnóstico.',
    ],
    pendiente: true,
  },
  {
    slug: 'senales-de-que-tu-marca-necesita-rebranding',
    titulo: '5 señales de que tu marca necesita un rebranding',
    resumen:
      'Si te identificas con tres o más, tu marca te está costando ventas todos los meses.',
    categoria: 'Branding',
    fecha: '2026-08-03',
    lectura: '5 min',
    cuerpo: [
      'Este es un artículo de ejemplo con la estructura del blog. Aquí va la entrada real escrita por el equipo.',
      'Cada publicación abre con el problema del lector, desarrolla la respuesta con datos propios y cierra invitando a la videollamada de diagnóstico.',
    ],
    pendiente: true,
  },
  {
    slug: 'chatbot-o-contestar-a-mano',
    titulo: 'Chatbot con IA o contestar a mano: cuándo conviene cada uno',
    resumen:
      'No todos los negocios necesitan automatizar. Aquí la línea para saber de qué lado estás.',
    categoria: 'Automatización',
    fecha: '2026-07-27',
    lectura: '6 min',
    cuerpo: [
      'Este es un artículo de ejemplo con la estructura del blog. Aquí va la entrada real escrita por el equipo.',
      'Cada publicación abre con el problema del lector, desarrolla la respuesta con datos propios y cierra invitando a la videollamada de diagnóstico.',
    ],
    pendiente: true,
  },
]

export function publicacionPorSlug(slug: string) {
  return PUBLICACIONES.find((p) => p.slug === slug)
}

export function casoPorSlug(slug: string) {
  return CASOS.find((c) => c.slug === slug)
}
