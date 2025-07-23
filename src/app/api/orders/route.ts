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

// --- PATCH: Update an existing order (can now handle full updates or just status) ---
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const payload = await req.json()
  const { id, ...updateData } = payload

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .update(updateData) // Only updates fields present in the payload
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('Error updating order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- DELETE: Remove an order and its line items ---
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return new NextResponse('Order ID is required', { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Because of 'ON DELETE CASCADE' in our SQL, deleting the order
  // will automatically delete all of its associated order_items.
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return new NextResponse('Order deleted successfully', { status: 200 })
}