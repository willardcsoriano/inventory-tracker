// src/services/items.ts
import { supabase } from '@/lib/supabaseClient'

export interface Item {
  id: number
  name: string
  quantity: number
  created_at: string
  user_id: string
}

export async function fetchItems(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createItem(
  userId: string,
  name: string,
  quantity: number
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert({ user_id: userId, name, quantity })
    .single()

  if (error) throw error
  return data
}

export async function updateItem(
  id: number,
  name: string,
  quantity: number
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ name, quantity })
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(id: number): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
