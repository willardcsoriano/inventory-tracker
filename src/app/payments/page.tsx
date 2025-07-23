'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface Order {
  id: number
  customer_name: string
  total_amount: number
  status: string
}

type PaymentStatusFilter = 'all' | 'paid' | 'unpaid'

// --- CHILD COMPONENTS ---

const FilterButton: FC<{
  label: string
  isActive: boolean
  onClick: () => void
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
)

// --- MAIN PAGE COMPONENT ---
export default function PaymentsPage() {
  const session = useSession()
  const user = session?.user

  const [orders, setOrders] = useState<Order[]>([])
  const [paidOrderIds, setPaidOrderIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<PaymentStatusFilter>('unpaid')

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true)
    const [ordersRes, paymentsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/payments'),
    ])

    if (ordersRes.ok) {
      setOrders(await ordersRes.json())
    }
    if (paymentsRes.ok) {
      const payments = await paymentsRes.json()
      setPaidOrderIds(new Set(payments.map((p: { order_id: number }) => p.order_id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  // --- EVENT HANDLERS ---
  const handleMarkAsPaid = async (order: Order) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        amount: order.total_amount,
      }),
    })
    if (res.ok) await fetchData()
    else alert('Failed to mark as paid.')
  }

  const handleMarkAsUnpaid = async (orderId: number) => {
    const res = await fetch(`/api/payments?order_id=${orderId}`, {
      method: 'DELETE',
    })
    if (res.ok) await fetchData()
    else alert('Failed to mark as unpaid.')
  }

  // --- RENDER LOGIC ---
  const filteredOrders = orders.filter((order) => {
    const isPaid = paidOrderIds.has(order.id)
    if (filter === 'paid') return isPaid
    if (filter === 'unpaid') return !isPaid
    return true
  })

  if (!user) {
    return <p className="text-center">Please sign in to manage payments.</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payment Tracking</h1>

      <div className="flex space-x-2 mb-6 border-b pb-4">
        <FilterButton
          label="Unpaid"
          isActive={filter === 'unpaid'}
          onClick={() => setFilter('unpaid')}
        />
        <FilterButton
          label="Paid"
          isActive={filter === 'paid'}
          onClick={() => setFilter('paid')}
        />
        <FilterButton
          label="All Orders"
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
        />
      </div>

      <div className="space-y-3">
        {loading && filteredOrders.length === 0 ? (
          <p>Loading payment records...</p>
        ) : (
          filteredOrders.map((order) => {
            const isPaid = paidOrderIds.has(order.id)
            return (
              <div
                key={order.id}
                className="grid grid-cols-3 gap-4 items-center p-4 bg-white rounded-lg shadow-sm"
              >
                <div>
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-sm text-gray-500">
                    Order #{order.id} — ${order.total_amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      isPaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="text-right">
                  {!isPaid ? (
                    <button
                      onClick={() => handleMarkAsPaid(order)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      Mark as Paid
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsUnpaid(order.id)}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                    >
                      Mark as Unpaid
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}