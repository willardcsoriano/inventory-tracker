// src/app/api/procurement/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// --- GET: Fetch all supply records for the user ---
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Use a join to get the inventory item's name with the supply record
  const { data, error } = await supabase
    .from('supplies')
    .select('*, inventory(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching supplies:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- POST: Create a new supply record ---
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { item_id, quantity, cost_per } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('supplies')
    .insert([{ item_id, quantity, cost_per, user_id: user.id }])
    .select()

  if (error) {
    console.error('Error creating supply record:', error)
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

// --- DELETE: Remove a supply record ---
export async function DELETE(req: Request) {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('Record ID is required', { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return new NextResponse(error.message, { status: 500 });

    return new NextResponse('Record deleted successfully', { status: 200 });
}