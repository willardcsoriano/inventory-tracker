'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface Item {
  id: number
  name: string
  part_number: string
  supplier: string | null
  description: string | null
  quantity: number
  category: string | null
  location: string | null
  reorder_level: number | null
  created_at: string
  updated_at: string
}

type ItemFormData = Partial<Omit<Item, 'id' | 'created_at' | 'updated_at'>>

// --- CHILD COMPONENTS ---

const ItemForm: FC<{
  onSubmit: (formData: ItemFormData) => void
  onCancel: () => void
  initialData?: Item | null
  loading?: boolean
}> = ({ onSubmit, onCancel, initialData, loading }) => {
  const [formData, setFormData] = useState<ItemFormData>({})

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData })
    } else {
      setFormData({
        name: '',
        part_number: '',
        supplier: '',
        description: '',
        quantity: 1, // Set a default quantity for new items
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const isNumber = ['quantity', 'reorder_level'].includes(name)
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? (value === '' ? null : Number(value)) : value,
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? `Editing Item: ${initialData.name}` : 'Add New Item'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fields for both Create and Edit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-sm">Item Name</label>
            <input name="name" type="text" value={formData.name || ''} required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm">Part Number</label>
            <input name="part_number" type="text" value={formData.part_number || ''} required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm">Supplier</label>
          <input name="supplier" type="text" value={formData.supplier || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm">Description</label>
          <textarea name="description" value={formData.description || ''} rows={3} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        
        {/* --- CHANGE 1: Moved Quantity field here so it shows for NEW items too --- */}
        <div>
          <label className="block mb-1 font-medium text-sm">Initial Quantity on Hand</label>
          <input name="quantity" type="number" value={formData.quantity || 0} min={0} required onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>

        {/* Fields ONLY for Editing */}
        {initialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block mb-1 font-medium text-sm">Category</label>
              <input name="category" type="text" value={formData.category || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium text-sm">Location</label>
              <input name="location" type="text" value={formData.location || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block mb-1 font-medium text-sm">Re-order Level</label>
              <input name="reorder_level" type="number" value={formData.reorder_level || ''} min={0} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Item'}
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const ItemCard: FC<{
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: number) => void
}> = ({ item, onEdit, onDelete }) => {
  const isLowStock = item.reorder_level !== null && item.quantity <= item.reorder_level;

  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm border-l-4 ${isLowStock ? 'border-red-500' : 'border-gray-200'}`}>
      {/* ... Card content remains the same ... */}
       <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg">{item.name}</div>
          <div className="text-sm text-gray-500">Part #: {item.part_number}</div>
          {item.supplier && <div className="text-sm text-blue-600 font-medium">Supplier: {item.supplier}</div>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{item.quantity}</div>
          <div className="text-xs text-gray-500">on hand</div>
        </div>
      </div>
      {isLowStock && (
        <div className="mt-2 text-sm font-semibold text-red-600 bg-red-100 p-2 rounded text-center">
          LOW STOCK (Re-order level: {item.reorder_level})
        </div>
      )}
      <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
        {item.category && <div><strong>Category:</strong> {item.category}</div>}
        {item.location && <div><strong>Location:</strong> {item.location}</div>}
        {item.description && <p className="italic">"{item.description}"</p>}
      </div>
      <div className="flex justify-between items-center mt-4 pt-2 border-t">
        <div className="text-xs text-gray-400">
          Last Updated: {new Date(item.updated_at).toLocaleString()}
        </div>
        <div className="space-x-2">
          <button onClick={() => onEdit(item)} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Edit</button>
          <button onClick={() => onDelete(item.id)} className="text-sm px-3 py-1 border rounded text-red-600 hover:bg-red-100">Delete</button>
        </div>
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---
export default function InventoryPage() {
  const session = useSession()
  const user = session?.user

  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    const res = await fetch('/api/items')
    if (res.ok) setItems(await res.json())
    else console.error('Failed to fetch items', await res.text())
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchItems()
  }, [user])

  const handleApiCall = async (endpoint: string, options: RequestInit) => {
    setLoading(true)
    const res = await fetch(endpoint, options)
    if (!res.ok) alert(await res.text())
    else {
      setIsFormVisible(false)
      setEditingItem(null)
      await fetchItems()
    }
    setLoading(false)
  }

  const handleSubmitForm = (formData: ItemFormData) => {
    if (editingItem) {
      handleApiCall('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem.id, ...formData }),
      })
    } else {
      // --- CHANGE 2: Removed hardcoded quantity: 0 so it uses the value from the form ---
      handleApiCall('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    }
  }

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    handleApiCall(`/api/items?id=${id}`, { method: 'DELETE' })
  }

  const handleStartEdit = (item: Item) => {
    setEditingItem(item)
    setIsFormVisible(true)
  }

  const handleStartCreate = () => {
    setEditingItem(null)
    setIsFormVisible(true)
  }

  const handleCancelForm = () => {
    setEditingItem(null)
    setIsFormVisible(false)
  }

  const visibleItems = items.filter((i) => {
    const searchTerm = filter.toLowerCase()
    return (
      i.name.toLowerCase().includes(searchTerm) ||
      i.part_number.toLowerCase().includes(searchTerm) ||
      i.category?.toLowerCase().includes(searchTerm) ||
      i.supplier?.toLowerCase().includes(searchTerm)
    )
  })

  if (!user) return null

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
       {/* ... main layout remains the same ... */}
       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name, part #, category, supplier..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-64 border rounded px-3 py-2"
          />
          <button
            onClick={handleStartCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
          >
            + Add New Item
          </button>
        </div>
      </div>
      
      {isFormVisible && (
        <div className="mb-8">
          <ItemForm
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
            initialData={editingItem}
            loading={loading}
          />
        </div>
      )}

      <div className="space-y-4">
        {loading && items.length === 0 && <p>Loading items...</p>}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold">Your inventory is empty</h3>
            <p className="text-gray-500 mt-2">Click "+ Add New Item" to get started.</p>
          </div>
        )}
        {!loading && visibleItems.length === 0 && items.length > 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold">No items match your search</h3>
            <p className="text-gray-500 mt-2">Try a different search term.</p>
          </div>
        )}
        {visibleItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </main>
  )
}