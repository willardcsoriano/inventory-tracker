// C:\Users\Willard\inventory-tracker\src\app\page.tsx
'use client'

import { useSession } from '@supabase/auth-helpers-react'
import AuthForm from '@/components/AuthForm'
import InventoryApp from '@/components/InventoryApp'

export default function HomePage() {
  const session = useSession()

  return session ? <InventoryApp /> : <AuthForm />
}
