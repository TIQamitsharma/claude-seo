import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Globe, Calendar, ChartBar as BarChart2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

const commandLabels: Record<string, string> = {
  audit: 'Full Audit', page: 'Page Analysis', technical: 'Technical SEO',
  content: 'Content Quality', schema: 'Schema Markup', sitemap: 'Sitemap',
  images: 'Image Audit', geo: 'AI Search (GEO)', plan: 'SEO Plan',
  programmatic: 'Programmatic SEO', 'competitor-pages': 'Competitor Pages', hreflang: 'Hreflang',
}

const industryLabels: Record<string, string> = {
  saas: 'SaaS', ecommerce: 'E-commerce', local: 'Local Business',
  publisher: 'Publisher', agency: 'Agency', generic: 'General',
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!project) notFound()

  const { data: audits } = await supabase
    .from('audits')
    .select('*, audit_results(overall_score)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 text-sm flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {project.url}
            </a>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" />
              {industryLabels[project.industry]}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Added {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
          {project.description && <p className="text-slate-500 text-sm mt-2">{project.description}</p>}
        </div>

        <Link
          href={`/audits/new?project=${id}`}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New audit
        </Link>
      </div>

      {/* Stats */}
      {project.latest_score !== null && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Latest SEO Health Score</h2>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${project.latest_score >= 80 ? 'text-emerald-600' : project.latest_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {project.latest_score}
            </div>
            <div>
              <div className="w-48 bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${project.latest_score >= 80 ? 'bg-emerald-500' : project.latest_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${project.latest_score}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-1">out of 100</p>
            </div>
          </div>
        </div>
      )}

      {/* Audits */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Audit History</h2>
          <span className="text-sm text-slate-400">{audits?.length ?? 0} audits</span>
        </div>

        {!audits || audits.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-slate-500 mb-4">No audits yet for this project.</p>
            <Link href={`/audits/new?project=${id}`} className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              Run first audit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {audits.map(audit => {
              const result = audit.audit_results as { overall_score: number | null } | null
              return (
                <Link key={audit.id} href={`/audits/${audit.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                      {commandLabels[audit.command] || audit.command}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(audit.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {result?.overall_score != null && (
                      <span className={`text-sm font-semibold ${result.overall_score >= 80 ? 'text-emerald-600' : result.overall_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {result.overall_score}/100
                      </span>
                    )}
                    <StatusBadge status={audit.status} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
