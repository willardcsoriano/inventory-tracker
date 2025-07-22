// src/components/Dashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  inventoryCount: number
  ordersCount:    number
  suppliesCount:  number
  paymentsCount:  number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
  }, [])

  if (!stats) return <p>Loading stats…</p>

  return (
    <div className="grid grid-cols-2 gap-6">
      <Link
        href="/inventory"
        className="p-6 bg-white rounded shadow hover:shadow-md"
      >
        <h2 className="text-xl font-semibold">Inventory</h2>
        <p className="text-3xl">{stats.inventoryCount}</p>
      </Link>

      <Link
        href="/orders"
        className="p-6 bg-white rounded shadow hover:shadow-md"
      >
        <h2 className="text-xl font-semibold">Orders</h2>
        <p className="text-3xl">{stats.ordersCount}</p>
      </Link>

      <Link
        href="/supplies"
        className="p-6 bg-white rounded shadow hover:shadow-md"
      >
        <h2 className="text-xl font-semibold">Supplies</h2>
        <p className="text-3xl">{stats.suppliesCount}</p>
      </Link>

      <Link
        href="/payments"
        className="p-6 bg-white rounded shadow hover:shadow-md"
      >
        <h2 className="text-xl font-semibold">Payments</h2>
        <p className="text-3xl">{stats.paymentsCount}</p>
      </Link>
    </div>
  )
}
