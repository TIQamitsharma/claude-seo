'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FolderOpen, Search, Settings, LogOut, ChartBar as BarChart2, Globe, FileText, Shield, Zap, Image, Map, TrendingUp, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
]

const auditItems = [
  { href: '/audits/new?command=audit', label: 'Full Audit', icon: Search },
  { href: '/audits/new?command=page', label: 'Page Analysis', icon: BarChart2 },
  { href: '/audits/new?command=technical', label: 'Technical SEO', icon: Shield },
  { href: '/audits/new?command=content', label: 'Content Quality', icon: FileText },
  { href: '/audits/new?command=schema', label: 'Schema Markup', icon: Globe },
  { href: '/audits/new?command=geo', label: 'AI Search (GEO)', icon: Globe },
  { href: '/audits/new?command=images', label: 'Images', icon: Image },
  { href: '/audits/new?command=sitemap', label: 'Sitemap', icon: Map },
  { href: '/audits/new?command=hreflang', label: 'Hreflang', icon: Globe },
  { href: '/audits/new?command=plan', label: 'SEO Plan', icon: TrendingUp },
  { href: '/audits/new?command=programmatic', label: 'Programmatic', icon: Zap },
  { href: '/audits/new?command=competitor-pages', label: 'Competitor Pages', icon: BarChart2 },
]

interface DashboardNavProps {
  userEmail?: string
  userName?: string
}

export default function DashboardNav({ userEmail, userName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-100">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="font-semibold text-slate-900">Claude SEO</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                pathname === href
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Audits</p>
          {auditItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                pathname.includes(href.split('?')[0]) && pathname !== '/dashboard' && pathname !== '/projects'
                  ? 'bg-sky-50 text-sky-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/settings' ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <div className="px-3 pt-2">
          <p className="text-xs text-slate-400 truncate">{userName || userEmail}</p>
          {userName && <p className="text-xs text-slate-400 truncate">{userEmail}</p>}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200 lg:bg-white">
        <NavContent />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-semibold text-slate-900">Claude SEO</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col w-72 bg-white shadow-xl">
            <NavContent />
          </div>
        </div>
      )}
    </>
  )
}
