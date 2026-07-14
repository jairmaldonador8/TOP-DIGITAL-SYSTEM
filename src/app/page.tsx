import { redirect } from 'next/navigation'

import { destinoPorRol } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  redirect(destinoPorRol(data?.claims))
}
