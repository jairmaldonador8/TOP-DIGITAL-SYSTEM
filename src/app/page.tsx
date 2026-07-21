import { redirect } from 'next/navigation'

import { Landing } from '@/components/inicio/landing'
import { destinoPorRol } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  // Con sesión, directo a su área; sin sesión, la landing pública.
  if (data?.claims) {
    redirect(destinoPorRol(data.claims))
  }

  return <Landing />
}
