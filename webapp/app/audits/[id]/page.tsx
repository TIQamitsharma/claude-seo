import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import SeverityBadge from '@/components/ui/SeverityBadge'
import AuditResultsClient from './AuditResultsClient'
import type { Severity, FindingCategory } from '@/lib/types'

const commandLabels: Record<string, string> = {
  audit: 'Full Site Audit', page: 'Page Analysis', technical: 'Technical SEO',
  content: 'Content Quality', schema: 'Schema Markup', sitemap: 'Sitemap Analysis',
  images: 'Image Optimization', geo: 'AI Search (GEO)', plan: 'SEO Plan',
  programmatic: 'Programmatic SEO', 'competitor-pages': 'Competitor Pages', hreflang: 'Hreflang Audit',
}

const categoryColors: Record<FindingCategory, string> = {
  technical: 'bg-slate-100 text-slate-700',
  content: 'bg-amber-50 text-amber-700',
  schema: 'bg-emerald-50 text-emerald-700',
  performance: 'bg-blue-50 text-blue-700',
  images: 'bg-teal-50 text-teal-700',
  geo: 'bg-sky-50 text-sky-700',
  sitemap: 'bg-orange-50 text-orange-700',
  hreflang: 'bg-pink-50 text-pink-700',
}

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: audit } = await supabase
    .from('audits')
    .select('*, projects(name, url, id), audit_results(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!audit) notFound()

  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('audit_id', id)
    .order('severity', { ascending: true })

  const project = audit.projects as { name: string; url: string; id: string } | null
  const result = audit.audit_results as {
    overall_score: number | null
    technical_score: number | null
    content_score: number | null
    schema_score: number | null
    performance_score: number | null
    images_score: number | null
    geo_score: number | null
    raw_data: Record<string, unknown>
  } | null

  const criticalCount = findings?.filter(f => f.severity === 'critical').length ?? 0
  const warningCount = findings?.filter(f => f.severity === 'warning').length ?? 0
  const infoCount = findings?.filter(f => f.severity === 'info').length ?? 0

  const scoreCategories = result ? [
    { label: 'Technical', score: result.technical_score, weight: '22%' },
    { label: 'Content', score: result.content_score, weight: '23%' },
    { label: 'Schema', score: result.schema_score, weight: '10%' },
    { label: 'Performance', score: result.performance_score, weight: '10%' },
    { label: 'Images', score: result.images_score, weight: '5%' },
    { label: 'AI Search', score: result.geo_score, weight: '10%' },
  ] : []

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={project ? `/projects/${project.id}` : '/dashboard'} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {project ? project.name : 'Dashboard'}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{commandLabels[audit.command]}</h1>
            <StatusBadge status={audit.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 flex items-center gap-1">
              {audit.url}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">·</span>
            <span>{new Date(audit.created_at).toLocaleString()}</span>
          </div>
        </div>

        {audit.status === 'failed' && (
          <Link href={`/audits/new?command=${audit.command}`} className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" />
            Retry audit
          </Link>
        )}
      </div>

      {audit.status === 'failed' && audit.error_message && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
          <p className="font-medium mb-1">Audit failed</p>
          <p className="text-sm">{audit.error_message}</p>
        </div>
      )}

      {audit.status === 'pending' || audit.status === 'running' ? (
        <AuditResultsClient auditId={id} />
      ) : (
        <>
          {/* Scores */}
          {result && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-slate-500 mb-1">Overall Score</p>
                  <div className={`text-6xl font-bold ${
                    (result.overall_score ?? 0) >= 80 ? 'text-emerald-600' :
                    (result.overall_score ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {result.overall_score ?? '—'}
                  </div>
                  <p className="text-sm text-slate-400">/ 100</p>
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {scoreCategories.map(({ label, score, weight }) => score !== null && (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-xs text-slate-400">{weight}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold w-8 text-right ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Findings summary */}
          {findings && findings.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
                  <div className="text-sm text-red-500 mt-1">Critical</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">{warningCount}</div>
                  <div className="text-sm text-amber-500 mt-1">Warnings</div>
                </div>
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-sky-600">{infoCount}</div>
                  <div className="text-sm text-sky-500 mt-1">Info</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Findings</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {findings.map(finding => (
                    <div key={finding.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <SeverityBadge severity={finding.severity as Severity} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColors[finding.category as FindingCategory]}`}>
                              {finding.category}
                            </span>
                            <span className="font-medium text-slate-900 text-sm">{finding.title}</span>
                          </div>
                          <p className="text-sm text-slate-500">{finding.description}</p>
                          {finding.recommendation && (
                            <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                              <span className="font-medium">Fix: </span>{finding.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Raw data */}
          {result?.raw_data && Object.keys(result.raw_data).length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Raw Data</h2>
              </div>
              <div className="p-6">
                <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-96">
                  {JSON.stringify(result.raw_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {audit.status === 'completed' && !result && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500">Audit completed. No detailed results available.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
