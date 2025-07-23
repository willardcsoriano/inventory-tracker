// C:\Users\Willard\inventory-tracker\src\app\api\dashboard\stats\route.ts

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
    // Fetch count from multiple tables in parallel for efficiency
    const [
      { count: inventoryCount },
      { count: ordersCount },
      { count: procurementCount }, // Changed from suppliesCount
    ] = await Promise.all([
      supabase.from('inventory').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('supplies').select('*', { count: 'exact', head: true }), // Fetch from 'supplies' table
    ])

    const stats = {
      inventoryCount: inventoryCount ?? 0,
      ordersCount: ordersCount ?? 0,
      procurementCount: procurementCount ?? 0, // Changed from suppliesCount
      paymentsCount: 0, // Placeholder
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new NextResponse('Internal Server Error fetching stats', {
      status: 500,
    })
  }
}