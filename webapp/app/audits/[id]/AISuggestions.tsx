'use client'

import { useState } from 'react'
import { Sparkles, Loader as Loader2, TriangleAlert as AlertTriangle, Zap, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

interface Finding {
  severity: string
  title: string
  description: string
  recommendation: string
}

interface Scores {
  overall: number | null
  technical: number | null
  content: number | null
  schema: number | null
  performance: number | null
  images: number | null
  geo: number | null
}

interface AISuggestionsProps {
  auditId: string
  url: string
  command: string
  findings: Finding[]
  scores: Scores
}

interface Suggestions {
  urgent: string
  quickWin: string
  strategic: string
}

export default function AISuggestions({ auditId, url, command, findings, scores }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)

  async function fetchSuggestions() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, url, command, findings, scores }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) {
          setError('OpenRouter API key not configured. Add OPENROUTER_API_KEY to your environment variables.')
        } else {
          setError(data.error || 'Failed to get AI suggestions')
        }
        return
      }
      setSuggestions(data.suggestions)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const items = suggestions ? [
    { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-100', label: 'Most Urgent Fix', text: suggestions.urgent },
    { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', label: 'Quick Win', text: suggestions.quickWin },
    { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', label: 'Strategic Growth', text: suggestions.strategic },
  ] : []

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-500" />
          <h2 className="font-semibold text-slate-900">AI Recommendations</h2>
          <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-medium">Powered by OpenRouter</span>
        </div>
        {suggestions && (
          <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="p-6">
        {!suggestions && !loading && !error && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <Sparkles className="w-10 h-10 text-sky-300" />
            <div>
              <p className="font-medium text-slate-900 mb-1">Get AI-powered recommendations</p>
              <p className="text-sm text-slate-500 max-w-sm">Analyze your audit results with AI to get specific, prioritized action items tailored to your site.</p>
            </div>
            <button
              onClick={fetchSuggestions}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate recommendations
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
            <span className="text-sm">Analyzing your audit with AI...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {suggestions && expanded && (
          <div className="space-y-3">
            {items.map(({ icon: Icon, color, bg, label, text }) => text && (
              <div key={label} className={`border rounded-xl p-4 ${bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
              </div>
            ))}
            <button
              onClick={fetchSuggestions}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
