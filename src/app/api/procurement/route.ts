import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all supply orders and their line items ---
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('supply_orders')
    .select('*, supply_order_items(*)')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching supply orders:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- POST: Create a new Supply Order ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const so_data = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Call the database function to handle the transaction
  const { data, error } = await supabase.rpc('create_supply_order', { so_data })

  if (error) {
    console.error('Error creating supply order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- PATCH: Update an existing supply order (e.g., status) ---
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const payload = await req.json()
  const { id, ...updateData } = payload

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('supply_orders')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('Error updating supply order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- DELETE: Remove a supply order and its line items ---
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return new NextResponse('Order ID is required', { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // 'ON DELETE CASCADE' in the SQL will auto-delete the line items
  const { error } = await supabase
    .from('supply_orders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting supply order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return new NextResponse('Supply order deleted successfully', { status: 200 })
}