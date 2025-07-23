'use client'

import { useEffect, useState, FC } from 'react'
import Link from 'next/link'

interface Stats {
  inventoryCount: number
  ordersCount: number
  procurementCount: number // Changed from suppliesCount
  paymentsCount: number
}

// Reusable card component for displaying stats
const StatCard: FC<{ href: string; title: string; value: number }> = ({
  href,
  title,
  value,
}) => (
  <Link
    href={href}
    className="p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg"
  >
    <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
    <p className="mt-2 text-4xl font-bold text-gray-900">{value}</p>
  </Link>
)

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats')
        return res.json()
      })
      .then((data) => {
        setStats(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-center text-gray-500">Loading stats… 📊</p>
  }

  if (!stats) {
    return <p className="text-center text-red-500">Could not load dashboard stats.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard href="/inventory" title="Inventory" value={stats.inventoryCount} />
      <StatCard href="/orders" title="Orders" value={stats.ordersCount} />
      {/* Updated link, title, and value */}
      <StatCard href="/procurement" title="Procurement" value={stats.procurementCount} />
      <StatCard href="/payments" title="Payments" value={stats.paymentsCount} />
    </div>
  )
}