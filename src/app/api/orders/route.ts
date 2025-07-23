// src/app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all orders for the logged-in user ---
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- POST: Create a new order ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { customer_name, total_amount, status } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .insert([{ customer_name, total_amount, status, user_id: user.id }])
    .select()

  if (error) {
    console.error('Error creating order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- PATCH: Update an existing order ---
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { id, customer_name, total_amount, status } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .update({ customer_name, total_amount, status })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure users can only update their own orders
    .select()

  if (error) {
    console.error('Error updating order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- DELETE: Remove an order ---
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return new NextResponse('Order ID is required', { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { error } = await supabase 
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure users can only delete their own orders

  if (error) {
    console.error('Error deleting order:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return new NextResponse('Order deleted successfully', { status: 200 })
}