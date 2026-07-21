// Verifica que el Custom Access Token Hook inyecta user_role y cliente_id.
// Uso: npm run verify:login  (usa la publishable key, como un cliente real)
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error("Faltan variables de Supabase en .env.local");
  process.exit(1);
}

type Claims = { user_role?: string; cliente_id?: string | null; [k: string]: unknown };

function decodeJwtPayload(token: string): Claims {
  const payload = token.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

let fallo = false;

function assert(cond: boolean, mensaje: string) {
  if (cond) {
    console.log(`  OK   ${mensaje}`);
  } else {
    console.error(`  FAIL ${mensaje}`);
    fallo = true;
  }
}

async function verificar(email: string, password: string): Promise<Claims> {
  const supabase = createClient(url!, publishableKey!, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error(`No se pudo iniciar sesión como ${email}: ${error?.message}`);
    process.exit(1);
  }
  const claims = decodeJwtPayload(data.session.access_token);
  console.log(`\n${email}:`);
  console.log(`  user_role=${JSON.stringify(claims.user_role)} cliente_id=${JSON.stringify(claims.cliente_id)}`);
  await supabase.auth.signOut();
  return claims;
}

async function main() {
  // id de Tacos El Patrón (via admin client, solo para comparar el claim)
  const adminClient = createClient(url!, secretKey!, { auth: { persistSession: false } });
  const { data: tacos, error } = await adminClient
    .from("clientes")
    .select("id")
    .eq("nombre_negocio", "Tacos El Patrón")
    .single();
  if (error || !tacos) {
    console.error(`No se encontró el cliente demo (¿corriste npm run seed?): ${error?.message}`);
    process.exit(1);
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!adminPassword || !demoPassword) {
    console.error("Faltan SEED_ADMIN_PASSWORD o SEED_DEMO_PASSWORD en .env.local");
    process.exit(1);
  }

  const adminClaims = await verificar("admin@topdigital.mx", adminPassword);
  assert(adminClaims.user_role === "admin", "admin: user_role === 'admin'");

  const demoClaims = await verificar("demo@tacoselpatron.mx", demoPassword);
  assert(demoClaims.user_role === "cliente", "demo: user_role === 'cliente'");
  assert(demoClaims.cliente_id === tacos.id, `demo: cliente_id === ${tacos.id}`);

  if (adminClaims.user_role === undefined && demoClaims.user_role === undefined) {
    console.error("\nBLOQUEADO: los JWT no traen user_role — el Custom Access Token Hook no está funcionando en el dashboard.");
  }

  if (fallo) process.exit(1);
  console.log("\nVerificación de claims: OK");
}

main().catch((err) => {
  console.error("Verificación falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
