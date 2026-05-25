'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/types'

const industries = [
  { value: 'saas', label: 'SaaS / Software', desc: 'Cloud software, apps, tools' },
  { value: 'ecommerce', label: 'E-commerce', desc: 'Online stores, marketplaces' },
  { value: 'local', label: 'Local Business', desc: 'Service businesses, restaurants' },
  { value: 'publisher', label: 'Publisher / Media', desc: 'Blogs, news, content sites' },
  { value: 'agency', label: 'Agency', desc: 'Marketing, design, consulting' },
  { value: 'generic', label: 'Other', desc: 'General website' },
]

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [url, setUrl] = useState(project.url)
  const [industry, setIndustry] = useState(project.industry)
  const [description, setDescription] = useState(project.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl
    try { new URL(normalizedUrl) } catch {
      setError('Please enter a valid URL')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        url: normalizedUrl,
        industry,
        description: description.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${project.id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this project? All audits and findings will be permanently removed.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', project.id)
    router.push('/projects')
    router.refresh()
  }

  return (
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
                onClick={() => setIndustry(ind.value as Project['industry'])}
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
            {loading ? 'Saving...' : 'Save changes'}
          </button>
          <Link href={`/projects/${project.id}`} className="px-6 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-red-100">
        <p className="text-sm text-slate-500 mb-3">Permanently delete this project and all its audits and findings.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete project'}
        </button>
      </div>
    </div>
  )
}
