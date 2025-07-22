// C:\Users\Willard\inventory-tracker\src\app\inventory\page.tsx
'use client'

import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface Item {
  id: number
  name: string
  quantity: number
}

// --- CHILD COMPONENTS ---

/**
 * A reusable form for creating or editing an item.
 */
const ItemForm: FC<{
  onSubmit: (name: string, quantity: number) => void
  onCancel?: () => void
  initialData?: Item | null
  submitText: string
  loading?: boolean
}> = ({ onSubmit, onCancel, initialData, submitText, loading }) => {
  const [name, setName] = useState(initialData?.name || '')
  const [quantity, setQuantity] = useState(initialData?.quantity || 1)

  // Update form fields if the item being edited changes
  useEffect(() => {
    setName(initialData?.name || '')
    setQuantity(initialData?.quantity || 1)
  }, [initialData])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(name, quantity)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={initialData ? 'mb-6 p-4 bg-yellow-100 rounded space-y-4' : 'mb-8 space-y-4'}
    >
      {initialData && <h2 className="text-xl font-semibold">Edit Item #{initialData.id}</h2>}
      <div>
        <label className="block mb-1 font-medium">Item Name</label>
        <input
          type="text"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
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
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className={`${
            initialData ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          } text-white px-4 py-2 rounded disabled:opacity-50`}
        >
          {loading ? 'Saving...' : submitText}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

/**
 * Displays a single inventory item with edit and delete controls.
 */
const ItemRow: FC<{
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: number) => void
}> = ({ item, onEdit, onDelete }) => (
  <li className="flex justify-between items-center p-4 bg-gray-100 rounded">
    <div>
      <span className="font-medium">{item.name}</span> —{' '}
      <span className="font-semibold">{item.quantity}</span>
    </div>
    <div className="space-x-2">
      <button
        onClick={() => onEdit(item)}
        className="text-sm px-2 py-1 border rounded hover:bg-gray-200"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(item.id)}
        className="text-sm px-2 py-1 border rounded text-red-600 hover:bg-red-100"
      >
        Delete
      </button>
    </div>
  </li>
)

/**
 * Renders the list of inventory items.
 */
const ItemList: FC<{
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (id: number) => void
}> = ({ items, onEdit, onDelete }) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <ItemRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </ul>
)

// --- MAIN PAGE COMPONENT ---
export default function InventoryPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const user = session?.user

  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  // --- DATA FETCHING ---
  const fetchItems = async () => {
    const res = await fetch('/api/items')
    if (res.ok) setItems(await res.json())
    else console.error(await res.text())
  }

  useEffect(() => {
    if (user) fetchItems()
  }, [user])

  // --- API HANDLERS ---
  const handleCreate = async (name: string, quantity: number) => {
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity }),
    })
    setLoading(false)
    if (!res.ok) alert(await res.text())
    else await fetchItems()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' })
    if (!res.ok) alert(await res.text())
    else await fetchItems()
  }

  const handleUpdate = async (name: string, quantity: number) => {
    if (!editingItem) return
    const res = await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingItem.id, name, quantity }),
    })
    if (!res.ok) alert(await res.text())
    else {
      setEditingItem(null)
      await fetchItems()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // --- RENDER LOGIC ---
  if (!user) return null // Or a loading/login component

  const visibleItems = items.filter((i) =>
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
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Conditional Edit Form or Create Form */}
      {editingItem ? (
        <ItemForm
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
          initialData={editingItem}
          submitText="Save Changes"
        />
      ) : (
        <ItemForm
          onSubmit={handleCreate}
          submitText="Add Item"
          loading={loading}
        />
      )}

      {/* Item List */}
      <ItemList
        items={visibleItems}
        onEdit={setEditingItem}
        onDelete={handleDelete}
      />
    </main>
  )
}