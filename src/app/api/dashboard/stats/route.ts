import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  // Applied the 'await' fix to satisfy the type-checker
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    const [{ count: inventoryCount }, { count: ordersCount }] =
      await Promise.all([
        supabase.from('inventory').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ])

    const stats = {
      inventoryCount: inventoryCount ?? 0,
      ordersCount: ordersCount ?? 0,
      suppliesCount: 0,
      paymentsCount: 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new NextResponse('Internal Server Error fetching stats', {
      status: 500,
    })
  }
}