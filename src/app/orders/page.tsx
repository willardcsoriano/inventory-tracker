'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, FormEvent, FC } from 'react'

// --- TYPE DEFINITIONS ---
interface OrderItem {
  id: number
  item_name: string
  part_number: string | null
  quantity: number
  price_per_unit: number
}

interface PurchaseOrder {
  id: number
  po_number: string
  customer_name: string
  status: 'Pending' | 'Processing' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled'
  order_date: string
  po_document_url: string | null
  order_items: OrderItem[]
}

// --- CHILD COMPONENTS ---

const PurchaseOrderForm: FC<{
  onSubmit: (formData: any) => void
  onCancel: () => void
  initialData?: PurchaseOrder | null
  loading?: boolean
}> = ({ onSubmit, onCancel, initialData, loading }) => {
  const [customerName, setCustomerName] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [status, setStatus] = useState<PurchaseOrder['status']>('Pending')
  const [orderDate, setOrderDate] = useState('')
  const [poFile, setPoFile] = useState<File | null>(null)
  const [lineItems, setLineItems] = useState<Omit<OrderItem, 'id'>[]>([])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (initialData) {
      setCustomerName(initialData.customer_name)
      setPoNumber(initialData.po_number)
      setStatus(initialData.status)
      setOrderDate(new Date(initialData.order_date).toISOString().split('T')[0])
      setLineItems(initialData.order_items.map(item => ({
        item_name: item.item_name,
        part_number: item.part_number || '',
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
      })))
    } else {
      setCustomerName('')
      setPoNumber('')
      setStatus('Pending')
      setOrderDate(today)
      setLineItems([{ item_name: '', part_number: '', quantity: 1, price_per_unit: 0 }])
    }
  }, [initialData])

  const handleItemChange = (index: number, field: keyof Omit<OrderItem, 'id'>, value: any) => {
    const updatedItems = [...lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setLineItems(updatedItems)
  }

  const addLineItem = () => setLineItems([...lineItems, { item_name: '', part_number: '', quantity: 1, price_per_unit: 0 }])
  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validItems = lineItems.filter(item => item.item_name.trim() !== '' && item.quantity > 0)
    if (validItems.length === 0) {
      alert('Please add at least one valid line item.')
      return
    }
    onSubmit({ 
      customer_name: customerName, 
      po_number: poNumber, 
      status, 
      order_date: orderDate,
      po_file: poFile,
      items: validItems 
    })
  }

  const totalCost = lineItems.reduce((acc, item) => acc + item.quantity * item.price_per_unit, 0)

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">{initialData ? `Editing PO #${initialData.po_number}` : 'Log New Customer PO'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block mb-1 font-medium text-sm">Customer Name</label><input type="text" value={customerName} required onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block mb-1 font-medium text-sm">Customer PO Number</label><input type="text" value={poNumber} required onChange={(e) => setPoNumber(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block mb-1 font-medium text-sm">Order Date</label><input type="date" value={orderDate} required onChange={(e) => setOrderDate(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" /></div>
          <div><label className="block mb-1 font-medium text-sm">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as PurchaseOrder['status'])} className="w-full border rounded px-3 py-2 bg-white"><option>Pending</option><option>Processing</option><option>Partially Fulfilled</option><option>Fulfilled</option><option>Cancelled</option></select></div>
        </div>
        <div>
            <label className="block mb-1 font-medium text-sm">PO Document (PDF, Image)</label>
            <input type="file" onChange={(e) => setPoFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            {initialData?.po_document_url && <a href={initialData.po_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Current Document</a>}
        </div>
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-semibold">Line Items</h3>
          <div className="grid grid-cols-12 gap-3 px-1 text-xs font-bold text-gray-500 uppercase"><div className="col-span-4">Item Name</div><div className="col-span-3">Part #</div><div className="col-span-2 text-center">Quantity</div><div className="col-span-2 text-center">Price/Unit</div><div className="col-span-1"></div></div>
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4"><input type="text" placeholder="Item Name" value={item.item_name} onChange={(e) => handleItemChange(index, 'item_name', e.target.value)} className="w-full border rounded px-3 py-2" /></div>
              <div className="col-span-3"><input type="text" placeholder="Part #" value={item.part_number || ''} onChange={(e) => handleItemChange(index, 'part_number', e.target.value)} className="w-full border rounded px-3 py-2" /></div>
              <div className="col-span-2"><input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} min={1} className="w-full border rounded px-3 py-2 text-center" /></div>
              <div className="col-span-2"><input type="number" placeholder="Price" value={item.price_per_unit} onChange={(e) => handleItemChange(index, 'price_per_unit', Number(e.target.value))} min={0} step="0.01" className="w-full border rounded px-3 py-2 text-center" /></div>
              <div className="col-span-1 text-right"><button type="button" onClick={() => removeLineItem(index)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button></div>
            </div>
          ))}
          <button type="button" onClick={addLineItem} className="text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300">+ Add Line</button>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-lg font-bold">Total: ₱{totalCost.toFixed(2)}</div>
          <div className="flex space-x-2"><button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Log PO'}</button><button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Cancel</button></div>
        </div>
      </form>
    </div>
  )
}

const PurchaseOrderCard: FC<{ order: PurchaseOrder; onView: (order: PurchaseOrder) => void }> = ({ order, onView }) => {
  const totalCost = order.order_items.reduce((acc, item) => acc + item.quantity * item.price_per_unit, 0);
  const statusColors = { Pending: 'bg-gray-200 text-gray-800', Processing: 'bg-yellow-200 text-yellow-800', 'Partially Fulfilled': 'bg-blue-200 text-blue-800', Fulfilled: 'bg-green-200 text-green-800', Cancelled: 'bg-red-200 text-red-800' }
  return <div className="p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md" onClick={() => onView(order)}><div className="flex justify-between items-start"><div><div className="font-bold text-lg">PO #{order.po_number}</div><div className="text-sm text-gray-600">{order.customer_name}</div><div className="text-xs text-gray-400">Date: {new Date(order.order_date).toLocaleDateString()}</div></div><div className="text-right"><div className="font-bold text-xl">₱{totalCost.toFixed(2)}</div><span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span></div></div></div>
}

// --- MAIN PAGE COMPONENT ---
export default function OrdersPage() {
  const session = useSession()
  const user = session?.user
  const supabase = useSupabaseClient()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  const [newStatus, setNewStatus] = useState<PurchaseOrder['status'] | ''>('');

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (user) fetchData() }, [user])

  const handleSubmitForm = async (formData: any) => {
    if (!user) return;
    setLoading(true);
    let documentUrl = editingOrder?.po_document_url || null;
    if (formData.po_file) {
      const file = formData.po_file as File;
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('po-documents').upload(filePath, file);
      if (uploadError) {
        alert('Error uploading file: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data } = supabase.storage.from('po-documents').getPublicUrl(filePath);
      documentUrl = data.publicUrl;
    }
    const finalPayload = { ...formData, po_document_url: documentUrl, }
    delete finalPayload.po_file;
    const endpoint = '/api/orders'
    const method = editingOrder ? 'PATCH' : 'POST'
    const body = editingOrder ? { id: editingOrder.id, ...finalPayload } : finalPayload
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) alert('Failed to save Purchase Order.')
    else {
      setIsFormVisible(false)
      setEditingOrder(null)
      await fetchData()
    }
    setLoading(false)
  }

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to permanently delete this order?')) return;
    setLoading(true);
    const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
    if (res.ok) {
        alert('Order deleted successfully.');
        setViewingOrder(null);
        await fetchData();
    } else {
        alert('Failed to delete order.');
    }
    setLoading(false);
  }

  const handleUpdateStatus = async () => {
    if (!viewingOrder || !newStatus) {
        alert("Please select a new status.");
        return;
    }
    setLoading(true);
    const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: viewingOrder.id, status: newStatus })
    });
    if (res.ok) {
        alert('Status updated successfully!');
        const updatedOrderData = await res.json();
        const updatedOrder = updatedOrderData[0]; 
        setViewingOrder(prev => prev ? {...prev, status: updatedOrder.status} : null);
        await fetchData();
    } else {
        alert('Failed to update status.');
    }
    setLoading(false);
  }

  const handleStartCreate = () => { setEditingOrder(null); setIsFormVisible(true); }
  const handleCancelForm = () => { setIsFormVisible(false); setEditingOrder(null); }
  const handleViewDetails = (order: PurchaseOrder) => { 
    setViewingOrder(order); 
    setNewStatus(order.status);
  }
  const handleCloseDetails = () => setViewingOrder(null)
  
  if (!user) return null

  if (viewingOrder) {
    // --- SIMPLIFIED: Detailed View ---
    return (
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <button onClick={handleCloseDetails} className="mb-4 text-blue-600 hover:underline">&larr; Back to All Orders</button>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-4 pb-4 border-b">
            <h1 className="text-2xl font-bold">PO #{viewingOrder.po_number}</h1>
            <p className="text-gray-600">For: {viewingOrder.customer_name}</p>
            {viewingOrder.po_document_url && (<a href={viewingOrder.po_document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-semibold">View Attached PO Document</a>)}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md border mb-6">
              <h3 className="font-semibold mb-3">Manage Order</h3>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-grow">
                      <label htmlFor="status-select" className="block text-sm font-medium mb-1">Change Status</label>
                      <select id="status-select" value={newStatus} onChange={e => setNewStatus(e.target.value as PurchaseOrder['status'])} className="w-full border rounded px-3 py-2 bg-white">
                          <option>Pending</option><option>Processing</option><option>Partially Fulfilled</option><option>Fulfilled</option><option>Cancelled</option>
                      </select>
                  </div>
                  <button onClick={handleUpdateStatus} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-10">Save Status</button>
                  <div className="border-l h-10 mx-2"></div>
                  <button onClick={() => handleDeleteOrder(viewingOrder.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 h-10">Delete Order</button>
              </div>
          </div>

          <h2 className="font-semibold mb-2">Order Items</h2>
          <table className="w-full text-left">
            <thead><tr className="border-b"><th className="p-2">Item</th><th className="p-2 text-center">Quantity</th><th className="p-2 text-right">Price/Unit</th><th className="p-2 text-right">Subtotal</th></tr></thead>
            <tbody>
              {viewingOrder.order_items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.item_name} {item.part_number && <span className="text-gray-500 text-xs">({item.part_number})</span>}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">₱{item.price_per_unit.toFixed(2)}</td>
                  <td className="p-2 text-right">₱{(item.quantity * item.price_per_unit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
             <tfoot>
              <tr className="font-bold">
                <td colSpan={3} className="p-2 text-right">Total</td>
                <td className="p-2 text-right">
                  ₱{viewingOrder.order_items.reduce((acc, item) => acc + item.quantity * item.price_per_unit, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Customer Purchase Orders</h1><button onClick={handleStartCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Log New PO</button></div>
      {isFormVisible && (<div className="mb-8"><PurchaseOrderForm onSubmit={handleSubmitForm} onCancel={handleCancelForm} initialData={editingOrder} loading={loading} /></div>)}
      <div className="space-y-4">
        {loading && orders.length === 0 && <p>Loading orders...</p>}
        {!loading && orders.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg"><h3 className="text-xl font-semibold">No purchase orders logged</h3><p className="text-gray-500 mt-2">Click "+ Log New PO" to get started.</p></div>)}
        {orders.map((order) => (<PurchaseOrderCard key={order.id} order={order} onView={handleViewDetails} />))}
      </div>
    </main>
  )
}