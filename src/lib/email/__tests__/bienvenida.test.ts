import { describe, expect, it } from 'vitest'

import { emailBienvenida } from '@/lib/email/bienvenida'

describe('emailBienvenida', () => {
  const datos = {
    nombre: 'Ana López',
    puesto: 'Diseño gráfico',
    email: 'ana@ejemplo.mx',
    password: 'secreta123',
  }

  it('incluye nombre, puesto, accesos y el enlace al panel', () => {
    const { asunto, html } = emailBienvenida(datos)
    expect(asunto).toContain('Ana López')
    expect(html).toContain('Ana López')
    expect(html).toContain('Diseño gráfico')
    expect(html).toContain('ana@ejemplo.mx')
    expect(html).toContain('secreta123')
    expect(html).toContain('https://www.topdigital.company/login')
  })

  it('escapa HTML en los datos del formulario', () => {
    const { html } = emailBienvenida({
      ...datos,
      nombre: '<script>alert(1)</script>',
      password: 'a<b>&"c',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('a&lt;b&gt;&amp;&quot;c')
  })
})
