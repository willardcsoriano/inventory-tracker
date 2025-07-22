// src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Inventory Tracker',
  description: 'A simple Supabase + Next.js inventory app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
