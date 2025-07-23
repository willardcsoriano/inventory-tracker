// src/app/auth/actions.ts
'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  // Change the redirect path to the homepage
  return redirect('/')
}