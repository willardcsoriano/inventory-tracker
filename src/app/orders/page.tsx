'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
type OrderStatus = 'Pending' | 'Shipped' | 'Completed' | 'Cancelled'

interface Order {
  id: number
  customer_name: string
  total_amount: number
  status: OrderStatus
  created_at: string
}

// --- HELPER DATA ---
const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Shipped', 'Completed', 'Cancelled']

// --- CHILD COMPONENTS ---

/**
 * A reusable form for creating or editing an order.
 */
const OrderForm: FC<{
  onSubmit: (formData: Omit<Order, 'id' | 'created_at'>) => void
  onCancel?: () => void
  initialData?: Order | null
  loading?: boolean
}> = ({ onSubmit, onCancel, initialData, loading }) => {
  const [customerName, setCustomerName] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [status, setStatus] = useState<OrderStatus>('Pending')

  useEffect(() => {
    setCustomerName(initialData?.customer_name || '')
    setTotalAmount(initialData?.total_amount || 0)
    setStatus(initialData?.status || 'Pending')
  }, [initialData])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ customer_name: customerName, total_amount: totalAmount, status })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        initialData ? 'mb-6 p-4 bg-yellow-100 rounded space-y-4' : 'mb-8 space-y-4'
      }
    >
      {initialData && <h2 className="text-xl font-semibold">Edit Order #{initialData.id}</h2>}
      <div>
        <label className="block mb-1 font-medium">Customer Name</label>
        <input
          type="text"
          value={customerName}
          required
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Total Amount ($)</label>
          <input
            type="number"
            value={totalAmount}
            min={0}
            step="0.01"
            required
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Order'}
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
 * Displays a single order with its status and controls.
 */
const OrderRow: FC<{
  order: Order
  onEdit: (order: Order) => void
  onDelete: (id: number) => void
}> = ({ order, onEdit, onDelete }) => {
  const statusColors: Record<OrderStatus, string> = {
    Pending: 'bg-yellow-200 text-yellow-800',
    Shipped: 'bg-blue-200 text-blue-800',
    Completed: 'bg-green-200 text-green-800',
    Cancelled: 'bg-red-200 text-red-800',
  }

  return (
    <div className="grid grid-cols-3 gap-4 items-center p-4 bg-gray-100 rounded">
      <div>
        <div className="font-medium">{order.customer_name}</div>
        <div className="text-sm text-gray-500">
          Total: ${order.total_amount.toFixed(2)}
        </div>
      </div>
      <div className="text-center">
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${
            statusColors[order.status]
          }`}
        >
          {order.status}
        </span>
      </div>
      <div className="space-x-2 text-right">
        <button
          onClick={() => onEdit(order)}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(order.id)}
          className="text-sm px-3 py-1 border rounded text-red-600 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---
export default function OrdersPage() {
  const session = useSession()
  const user = session?.user

  const [orders, setOrders] = useState<Order[]>([])
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  // --- API HANDLERS ---
  const fetchOrders = async () => {
    // NOTE: You need to implement this API route
    setLoading(true)
    const res = await fetch('/api/orders')
    if (res.ok) setOrders(await res.json())
    else console.error('Failed to fetch orders', await res.text())
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchOrders()
  }, [user])

  const handleCreate = async (formData: Omit<Order, 'id' | 'created_at'>) => {
    // NOTE: You need to implement this API route
    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) alert(await res.text())
    else await fetchOrders()
    setLoading(false)
  }

  const handleUpdate = async (formData: Omit<Order, 'id' | 'created_at'>) => {
    // NOTE: You need to implement this API route
    if (!editingOrder) return
    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingOrder.id, ...formData }),
    })
    if (!res.ok) alert(await res.text())
    else {
      setEditingOrder(null)
      await fetchOrders()
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    // NOTE: You need to implement this API route
    if (!confirm(`Are you sure you want to delete order #${id}?`)) return
    const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
    if (!res.ok) alert(await res.text())
    else await fetchOrders()
  }

  if (!user) {
    return <p className="text-center">Please sign in to view orders.</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>

      <OrderForm
        onSubmit={editingOrder ? handleUpdate : handleCreate}
        onCancel={editingOrder ? () => setEditingOrder(null) : undefined}
        initialData={editingOrder}
        loading={loading}
      />

      <div className="mt-8 space-y-3">
        {loading && orders.length === 0 ? (
          <p>Loading orders...</p>
        ) : (
          orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onEdit={setEditingOrder}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}