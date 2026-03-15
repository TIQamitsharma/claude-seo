import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import { CircleCheck as CheckCircle, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for individuals and small sites',
    features: [
      '5 audits per month',
      'Full-site audit',
      'SEO Health Score',
      'Core Web Vitals analysis',
      'Schema markup validation',
      'Image optimization audit',
      'Email support',
    ],
    notIncluded: ['GEO / AI Search analysis', 'DataForSEO integration', 'Strategic SEO plans', 'Hreflang validation', 'CSV/PDF export'],
    cta: 'Get started free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    desc: 'For growing businesses and agencies',
    features: [
      'Unlimited audits',
      'All 13 audit commands',
      'AI Search (GEO) optimization',
      'DataForSEO integration',
      'Strategic SEO plans',
      'Competitor page analysis',
      'Programmatic SEO analysis',
      'Hreflang & international SEO',
      'Priority support',
      'CSV/PDF export',
    ],
    notIncluded: [],
    cta: 'Start 14-day free trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large teams with advanced needs',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      '99.9% SLA uptime',
      'Team collaboration (unlimited seats)',
      'REST API access',
      'SSO / SAML authentication',
      'Custom reporting & dashboards',
      'Onboarding & training',
      'Invoiced billing',
    ],
    notIncluded: [],
    cta: 'Contact sales',
    href: '/register',
    highlighted: false,
  },
]

const faqs = [
  { q: 'What counts as an audit?', a: 'Each time you run an analysis command (/seo audit, /seo page, /seo technical, etc.) it counts as one audit. Running /seo audit on one URL counts as one audit even though it spawns 7 parallel agents internally.' },
  { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade at any time. If you upgrade mid-cycle you\'ll be charged the prorated difference. If you downgrade, the change takes effect at the end of your current billing period.' },
  { q: 'What is the DataForSEO integration?', a: 'DataForSEO is an optional third-party API that provides live SERP data, keyword research, backlink analysis, and more. You need your own DataForSEO API credentials (separate subscription). The Pro plan unlocks the integration within Claude SEO.' },
  { q: 'Is there a free trial for Pro?', a: 'Yes — all new Pro signups get a 14-day free trial, no credit card required. You\'ll have full access to all Pro features during the trial.' },
  { q: 'How does the GEO / AI Search analysis work?', a: 'GEO (Generative Engine Optimization) audits check whether your site\'s content can be cited by AI-powered search engines like Google AI Overviews, ChatGPT, and Perplexity. It checks for llms.txt, passage citability, brand mentions, and AI crawler accessibility.' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-slate-500">Start free. No credit card required. Cancel anytime.</p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlighted ? 'bg-sky-500 text-white shadow-2xl md:scale-105' : 'bg-white border border-slate-200'}`}>
                <div className="mb-6">
                  {plan.highlighted && (
                    <div className="text-xs font-semibold text-sky-100 bg-sky-600 rounded-full px-3 py-1 inline-block mb-3">Most Popular</div>
                  )}
                  <h2 className={`font-semibold text-xl mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h2>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-sky-100' : 'text-slate-500'}`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.highlighted ? 'text-sky-100' : 'text-slate-500'}`}>/{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-sky-50' : 'text-slate-700'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-sky-200' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-400 line-through">
                      <span className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center text-slate-300">–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${plan.highlighted ? 'bg-white text-sky-600 hover:bg-sky-50' : 'bg-sky-500 text-white hover:bg-sky-600'}`}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-slate-700">Claude SEO</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Claude SEO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
