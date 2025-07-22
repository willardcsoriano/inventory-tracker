// src/components/InventoryApp.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent } from 'react'

interface Item {
  id: number
  name: string
  quantity: number
  created_at: string
  user_id: string
}

export default function InventoryApp() {
  const session = useSession()!
  const userId  = session.user.id

  const [items, setItems]               = useState<Item[]>([])
  const [name, setName]                 = useState('')
  const [quantity, setQuantity]         = useState(1)
  const [loading, setLoading]           = useState(false)
  const [editingId, setEditingId]       = useState<number | null>(null)
  const [editName, setEditName]         = useState('')
  const [editQuantity, setEditQuantity] = useState(1)

  // 1. Load this user's items
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')               // no generic here
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false })

    if (error) console.error('Error fetching items:', error)
    else setItems(data ?? [])
  }

  useEffect(() => {
    // Initial fetch
    fetchItems()

    // Real-time subscription for this user's rows
    const channel = supabase
      .channel('items')  // arbitrary channel name
      .on<RealtimePostgresChangesPayload<Item>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old)! as Item
          setItems((curr) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [row, ...curr]
              case 'UPDATE':
                return curr.map(i => (i.id === row.id ? row : i))
              case 'DELETE':
                return curr.filter(i => i.id !== row.id)
              default:
                return curr
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 2. Create a new item
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('items')
      .insert({ name, quantity, user_id: userId })
    setLoading(false)

    if (error) alert('Error adding item: ' + error.message)
    else {
      setName('')
      setQuantity(1)
      // no fetchItems() needed; subscription will update state
    }
  }

  // 3. Delete
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
    if (error) alert('Error deleting item: ' + error.message)
  }

  // 4. Edit flows
  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditQuantity(item.quantity)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditQuantity(1)
  }
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    const { error } = await supabase
      .from('items')
      .update({ name: editName, quantity: editQuantity })
      .eq('id', editingId)
    if (error) alert('Error updating item: ' + error.message)
    else cancelEdit()
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Inventory Tracker</h1>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="mb-8 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Item Name</label>
          <input
            type="text"
            value={name}
            required
            onChange={e => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Quantity</label>
          <input
            type="number"
            value={quantity}
            min={1}
            required
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add Item'}
        </button>
      </form>

      {/* Edit Form */}
      {editingId !== null && (
        <form onSubmit={handleUpdate} className="mb-6 p-4 bg-yellow-100 rounded space-y-4">
          <h2 className="text-xl font-semibold">Edit Item #{editingId}</h2>
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              value={editName}
              required
              onChange={e => setEditName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Quantity</label>
            <input
              type="number"
              value={editQuantity}
              min={1}
              required
              onChange={e => setEditQuantity(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Item List */}
      <ul className="space-y-3">
        {items.map(item => (
          <li
            key={item.id}
            className="flex justify-between items-center p-4 bg-gray-100 rounded"
          >
            <div>
              <span className="font-medium">{item.name}</span> — <span className="font-semibold">{item.quantity}</span>
            </div>
            <div className="space-x-2">
              <button onClick={() => startEdit(item)} className="text-sm px-2 py-1 border rounded hover:bg-gray-200">
                Edit
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-sm px-2 py-1 border rounded text-red-600 hover:bg-red-100">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
