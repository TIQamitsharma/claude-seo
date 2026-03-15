import type { AuditCommand } from './types'

interface PageFetchResult {
  url: string
  finalUrl: string
  statusCode: number
  redirectCount: number
  responseTimeMs: number
  title: string | null
  metaDescription: string | null
  canonical: string | null
  robotsMeta: string | null
  h1s: string[]
  h2s: string[]
  images: { src: string; alt: string }[]
  schemaMarkup: unknown[]
  wordCount: number
  links: { href: string; text: string; rel?: string }[]
  error: string | null
}

type Finding = {
  severity: 'critical' | 'warning' | 'info'
  category: 'technical' | 'content' | 'schema' | 'performance' | 'images' | 'geo' | 'sitemap' | 'hreflang'
  title: string
  description: string
  recommendation: string
}

async function fetchAndAnalyzePage(url: string): Promise<PageFetchResult> {
  const startTime = Date.now()
  const result: PageFetchResult = {
    url,
    finalUrl: url,
    statusCode: 0,
    redirectCount: 0,
    responseTimeMs: 0,
    title: null,
    metaDescription: null,
    canonical: null,
    robotsMeta: null,
    h1s: [],
    h2s: [],
    images: [],
    schemaMarkup: [],
    wordCount: 0,
    links: [],
    error: null,
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClaudeSEOBot/1.0; +https://claudeseo.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })

    result.responseTimeMs = Date.now() - startTime
    result.statusCode = response.status
    result.finalUrl = response.url

    if (response.url !== url) {
      const urlA = new URL(url)
      const urlB = new URL(response.url)
      if (urlA.hostname !== urlB.hostname || urlA.pathname !== urlB.pathname) {
        result.redirectCount = 1
      }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      result.error = `Non-HTML content type: ${contentType}`
      return result
    }

    const html = await response.text()
    parseHtml(html, result)
  } catch (err: unknown) {
    result.error = err instanceof Error ? err.message : String(err)
    result.responseTimeMs = Date.now() - startTime
  }

  return result
}

function parseHtml(html: string, result: PageFetchResult): void {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch) result.title = decodeHtmlEntities(titleMatch[1].trim())

  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
  if (metaDescMatch) result.metaDescription = decodeHtmlEntities(metaDescMatch[1].trim())

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
    || html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i)
  if (canonicalMatch) result.canonical = canonicalMatch[1].trim()

  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i)
  if (robotsMatch) result.robotsMeta = robotsMatch[1].trim()

  const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)
  for (const m of h1Matches) {
    result.h1s.push(stripTags(m[1]).trim())
  }

  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)
  for (const m of h2Matches) {
    result.h2s.push(stripTags(m[1]).trim())
  }

  const imgMatches = html.matchAll(/<img([^>]*)>/gi)
  for (const m of imgMatches) {
    const attrs = m[1]
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    if (srcMatch) {
      result.images.push({ src: srcMatch[1], alt: altMatch ? altMatch[1] : '' })
    }
  }

  const schemaMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const m of schemaMatches) {
    try {
      const parsed = JSON.parse(m[1].trim())
      if (Array.isArray(parsed)) {
        result.schemaMarkup.push(...parsed)
      } else {
        result.schemaMarkup.push(parsed)
      }
    } catch {
      /* ignore invalid JSON */
    }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (bodyMatch) {
    const bodyText = stripTags(bodyMatch[1]).replace(/\s+/g, ' ').trim()
    result.wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}

function scoreFromIssues(critical: number, warnings: number, checkCount: number): number {
  if (checkCount === 0) return 75
  const base = 100
  const criticalPenalty = critical * 15
  const warningPenalty = warnings * 5
  return Math.max(0, Math.min(100, base - criticalPenalty - warningPenalty))
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
  let pageData: PageFetchResult | null = null

  try {
    pageData = await fetchAndAnalyzePage(url)
  } catch {
    pageData = null
  }

  const raw: Record<string, unknown> = { url, command, timestamp: new Date().toISOString() }
  if (pageData) raw.page = pageData

  let technicalCritical = 0
  let technicalWarnings = 0

  if (pageData) {
    if (pageData.error && pageData.statusCode === 0) {
      findings.push({
        severity: 'critical',
        category: 'technical',
        title: 'Page could not be fetched',
        description: `Unable to reach the URL: ${pageData.error}`,
        recommendation: 'Ensure the URL is accessible and the server is running correctly.',
      })
      technicalCritical++
    } else {
      if (pageData.statusCode >= 400) {
        findings.push({
          severity: 'critical',
          category: 'technical',
          title: `Page returns HTTP ${pageData.statusCode}`,
          description: `The URL returned an error status code ${pageData.statusCode}.`,
          recommendation: 'Fix the server error or redirect to the correct URL.',
        })
        technicalCritical++
      }

      if (pageData.redirectCount > 1) {
        findings.push({
          severity: 'warning',
          category: 'technical',
          title: 'Redirect chain detected',
          description: `Found ${pageData.redirectCount} redirect(s). Chains slow crawling and indexing.`,
          recommendation: 'Consolidate redirects to a single hop where possible.',
        })
        technicalWarnings++
      }

      if (pageData.responseTimeMs > 3000) {
        findings.push({
          severity: 'critical',
          category: 'performance',
          title: 'Slow server response time',
          description: `TTFB is ${pageData.responseTimeMs}ms. Google recommends under 600ms.`,
          recommendation: 'Optimize server response time, enable caching, use a CDN.',
        })
        technicalCritical++
      } else if (pageData.responseTimeMs > 1500) {
        findings.push({
          severity: 'warning',
          category: 'performance',
          title: 'Moderate server response time',
          description: `TTFB is ${pageData.responseTimeMs}ms. Aim for under 600ms.`,
          recommendation: 'Consider server-side caching or CDN to reduce latency.',
        })
      }

      if (!pageData.title) {
        findings.push({
          severity: 'critical',
          category: 'technical',
          title: 'Missing title tag',
          description: 'No title tag found on this page.',
          recommendation: 'Add a unique, descriptive title tag between 30–60 characters.',
        })
        technicalCritical++
      } else if (pageData.title.length < 30) {
        findings.push({
          severity: 'warning',
          category: 'technical',
          title: 'Title tag too short',
          description: `Title is ${pageData.title.length} characters. Aim for 30–60 characters.`,
          recommendation: 'Expand the title to include your primary keyword and value proposition.',
        })
        technicalWarnings++
      } else if (pageData.title.length > 60) {
        findings.push({
          severity: 'warning',
          category: 'technical',
          title: 'Title tag too long',
          description: `Title is ${pageData.title.length} characters. Google truncates at ~60 characters.`,
          recommendation: 'Shorten the title to under 60 characters while keeping the primary keyword.',
        })
        technicalWarnings++
      }

      if (!pageData.metaDescription) {
        findings.push({
          severity: 'warning',
          category: 'content',
          title: 'Missing meta description',
          description: 'No meta description found on this page.',
          recommendation: 'Add a meta description between 120–160 characters that summarizes the page.',
        })
        technicalWarnings++
      } else if (pageData.metaDescription.length > 160) {
        findings.push({
          severity: 'info',
          category: 'content',
          title: 'Meta description too long',
          description: `Meta description is ${pageData.metaDescription.length} characters. Google truncates at ~160.`,
          recommendation: 'Shorten to under 160 characters.',
        })
      }

      if (pageData.h1s.length === 0) {
        findings.push({
          severity: 'critical',
          category: 'technical',
          title: 'Missing H1 tag',
          description: 'No H1 heading found on this page.',
          recommendation: 'Add exactly one H1 tag containing your primary keyword.',
        })
        technicalCritical++
      } else if (pageData.h1s.length > 1) {
        findings.push({
          severity: 'warning',
          category: 'technical',
          title: 'Multiple H1 tags',
          description: `Found ${pageData.h1s.length} H1 tags. Only one H1 is recommended per page.`,
          recommendation: 'Use exactly one H1 tag as the main page heading.',
        })
        technicalWarnings++
      }

      if (!pageData.canonical) {
        findings.push({
          severity: 'warning',
          category: 'technical',
          title: 'Missing canonical tag',
          description: 'No canonical URL found. This may lead to duplicate content issues.',
          recommendation: 'Add a <link rel="canonical"> tag pointing to the preferred URL.',
        })
        technicalWarnings++
      }

      const imagesWithoutAlt = pageData.images.filter(img => !img.alt || img.alt.trim() === '')
      if (imagesWithoutAlt.length > 0) {
        findings.push({
          severity: 'warning',
          category: 'images',
          title: `${imagesWithoutAlt.length} image${imagesWithoutAlt.length > 1 ? 's' : ''} missing alt text`,
          description: `${imagesWithoutAlt.length} of ${pageData.images.length} images have no alt text.`,
          recommendation: 'Add descriptive alt text to all meaningful images for accessibility and SEO.',
        })
      }

      if (pageData.wordCount < 300 && pageData.wordCount > 0) {
        findings.push({
          severity: 'warning',
          category: 'content',
          title: 'Thin content detected',
          description: `Page has only ~${pageData.wordCount} words. Competitive pages typically have 800+ words.`,
          recommendation: 'Add comprehensive, useful content that fully covers the topic.',
        })
      }

      if (pageData.schemaMarkup.length === 0) {
        findings.push({
          severity: 'info',
          category: 'schema',
          title: 'No structured data detected',
          description: 'No Schema.org markup found on this page.',
          recommendation: 'Add relevant Schema.org markup (Organization, WebPage, Article) to improve rich result eligibility.',
        })
      } else {
        const schemaTypes = pageData.schemaMarkup
          .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
          .map(s => (s['@type'] as string) || 'Unknown')
        findings.push({
          severity: 'info',
          category: 'schema',
          title: `${pageData.schemaMarkup.length} schema markup type${pageData.schemaMarkup.length > 1 ? 's' : ''} detected`,
          description: `Found: ${schemaTypes.join(', ')}`,
          recommendation: 'Validate all schema markup at schema.org/validator to ensure it is error-free.',
        })
      }

      if (pageData.robotsMeta && (pageData.robotsMeta.includes('noindex') || pageData.robotsMeta.includes('none'))) {
        findings.push({
          severity: 'critical',
          category: 'technical',
          title: 'Page is set to noindex',
          description: `The robots meta tag contains "${pageData.robotsMeta}" which prevents indexing.`,
          recommendation: 'Remove the noindex directive if you want this page to appear in search results.',
        })
        technicalCritical++
      }
    }
  }

  const parsedUrlObj = new URL(url)
  const llmsTxtUrl = `${parsedUrlObj.protocol}//${parsedUrlObj.hostname}/llms.txt`
  const robotsTxtUrl = `${parsedUrlObj.protocol}//${parsedUrlObj.hostname}/robots.txt`

  let hasLlmsTxt = false
  let hasRobotsTxt = false

  try {
    const [llmsRes, robotsRes] = await Promise.allSettled([
      fetch(llmsTxtUrl, { signal: AbortSignal.timeout(5000) }),
      fetch(robotsTxtUrl, { signal: AbortSignal.timeout(5000) }),
    ])

    if (llmsRes.status === 'fulfilled' && llmsRes.value.ok) {
      hasLlmsTxt = true
      findings.push({
        severity: 'info',
        category: 'geo',
        title: 'llms.txt found',
        description: 'An llms.txt file exists to guide AI crawlers on your content.',
        recommendation: 'Ensure llms.txt is kept up to date as you add new content sections.',
      })
    } else {
      findings.push({
        severity: 'info',
        category: 'geo',
        title: 'llms.txt not found',
        description: 'No llms.txt file found at the root of this domain.',
        recommendation: 'Create an llms.txt file to guide AI crawlers on how to access and cite your content.',
      })
    }

    if (robotsRes.status === 'fulfilled' && robotsRes.value.ok) {
      hasRobotsTxt = true
      const robotsText = await robotsRes.value.text()
      if (robotsText.includes('GPTBot') && robotsText.toLowerCase().includes('disallow')) {
        findings.push({
          severity: 'warning',
          category: 'geo',
          title: 'AI crawlers may be blocked in robots.txt',
          description: 'Your robots.txt appears to block GPTBot or other AI crawlers.',
          recommendation: 'Consider allowing AI crawlers to index your content to appear in AI-generated answers.',
        })
      }
    }
  } catch {
    /* ignore geo check errors */
  }

  raw.checked = { llms_txt: llmsTxtUrl, robots_txt: robotsTxtUrl, has_llms_txt: hasLlmsTxt, has_robots_txt: hasRobotsTxt }

  const technicalFindings = findings.filter(f => f.category === 'technical')
  const technicalScore = ['technical', 'audit', 'page'].includes(command)
    ? scoreFromIssues(technicalCritical, technicalWarnings, technicalFindings.length + 5)
    : null

  const contentFindings = findings.filter(f => f.category === 'content')
  const contentScore = ['content', 'audit', 'page'].includes(command)
    ? scoreFromIssues(
        contentFindings.filter(f => f.severity === 'critical').length,
        contentFindings.filter(f => f.severity === 'warning').length,
        contentFindings.length + 3
      )
    : null

  const schemaScore = ['schema', 'audit'].includes(command)
    ? (pageData?.schemaMarkup && pageData.schemaMarkup.length > 0 ? 80 : 30)
    : null

  const performanceFindings = findings.filter(f => f.category === 'performance')
  const performanceScore = ['technical', 'audit'].includes(command)
    ? scoreFromIssues(
        performanceFindings.filter(f => f.severity === 'critical').length,
        performanceFindings.filter(f => f.severity === 'warning').length,
        performanceFindings.length + 3
      )
    : null

  const imageFindings = findings.filter(f => f.category === 'images')
  const imagesScore = ['images', 'audit'].includes(command)
    ? scoreFromIssues(
        imageFindings.filter(f => f.severity === 'critical').length,
        imageFindings.filter(f => f.severity === 'warning').length,
        imageFindings.length + 2
      )
    : null

  const geoFindings = findings.filter(f => f.category === 'geo')
  const geoScore = ['geo', 'audit'].includes(command)
    ? scoreFromIssues(
        geoFindings.filter(f => f.severity === 'critical').length,
        geoFindings.filter(f => f.severity === 'warning').length,
        geoFindings.length + 2
      )
    : null

  const scoresToAverage = [technicalScore, contentScore, schemaScore, performanceScore, imagesScore, geoScore].filter(
    (s): s is number => s !== null
  )
  const overall_score =
    scoresToAverage.length > 0
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
