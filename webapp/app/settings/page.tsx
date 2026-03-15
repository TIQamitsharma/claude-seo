'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, ExternalLink, Eye, EyeOff, CircleCheck as CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [dfsLogin, setDfsLogin] = useState('')
  const [dfsPassword, setDfsPassword] = useState('')
  const [showDfsPassword, setShowDfsPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setDfsLogin(profile.dataforseo_login || '')
        setDfsPassword(profile.dataforseo_password || '')
      }
      setInitialLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        dataforseo_login: dfsLogin,
        dataforseo_password: dfsPassword,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      setError(profileError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  if (initialLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded mb-8"></div>
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-12 bg-slate-100 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-12 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
      <p className="text-slate-500 mb-8">Manage your account and integrations.</p>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully
          </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-5">Profile</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
            </div>
          </div>
        </div>

        {/* DataForSEO */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-semibold text-slate-900">DataForSEO Integration</h2>
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">Optional</span>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Connect your DataForSEO account to unlock 22 additional commands including live SERP data, keyword research, backlinks, and AI visibility tracking.{' '}
            <a href="https://dataforseo.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
              Get API access
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">API login (email)</label>
              <input
                type="text"
                value={dfsLogin}
                onChange={e => setDfsLogin(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">API password</label>
              <div className="relative">
                <input
                  type={showDfsPassword ? 'text' : 'password'}
                  value={dfsPassword}
                  onChange={e => setDfsPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowDfsPassword(!showDfsPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showDfsPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-sky-700 mb-2">Available DataForSEO commands (Pro)</p>
            <div className="flex flex-wrap gap-1.5">
              {['serp', 'keywords', 'backlinks', 'competitors', 'traffic', 'onpage', 'tech', 'listings', 'ai-scrape', 'ai-mentions'].map(cmd => (
                <code key={cmd} className="text-xs bg-white border border-sky-200 text-sky-600 px-1.5 py-0.5 rounded">
                  /seo dataforseo {cmd}
                </code>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="font-semibold text-red-700 mb-2">Danger zone</h2>
          <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            onClick={() => alert('Please contact support to delete your account.')}
          >
            Delete account
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
