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