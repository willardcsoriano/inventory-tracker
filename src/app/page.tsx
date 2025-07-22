// src/app/page.tsx
'use client'

import { useSession } from '@supabase/auth-helpers-react'
import AuthForm  from '@/components/AuthForm'
import Dashboard from '@/components/Dashboard'

export default function HomePage() {
  const session = useSession()

  return session ? <Dashboard /> : <AuthForm />
}
