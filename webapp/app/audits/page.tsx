import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

const commandLabels: Record<string, string> = {
  audit: 'Full Site Audit', page: 'Page Analysis', technical: 'Technical SEO',
  content: 'Content Quality', schema: 'Schema Markup', sitemap: 'Sitemap Analysis',
  images: 'Image Optimization', geo: 'AI Search (GEO)', plan: 'SEO Plan',
  programmatic: 'Programmatic SEO', 'competitor-pages': 'Competitor Pages', hreflang: 'Hreflang Audit',
}

export default async function AuditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: audits } = await supabase
    .from('audits')
    .select('*, projects(name, id), audit_results(overall_score)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const totalCount = audits?.length ?? 0
  const completedCount = audits?.filter(a => a.status === 'completed').length ?? 0
  const failedCount = audits?.filter(a => a.status === 'failed').length ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Audits</h1>
          <p className="text-slate-500 mt-1">
            {totalCount} audit{totalCount !== 1 ? 's' : ''} total &middot; {completedCount} completed &middot; {failedCount} failed
          </p>
        </div>
        <Link
          href="/audits/new"
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New audit
        </Link>
      </div>

      {!audits || audits.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">No audits yet</h2>
          <p className="text-sm text-slate-500 mb-6">Run your first SEO analysis to see results here.</p>
          <Link href="/audits/new" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Run audit
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {audits.map(audit => {
              const project = audit.projects as { name: string; id: string } | null
              const auditResultRaw = audit.audit_results
              const result = (Array.isArray(auditResultRaw) ? auditResultRaw[0] : auditResultRaw) as { overall_score: number | null } | null

              return (
                <Link key={audit.id} href={`/audits/${audit.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                        {commandLabels[audit.command] || audit.command}
                      </span>
                      <StatusBadge status={audit.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {project && (
                        <>
                          <span className="text-sky-600 hover:text-sky-700 font-medium">{project.name}</span>
                          <span>·</span>
                        </>
                      )}
                      <span className="truncate max-w-xs">{audit.url}</span>
                      <span>·</span>
                      <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {result?.overall_score != null && (
                    <div className={`text-sm font-semibold flex-shrink-0 ${result.overall_score >= 80 ? 'text-emerald-600' : result.overall_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {result.overall_score}/100
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
