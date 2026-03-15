import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import { ArrowRight, ChartBar as BarChart2, Zap, Globe, Shield, Search, FileText, Image, Map, TrendingUp, CircleCheck as CheckCircle } from 'lucide-react'

const features = [
  { icon: Search, title: 'Full Site Audit', desc: '7 parallel AI agents analyze every aspect of your site simultaneously — technical, content, schema, performance, and more.', color: 'bg-sky-50 text-sky-600' },
  { icon: BarChart2, title: 'SEO Health Score', desc: 'Get a 0–100 score broken down across 7 weighted categories so you know exactly where to focus.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Globe, title: 'AI Search Optimization', desc: 'Optimize for Google AI Overviews, ChatGPT, and Perplexity. Track your citability score and llms.txt compliance.', color: 'bg-cyan-50 text-cyan-600' },
  { icon: FileText, title: 'E-E-A-T Content Analysis', desc: 'Evaluate Experience, Expertise, Authoritativeness, and Trustworthiness with Google\'s 2025 Quality Rater Guidelines.', color: 'bg-amber-50 text-amber-600' },
  { icon: Shield, title: 'Schema Validation', desc: 'Detect, validate, and generate 30+ Schema.org types. Auto-flag deprecated markup before it hurts rankings.', color: 'bg-rose-50 text-rose-600' },
  { icon: Zap, title: 'Core Web Vitals', desc: 'Measure LCP, INP, and CLS against Google\'s latest thresholds with actionable fixes.', color: 'bg-orange-50 text-orange-600' },
  { icon: Image, title: 'Image Optimization', desc: 'Audit alt text, file sizes, WebP/AVIF formats, lazy loading, and CLS-causing images across every page.', color: 'bg-teal-50 text-teal-600' },
  { icon: Map, title: 'Hreflang & International SEO', desc: 'Validate hreflang tags across 8 criteria, detect missing ISO codes, and generate correct implementation code.', color: 'bg-blue-50 text-blue-600' },
  { icon: TrendingUp, title: 'Strategic SEO Planning', desc: 'Get a custom roadmap tailored to your industry — SaaS, e-commerce, local, publisher, or agency.', color: 'bg-pink-50 text-pink-600' },
]

const commands = [
  { cmd: '/seo audit', desc: 'Full site audit — 7 parallel agents' },
  { cmd: '/seo page', desc: 'Deep single-page analysis' },
  { cmd: '/seo technical', desc: '9-category technical audit' },
  { cmd: '/seo content', desc: 'E-E-A-T & content quality' },
  { cmd: '/seo schema', desc: 'Schema detection & generation' },
  { cmd: '/seo geo', desc: 'AI search optimization' },
  { cmd: '/seo images', desc: 'Image optimization audit' },
  { cmd: '/seo sitemap', desc: 'Sitemap analysis & generation' },
  { cmd: '/seo hreflang', desc: 'International SEO audit' },
  { cmd: '/seo plan', desc: 'Strategic SEO planning' },
  { cmd: '/seo programmatic', desc: 'Programmatic SEO at scale' },
  { cmd: '/seo competitor-pages', desc: 'Comparison page generation' },
]

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for individuals and small sites',
    features: ['5 audits per month', 'Full-site audit', 'SEO Health Score', 'Core Web Vitals', 'Schema validation', 'Email support'],
    cta: 'Get started free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    desc: 'For growing businesses and agencies',
    features: ['Unlimited audits', 'All 13 audit commands', 'AI Search (GEO) optimization', 'DataForSEO integration', 'Strategic SEO plans', 'Competitor page analysis', 'Priority support', 'CSV/PDF export'],
    cta: 'Start free trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large teams with advanced needs',
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'SLA guarantees', 'Team collaboration', 'API access', 'SSO / SAML', 'Custom reporting'],
    cta: 'Contact sales',
    href: '/register',
    highlighted: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 text-sm px-4 py-2 rounded-full mb-8 font-medium">
            <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
            Updated for 2026 — includes AI Overviews optimization
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
            SEO Analysis That<br />
            <span className="text-sky-500">Thinks Like an Expert</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            13 AI-powered audit commands, 7 parallel agents, and a comprehensive health score system — built on Google&apos;s latest quality guidelines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              See all features
            </Link>
          </div>
        </div>
      </section>

      {/* Score preview mockup */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-slate-800 rounded-md px-3 py-1 text-slate-400 text-sm font-mono">
                claude-seo.app — /seo audit example.com
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Overall', score: 78, color: '#f59e0b' },
                { label: 'Technical', score: 85, color: '#22c55e' },
                { label: 'Content', score: 72, color: '#f59e0b' },
                { label: 'GEO', score: 61, color: '#f97316' },
              ].map(({ label, score, color }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color }}>{score}</div>
                  <div className="text-slate-400 text-sm">{label}</div>
                  <div className="mt-2 bg-slate-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: color }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {[
                { sev: 'critical', text: 'Missing canonical tags on 14 paginated URLs', cat: 'Technical' },
                { sev: 'warning', text: 'Author bylines missing on 8 blog posts — E-E-A-T impact', cat: 'Content' },
                { sev: 'info', text: 'llms.txt not found — AI crawler guidance unavailable', cat: 'GEO' },
              ].map(({ sev, text, cat }) => (
                <div key={text} className="flex items-start gap-3 bg-slate-800 rounded-lg px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium mt-0.5 ${sev === 'critical' ? 'bg-red-900 text-red-300' : sev === 'warning' ? 'bg-amber-900 text-amber-300' : 'bg-sky-900 text-sky-300'}`}>
                    {sev}
                  </span>
                  <span className="text-slate-300 text-sm flex-1">{text}</span>
                  <span className="text-slate-500 text-xs">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to rank higher</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">13 specialized audit commands backed by the latest SEO research and AI optimization guidance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commands */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">12 commands. One dashboard.</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Run any SEO analysis from the command bar or pick from the visual interface.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {commands.map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-white hover:shadow-sm transition-all">
                <code className="text-sky-600 bg-sky-50 border border-sky-100 rounded px-2 py-1 text-xs font-mono whitespace-nowrap">{cmd}</code>
                <span className="text-sm text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 ${plan.highlighted ? 'bg-sky-500 text-white shadow-xl md:scale-105' : 'bg-white border border-slate-200'}`}>
                <div className="mb-6">
                  <h3 className={`font-semibold text-lg mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-sky-100' : 'text-slate-500'}`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.highlighted ? 'text-sky-100' : 'text-slate-500'}`}>/{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-sky-50' : 'text-slate-600'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-sky-200' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center px-6 py-3 rounded-xl font-medium transition-colors ${plan.highlighted ? 'bg-white text-sky-600 hover:bg-sky-50' : 'bg-sky-500 text-white hover:bg-sky-600'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready to improve your SEO?</h2>
          <p className="text-lg text-slate-500 mb-8">Start your first audit in seconds. No credit card required.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors">
            Get started for free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-slate-700">Claude SEO</span>
          </div>
          <div className="flex gap-8">
            <Link href="/pricing" className="text-sm text-slate-500 hover:text-slate-700">Pricing</Link>
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">Sign in</Link>
            <Link href="/register" className="text-sm text-slate-500 hover:text-slate-700">Register</Link>
          </div>
          <p className="text-sm text-slate-400">© 2026 Claude SEO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
