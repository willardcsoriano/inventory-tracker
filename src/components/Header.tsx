import Link from 'next/link'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function Header() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight hover:text-blue-400 transition-colors"
        >
          📦 InventoryApp
        </Link>

        {/* Conditionally render navigation links only if logged in */}
        {user && (
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/inventory" className="text-gray-300 hover:text-white transition-colors">
              Inventory
            </Link>
            <Link href="/orders" className="text-gray-300 hover:text-white transition-colors">
              Orders
            </Link>
            <Link href="/procurement" className="text-gray-300 hover:text-white transition-colors">
              Procurement
            </Link>
            <Link href="/collections" className="text-gray-300 hover:text-white transition-colors">
              Collections
            </Link>
          </div>
        )}

        {/* Conditionally render auth buttons */}
        <div>
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Sign Out
              </button>
            </form>
          ) : (
            // Render nothing when logged out, as the homepage handles auth
            null
          )}
        </div>
      </nav>
    </header>
  )
}