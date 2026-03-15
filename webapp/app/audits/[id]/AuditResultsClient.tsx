'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader as Loader2 } from 'lucide-react'

const agentSteps = [
  { label: 'Technical SEO', desc: 'Crawlability, indexability, security...', delay: 2000 },
  { label: 'Content Quality', desc: 'E-E-A-T, readability, thin content...', delay: 4000 },
  { label: 'Schema Markup', desc: 'Structured data validation...', delay: 6000 },
  { label: 'Sitemap', desc: 'XML sitemap analysis...', delay: 8000 },
  { label: 'Performance', desc: 'Core Web Vitals measurement...', delay: 10000 },
  { label: 'Visual', desc: 'Screenshots, mobile rendering...', delay: 12000 },
  { label: 'AI Search (GEO)', desc: 'AI crawler access, citability...', delay: 14000 },
]

export default function AuditResultsClient({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [status, setStatus] = useState<string>('pending')

  useEffect(() => {
    fetch(`/api/audits/${auditId}/run`, { method: 'POST' })
      .then(res => { if (res.ok) setTimeout(() => router.refresh(), 500) })
      .catch(() => {})
  }, [auditId, router])

  useEffect(() => {
    agentSteps.forEach((step, i) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, i])
      }, step.delay)
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`audit-${auditId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'audits', filter: `id=eq.${auditId}` },
        (payload) => {
          const newStatus = payload.new.status
          setStatus(newStatus)
          if (newStatus === 'completed' || newStatus === 'failed') {
            setTimeout(() => {
              router.refresh()
            }, 500)
          }
        }
      )
      .subscribe()

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('audits')
        .select('status')
        .eq('id', auditId)
        .maybeSingle()
      if (data) {
        setStatus(data.status)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(poll)
          setTimeout(() => router.refresh(), 500)
        }
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [auditId, router])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      <div className="flex items-center gap-3 mb-8">
        <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
        <div>
          <h2 className="font-semibold text-slate-900">
            {status === 'pending' ? 'Preparing audit...' : 'Running analysis...'}
          </h2>
          <p className="text-sm text-slate-500">7 parallel agents are analyzing your site</p>
        </div>
      </div>

      <div className="space-y-3">
        {agentSteps.map((step, i) => {
          const isComplete = completedSteps.includes(i)
          const isActive = completedSteps.includes(i - 1) && !isComplete
          return (
            <div key={step.label} className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
              isComplete ? 'bg-emerald-50 border border-emerald-100' :
              isActive ? 'bg-sky-50 border border-sky-100' :
              'bg-slate-50 border border-slate-100'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isComplete ? 'bg-emerald-500' : isActive ? 'bg-sky-500' : 'bg-slate-200'
              }`}>
                {isComplete ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <span className="text-slate-400 text-xs font-medium">{i + 1}</span>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${isComplete ? 'text-emerald-700' : isActive ? 'text-sky-700' : 'text-slate-500'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        Full audits typically take 30–90 seconds depending on site size
      </p>
    </div>
  )
}
