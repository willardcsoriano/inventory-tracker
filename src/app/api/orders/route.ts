import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all orders and their line items ---
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // This Supabase query fetches orders and automatically includes their nested order_items
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- POST: Create a new Purchase Order ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const poData = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Call the database function to handle the transaction
  const { data, error } = await supabase.rpc('create_purchase_order', { po_data: poData })

  if (error) {
    console.error('Error creating purchase order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}