import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { order_id, deliveries } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Call the database function to log the delivery and update statuses
  const { error } = await supabase.rpc('log_order_delivery', {
    order_id_in: order_id,
    deliveries: deliveries,
  })

  if (error) {
    console.error('Error logging delivery:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return new NextResponse('Delivery logged successfully', { status: 200 })
}