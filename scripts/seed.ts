// Seed idempotente: agencia + admin + cliente demo con datos de ejemplo.
// Uso: npm run seed  (usa SUPABASE_SECRET_KEY, nunca exponer en cliente)
import { config } from "dotenv";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, secretKey, { auth: { persistSession: false } });

function fail(context: string, error: { message: string }): never {
  console.error(`Error en ${context}: ${error.message}`);
  process.exit(1);
}

/** Fecha ISO hace N dias. */
function diasAtras(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Busca un auth user por email; lo crea (confirmado) si no existe. */
async function ensureAuthUser(email: string, password: string): Promise<User> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) fail(`listUsers (${email})`, error);
  const existente = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existente) return existente;

  const { data: creado, error: errCrear } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (errCrear || !creado.user) fail(`createUser (${email})`, errCrear ?? { message: "sin usuario" });
  return creado.user;
}

/** Busca una fila por columnas de identidad; la inserta si no existe. Devuelve la fila. */
async function ensureRow<T extends Record<string, unknown>>(
  tabla: string,
  identidad: Record<string, unknown>,
  valores: Record<string, unknown>,
): Promise<T> {
  let query = admin.from(tabla).select("*");
  for (const [col, val] of Object.entries(identidad)) {
    query = val === null ? query.is(col, null) : query.eq(col, val as never);
  }
  const { data: existentes, error } = await query.limit(1);
  if (error) fail(`select ${tabla}`, error);
  if (existentes && existentes.length > 0) return existentes[0] as T;

  const { data: insertada, error: errInsert } = await admin
    .from(tabla)
    .insert({ ...identidad, ...valores })
    .select("*")
    .single();
  if (errInsert) fail(`insert ${tabla}`, errInsert);
  return insertada as T;
}

async function main() {
  // ===== 1. Agencia =====
  const agencia = await ensureRow<{ id: string }>(
    "clientes",
    { nombre_negocio: "Top Digital" },
    { es_agencia: true, estado: "activo" },
  );

  // ===== 2. Admin =====
  const adminUser = await ensureAuthUser("admin@topdigital.mx", "TopDigital2026!");
  await ensureRow(
    "usuarios",
    { user_id: adminUser.id },
    { cliente_id: null, rol: "admin", nombre: "Dueño Top Digital" },
  );

  // ===== 3. Cliente demo: Tacos El Patrón =====
  const tacos = await ensureRow<{ id: string }>(
    "clientes",
    { nombre_negocio: "Tacos El Patrón" },
    {
      contacto_nombre: "Carlos Mendoza",
      email: "demo@tacoselpatron.mx",
      telefono: "+52 55 1234 5678",
      presupuesto_ads: 8000,
      meta_facturacion: 120000,
      estado: "activo",
      es_agencia: false,
    },
  );

  const demoUser = await ensureAuthUser("demo@tacoselpatron.mx", "Demo2026!");
  await ensureRow(
    "usuarios",
    { user_id: demoUser.id },
    { cliente_id: tacos.id, rol: "cliente", nombre: "Carlos Mendoza" },
  );

  // ===== 4a. Campañas + finanzas =====
  const campActiva = await ensureRow<{ id: string }>(
    "campanias",
    { cliente_id: tacos.id, nombre: "Promo 2x1 Julio" },
    { plataforma: "Meta Ads", estado: "activa", fecha_inicio: diasAtras(10).slice(0, 10), leads_generados: 12 },
  );
  const campPausada = await ensureRow<{ id: string }>(
    "campanias",
    { cliente_id: tacos.id, nombre: "Awareness Local" },
    { plataforma: "Meta Ads", estado: "pausada", fecha_inicio: diasAtras(45).slice(0, 10), leads_generados: 4 },
  );
  await ensureRow("campania_finanzas", { campania_id: campActiva.id }, { cliente_id: tacos.id, gasto: 3500 });
  await ensureRow("campania_finanzas", { campania_id: campPausada.id }, { cliente_id: tacos.id, gasto: 1200 });

  // ===== 4b. Leads =====
  const leadsSpec: Array<{ nombre: string; valores: Record<string, unknown> }> = [
    {
      nombre: "María Fernanda López",
      valores: {
        telefono: "+52 55 2211 0034",
        fuente: "meta_ads",
        campania_id: campActiva.id,
        etapa: "nuevo",
        interes: "medio",
        responsable: "Carlos Mendoza",
      },
    },
    {
      nombre: "Jorge Ramírez",
      valores: {
        telefono: "+52 55 8765 4321",
        fuente: "whatsapp",
        etapa: "contactado",
        interes: "alto",
        responsable: "Carlos Mendoza",
      },
    },
    {
      nombre: "Ana Sofía Gutiérrez",
      valores: {
        email: "anasofia.g@gmail.com",
        fuente: "meta_ads",
        campania_id: campActiva.id,
        etapa: "interesado",
        interes: "alto",
        responsable: "Carlos Mendoza",
      },
    },
    {
      nombre: "Ricardo Torres",
      valores: {
        telefono: "+52 55 4433 2211",
        fuente: "referido",
        etapa: "ganado",
        interes: "alto",
        monto_venta: 4800,
        metodo_cierre: "whatsapp",
        fecha_cierre: diasAtras(2),
        responsable: "Carlos Mendoza",
      },
    },
    {
      nombre: "Lucía Hernández",
      valores: {
        telefono: "+52 55 9988 7766",
        fuente: "organico",
        etapa: "perdido",
        interes: "bajo",
        objeciones: ["precio"],
        responsable: "Carlos Mendoza",
      },
    },
  ];

  const leads: Record<string, { id: string }> = {};
  for (const spec of leadsSpec) {
    leads[spec.nombre] = await ensureRow<{ id: string }>(
      "leads",
      { cliente_id: tacos.id, nombre: spec.nombre },
      spec.valores,
    );
  }

  // ===== 4c. Seguimientos (2, en leads distintos) =====
  await ensureRow(
    "seguimientos",
    {
      lead_id: leads["Jorge Ramírez"].id,
      nota: "Le mandé el menú de banquetes por WhatsApp, quedó de confirmar el viernes.",
    },
    { cliente_id: tacos.id, autor_id: demoUser.id, autor_nombre: "Carlos Mendoza" },
  );
  await ensureRow(
    "seguimientos",
    {
      lead_id: leads["Ana Sofía Gutiérrez"].id,
      nota: "Preguntó por el paquete para evento de 50 personas, le envié cotización preliminar.",
    },
    { cliente_id: tacos.id, autor_id: demoUser.id, autor_nombre: "Carlos Mendoza" },
  );

  // ===== 4d. Tareas =====
  await ensureRow(
    "tareas",
    { cliente_id: tacos.id, titulo: "Subir creativos nuevos para Promo 2x1" },
    { descripcion: "Reemplazar los banners con las fotos nuevas del platillo estrella.", estado: "completada" },
  );
  await ensureRow(
    "tareas",
    { cliente_id: tacos.id, titulo: "Preparar reporte mensual de campañas" },
    { descripcion: "Consolidar métricas de julio para la reunión con el cliente.", estado: "pendiente", fecha_limite: diasAtras(-5).slice(0, 10) },
  );
  await ensureRow(
    "tareas",
    { cliente_id: tacos.id, titulo: "Configurar respuestas automáticas de WhatsApp" },
    { descripcion: "Plantillas de bienvenida y seguimiento para leads de Meta Ads.", estado: "pendiente", fecha_limite: diasAtras(-10).slice(0, 10) },
  );

  // ===== 4e. Actividades =====
  await ensureRow(
    "actividades",
    { cliente_id: tacos.id, texto: "Se activó la campaña Promo 2x1 Julio" },
    { tipo: "campania" },
  );
  await ensureRow(
    "actividades",
    { cliente_id: tacos.id, texto: "Nuevos diseños para historias aprobados" },
    { tipo: "diseno" },
  );
  await ensureRow(
    "actividades",
    { cliente_id: tacos.id, texto: "Optimizamos la segmentación de tu público" },
    { tipo: "optimizacion" },
  );

  // ===== 4f. Notificaciones (no leídas) =====
  await ensureRow(
    "notificaciones",
    { cliente_id: tacos.id, texto: "Tienes un nuevo lead: María Fernanda López" },
    { user_id: demoUser.id, tipo: "lead", leida: false },
  );
  await ensureRow(
    "notificaciones",
    { cliente_id: tacos.id, texto: "Tu campaña Promo 2x1 Julio ya generó 12 leads este mes" },
    { user_id: demoUser.id, tipo: "campania", leida: false },
  );

  // ===== Resumen =====
  const tablas = [
    "clientes",
    "usuarios",
    "campanias",
    "campania_finanzas",
    "leads",
    "seguimientos",
    "tareas",
    "actividades",
    "notificaciones",
  ];
  console.log("Seed completado. Conteos por tabla:");
  for (const tabla of tablas) {
    const { count, error } = await admin.from(tabla).select("*", { count: "exact", head: true });
    if (error) fail(`count ${tabla}`, error);
    console.log(`  ${tabla}: ${count}`);
  }
  console.log(`\nAgencia: ${agencia.id}`);
  console.log(`Cliente demo (Tacos El Patrón): ${tacos.id}`);
}

main().catch((err) => {
  console.error("Seed falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
