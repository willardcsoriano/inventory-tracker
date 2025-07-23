import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all items for the logged-in user ---
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

// --- POST: Create a new item with limited initial data ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  // Only expect the initial fields for a new item
  const { name, part_number, supplier, description, quantity } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('inventory')
    .insert([{ name, part_number, supplier, description, quantity: quantity || 0, user_id: user.id }])
    .select()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

// --- PATCH: Update an existing item with all fields ---
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  // Expect all fields for an update
  const { id, name, part_number, supplier, description, quantity, category, location, reorder_level } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('inventory')
    .update({ name, part_number, supplier, description, quantity, category, location, reorder_level })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

// --- DELETE: Remove an item ---
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return new NextResponse('Item ID is required', { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse('Item deleted successfully', { status: 200 })
}