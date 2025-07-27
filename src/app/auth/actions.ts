// src/app/auth/actions.ts
'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  return redirect('/')
}

// Updated signIn action to return an error object
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign-in error:', error.message)
    // Return an error object to the client component
    return { error: { message: error.message } };
  }

  // Successful sign-in, redirect to the dashboard (your homepage '/')
  redirect('/') // Use redirect here, it stops function execution
}

// Updated signUp action to return an error object
export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Sign-up error:', error.message)
    // Return an error object to the client component
    return { error: { message: error.message } };
  }

  // Successful sign-up, redirect to the dashboard (your homepage '/')
  // Or, if email confirmation is needed, you might redirect to a specific 'check email' page.
  redirect('/')
}