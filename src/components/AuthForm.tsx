// src/components/AuthForm.tsx
'use client'

import { useState } from 'react'
// Import the server actions directly
import { signIn, signUp } from '@/app/auth/actions'

export default function AuthForm() {
  // We no longer need useSupabaseClient or useSession here,
  // as authentication logic and session state are handled by server actions
  // and the parent (app/page.tsx) server component.

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // This function wraps the server action to handle client-side state like loading and errors
  const handleSignIn = async (formData: FormData) => {
    setLoading(true)
    setErrorMsg(null) // Clear previous errors

    // Call the server action. The server action will handle the redirect on success.
    // If the server action returns an error (which it should if login fails), we catch it here.
    const result = await signIn(formData);
    // Note: server actions don't throw errors directly, they return them in a structure
    // if you explicitly set them up to do so, or you can check for redirects.
    // For now, let's assume `signIn` can return an object with an `error` property.
    // If you don't return an explicit error object from your server action,
    // you'd rely on Supabase's `error` handling within the action itself
    // and potentially redirect to an error page or not redirect at all if failed.

    if (result && result.error) { // Assuming your signIn server action returns { error: ... } on failure
        setErrorMsg(result.error.message);
    }
    setLoading(false);
    // No client-side redirect needed here, as the server action handles it.
  }

  // This function wraps the server action for sign-up
  const handleSignUp = async (formData: FormData) => {
    setLoading(true)
    setErrorMsg(null)

    const result = await signUp(formData); // Await the server action

    if (result && result.error) { // Assuming your signUp server action returns { error: ... } on failure
        setErrorMsg(result.error.message);
    } else {
        // For successful sign-up, you might want a specific message
        // if email confirmation is required, otherwise the server action
        // will redirect to '/' where the user might see the Dashboard.
        setErrorMsg("Sign up successful! Please check your email for confirmation if required.");
    }
    setLoading(false);
    // No client-side redirect needed here.
  }

  // The AuthForm will ONLY render the login/signup form now.
  // The decision to show AuthForm vs Dashboard is made in app/page.tsx (Server Component)
  return (
    <div className="p-4 bg-gray-100 rounded max-w-sm mx-auto my-8 space-y-4">
      <h2 className="text-xl font-semibold text-center mb-4">Sign In / Sign Up</h2>

      {errorMsg && (
        <p className="text-red-600 text-sm text-center bg-red-100 border border-red-400 p-2 rounded">
          {errorMsg}
        </p>
      )}

      {/* Sign In Form */}
      <form action={handleSignIn} className="space-y-3">
        <div>
          <label htmlFor="signInEmail" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            id="signInEmail" // Unique ID
            name="email" // Important for FormData
            type="email"
            required
            className="w-full border rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="signInPassword" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            id="signInPassword" // Unique ID
            name="password" // Important for FormData
            type="password"
            required
            className="w-full border rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Separator */}
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-400"></div>
      </div>

      {/* Sign Up Form */}
      <form action={handleSignUp} className="space-y-3">
        <div>
          <label htmlFor="signUpEmail" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            id="signUpEmail" // Unique ID
            name="email" // Important for FormData
            type="email"
            required
            className="w-full border rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="signUpPassword" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            id="signUpPassword" // Unique ID
            name="password" // Important for FormData
            type="password"
            required
            className="w-full border rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}