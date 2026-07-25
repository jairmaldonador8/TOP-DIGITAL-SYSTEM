/**
 * Plantilla del correo de bienvenida para integrantes nuevos del equipo
 * (función pura, testeable). HTML con estilos inline (los clientes de
 * correo no cargan CSS externo) y el degradado de marca de Top Digital.
 */

const VIOLETA = '#7c3aed'
const MAGENTA = '#f0338d'
const NARANJA = '#fca044'
const URL_APP = 'https://www.topdigital.company'

function escaparHtml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function emailBienvenida(datos: {
  nombre: string
  puesto: string
  email: string
  password: string
}): { asunto: string; html: string } {
  const nombre = escaparHtml(datos.nombre)
  const puesto = escaparHtml(datos.puesto)
  const email = escaparHtml(datos.email)
  const password = escaparHtml(datos.password)

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="height:6px;background:linear-gradient(90deg,${VIOLETA} 0%,${MAGENTA} 52%,${NARANJA} 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:36px 36px 8px;">
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MAGENTA};">Top Digital</p>
            <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;color:#111827;">¡Bienvenido al equipo, ${nombre}! 👋</h1>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#4b5563;">
              Ya formas parte de Top Digital como <strong>${puesto}</strong>.
              Desde tu panel vas a recibir tus encargos, entregar tu trabajo con
              evidencia y chatear directo con la dirección — todo en un solo lugar.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#6b7280;">Tus accesos</p>
                <p style="margin:12px 0 0;font-size:14px;color:#111827;">Correo: <strong>${email}</strong></p>
                <p style="margin:6px 0 0;font-size:14px;color:#111827;">Contraseña: <strong>${password}</strong></p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;" align="center">
            <a href="${URL_APP}/login" style="display:inline-block;background:linear-gradient(90deg,${VIOLETA} 0%,${MAGENTA} 52%,${NARANJA} 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:9999px;">Entrar a mi panel</a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 36px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;" align="center">
              Guarda este correo o tus accesos en un lugar seguro.<br>
              Si tienes dudas, escríbele directo a la dirección desde el chat de tu panel.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">© Top Digital · ${URL_APP.replace('https://', '')}</p>
    </td></tr>
  </table>
</body>
</html>`

  return { asunto: `Bienvenido a Top Digital, ${datos.nombre} 🚀`, html }
}
