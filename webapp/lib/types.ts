export type Industry = 'saas' | 'ecommerce' | 'local' | 'publisher' | 'agency' | 'generic'
export type AuditCommand = 'audit' | 'page' | 'technical' | 'content' | 'schema' | 'sitemap' | 'images' | 'geo' | 'plan' | 'programmatic' | 'competitor-pages' | 'hreflang'
export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed'
export type Severity = 'critical' | 'warning' | 'info'
export type FindingCategory = 'technical' | 'content' | 'schema' | 'performance' | 'images' | 'geo' | 'sitemap' | 'hreflang'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  dataforseo_login: string
  dataforseo_password: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  url: string
  industry: Industry
  description: string
  latest_score: number | null
  created_at: string
  updated_at: string
}

export interface Audit {
  id: string
  project_id: string
  user_id: string
  command: AuditCommand
  status: AuditStatus
  url: string
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AuditResult {
  id: string
  audit_id: string
  overall_score: number | null
  technical_score: number | null
  content_score: number | null
  schema_score: number | null
  performance_score: number | null
  images_score: number | null
  geo_score: number | null
  raw_data: Record<string, unknown>
  created_at: string
}

export interface Finding {
  id: string
  audit_id: string
  user_id: string
  severity: Severity
  category: FindingCategory
  title: string
  description: string
  recommendation: string
  created_at: string
}

export interface AuditWithResult extends Audit {
  audit_results?: AuditResult | null
}

export interface ProjectWithStats extends Project {
  audits?: Audit[]
  audit_count?: number
}
