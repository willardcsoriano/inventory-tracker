// src/app/page.tsx

import { createSupabaseServerClient } from '@/utils/supabase/server' // Import server client
import AuthForm from '@/components/AuthForm'
import Dashboard from '@/components/Dashboard'

export default async function HomePage() { // Make it async
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser() // Get user server-side

  return user ? <Dashboard /> : <AuthForm />
}