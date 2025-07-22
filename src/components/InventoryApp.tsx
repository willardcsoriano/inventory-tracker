// src/components/InventoryApp.tsx
'use client'

import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent } from 'react'

interface Item {
  id: number
  name: string
  quantity: number
  created_at: string
  user_id: string
}

export default function InventoryApp() {
  const supabase = useSupabaseClient()
  const session  = useSession()
  const user     = session?.user

  const [items, setItems]               = useState<Item[]>([])
  const [filter, setFilter]             = useState('')       // ← search text
  const [name, setName]                 = useState('')
  const [quantity, setQuantity]         = useState(1)
  const [loading, setLoading]           = useState(false)
  const [editingId, setEditingId]       = useState<number | null>(null)
  const [editName, setEditName]         = useState('')
  const [editQuantity, setEditQuantity] = useState(1)

  // Fetch items
  const fetchItems = async () => {
    const res = await fetch('/api/items')
    if (!res.ok) {
      console.error(await res.text())
      return
    }
    setItems(await res.json())
  }

  useEffect(() => {
    if (user) fetchItems()
  }, [user])

  // Create
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity }),
    })
    setLoading(false)
    if (!res.ok) alert(await res.text())
    else {
      setName(''); setQuantity(1); fetchItems()
    }
  }

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' })
    if (!res.ok) alert(await res.text())
    else fetchItems()
  }

  // Edit flows
  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditQuantity(item.quantity)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditName(''); setEditQuantity(1)
  }
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    const res = await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, name: editName, quantity: editQuantity }),
    })
    if (!res.ok) alert(await res.text())
    else {
      cancelEdit(); fetchItems()
    }
  }

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!user) return null

  // Apply the search filter
  const visibleItems = items.filter(i =>
    i.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <main className="p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Tracker</h1>
        <button
          onClick={handleSignOut}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search items…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

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
        {visibleItems.map(item => (
          <li
            key={item.id}
            className="flex justify-between items-center p-4 bg-gray-100 rounded"
          >
            <div>
              <span className="font-medium">{item.name}</span> —{' '}
              <span className="font-semibold">{item.quantity}</span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => startEdit(item)}
                className="text-sm px-2 py-1 border rounded hover:bg-gray-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-sm px-2 py-1 border rounded text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
