import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Globe, ChartBar as BarChart2, Calendar } from 'lucide-react'

const industryLabels: Record<string, string> = {
  saas: 'SaaS',
  ecommerce: 'E-commerce',
  local: 'Local Business',
  publisher: 'Publisher',
  agency: 'Agency',
  generic: 'General',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage your websites and track SEO progress.</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Add your first website to start tracking SEO performance and running audits.</p>
          <Link href="/projects/new" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-sky-500" />
                </div>
                {project.latest_score !== null && (
                  <div className={`text-2xl font-bold ${project.latest_score >= 80 ? 'text-emerald-600' : project.latest_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {project.latest_score}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">{project.name}</h3>
              <p className="text-sm text-slate-400 truncate mb-4">{project.url}</p>

              {project.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  {industryLabels[project.industry] || 'General'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}

          <Link href="/projects/new" className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-sky-300 transition-all text-slate-400 hover:text-sky-500">
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Add project</span>
          </Link>
        </div>
      )}
    </div>
  )
}
