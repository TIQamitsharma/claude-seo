'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-slate-900 text-lg">Claude SEO</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How It Works</Link>
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Get started free
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 flex flex-col gap-4">
            <Link href="/#features" className="text-sm text-slate-600" onClick={() => setOpen(false)}>Features</Link>
            <Link href="/#how-it-works" className="text-sm text-slate-600" onClick={() => setOpen(false)}>How It Works</Link>
            <Link href="/pricing" className="text-sm text-slate-600" onClick={() => setOpen(false)}>Pricing</Link>
            <hr className="border-slate-200" />
            <Link href="/login" className="text-sm text-slate-600">Sign in</Link>
            <Link href="/register" className="text-sm bg-sky-500 text-white px-4 py-2 rounded-lg text-center font-medium">
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
