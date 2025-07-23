import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight hover:text-blue-400 transition-colors"
        >
          📦 InventoryApp
        </Link>
        <div className="space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/inventory" className="text-gray-300 hover:text-white transition-colors">
            Inventory
          </Link>
          {/* Add this new link */}
          <Link href="/orders" className="text-gray-300 hover:text-white transition-colors">
            Orders
          </Link>
        </div>
      </nav>
    </header>
  )
}