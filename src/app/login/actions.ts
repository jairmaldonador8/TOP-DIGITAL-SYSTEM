'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type EstadoLogin = { error: string } | null

export async function iniciarSesion(
  _estadoPrevio: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.code === 'invalid_credentials') {
      // Mensaje genérico: no revelar si el correo existe o no.
      return { error: 'Correo o contraseña incorrectos' }
    }
    console.error('Error inesperado al iniciar sesión:', error)
    return { error: 'Ocurrió un error inesperado, intenta de nuevo' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
