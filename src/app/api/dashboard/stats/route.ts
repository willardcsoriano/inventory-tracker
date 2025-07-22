// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // run multiple queries in parallel
  const [inv, ord, sup, pay] = await Promise.all([
    supabase.from('items'   ).select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('orders'  ).select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('supplies').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('payments').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  if (inv.error || ord.error || sup.error || pay.error) {
    console.error(inv.error, ord.error, sup.error, pay.error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  return NextResponse.json({
    inventoryCount: inv.count ?? 0,
    ordersCount:    ord.count ?? 0,
    suppliesCount:  sup.count ?? 0,
    paymentsCount:  pay.count ?? 0,
  })
}
