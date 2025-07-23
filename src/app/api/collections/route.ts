import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all collection records for the user ---
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching collections:', error)
    return new NextResponse(error.message, { status: 500 })
  }
  return NextResponse.json(data)
}

// --- POST: Create a new collection record ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    order_id,
    amount,
    date_collected,
    payment_method,
    reference_number
  } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('collections')
    .insert([{ 
        order_id, 
        amount, 
        date_collected,
        payment_method,
        reference_number,
        user_id: user.id 
    }])
    .select()

  if (error) {
    console.error('Error creating collection:', error)
    return new NextResponse(error.message, { status: 500 })
  }
  return NextResponse.json(data)
}