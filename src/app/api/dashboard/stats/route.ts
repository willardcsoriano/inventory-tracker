import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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
    // Fetch count from all tables in parallel
    const [
      { count: inventoryCount },
      { count: ordersCount },
      { count: procurementCount },
      { count: paymentsCount }, // Added payments count
    ] = await Promise.all([
      supabase.from('inventory').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('supplies').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }), // Fetch from 'payments' table
    ])

    const stats = {
      inventoryCount: inventoryCount ?? 0,
      ordersCount: ordersCount ?? 0,
      procurementCount: procurementCount ?? 0,
      paymentsCount: paymentsCount ?? 0, // Use the real count
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new NextResponse('Internal Server Error fetching stats', {
      status: 500,
    })
  }
}