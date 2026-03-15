import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: recentAudits }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false }).limit(6),
    supabase.from('audits').select('*, projects(name, url)').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('display_name').eq('id', user!.id).maybeSingle(),
  ])

  const totalAudits = await supabase.from('audits').select('id', { count: 'exact', head: true }).eq('user_id', user!.id)
  const completedAudits = await supabase.from('audits').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'completed')

  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName}</h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your SEO activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Projects', value: projects?.length ?? 0, icon: TrendingUp, color: 'text-sky-600 bg-sky-50' },
          { label: 'Total Audits', value: totalAudits.count ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Completed', value: completedAudits.count ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending', value: (totalAudits.count ?? 0) - (completedAudits.count ?? 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Projects</h2>
            <Link href="/projects/new" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium">
              <Plus className="w-4 h-4" />
              New project
            </Link>
          </div>

          {!projects || projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-4">No projects yet. Add your first website to start tracking SEO.</p>
              <Link href="/projects/new" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate group-hover:text-sky-600 transition-colors">{project.name}</p>
                    <p className="text-xs text-slate-400 truncate">{project.url}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {project.latest_score !== null ? (
                      <span className={`text-sm font-semibold ${project.latest_score >= 80 ? 'text-emerald-600' : project.latest_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {project.latest_score}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No score</span>
                    )}
                  </div>
                </Link>
              ))}
              {projects.length >= 6 && (
                <Link href="/projects" className="block text-center text-sm text-sky-600 hover:text-sky-700 font-medium py-2">
                  View all projects →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent audits */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Recent Audits</h2>
            <Link href="/audits/new" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium">
              <Plus className="w-4 h-4" />
              New audit
            </Link>
          </div>

          {!recentAudits || recentAudits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-4">No audits yet. Run your first SEO analysis.</p>
              <Link href="/audits/new" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
                Run audit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAudits.map((audit) => {
                const proj = audit.projects as { name: string; url: string } | null
                return (
                  <Link key={audit.id} href={`/audits/${audit.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate group-hover:text-sky-600 transition-colors">
                        {proj?.name ?? audit.url}
                      </p>
                      <p className="text-xs text-slate-400">/seo {audit.command} · {new Date(audit.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ml-3 ${
                      audit.status === 'completed' ? 'bg-green-100 text-green-700' :
                      audit.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      audit.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {audit.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick start */}
      {(!projects || projects.length === 0) && (
        <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-6">
          <h3 className="font-semibold text-sky-900 mb-2">Get started in 3 steps</h3>
          <ol className="space-y-2 text-sm text-sky-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span><Link href="/projects/new" className="font-medium underline">Create a project</Link> for the website you want to analyze</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Run a <Link href="/audits/new" className="font-medium underline">full site audit</Link> to get your SEO Health Score</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Fix the critical findings and re-audit to track your progress</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
