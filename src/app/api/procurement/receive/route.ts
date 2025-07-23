import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { order_id, received_items } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Call the database function to log received items and update statuses
  const { error } = await supabase.rpc('log_items_received', {
    order_id_in: order_id,
    received_items: received_items,
  })

  if (error) {
    console.error('Error logging received items:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return new NextResponse('Items received successfully', { status: 200 })
}