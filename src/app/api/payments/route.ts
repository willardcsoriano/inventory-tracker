// src/app/api/payments/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all payment records for the user ---
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('payments')
    .select('order_id')
    .eq('user_id', user.id)

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }
  return NextResponse.json(data)
}

// --- POST: Create a payment record to mark an order as paid ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { order_id, amount } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // paid_at is set to the current time automatically
  const { data, error } = await supabase
    .from('payments')
    .insert([{ order_id, amount, user_id: user.id, paid_at: new Date().toISOString() }])
    .select()

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }
  return NextResponse.json(data)
}

// --- DELETE: Remove a payment record to mark an order as unpaid ---
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const order_id = searchParams.get('order_id')

  if (!order_id) return new NextResponse('Order ID is required', { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Delete all payment records associated with this order_id
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('order_id', order_id)
    .eq('user_id', user.id)

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }
  return new NextResponse('Payment record deleted successfully', { status: 200 })
}