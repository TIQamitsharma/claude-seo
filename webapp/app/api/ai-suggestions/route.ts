import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { auditId, url, command, findings, scores } = body

  if (!auditId || !url || !findings) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const criticalCount = findings.filter((f: { severity: string }) => f.severity === 'critical').length
  const warningCount = findings.filter((f: { severity: string }) => f.severity === 'warning').length
  const topFindings = findings
    .filter((f: { severity: string }) => f.severity !== 'info')
    .slice(0, 8)
    .map((f: { severity: string; title: string; description: string; recommendation: string }) =>
      `[${f.severity.toUpperCase()}] ${f.title}: ${f.description}`
    )
    .join('\n')

  const scoresSummary = Object.entries(scores as Record<string, number | null>)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(', ')

  const prompt = `You are an expert SEO consultant. A website (${url}) just completed a "${command}" SEO audit.

Scores: ${scoresSummary}
Issues found: ${criticalCount} critical, ${warningCount} warnings

Top issues:
${topFindings}

Provide a concise, actionable 3-point executive summary of:
1. The most urgent fix with the highest SEO impact
2. A quick-win improvement (can be done in under 1 hour)
3. A strategic recommendation for long-term SEO growth

Keep each point to 2-3 sentences. Be specific to this site's actual issues. Format as JSON: {"urgent": "...", "quickWin": "...", "strategic": "..."}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://claudeseo.app',
        'X-Title': 'Claude SEO',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content || ''

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    let suggestions: Record<string, string>
    try {
      suggestions = JSON.parse(jsonStr)
    } catch {
      suggestions = { urgent: raw, quickWin: '', strategic: '' }
    }

    return NextResponse.json({ suggestions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
