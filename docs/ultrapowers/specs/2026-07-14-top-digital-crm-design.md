# Top Digital — Sistema web CRM multi-portal

**Fecha:** 2026-07-14
**Estado:** Aprobado por el usuario (brainstorming completo)
**Idioma del producto:** Español (México)

## 1. Resumen

Sitio web (no app nativa; se accede por navegador en computadora o celular) para la agencia de marketing **Top Digital**. Un solo sitio con dos experiencias según el rol del usuario:

- **Panel de la agencia** (`/agencia`): el dueño de Top Digital administra clientes, campañas, tareas y ve todas las métricas reales (gasto, CPL, utilidad) para encontrar áreas de oportunidad.
- **Portal del cliente** (`/portal`): cada cliente de la agencia da seguimiento a sus leads (CRM), ve su progreso, campañas activas y notificaciones — con números simples, **nunca métricas técnicas** (CPL, gasto en ads, CTR), porque los clientes no las entienden.

Contexto de negocio: el acceso a este portal es el diferenciador del paquete premium ($145k) de Top Digital. El registro de seguimientos por parte del cliente es la base del modelo de garantía: "si no registran sus seguimientos, no pueden reclamar resultados" — y esos datos son los que la agencia usa para optimizar campañas.

## 2. Decisiones tomadas durante brainstorming

| Tema | Decisión |
|---|---|
| Alcance | Sistema web directo (no plantilla Notion) |
| Portal del cliente | CRM con seguimiento de leads + visibilidad de progreso/campañas |
| Captura de leads | **Manual rápida** en v1 (~10 segundos desde celular: nombre, teléfono, fuente). Los leads llegan principalmente por WhatsApp; sin integración de WhatsApp API por ahora. El diseño deja la puerta abierta a integraciones futuras (Meta Lead Ads, WhatsApp API) |
| Usuarios agencia | **Solo el dueño** (rol único admin) |
| Usuarios cliente | Uno o más usuarios por cliente, mismo nivel de acceso |
| Notificaciones | **Solo dentro de la plataforma** (campanita con historial). Email queda como mejora futura |
| Chat | Chat interno cliente ↔ Top Digital, en tiempo real, un hilo por cliente |
| Stack | Next.js (App Router) + Supabase (Postgres/RLS, Auth, Realtime, Storage), desplegado en Vercel |
| Estilo visual | Referencia del usuario: sidebar azul marino oscuro, área de contenido clara, tarjetas redondeadas, KPIs grandes, acentos vivos (verde lima, rosa), tablas con pills de estado |

## 3. Arquitectura

- **Frontend/backend:** una sola aplicación Next.js (App Router) en Vercel. Rutas `/agencia/*` (admin) y `/portal/*` (cliente). Login único en `/`; tras autenticarse, el sistema redirige según el rol. Responsivo (la captura de leads debe ser cómoda desde celular).
- **Supabase:**
  - **PostgreSQL + Row Level Security (RLS):** todas las tablas de negocio llevan `cliente_id`. El rol cliente solo lee/escribe filas de su propio `cliente_id`. Los campos sensibles (gasto, CPL, utilidad) se sirven únicamente a través de consultas del lado servidor para el admin — **nunca se envían al navegador del cliente**.
  - **Auth:** email + contraseña. Sin registro público: el dueño da de alta los usuarios de cada cliente desde el panel. Recuperación de contraseña estándar.
  - **Realtime:** suscripciones para chat y notificaciones en vivo.
  - **Storage:** PDFs de reportes mensuales.
- **Multi-tenancy:** Top Digital se da de alta como un cliente más (`es_agencia = true`) y usa el mismo CRM para sus propios prospectos y ventas internas.

## 4. Modelo de datos (9 tablas)

1. **clientes** — nombre del negocio, contacto principal, email, teléfono, presupuesto de ads, meta de facturación mensual, estado (activo/pausado/inactivo), flag `es_agencia`, notas.
2. **usuarios** — vinculado a Supabase Auth; rol (`admin` | `cliente`), `cliente_id` (null para admin), nombre.
3. **leads** — `cliente_id`, nombre, teléfono, email opcional, fecha de llegada, fuente (Meta Ads, WhatsApp, Referido, Orgánico), campaña opcional, etapa (Nuevo → Contactado → Interesado → Cotizado → Cerrado ganado / Cerrado perdido), nivel de interés (Alto/Medio/Bajo), monto de venta, método de cierre (WhatsApp, Llamada, Reunión, Checkout), venta difícil (sí/no), objeciones (Precio, Tiempo, Confianza, Necesita pensarlo, Ubicación — multi), responsable, fecha de cierre.
4. **seguimientos** — historial por lead: `lead_id`, autor, nota, timestamp. Inmutable (evidencia del modelo de garantía).
5. **campañas** — `cliente_id`, nombre, plataforma, estado (activa/pausada), fechas, gasto acumulado, leads generados; CPL calculado (gasto ÷ leads).
6. **tareas** — `cliente_id`, título, descripción, estado, fecha límite; al completar, opción de publicar al timeline.
7. **actividades** — timeline "así trabajamos tu marca": `cliente_id`, tipo (campaña activada, diseño entregado, optimización, personalizada), texto, timestamp. Se crean manualmente por el admin o automáticamente (p. ej. al activar campaña).
8. **notificaciones** — `cliente_id`, destinatario, tipo, texto, leída/no leída, timestamp.
9. **mensajes** — chat: `cliente_id` (un hilo por cliente), autor, texto, timestamp, leído.

## 5. Pantallas

### Portal del cliente (`/portal`)

1. **Dashboard** — KPIs simples (leads del mes, ventas cerradas, dinero generado, campañas activas), gráfica de barras semanal (leads/ventas), timeline "así trabajamos tu marca", alerta de leads sin atender, botón para descargar reporte mensual PDF.
2. **Mis Leads** — kanban por etapa; botón prominente "+ Registrar lead" (nombre, teléfono, fuente — 10 segundos, optimizado para celular); detalle de lead con seguimientos, objeciones, monto y método de cierre.
3. **Campañas** — lista de sus campañas con nombre, plataforma y estado. Sin gasto, sin CPL.
4. **Chat** — conversación en tiempo real con Top Digital.
5. **Notificaciones** — campanita con historial (campaña activada/pausada, mensaje nuevo, actividad publicada, leads sin atender).

### Panel de la agencia (`/agencia`)

1. **Dashboard global** — KPIs de agencia (clientes activos, leads del mes, ventas generadas, tasa de cierre global) + tabla de salud por cliente con semáforo.
2. **Clientes** — CRUD de clientes y sus usuarios; perfil completo por cliente: métricas reales (gasto, CPL, utilidad, ticket promedio, objeciones más comunes), leads, campañas, tareas, y vista previa de lo que ese cliente ve en su portal.
3. **Campañas** — crear/editar por cliente; switch activar/pausar → genera notificación automática al cliente y entrada en su timeline; captura de gasto y leads generados.
4. **Tareas** — checklist por cliente; al completar, diálogo "¿publicar al timeline del cliente?".
5. **Leads global** — todos los leads de todos los clientes, filtros por cliente/etapa/campaña/fuente.
6. **Chats** — inbox centralizado con badge de no leídos.
7. **Reportes** — generar PDF mensual por cliente (con marca Top Digital: leads, ventas, dinero generado, actividades del mes) y publicarlo a su portal.

## 6. Reglas de negocio

- **Lead sin atender:** lead en etapa "Nuevo" sin ningún seguimiento registrado tras 24 horas. Alimenta la alerta del portal del cliente y el semáforo de la agencia.
- **Semáforo de salud** (🟢 Sano / 🟡 Atención / 🔴 Riesgo) por cliente, con tres señales explicables: % de leads sin atender, tasa de cierre del mes vs promedio histórico del cliente, y gasto acumulado del mes vs presupuesto de ads del cliente.
- **Notificaciones automáticas:** activar/pausar campaña, mensaje de chat nuevo, actividad publicada en timeline, resumen de leads sin atender.
- **Facturación / "dinero generado":** suma de `monto de venta` de los leads en etapa "Cerrado ganado" del periodo.
- **Métricas (solo agencia):** CPL = gasto ÷ leads; tasa de cierre = ganados ÷ (ganados + perdidos); ticket promedio = facturación ÷ ventas ganadas; utilidad = facturación − gasto en ads.
- **Métricas (cliente):** leads, ventas cerradas, dinero generado, campañas activas. Nada más.
- **Destinatarios de notificaciones:** en v1 las notificaciones in-app son para los usuarios del cliente. El admin monitorea desde el dashboard global y el badge de no leídos del inbox de chats.
- **Evidencia de garantía:** el historial de seguimientos es inmutable y con timestamps — sustenta el modelo "sin datos registrados no hay reclamo".

## 7. Manejo de errores

- Validación de formularios con mensajes en español.
- Chat/notificaciones: si la conexión realtime se cae, reconexión automática; los mensajes persisten en la base de datos (no se pierden).
- Sin acciones destructivas irreversibles: los clientes se desactivan (soft delete), nunca se borran con sus datos.
- Estados vacíos y de carga diseñados (primer uso sin datos).

## 8. Testing

- **Crítico:** pruebas automáticas de las políticas RLS — un usuario cliente jamás puede leer/escribir datos de otro `cliente_id`, y los campos sensibles no llegan al rol cliente.
- Pruebas unitarias de cálculos de métricas y del semáforo de salud.
- Pruebas de flujo principal: registrar lead → seguimientos → mover etapas → cerrar venta → reflejarse en dashboards de ambos lados.

## 9. Fases de entrega

Cada fase termina en algo usable y desplegado en Vercel.

1. **Fase 1 — El corazón:** login con roles y redirección, CRUD de clientes y usuarios, CRM de leads (kanban, captura rápida, seguimientos, cierre de venta), campañas con activar/pausar y notificaciones internas.
2. **Fase 2 — La experiencia:** dashboards de ambos lados con el estilo visual de referencia, timeline de marca, semáforo de salud, gráficas semanales. (El botón de reporte PDF del dashboard del cliente se oculta hasta la Fase 3.)
3. **Fase 3 — Los extras:** chat en tiempo real, reportes PDF mensuales, alertas de leads sin atender.

## 10. Fuera de alcance (v1)

- App nativa móvil (es sitio web responsivo).
- Integraciones automáticas de captura (Meta Lead Ads, WhatsApp Business API) — el diseño las contempla como fuente futura de la tabla `leads`.
- Notificaciones por email o WhatsApp (solo in-app en v1).
- Roles adicionales en la agencia (solo el dueño).
- Facturación/cobros dentro de la plataforma.
