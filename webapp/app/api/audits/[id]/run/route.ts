import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAudit } from '@/lib/audit-runner'
import type { AuditCommand } from '@/lib/types'

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '169.254.169.254', // AWS metadata
  '100.100.100.200', // Alibaba Cloud metadata
  'metadata.google.internal',
]

function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.includes(hostname)) return false

  // Block private/link-local ranges by hostname pattern
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|fc|fd)/.test(hostname)) return false

  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: audit } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  if (audit.status !== 'pending') {
    return NextResponse.json({ error: 'Audit is not in pending state' }, { status: 400 })
  }

  // SSRF protection — validate URL before executing
  if (!isSafeUrl(audit.url)) {
    const admin = createAdminClient()
    await admin
      .from('audits')
      .update({ status: 'failed', error_message: 'URL rejected: private or invalid address' })
      .eq('id', id)
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Rate limiting — max 10 audits per user per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('audits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['running', 'completed'])
    .gte('created_at', oneHourAgo)

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Rate limit: max 10 audits per hour' }, { status: 429 })
  }

  const admin = createAdminClient()

  await admin
    .from('audits')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', id)

  try {
    const results = await runAudit(audit.url, audit.command as AuditCommand)

    await admin
      .from('audit_results')
      .insert({
        audit_id: id,
        overall_score: results.overall_score,
        technical_score: results.technical_score,
        content_score: results.content_score,
        schema_score: results.schema_score,
        performance_score: results.performance_score,
        images_score: results.images_score,
        geo_score: results.geo_score,
        raw_data: results.raw_data,
      })

    if (results.findings.length > 0) {
      await admin
        .from('findings')
        .insert(results.findings.map(f => ({ ...f, audit_id: id, user_id: user.id })))
    }

    await admin
      .from('audits')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)

    if (audit.project_id) {
      await admin
        .from('projects')
        .update({ latest_score: results.overall_score, updated_at: new Date().toISOString() })
        .eq('id', audit.project_id)
    }

    return NextResponse.json({ success: true, overall_score: results.overall_score })
  } catch (err) {
    await admin
      .from('audits')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', id)

    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
