// src/components/AuthForm.tsx
'use client'

import { useState } from 'react'
import { useSession } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthForm() {
  // This client helper reads/writes the Supabase Auth cookie
  const supabase = createClientComponentClient()
  const session  = useSession()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const signUp = async () => {
    setLoading(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setErrorMsg(error.message)
    setLoading(false)
  }

  const signIn = async () => {
    setLoading(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMsg(error.message)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // If already signed in, show a Sign Out button
  if (session) {
    return (
      <div className="p-4 bg-green-100 rounded max-w-sm mx-auto my-8">
        <p className="mb-2">
          Signed in as <strong>{session.user.email}</strong>
        </p>
        <button
          onClick={signOut}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Otherwise show the sign-in / sign-up form
  return (
    <div className="p-4 bg-gray-100 rounded max-w-sm mx-auto my-8 space-y-4">
      <h2 className="text-xl font-semibold">Sign In / Sign Up</h2>

      <div>
        <label className="block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div className="flex space-x-2">
        <button
          onClick={signIn}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Sign In
        </button>
        <button
          onClick={signUp}
          disabled={loading}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}
