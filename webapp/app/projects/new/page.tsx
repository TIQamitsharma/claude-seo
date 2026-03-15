'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

const industries = [
  { value: 'saas', label: 'SaaS / Software', desc: 'Cloud software, apps, tools' },
  { value: 'ecommerce', label: 'E-commerce', desc: 'Online stores, marketplaces' },
  { value: 'local', label: 'Local Business', desc: 'Service businesses, restaurants' },
  { value: 'publisher', label: 'Publisher / Media', desc: 'Blogs, news, content sites' },
  { value: 'agency', label: 'Agency', desc: 'Marketing, design, consulting' },
  { value: 'generic', label: 'Other', desc: 'General website' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [industry, setIndustry] = useState('generic')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    try { new URL(normalizedUrl) } catch {
      setError('Please enter a valid URL')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({ name: name.trim(), url: normalizedUrl, industry, description: description.trim(), user_id: user!.id })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">New project</h1>
      <p className="text-slate-500 mb-8">Add a website to start tracking and analyzing its SEO.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Project name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="My Website"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Website URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Industry type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {industries.map(ind => (
                <button
                  key={ind.value}
                  type="button"
                  onClick={() => setIndustry(ind.value)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    industry === ind.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-medium ${industry === ind.value ? 'text-sky-700' : 'text-slate-900'}`}>{ind.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ind.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this website..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
            <Link href="/projects" className="px-6 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
