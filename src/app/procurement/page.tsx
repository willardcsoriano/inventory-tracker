'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface InventoryItem {
  id: number
  name: string
}

interface Supply {
  id: number
  item_id: number
  quantity: number
  cost_per: number
  created_at: string
  inventory: { name: string } // Joined data
}

// --- CHILD COMPONENTS ---

const ProcurementForm: FC<{
  onSubmit: (formData: Omit<Supply, 'id' | 'created_at' | 'inventory'>) => void
  inventoryItems: InventoryItem[]
  initialData?: Supply | null
  loading?: boolean
}> = ({ onSubmit, inventoryItems, initialData, loading }) => {
  const [itemId, setItemId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [costPer, setCostPer] = useState(0)

  useEffect(() => {
    setItemId(initialData?.item_id || '')
    setQuantity(initialData?.quantity || 1)
    setCostPer(initialData?.cost_per || 0)
  }, [initialData])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!itemId) {
      alert('Please select an item.')
      return
    }
    onSubmit({ item_id: itemId, quantity, cost_per: costPer })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        initialData ? 'mb-6 p-4 bg-yellow-100 rounded space-y-4' : 'mb-8 space-y-4'
      }
    >
      {initialData && (
        <h2 className="text-xl font-semibold">Edit Supply Record #{initialData.id}</h2>
      )}
      <div>
        <label className="block mb-1 font-medium">Inventory Item</label>
        <select
          value={itemId}
          required
          onChange={(e) => setItemId(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 bg-white"
          disabled={!!initialData} // Disable changing the item when editing
        >
          <option value="" disabled>
            -- Select an item --
          </option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="block mb-1 font-medium">Cost Per Item ($)</label>
          <input
            type="number"
            value={costPer}
            min={0}
            step="0.01"
            required
            onChange={(e) => setCostPer(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Supply Record'}
        </button>
      </div>
    </form>
  )
}

// --- MAIN PAGE COMPONENT ---
export default function ProcurementPage() {
  const session = useSession()
  const user = session?.user

  const [supplies, setSupplies] = useState<Supply[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Using a single state for editing to simplify
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);

  const fetchData = async () => {
    setLoading(true)
    // Fetch both supplies and inventory items at the same time
    const [suppliesRes, itemsRes] = await Promise.all([
      fetch('/api/procurement'),
      fetch('/api/items'),
    ])

    if (suppliesRes.ok) setSupplies(await suppliesRes.json())
    if (itemsRes.ok) setInventoryItems(await itemsRes.json())

    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleCreate = async (formData: Omit<Supply, 'id' | 'created_at' | 'inventory'>) => {
    setLoading(true)
    const res = await fetch('/api/procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) alert(await res.text())
    else await fetchData()
    setLoading(false)
  }
  
  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this record?`)) return;
    const res = await fetch(`/api/procurement?id=${id}`, { method: 'DELETE' });
    if (!res.ok) alert(await res.text());
    else await fetchData();
  };

  if (!user) {
    return <p className="text-center">Please sign in to view procurement records.</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Procurement / Supplies</h1>

      <ProcurementForm
        onSubmit={handleCreate}
        inventoryItems={inventoryItems}
        loading={loading}
      />

      <div className="mt-8 space-y-3">
        {loading && supplies.length === 0 ? (
          <p>Loading records...</p>
        ) : (
          supplies.map((supply) => (
            <div key={supply.id} className="grid grid-cols-4 gap-4 items-center p-4 bg-gray-100 rounded">
              <div>
                <div className="font-medium">{supply.inventory.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(supply.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-center">{supply.quantity} units</div>
              <div className="text-center">@ ${supply.cost_per.toFixed(2)} each</div>
              <div className="text-right">
                <div className="font-semibold">
                  Total: ${(supply.quantity * supply.cost_per).toFixed(2)}
                </div>
                 <button
                    onClick={() => handleDelete(supply.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Delete
                  </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}