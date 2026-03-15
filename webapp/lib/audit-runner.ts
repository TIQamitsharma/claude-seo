import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import type { AuditCommand } from './types'

const execFileAsync = promisify(execFile)

const SCRIPTS_DIR = path.join(process.cwd(), '..', 'scripts')

interface FetchResult {
  url: string
  status_code: number
  title?: string
  meta_description?: string
  canonical?: string
  robots?: string
  h1?: string[]
  redirect_chain?: string[]
  response_time_ms?: number
  error?: string
}

interface ParseResult {
  title?: string
  meta_description?: string
  headings?: { tag: string; text: string }[]
  images?: { src: string; alt: string; width?: number; height?: number }[]
  schema?: unknown[]
  canonical?: string
  robots?: string
  links?: { href: string; text: string; rel?: string }[]
  word_count?: number
  error?: string
}

export async function fetchPage(url: string): Promise<FetchResult> {
  try {
    const { stdout } = await execFileAsync(
      'python3',
      [path.join(SCRIPTS_DIR, 'fetch_page.py'), url],
      { timeout: 30000 }
    )
    return JSON.parse(stdout)
  } catch (err) {
    return { url, status_code: 0, error: String(err) }
  }
}

export async function parsePage(url: string): Promise<ParseResult> {
  try {
    const fetchResult = await fetchPage(url)
    if (fetchResult.error) return { error: fetchResult.error }

    const { stdout } = await execFileAsync(
      'python3',
      [path.join(SCRIPTS_DIR, 'parse_html.py'), url],
      { timeout: 30000 }
    )
    return JSON.parse(stdout)
  } catch (err) {
    return { error: String(err) }
  }
}

function scoreFromIssues(critical: number, warnings: number, total: number): number {
  if (total === 0) return 75
  const base = 100
  const criticalPenalty = critical * 15
  const warningPenalty = warnings * 5
  return Math.max(0, Math.min(100, base - criticalPenalty - warningPenalty))
}

type Finding = {
  severity: 'critical' | 'warning' | 'info'
  category: 'technical' | 'content' | 'schema' | 'performance' | 'images' | 'geo' | 'sitemap' | 'hreflang'
  title: string
  description: string
  recommendation: string
}

export async function runAudit(url: string, command: AuditCommand): Promise<{
  overall_score: number
  technical_score: number | null
  content_score: number | null
  schema_score: number | null
  performance_score: number | null
  images_score: number | null
  geo_score: number | null
  raw_data: Record<string, unknown>
  findings: Finding[]
}> {
  const findings: Finding[] = []
  let pageData: FetchResult | null = null
  let parsedData: ParseResult | null = null

  try {
    pageData = await fetchPage(url)
    parsedData = await parsePage(url)
  } catch {
    pageData = null
    parsedData = null
  }

  const raw: Record<string, unknown> = { url, command, timestamp: new Date().toISOString() }

  if (pageData) raw.fetch = pageData
  if (parsedData) raw.parse = parsedData

  // Technical checks
  let technicalCritical = 0
  let technicalWarnings = 0

  if (pageData) {
    if (pageData.status_code >= 400) {
      findings.push({ severity: 'critical', category: 'technical', title: `Page returns HTTP ${pageData.status_code}`, description: `The URL returned an error status code ${pageData.status_code}.`, recommendation: 'Fix the server error or redirect to the correct URL.' })
      technicalCritical++
    }
    if (pageData.redirect_chain && pageData.redirect_chain.length > 2) {
      findings.push({ severity: 'warning', category: 'technical', title: 'Long redirect chain detected', description: `Found ${pageData.redirect_chain.length} redirects. Long chains slow down crawling and indexing.`, recommendation: 'Consolidate redirects to a maximum of 1 hop.' })
      technicalWarnings++
    }
    if (pageData.response_time_ms && pageData.response_time_ms > 3000) {
      findings.push({ severity: 'critical', category: 'performance', title: 'Slow server response time', description: `TTFB is ${pageData.response_time_ms}ms. Google recommends under 600ms.`, recommendation: 'Optimize server response, enable caching, use a CDN.' })
      technicalCritical++
    }
  }

  if (parsedData) {
    if (!parsedData.title) {
      findings.push({ severity: 'critical', category: 'technical', title: 'Missing title tag', description: 'No title tag found on this page.', recommendation: 'Add a unique, descriptive title tag between 30–60 characters.' })
      technicalCritical++
    } else if (parsedData.title.length < 30) {
      findings.push({ severity: 'warning', category: 'technical', title: 'Title tag too short', description: `Title is ${parsedData.title.length} characters. Aim for 30–60 characters.`, recommendation: 'Expand the title to include your primary keyword and value proposition.' })
      technicalWarnings++
    } else if (parsedData.title.length > 60) {
      findings.push({ severity: 'warning', category: 'technical', title: 'Title tag too long', description: `Title is ${parsedData.title.length} characters. Google truncates titles over ~60 characters.`, recommendation: 'Shorten the title to under 60 characters while keeping the primary keyword.' })
      technicalWarnings++
    }

    if (!parsedData.meta_description) {
      findings.push({ severity: 'warning', category: 'content', title: 'Missing meta description', description: 'No meta description found on this page.', recommendation: 'Add a meta description between 120–160 characters that summarizes the page content.' })
      technicalWarnings++
    } else if (parsedData.meta_description.length > 160) {
      findings.push({ severity: 'info', category: 'content', title: 'Meta description too long', description: `Meta description is ${parsedData.meta_description.length} characters. Google truncates at ~160.`, recommendation: 'Shorten to under 160 characters.' })
    }

    const h1s = parsedData.headings?.filter(h => h.tag === 'h1') || []
    if (h1s.length === 0) {
      findings.push({ severity: 'critical', category: 'technical', title: 'Missing H1 tag', description: 'No H1 heading found on this page.', recommendation: 'Add exactly one H1 tag containing your primary keyword.' })
      technicalCritical++
    } else if (h1s.length > 1) {
      findings.push({ severity: 'warning', category: 'technical', title: 'Multiple H1 tags', description: `Found ${h1s.length} H1 tags. Only one H1 is recommended per page.`, recommendation: 'Use exactly one H1 tag as the main page heading.' })
      technicalWarnings++
    }

    if (!parsedData.canonical) {
      findings.push({ severity: 'warning', category: 'technical', title: 'Missing canonical tag', description: 'No canonical URL found. This may lead to duplicate content issues.', recommendation: 'Add a <link rel="canonical"> tag pointing to the preferred URL.' })
      technicalWarnings++
    }

    // Images
    if (parsedData.images) {
      const imagesWithoutAlt = parsedData.images.filter(img => !img.alt || img.alt.trim() === '')
      if (imagesWithoutAlt.length > 0) {
        findings.push({ severity: 'warning', category: 'images', title: `${imagesWithoutAlt.length} images missing alt text`, description: `${imagesWithoutAlt.length} out of ${parsedData.images.length} images have no alt text.`, recommendation: 'Add descriptive alt text to all meaningful images.' })
      }
    }

    // Content
    if (parsedData.word_count && parsedData.word_count < 300) {
      findings.push({ severity: 'warning', category: 'content', title: 'Thin content detected', description: `Page has only ${parsedData.word_count} words. Most competitive pages have 1000+ words.`, recommendation: 'Add comprehensive, useful content that covers the topic in depth.' })
    }

    // Schema
    if (!parsedData.schema || parsedData.schema.length === 0) {
      findings.push({ severity: 'info', category: 'schema', title: 'No structured data detected', description: 'No Schema.org markup found on this page.', recommendation: 'Add relevant Schema.org markup (e.g., Organization, WebPage, Article) to improve rich result eligibility.' })
    }
  }

  // GEO checks
  const parsedUrlObj = new URL(url)
  const robotsTxtUrl = `${parsedUrlObj.protocol}//${parsedUrlObj.hostname}/robots.txt`
  const llmsTxtUrl = `${parsedUrlObj.protocol}//${parsedUrlObj.hostname}/llms.txt`

  try {
    const llmsRes = await fetch(llmsTxtUrl, { signal: AbortSignal.timeout(5000) })
    if (!llmsRes.ok) {
      findings.push({ severity: 'info', category: 'geo', title: 'llms.txt not found', description: 'No llms.txt file found at the root of this domain.', recommendation: 'Create an llms.txt file to guide AI crawlers on how to access and cite your content.' })
    }
  } catch {
    findings.push({ severity: 'info', category: 'geo', title: 'llms.txt not found', description: 'Could not check for llms.txt file.', recommendation: 'Create an llms.txt file to guide AI crawlers.' })
  }
  raw.checked_urls = { robots_txt: robotsTxtUrl, llms_txt: llmsTxtUrl }

  const technicalScore = command === 'technical' || command === 'audit' || command === 'page'
    ? scoreFromIssues(technicalCritical, technicalWarnings, findings.filter(f => f.category === 'technical').length)
    : null

  const contentFindings = findings.filter(f => f.category === 'content')
  const contentScore = command === 'content' || command === 'audit' || command === 'page'
    ? scoreFromIssues(contentFindings.filter(f => f.severity === 'critical').length, contentFindings.filter(f => f.severity === 'warning').length, contentFindings.length)
    : null

  const schemaFindings = findings.filter(f => f.category === 'schema')
  const schemaScore = command === 'schema' || command === 'audit'
    ? (parsedData?.schema && parsedData.schema.length > 0 ? 75 : 30)
    : null

  const performanceFindings = findings.filter(f => f.category === 'performance')
  const performanceScore = command === 'technical' || command === 'audit'
    ? scoreFromIssues(performanceFindings.filter(f => f.severity === 'critical').length, 0, performanceFindings.length)
    : null

  const imageFindings = findings.filter(f => f.category === 'images')
  const imagesScore = command === 'images' || command === 'audit'
    ? scoreFromIssues(imageFindings.filter(f => f.severity === 'critical').length, imageFindings.filter(f => f.severity === 'warning').length, imageFindings.length)
    : null

  const geoFindings = findings.filter(f => f.category === 'geo')
  const geoScore = command === 'geo' || command === 'audit'
    ? scoreFromIssues(geoFindings.filter(f => f.severity === 'critical').length, geoFindings.filter(f => f.severity === 'warning').length, geoFindings.length)
    : null

  const scoresToAverage = [technicalScore, contentScore, schemaScore, performanceScore, imagesScore, geoScore].filter(s => s !== null) as number[]
  const overall_score = scoresToAverage.length > 0
    ? Math.round(scoresToAverage.reduce((a, b) => a + b, 0) / scoresToAverage.length)
    : 50

  return {
    overall_score,
    technical_score: technicalScore,
    content_score: contentScore,
    schema_score: schemaScore,
    performance_score: performanceScore,
    images_score: imagesScore,
    geo_score: geoScore,
    raw_data: raw,
    findings,
  }
}
