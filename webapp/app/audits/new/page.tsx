'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Play } from 'lucide-react'
import type { AuditCommand, Project } from '@/lib/types'

const commands: { value: AuditCommand; label: string; desc: string; icon: string }[] = [
  { value: 'audit', label: 'Full Site Audit', desc: '7 parallel agents — comprehensive analysis', icon: '🔍' },
  { value: 'page', label: 'Page Analysis', desc: 'Deep single-page SEO analysis', icon: '📄' },
  { value: 'technical', label: 'Technical SEO', desc: '9 categories: crawlability, indexability, CWV...', icon: '⚙️' },
  { value: 'content', label: 'Content Quality', desc: 'E-E-A-T scoring and readability analysis', icon: '✍️' },
  { value: 'schema', label: 'Schema Markup', desc: 'Detection, validation, and generation', icon: '🏷️' },
  { value: 'geo', label: 'AI Search (GEO)', desc: 'Google AIO, ChatGPT, Perplexity optimization', icon: '🤖' },
  { value: 'images', label: 'Image Optimization', desc: 'Alt text, file sizes, formats, lazy loading', icon: '🖼️' },
  { value: 'sitemap', label: 'Sitemap Analysis', desc: 'XML sitemap quality and generation', icon: '🗺️' },
  { value: 'hreflang', label: 'Hreflang Audit', desc: 'International SEO and language targeting', icon: '🌍' },
  { value: 'plan', label: 'SEO Plan', desc: 'Strategic roadmap by industry type', icon: '📋' },
  { value: 'programmatic', label: 'Programmatic SEO', desc: 'Scale analysis and thin content gates', icon: '⚡' },
  { value: 'competitor-pages', label: 'Competitor Pages', desc: '"X vs Y" comparison page generation', icon: '🆚' },
]

function NewAuditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCommand = (searchParams.get('command') as AuditCommand) || 'audit'
  const preselectedProject = searchParams.get('project') || ''

  const [url, setUrl] = useState('')
  const [command, setCommand] = useState<AuditCommand>(preselectedCommand)
  const [projectId, setProjectId] = useState(preselectedProject)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('*').order('name').then(({ data }) => {
      if (data) {
        setProjects(data)
        if (preselectedProject) {
          const proj = data.find(p => p.id === preselectedProject)
          if (proj) setUrl(proj.url)
        }
      }
    })
  }, [preselectedProject])

  useEffect(() => {
    if (projectId) {
      const proj = projects.find(p => p.id === projectId)
      if (proj) setUrl(proj.url)
    }
  }, [projectId, projects])

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
    const { data: { user } } = await supabase.auth.getUser()

    let resolvedProjectId = projectId
    if (!resolvedProjectId && projects.length === 0) {
      const { data: newProject } = await supabase
        .from('projects')
        .insert({ name: new URL(normalizedUrl).hostname, url: normalizedUrl, user_id: user!.id })
        .select()
        .single()
      if (newProject) resolvedProjectId = newProject.id
    }

    const { data: audit, error: insertError } = await supabase
      .from('audits')
      .insert({
        project_id: resolvedProjectId || null,
        user_id: user!.id,
        command,
        url: normalizedUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !audit) {
      setError(insertError?.message || 'Failed to create audit')
      setLoading(false)
      return
    }

    router.push(`/audits/${audit.id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">New audit</h1>
      <p className="text-slate-500 mb-8">Choose an audit type and enter the URL to analyze.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* URL */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">URL to analyze</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />

          {projects.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Associate with project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Command */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Audit type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commands.map(cmd => (
              <button
                key={cmd.value}
                type="button"
                onClick={() => setCommand(cmd.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  command === cmd.value
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{cmd.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${command === cmd.value ? 'text-sky-700' : 'text-slate-900'}`}>{cmd.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{cmd.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
        >
          <Play className="w-5 h-5" />
          {loading ? 'Starting audit...' : 'Run audit'}
        </button>
      </form>
    </div>
  )
}

export default function NewAuditPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <NewAuditForm />
    </Suspense>
  )
}
