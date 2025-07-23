'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface Collection {
  id: number
  order_id: number
  amount: number
  date_collected: string
  payment_method: string | null
  reference_number: string | null
}

interface PurchaseOrder {
  id: number
  po_number: string
  customer_name: string
  order_date: string
  // This is a calculated field, not from the DB directly
  total_amount: number
  order_items: {
    quantity: number
    price_per_unit: number
  }[]
}

type CollectionStatusFilter = 'uncollected' | 'partial' | 'collected' | 'all'

// --- CHILD COMPONENTS ---

const FilterButton: FC<{
  label: string
  isActive: boolean
  onClick: () => void
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
)

const OrderCollectionCard: FC<{
  order: PurchaseOrder
  collections: Collection[]
  onView: (order: PurchaseOrder) => void
}> = ({ order, collections, onView }) => {
  const totalCollected = collections.reduce((acc, p) => acc + p.amount, 0)
  const balance = order.total_amount - totalCollected
  
  let status: 'Uncollected' | 'Partially Collected' | 'Fully Collected' = 'Uncollected';
  let statusColor = 'bg-red-200 text-red-800';

  if (totalCollected > 0 && balance > 0) {
    status = 'Partially Collected';
    statusColor = 'bg-yellow-200 text-yellow-800';
  } else if (balance <= 0) {
    status = 'Fully Collected';
    statusColor = 'bg-green-200 text-green-800';
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md" onClick={() => onView(order)}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg">{order.customer_name}</div>
          <div className="text-sm text-gray-600">PO #{order.po_number}</div>
          <div className="text-xs text-gray-400">Date: {new Date(order.order_date).toLocaleDateString()}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-xl">₱{order.total_amount.toFixed(2)}</div>
          <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <span>Collected: ₱{totalCollected.toFixed(2)}</span>
        <span className="mx-2">|</span>
        <span className="font-medium">Balance: ₱{balance.toFixed(2)}</span>
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---
export default function CollectionsPage() {
  const session = useSession()
  const user = session?.user

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CollectionStatusFilter>('uncollected')
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  
  // State for the new collection form
  const [collectionAmount, setCollectionAmount] = useState<number | ''>('')
  const [collectionDate, setCollectionDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const [ordersRes, collectionsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/collections'), // This API needs to be created
    ])

    if (ordersRes.ok) {
        const fetchedOrders = await ordersRes.json();
        // Calculate total_amount for each order on the frontend
        const ordersWithTotals = fetchedOrders.map((o: PurchaseOrder) => ({
            ...o,
            total_amount: o.order_items.reduce((acc, item) => acc + item.quantity * item.price_per_unit, 0)
        }));
        setOrders(ordersWithTotals);
    }
    if (collectionsRes.ok) setCollections(await collectionsRes.json())
    
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleLogCollection = async (e: FormEvent) => {
    e.preventDefault();
    if (!viewingOrder || !collectionAmount) return;

    const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            order_id: viewingOrder.id,
            amount: collectionAmount,
            date_collected: collectionDate,
            payment_method: paymentMethod,
            reference_number: referenceNumber
        })
    });

    if (res.ok) {
        alert("Collection logged successfully!");
        // Reset form and refresh data
        setCollectionAmount(''); setCollectionDate(''); setPaymentMethod(''); setReferenceNumber('');
        await fetchData();
    } else {
        alert("Failed to log collection.");
    }
  }

  const handleViewDetails = (order: PurchaseOrder) => {
    setViewingOrder(order)
    setCollectionDate(new Date().toISOString().split('T')[0]); // Pre-fill date
  }
  const handleCloseDetails = () => setViewingOrder(null)

  const filteredOrders = orders.filter(order => {
    const totalCollected = collections.filter(p => p.order_id === order.id).reduce((acc, p) => acc + p.amount, 0);
    const balance = order.total_amount - totalCollected;

    if (filter === 'uncollected') return totalCollected === 0;
    if (filter === 'partial') return totalCollected > 0 && balance > 0;
    if (filter === 'collected') return balance <= 0;
    return true; // 'all'
  })

  if (!user) return null

  if (viewingOrder) {
    const orderCollections = collections.filter(p => p.order_id === viewingOrder.id);
    const totalCollected = orderCollections.reduce((acc, p) => acc + p.amount, 0);
    const balance = viewingOrder.total_amount - totalCollected;

    return (
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <button onClick={handleCloseDetails} className="mb-4 text-blue-600 hover:underline">&larr; Back to All Orders</button>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-4 pb-4 border-b">
            <h1 className="text-2xl font-bold">Log Collection for PO #{viewingOrder.po_number}</h1>
            <p className="text-gray-600">Customer: {viewingOrder.customer_name}</p>
            <div className="mt-2 text-lg">
                Total Amount: <span className="font-bold">₱{viewingOrder.total_amount.toFixed(2)}</span> | 
                Balance Due: <span className="font-bold text-red-600">₱{balance.toFixed(2)}</span>
            </div>
          </div>
          
          {/* New Collection Form */}
          <form onSubmit={handleLogCollection} className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h2 className="font-semibold">Add New Collection Record</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Amount Collected</label><input type="number" value={collectionAmount} onChange={e => setCollectionAmount(Number(e.target.value))} required min="0.01" step="0.01" className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Date Collected</label><input type="date" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required className="w-full border rounded px-3 py-2 bg-white" /></div>
                <div><label className="block text-sm font-medium mb-1">Payment Method</label><input type="text" placeholder="e.g., Bank Transfer, Cash" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Reference #</label><input type="text" placeholder="e.g., Check #, Transaction ID" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
            </div>
            <div className="text-right"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Log Collection</button></div>
          </form>

          {/* Collection History */}
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Collection History</h2>
            {orderCollections.length > 0 ? (
                <ul className="space-y-2">
                    {orderCollections.map(p => (
                        <li key={p.id} className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>Collected <strong>₱{p.amount.toFixed(2)}</strong> on {new Date(p.date_collected).toLocaleDateString()}</span>
                            <span className="text-sm text-gray-500">{p.payment_method} {p.reference_number && `- #${p.reference_number}`}</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500">No collections have been logged for this order yet.</p>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Collections</h1>
      </div>
      <div className="flex space-x-2 mb-6 border-b pb-4">
        <FilterButton label="Uncollected" isActive={filter === 'uncollected'} onClick={() => setFilter('uncollected')} />
        <FilterButton label="Partially Collected" isActive={filter === 'partial'} onClick={() => setFilter('partial')} />
        <FilterButton label="Fully Collected" isActive={filter === 'collected'} onClick={() => setFilter('collected')} />
        <FilterButton label="All Orders" isActive={filter === 'all'} onClick={() => setFilter('all')} />
      </div>
      <div className="space-y-4">
        {loading && <p>Loading orders...</p>}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold">No orders match this filter</h3>
            <p className="text-gray-500 mt-2">Try selecting a different filter or logging a new PO.</p>
          </div>
        )}
        {filteredOrders.map(order => (
          <OrderCollectionCard 
            key={order.id} 
            order={order} 
            collections={collections.filter(p => p.order_id === order.id)}
            onView={handleViewDetails}
          />
        ))}
      </div>
    </main>
  )
}