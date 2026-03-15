import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAudit } from '@/lib/audit-runner'
import type { AuditCommand } from '@/lib/types'

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

  await supabase
    .from('audits')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', id)

  try {
    const results = await runAudit(audit.url, audit.command as AuditCommand)

    await supabase
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
      await supabase
        .from('findings')
        .insert(results.findings.map(f => ({ ...f, audit_id: id, user_id: user.id })))
    }

    await supabase
      .from('audits')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)

    if (audit.project_id) {
      await supabase
        .from('projects')
        .update({ latest_score: results.overall_score, updated_at: new Date().toISOString() })
        .eq('id', audit.project_id)
    }

    return NextResponse.json({ success: true, overall_score: results.overall_score })
  } catch (err) {
    await supabase
      .from('audits')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', id)

    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
