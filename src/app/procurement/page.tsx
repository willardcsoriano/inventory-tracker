'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface SupplyOrderItem {
  id: number
  item_name: string
  part_number: string | null
  quantity_ordered: number
  quantity_received: number
  cost_per_unit: number
}

interface SupplyOrder {
  id: number
  supplier_name: string
  order_number: string
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled'
  order_date: string
  expected_delivery_date: string | null
  tracking_number: string | null
  notes: string | null
  supply_order_items: SupplyOrderItem[]
}

// --- CHILD COMPONENTS ---

const SupplyOrderForm: FC<{
  onSubmit: (formData: any) => void
  onCancel: () => void
  initialData?: SupplyOrder | null
  loading?: boolean
}> = ({ onSubmit, onCancel, initialData, loading }) => {
  // Main Order State
  const [supplierName, setSupplierName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [status, setStatus] = useState<SupplyOrder['status']>('Draft')
  const [orderDate, setOrderDate] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  
  // Line Items State
  const [lineItems, setLineItems] = useState<Partial<Omit<SupplyOrderItem, 'id' | 'quantity_received'>>[]>([])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (initialData) {
      setSupplierName(initialData.supplier_name);
      setOrderNumber(initialData.order_number);
      setStatus(initialData.status);
      setOrderDate(new Date(initialData.order_date).toISOString().split('T')[0]);
      setExpectedDeliveryDate(initialData.expected_delivery_date ? new Date(initialData.expected_delivery_date).toISOString().split('T')[0] : '');
      setTrackingNumber(initialData.tracking_number || '');
      setNotes(initialData.notes || '');
      setLineItems(initialData.supply_order_items.map(item => ({
        item_name: item.item_name,
        part_number: item.part_number,
        quantity_ordered: item.quantity_ordered,
        cost_per_unit: item.cost_per_unit,
      })))
    } else {
      setSupplierName(''); setOrderNumber(''); setStatus('Draft');
      setOrderDate(today); setExpectedDeliveryDate('');
      setTrackingNumber(''); setNotes('');
      setLineItems([{ item_name: '', part_number: '', quantity_ordered: 1, cost_per_unit: 0 }])
    }
  }, [initialData])

  const handleItemChange = (index: number, field: keyof typeof lineItems[0], value: any) => {
    const updatedItems = [...lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setLineItems(updatedItems)
  }

  const addLineItem = () => setLineItems([...lineItems, { item_name: '', part_number: '', quantity_ordered: 1, cost_per_unit: 0 }])
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter(item => item.item_name && item.item_name.trim() !== '' && item.quantity_ordered && item.quantity_ordered > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid line item.');
      return;
    }
    onSubmit({
      supplier_name: supplierName, order_number: orderNumber, status,
      order_date: orderDate, expected_delivery_date: expectedDeliveryDate || null,
      tracking_number: trackingNumber || null, notes: notes || null,
      items: validItems
    });
  }

  const totalCost = lineItems.reduce((acc, item) => acc + (item.quantity_ordered || 0) * (item.cost_per_unit || 0), 0)

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">{initialData ? `Editing Order #${initialData.order_number}` : 'Create New Supply Order'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block mb-1 font-medium text-sm">Supplier Name</label><input type="text" value={supplierName} required onChange={e => setSupplierName(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block mb-1 font-medium text-sm">Order # (PO / Invoice)</label><input type="text" value={orderNumber} required onChange={e => setOrderNumber(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block mb-1 font-medium text-sm">Order Date</label><input type="date" value={orderDate} required onChange={e => setOrderDate(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" /></div>
          <div><label className="block mb-1 font-medium text-sm">Expected Delivery</label><input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" /></div>
          <div><label className="block mb-1 font-medium text-sm">Status</label><select value={status} onChange={e => setStatus(e.target.value as SupplyOrder['status'])} className="w-full border rounded px-3 py-2 bg-white"><option>Draft</option><option>Ordered</option><option>Partially Received</option><option>Received</option><option>Cancelled</option></select></div>
          <div><label className="block mb-1 font-medium text-sm">Tracking Number</label><input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
        </div>
        <div><label className="block mb-1 font-medium text-sm">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border rounded px-3 py-2"></textarea></div>

        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-semibold">Line Items</h3>
          <div className="grid grid-cols-12 gap-3 px-1 text-xs font-bold text-gray-500 uppercase"><div className="col-span-4">Item Name</div><div className="col-span-3">Part #</div><div className="col-span-2 text-center">Quantity</div><div className="col-span-2 text-center">Cost/Unit</div><div className="col-span-1"></div></div>
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4"><input type="text" placeholder="Item Name" value={item.item_name || ''} onChange={e => handleItemChange(index, 'item_name', e.target.value)} className="w-full border rounded px-3 py-2" /></div>
              <div className="col-span-3"><input type="text" placeholder="Part #" value={item.part_number || ''} onChange={e => handleItemChange(index, 'part_number', e.target.value)} className="w-full border rounded px-3 py-2" /></div>
              <div className="col-span-2"><input type="number" placeholder="Qty" value={item.quantity_ordered || ''} onChange={e => handleItemChange(index, 'quantity_ordered', Number(e.target.value))} min={1} className="w-full border rounded px-3 py-2 text-center" /></div>
              <div className="col-span-2"><input type="number" placeholder="Cost" value={item.cost_per_unit || ''} onChange={e => handleItemChange(index, 'cost_per_unit', Number(e.target.value))} min={0} step="0.01" className="w-full border rounded px-3 py-2 text-center" /></div>
              <div className="col-span-1 text-right"><button type="button" onClick={() => removeLineItem(index)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button></div>
            </div>
          ))}
          <button type="button" onClick={addLineItem} className="text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300">+ Add Line</button>
        </div>

        <div className="flex justify-between items-center pt-4 border-t"><div className="text-lg font-bold">Total Est. Cost: ₱{totalCost.toFixed(2)}</div><div className="flex space-x-2"><button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Order'}</button><button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Cancel</button></div></div>
      </form>
    </div>
  )
}

const SupplyOrderCard: FC<{ order: SupplyOrder; onView: (order: SupplyOrder) => void }> = ({ order, onView }) => {
  const totalCost = order.supply_order_items.reduce((acc, item) => acc + item.quantity_ordered * item.cost_per_unit, 0);
  const statusColors = { Draft: 'bg-gray-200 text-gray-800', Ordered: 'bg-blue-200 text-blue-800', 'Partially Received': 'bg-yellow-200 text-yellow-800', Received: 'bg-green-200 text-green-800', Cancelled: 'bg-red-200 text-red-800' }
  return <div className="p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md" onClick={() => onView(order)}><div className="flex justify-between items-start"><div><div className="font-bold text-lg">{order.supplier_name}</div><div className="text-sm text-gray-600">Order #{order.order_number}</div><div className="text-xs text-gray-400">Date: {new Date(order.order_date).toLocaleDateString()}</div></div><div className="text-right"><div className="font-bold text-xl">₱{totalCost.toFixed(2)}</div><span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span></div></div></div>
}


// --- MAIN PAGE COMPONENT ---
export default function ProcurementPage() {
  const session = useSession()
  const user = session?.user

  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SupplyOrder | null>(null)
  const [viewingOrder, setViewingOrder] = useState<SupplyOrder | null>(null)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number | string>>({})

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/procurement')
    if (res.ok) setSupplyOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (user) fetchData() }, [user])

  const handleSubmitForm = async (formData: any) => { alert("Backend for creating Supply Orders needs to be implemented with the new structure."); }
  const handleLogReception = async () => { alert("Backend for receiving items needs to be implemented."); }
  const handleReceiveQtyChange = (itemId: number, qty: string) => { setReceivedQuantities(prev => ({...prev, [itemId]: qty})) }

  const handleStartCreate = () => { setEditingOrder(null); setIsFormVisible(true); }
  const handleCancelForm = () => { setIsFormVisible(false); setEditingOrder(null); }
  const handleViewDetails = (order: SupplyOrder) => { setViewingOrder(order); setReceivedQuantities({}); }
  const handleCloseDetails = () => setViewingOrder(null)
  
  if (!user) return null

  if (viewingOrder) {
    return (
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <button onClick={handleCloseDetails} className="mb-4 text-blue-600 hover:underline">&larr; Back to All Supply Orders</button>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-4 pb-4 border-b">
            <h1 className="text-2xl font-bold">Receive Items for Order #{viewingOrder.order_number}</h1>
            <p className="text-gray-600">From: {viewingOrder.supplier_name}</p>
          </div>
          <h2 className="font-semibold mb-2">Log Received Items</h2>
          <table className="w-full text-left">
            <thead><tr className="border-b"><th className="p-2">Item</th><th className="p-2">Part #</th><th className="p-2 text-center">Ordered</th><th className="p-2 text-center">Received</th><th className="p-2">Receive Now</th></tr></thead>
            <tbody>
              {viewingOrder.supply_order_items.map(item => {
                const remaining = item.quantity_ordered - item.quantity_received;
                return (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.item_name}</td>
                    <td className="p-2 text-gray-500">{item.part_number}</td>
                    <td className="p-2 text-center">{item.quantity_ordered}</td>
                    <td className="p-2 text-center font-medium">{item.quantity_received}</td>
                    <td className="p-2">{remaining > 0 ? (<input type="number" value={receivedQuantities[item.id] || ''} onChange={e => handleReceiveQtyChange(item.id, e.target.value)} min={0} max={remaining} placeholder={`Max: ${remaining}`} className="w-24 border rounded px-2 py-1 text-center"/>) : (<span className="text-green-600 font-semibold">Received</span>)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
           <div className="mt-6 text-right"><button onClick={handleLogReception} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Log Received Items</button></div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Procurement</h1>
        <button onClick={handleStartCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Create Supply Order</button>
      </div>
      {isFormVisible && (<div className="mb-8"><SupplyOrderForm onSubmit={handleSubmitForm} onCancel={handleCancelForm} initialData={editingOrder} loading={loading} /></div>)}
      <div className="space-y-4">
        {loading && supplyOrders.length === 0 && <p>Loading supply orders...</p>}
        {!loading && supplyOrders.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg"><h3 className="text-xl font-semibold">No supply orders found</h3><p className="text-gray-500 mt-2">Click "+ Create Supply Order" to get started.</p></div>)}
        {supplyOrders.map((order) => (<SupplyOrderCard key={order.id} order={order} onView={handleViewDetails} />))}
      </div>
    </main>
  )
}