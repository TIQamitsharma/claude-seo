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
  isHttps: boolean
  viewportMeta: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  twitterCard: string | null
  hreflangTags: { lang: string; href: string }[]
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
    isHttps: url.startsWith('https://'),
    viewportMeta: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: null,
    hreflangTags: [],
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

  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i)
  if (viewportMatch) result.viewportMeta = viewportMatch[1].trim()

  // Open Graph
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i)
  if (ogTitleMatch) result.ogTitle = decodeHtmlEntities(ogTitleMatch[1].trim())

  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i)
  if (ogDescMatch) result.ogDescription = decodeHtmlEntities(ogDescMatch[1].trim())

  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i)
  if (ogImageMatch) result.ogImage = ogImageMatch[1].trim()

  const twitterCardMatch = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']twitter:card["']/i)
  if (twitterCardMatch) result.twitterCard = twitterCardMatch[1].trim()

  // hreflang
  const hreflangMatches = html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']*)["'][^>]+href=["']([^"']*)["']/gi)
  for (const m of hreflangMatches) {
    result.hreflangTags.push({ lang: m[1], href: m[2] })
  }
  const hreflangMatches2 = html.matchAll(/<link[^>]+hreflang=["']([^"']*)["'][^>]+href=["']([^"']*)["'][^>]+rel=["']alternate["']/gi)
  for (const m of hreflangMatches2) {
    result.hreflangTags.push({ lang: m[1], href: m[2] })
  }

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

  const linkMatches = html.matchAll(/<a([^>]*)>/gi)
  for (const m of linkMatches) {
    const attrs = m[1]
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/i)
    const textMatch = attrs.match(/>([\s\S]*?)<\/a>/i)
    const relMatch = attrs.match(/rel=["']([^"']*)["']/i)
    if (hrefMatch) {
      result.links.push({
        href: hrefMatch[1],
        text: textMatch ? stripTags(textMatch[1]).trim() : '',
        rel: relMatch ? relMatch[1] : undefined,
      })
    }
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

// --- Command-specific finding generators ---

function generateTechnicalFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (!pageData.isHttps) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Site is not served over HTTPS',
      description: 'The page is served over HTTP. Google has used HTTPS as a ranking signal since 2014.',
      recommendation: 'Install an SSL certificate and configure redirects from HTTP to HTTPS.',
    })
    critical++
  }

  if (!pageData.viewportMeta) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Missing viewport meta tag',
      description: 'No viewport meta tag found. This is required for mobile-friendly pages.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.',
    })
    critical++
  }

  if (pageData.redirectCount > 1) {
    findings.push({
      severity: 'warning',
      category: 'technical',
      title: 'Redirect chain detected',
      description: `Found ${pageData.redirectCount} redirect(s). Chains slow crawling and indexing.`,
      recommendation: 'Consolidate redirects to a single hop where possible.',
    })
    warnings++
  }

  if (!pageData.title) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Missing title tag',
      description: 'No title tag found on this page.',
      recommendation: 'Add a unique, descriptive title tag between 30–60 characters.',
    })
    critical++
  } else if (pageData.title.length < 30) {
    findings.push({
      severity: 'warning',
      category: 'technical',
      title: 'Title tag too short',
      description: `Title is ${pageData.title.length} characters. Aim for 30–60 characters.`,
      recommendation: 'Expand the title to include your primary keyword and value proposition.',
    })
    warnings++
  } else if (pageData.title.length > 60) {
    findings.push({
      severity: 'warning',
      category: 'technical',
      title: 'Title tag too long',
      description: `Title is ${pageData.title.length} characters. Google truncates at ~60 characters.`,
      recommendation: 'Shorten the title to under 60 characters while keeping the primary keyword.',
    })
    warnings++
  }

  if (!pageData.canonical) {
    findings.push({
      severity: 'warning',
      category: 'technical',
      title: 'Missing canonical tag',
      description: 'No canonical URL found. This may lead to duplicate content issues.',
      recommendation: 'Add a <link rel="canonical"> tag pointing to the preferred URL.',
    })
    warnings++
  }

  if (pageData.h1s.length === 0) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Missing H1 tag',
      description: 'No H1 heading found on this page.',
      recommendation: 'Add exactly one H1 tag containing your primary keyword.',
    })
    critical++
  } else if (pageData.h1s.length > 1) {
    findings.push({
      severity: 'warning',
      category: 'technical',
      title: 'Multiple H1 tags',
      description: `Found ${pageData.h1s.length} H1 tags. Only one H1 is recommended per page.`,
      recommendation: 'Use exactly one H1 tag as the main page heading.',
    })
    warnings++
  }

  if (pageData.robotsMeta && (pageData.robotsMeta.includes('noindex') || pageData.robotsMeta.includes('none'))) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Page is set to noindex',
      description: `The robots meta tag contains "${pageData.robotsMeta}" which prevents indexing.`,
      recommendation: 'Remove the noindex directive if you want this page to appear in search results.',
    })
    critical++
  }

  if (pageData.h2s.length === 0 && pageData.wordCount > 300) {
    findings.push({
      severity: 'info',
      category: 'technical',
      title: 'No H2 subheadings found',
      description: 'The page has substantial content but no H2 headings to structure it.',
      recommendation: 'Break long content into sections with descriptive H2 subheadings.',
    })
  }

  // Link analysis
  const internalLinks = pageData.links.filter(l => {
    try { return new URL(l.href).hostname === new URL(pageData.finalUrl).hostname } catch { return false }
  })
  const externalLinks = pageData.links.filter(l => {
    try { return new URL(l.href).hostname !== new URL(pageData.finalUrl).hostname } catch { return false }
  })
  if (internalLinks.length < 3 && pageData.wordCount > 300) {
    findings.push({
      severity: 'info',
      category: 'technical',
      title: 'Few internal links',
      description: `Only ${internalLinks.length} internal link(s) found. Internal linking helps distribute page authority.`,
      recommendation: 'Add more internal links to related pages and key landing pages.',
    })
  }
  if (externalLinks.length > 0) {
    findings.push({
      severity: 'info',
      category: 'technical',
      title: `${externalLinks.length} external link(s) found`,
      description: `The page links to ${externalLinks.length} external site(s).`,
      recommendation: 'Ensure external links open in a new tab and use rel="noopener" for security.',
    })
  }

  return { critical, warnings }
}

function generateContentFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (!pageData.metaDescription) {
    findings.push({
      severity: 'warning',
      category: 'content',
      title: 'Missing meta description',
      description: 'No meta description found on this page.',
      recommendation: 'Add a meta description between 120–160 characters that summarizes the page.',
    })
    warnings++
  } else if (pageData.metaDescription.length > 160) {
    findings.push({
      severity: 'info',
      category: 'content',
      title: 'Meta description too long',
      description: `Meta description is ${pageData.metaDescription.length} characters. Google truncates at ~160.`,
      recommendation: 'Shorten to under 160 characters.',
    })
  } else if (pageData.metaDescription.length < 70) {
    findings.push({
      severity: 'warning',
      category: 'content',
      title: 'Meta description too short',
      description: `Meta description is only ${pageData.metaDescription.length} characters. Aim for 120–160.`,
      recommendation: 'Expand the meta description to better describe the page and entice clicks.',
    })
    warnings++
  }

  if (pageData.wordCount < 300 && pageData.wordCount > 0) {
    findings.push({
      severity: 'warning',
      category: 'content',
      title: 'Thin content detected',
      description: `Page has only ~${pageData.wordCount} words. Competitive pages typically have 800+ words.`,
      recommendation: 'Add comprehensive, useful content that fully covers the topic.',
    })
    warnings++
  } else if (pageData.wordCount >= 300 && pageData.wordCount < 600) {
    findings.push({
      severity: 'info',
      category: 'content',
      title: 'Content could be expanded',
      description: `Page has ~${pageData.wordCount} words. Comprehensive coverage typically requires 800+ words for competitive topics.`,
      recommendation: 'Consider expanding the content with more details, FAQs, or supporting sections.',
    })
  } else if (pageData.wordCount >= 600) {
    findings.push({
      severity: 'info',
      category: 'content',
      title: `Good content length (~${pageData.wordCount} words)`,
      description: 'The page has substantial content which is positive for SEO.',
      recommendation: 'Ensure content is well-structured, covers the topic thoroughly, and demonstrates expertise.',
    })
  }

  if (!pageData.ogTitle || !pageData.ogDescription || !pageData.ogImage) {
    const missing = [
      !pageData.ogTitle && 'og:title',
      !pageData.ogDescription && 'og:description',
      !pageData.ogImage && 'og:image',
    ].filter(Boolean).join(', ')
    findings.push({
      severity: 'warning',
      category: 'content',
      title: 'Incomplete Open Graph tags',
      description: `Missing Open Graph properties: ${missing}. These are needed for proper social media sharing.`,
      recommendation: 'Add all Open Graph meta tags (og:title, og:description, og:image) for rich social previews.',
    })
    warnings++
  }

  if (!pageData.twitterCard) {
    findings.push({
      severity: 'info',
      category: 'content',
      title: 'No Twitter Card meta tags',
      description: 'No Twitter Card meta tags found. These control how your page looks when shared on Twitter/X.',
      recommendation: 'Add <meta name="twitter:card" content="summary_large_image"> and related tags.',
    })
  }

  return { critical, warnings }
}

function generateSchemaFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  const warnings = 0

  if (pageData.schemaMarkup.length === 0) {
    findings.push({
      severity: 'warning',
      category: 'schema',
      title: 'No structured data detected',
      description: 'No Schema.org markup found on this page.',
      recommendation: 'Add relevant Schema.org markup (Organization, WebPage, Article, Product) to improve rich result eligibility.',
    })
  } else {
    const schemaTypes = pageData.schemaMarkup
      .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
      .map(s => (s['@type'] as string) || 'Unknown')

    findings.push({
      severity: 'info',
      category: 'schema',
      title: `${pageData.schemaMarkup.length} schema type(s) detected`,
      description: `Found: ${schemaTypes.join(', ')}`,
      recommendation: 'Validate all schema markup at schema.org/validator to ensure it is error-free.',
    })

    const hasOrg = schemaTypes.some(t => t === 'Organization' || t === 'LocalBusiness')
    if (!hasOrg) {
      findings.push({
        severity: 'info',
        category: 'schema',
        title: 'Organization schema not found',
        description: 'No Organization or LocalBusiness schema detected on this page.',
        recommendation: 'Add Organization schema to your homepage or site-wide template to establish brand identity in search.',
      })
    }

    const hasBreadcrumb = schemaTypes.some(t => t === 'BreadcrumbList')
    if (!hasBreadcrumb) {
      findings.push({
        severity: 'info',
        category: 'schema',
        title: 'BreadcrumbList schema not found',
        description: 'No BreadcrumbList schema detected. Breadcrumbs can appear in search results.',
        recommendation: 'Add BreadcrumbList schema to pages deeper than the homepage.',
      })
    }
  }

  return { critical, warnings }
}

function generatePerformanceFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (pageData.responseTimeMs > 3000) {
    findings.push({
      severity: 'critical',
      category: 'performance',
      title: 'Slow server response time (TTFB)',
      description: `Time to First Byte is ${pageData.responseTimeMs}ms. Google recommends under 600ms.`,
      recommendation: 'Optimize server response time, enable caching, and use a CDN.',
    })
    critical++
  } else if (pageData.responseTimeMs > 1500) {
    findings.push({
      severity: 'warning',
      category: 'performance',
      title: 'Moderate server response time',
      description: `TTFB is ${pageData.responseTimeMs}ms. Aim for under 600ms for best Core Web Vitals.`,
      recommendation: 'Consider server-side caching, database query optimization, or a CDN.',
    })
    warnings++
  } else {
    findings.push({
      severity: 'info',
      category: 'performance',
      title: `Good server response time (${pageData.responseTimeMs}ms)`,
      description: 'Server responds quickly, which is good for Core Web Vitals (TTFB).',
      recommendation: 'Continue monitoring TTFB over time and after deployments.',
    })
  }

  return { critical, warnings }
}

function generateImageFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  const imagesWithoutAlt = pageData.images.filter(img => !img.alt || img.alt.trim() === '')
  if (imagesWithoutAlt.length > 0) {
    findings.push({
      severity: 'warning',
      category: 'images',
      title: `${imagesWithoutAlt.length} image${imagesWithoutAlt.length > 1 ? 's' : ''} missing alt text`,
      description: `${imagesWithoutAlt.length} of ${pageData.images.length} images have no alt text. Alt text is critical for accessibility and image SEO.`,
      recommendation: 'Add descriptive alt text to all meaningful images. Use empty alt="" for decorative images.',
    })
    warnings++
  }

  const svgImages = pageData.images.filter(img => img.src.toLowerCase().endsWith('.svg'))
  const potentiallyHeavy = pageData.images.filter(img =>
    !img.src.toLowerCase().endsWith('.webp') &&
    !img.src.toLowerCase().endsWith('.avif') &&
    !img.src.toLowerCase().endsWith('.svg') &&
    (img.src.toLowerCase().endsWith('.jpg') || img.src.toLowerCase().endsWith('.jpeg') || img.src.toLowerCase().endsWith('.png'))
  )

  if (potentiallyHeavy.length > 0) {
    findings.push({
      severity: 'info',
      category: 'images',
      title: `${potentiallyHeavy.length} image(s) could use modern formats`,
      description: `${potentiallyHeavy.length} image(s) are served as JPEG/PNG instead of WebP or AVIF.`,
      recommendation: 'Convert images to WebP or AVIF format for 25–50% smaller file sizes with the same quality.',
    })
  }

  if (pageData.images.length === 0) {
    findings.push({
      severity: 'info',
      category: 'images',
      title: 'No images detected',
      description: 'No <img> tags found on this page.',
      recommendation: 'Consider adding relevant images to improve engagement and provide Google Image Search opportunities.',
    })
  }

  if (svgImages.length > 0) {
    findings.push({
      severity: 'info',
      category: 'images',
      title: `${svgImages.length} SVG image(s) found`,
      description: 'SVG images are already vector-optimized, which is good for logos and icons.',
      recommendation: 'Ensure SVG files are minified and do not include unnecessary metadata.',
    })
  }

  return { critical, warnings }
}

function generateGeoFindings(hasLlmsTxt: boolean, robotsContent: string | null, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (hasLlmsTxt) {
    findings.push({
      severity: 'info',
      category: 'geo',
      title: 'llms.txt found',
      description: 'An llms.txt file exists to guide AI crawlers on your content.',
      recommendation: 'Keep llms.txt up to date as you add new content sections.',
    })
  } else {
    findings.push({
      severity: 'warning',
      category: 'geo',
      title: 'llms.txt not found',
      description: 'No llms.txt file found at the root of this domain.',
      recommendation: 'Create an llms.txt file to guide AI crawlers (ChatGPT, Perplexity, etc.) on how to access and cite your content.',
    })
    warnings++
  }

  if (robotsContent) {
    const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot']
    const blockedCrawlers = aiCrawlers.filter(bot =>
      robotsContent.includes(bot) && robotsContent.toLowerCase().includes('disallow')
    )
    if (blockedCrawlers.length > 0) {
      findings.push({
        severity: 'warning',
        category: 'geo',
        title: 'AI crawlers may be blocked in robots.txt',
        description: `Your robots.txt references: ${blockedCrawlers.join(', ')} with Disallow rules.`,
        recommendation: 'Consider allowing AI crawlers to index your content to appear in AI-generated answers.',
      })
      warnings++
    } else {
      findings.push({
        severity: 'info',
        category: 'geo',
        title: 'AI crawlers not explicitly blocked',
        description: 'No AI crawler blocks detected in robots.txt.',
        recommendation: 'Consider adding explicit Allow rules for AI crawlers to signal open access.',
      })
    }
  }

  findings.push({
    severity: 'info',
    category: 'geo',
    title: 'GEO optimization checklist',
    description: 'For AI search visibility, ensure your content is factual, well-structured, and citable.',
    recommendation: 'Add FAQ sections, clear author attribution, publication dates, and cite credible sources to improve AI citation likelihood.',
  })

  return { critical, warnings }
}

function generateSitemapFindings(sitemapContent: string | null, sitemapUrl: string, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (!sitemapContent) {
    findings.push({
      severity: 'critical',
      category: 'sitemap',
      title: 'No sitemap.xml found',
      description: `Could not find a sitemap at ${sitemapUrl}.`,
      recommendation: 'Create an XML sitemap and submit it to Google Search Console and Bing Webmaster Tools.',
    })
    critical++
    return { critical, warnings }
  }

  const urlMatches = sitemapContent.match(/<url>/gi) || []
  const urlCount = urlMatches.length

  if (urlCount === 0) {
    findings.push({
      severity: 'critical',
      category: 'sitemap',
      title: 'Sitemap appears empty',
      description: 'The sitemap.xml file exists but contains no <url> entries.',
      recommendation: 'Regenerate your sitemap to include all indexable pages.',
    })
    critical++
  } else {
    findings.push({
      severity: 'info',
      category: 'sitemap',
      title: `Sitemap found with ${urlCount} URL(s)`,
      description: `sitemap.xml contains ${urlCount} URL entries.`,
      recommendation: 'Ensure all important pages are included and submit the sitemap to Search Console.',
    })
  }

  const hasLastmod = sitemapContent.includes('<lastmod>')
  if (!hasLastmod) {
    findings.push({
      severity: 'info',
      category: 'sitemap',
      title: 'Sitemap missing lastmod dates',
      description: 'No <lastmod> tags found in the sitemap.',
      recommendation: 'Add <lastmod> dates to help crawlers prioritize recently updated pages.',
    })
  }

  const hasPriority = sitemapContent.includes('<priority>')
  if (!hasPriority && urlCount > 10) {
    findings.push({
      severity: 'info',
      category: 'sitemap',
      title: 'Sitemap missing priority hints',
      description: 'No <priority> tags found. While not critical, they can help direct crawl budget.',
      recommendation: 'Add <priority> values (0.1–1.0) to signal the relative importance of pages.',
    })
  }

  if (urlCount > 50000) {
    findings.push({
      severity: 'warning',
      category: 'sitemap',
      title: 'Sitemap exceeds recommended URL limit',
      description: `Sitemap has ${urlCount} URLs. Google recommends splitting sitemaps at 50,000 URLs.`,
      recommendation: 'Split into multiple sitemaps and reference them from a sitemap index file.',
    })
    warnings++
  }

  return { critical, warnings }
}

function generateHreflangFindings(pageData: PageFetchResult, findings: Finding[]): { critical: number; warnings: number } {
  let critical = 0
  let warnings = 0

  if (pageData.hreflangTags.length === 0) {
    findings.push({
      severity: 'info',
      category: 'hreflang',
      title: 'No hreflang tags found',
      description: 'No hreflang attributes detected on this page.',
      recommendation: 'If you target multiple countries or languages, add hreflang tags to signal the correct version to search engines.',
    })
    return { critical, warnings }
  }

  findings.push({
    severity: 'info',
    category: 'hreflang',
    title: `${pageData.hreflangTags.length} hreflang tag(s) found`,
    description: `Languages/regions: ${pageData.hreflangTags.map(t => t.lang).join(', ')}`,
    recommendation: 'Verify each hreflang URL returns the correct page and that all alternate pages link back to each other.',
  })

  const hasXDefault = pageData.hreflangTags.some(t => t.lang === 'x-default')
  if (!hasXDefault) {
    findings.push({
      severity: 'warning',
      category: 'hreflang',
      title: 'Missing x-default hreflang',
      description: 'No x-default hreflang found. This should point to the fallback page for unmatched regions.',
      recommendation: 'Add <link rel="alternate" hreflang="x-default" href="..."> pointing to your default language page.',
    })
    warnings++
  }

  const duplicateLangs = pageData.hreflangTags
    .map(t => t.lang)
    .filter((lang, idx, arr) => arr.indexOf(lang) !== idx)
  if (duplicateLangs.length > 0) {
    findings.push({
      severity: 'critical',
      category: 'hreflang',
      title: 'Duplicate hreflang language codes',
      description: `Duplicate hreflang values found: ${duplicateLangs.join(', ')}`,
      recommendation: 'Remove duplicate hreflang tags. Each language/region combination should appear exactly once.',
    })
    critical++
  }

  return { critical, warnings }
}

function generatePlanFindings(url: string, pageData: PageFetchResult | null, findings: Finding[]): void {
  const domain = (() => { try { return new URL(url).hostname } catch { return url } })()

  findings.push({
    severity: 'info',
    category: 'technical',
    title: 'SEO Plan: Technical Foundation',
    description: `Priority 1 — Ensure HTTPS, fast TTFB (<600ms), mobile-friendly viewport, canonical tags, and clean URL structure for ${domain}.`,
    recommendation: 'Run /seo technical to get a full technical audit and fix all critical issues first.',
  })
  findings.push({
    severity: 'info',
    category: 'content',
    title: 'SEO Plan: Content Strategy',
    description: 'Priority 2 — Develop a keyword-focused content calendar. Target long-tail keywords with clear search intent.',
    recommendation: 'Create pillar pages for core topics, then supporting cluster content. Aim for 1,500+ words on pillar pages.',
  })
  findings.push({
    severity: 'info',
    category: 'schema',
    title: 'SEO Plan: Structured Data',
    description: 'Priority 3 — Implement Organization, WebPage, and content-specific schema (Article, Product, FAQPage) to qualify for rich results.',
    recommendation: 'Run /seo schema to audit current markup and identify rich result opportunities.',
  })
  findings.push({
    severity: 'info',
    category: 'geo',
    title: 'SEO Plan: AI Search Optimization',
    description: 'Priority 4 — Optimize for AI-powered search (ChatGPT, Perplexity, Google AI Overviews) by creating citable, factual content.',
    recommendation: 'Add llms.txt, include FAQ sections, cite sources, and ensure content is clearly attributed to authors.',
  })
  findings.push({
    severity: 'info',
    category: 'technical',
    title: 'SEO Plan: Core Web Vitals',
    description: 'Priority 5 — Achieve "Good" CWV scores: LCP <2.5s, CLS <0.1, INP <200ms.',
    recommendation: 'Use PageSpeed Insights to identify CWV issues. Optimize images, reduce JavaScript, and use lazy loading.',
  })

  if (pageData) {
    if (!pageData.title || pageData.h1s.length === 0) {
      findings.push({
        severity: 'warning',
        category: 'technical',
        title: 'SEO Plan: Immediate Action Required',
        description: 'Critical on-page elements (title tag or H1) are missing. These must be fixed before any other SEO work.',
        recommendation: 'Fix missing title and H1 tags immediately. These are foundational to all other SEO efforts.',
      })
    }
    if (!pageData.canonical) {
      findings.push({
        severity: 'warning',
        category: 'technical',
        title: 'SEO Plan: Add Canonical Tags',
        description: 'No canonical tags detected. Implement canonical tags site-wide to prevent duplicate content issues.',
        recommendation: 'Add self-referencing canonicals to all pages as part of your technical SEO template.',
      })
    }
  }
}

function generateProgrammaticFindings(url: string, pageData: PageFetchResult | null, findings: Finding[]): void {
  const domain = (() => { try { return new URL(url).hostname } catch { return url } })()

  findings.push({
    severity: 'info',
    category: 'technical',
    title: 'Programmatic SEO: URL Structure Analysis',
    description: `Analyze ${domain}'s URL patterns to identify programmatic page opportunities (location-based, category-based, comparison pages).`,
    recommendation: 'Map out repeatable page templates where structured data can generate hundreds or thousands of unique, valuable pages.',
  })
  findings.push({
    severity: 'info',
    category: 'content',
    title: 'Programmatic SEO: Content Template Quality',
    description: 'Each programmatic page must provide unique value — avoid near-duplicate pages that only change a keyword or location name.',
    recommendation: 'Ensure each template includes unique data points (reviews, prices, local details) that differ meaningfully between pages.',
  })
  findings.push({
    severity: 'info',
    category: 'schema',
    title: 'Programmatic SEO: Structured Data at Scale',
    description: 'Programmatic pages should include dynamically generated schema markup matching the page type.',
    recommendation: 'Use templated JSON-LD injection based on your data source to add Product, LocalBusiness, or FAQ schema to every generated page.',
  })
  findings.push({
    severity: 'warning',
    category: 'technical',
    title: 'Programmatic SEO: Crawl Budget Consideration',
    description: 'Large programmatic sites (1,000+ pages) can exhaust Google\'s crawl budget if pages are thin or low-quality.',
    recommendation: 'Use noindex on low-value pages, implement pagination, and submit a sitemap index to help Google prioritize crawling.',
  })

  if (pageData && pageData.wordCount < 300) {
    findings.push({
      severity: 'critical',
      category: 'content',
      title: 'Programmatic SEO: Thin Content Risk',
      description: `This page has only ~${pageData.wordCount} words. Programmatic pages with thin content risk being classified as doorway pages.`,
      recommendation: 'Each programmatic page must have sufficient unique content. Minimum 300 words; 600+ recommended.',
    })
  }
}

function generateCompetitorFindings(url: string, findings: Finding[]): void {
  findings.push({
    severity: 'info',
    category: 'content',
    title: 'Competitor Analysis: Page Structure',
    description: 'To create effective competitor comparison pages, analyze the top 3 ranking competitors\' page structure, word count, and schema usage.',
    recommendation: 'Use /seo page on competitor URLs to compare their technical and content approach against yours.',
  })
  findings.push({
    severity: 'info',
    category: 'schema',
    title: 'Competitor Analysis: Structured Data Gaps',
    description: 'Competitor pages that use rich schema types (Product, Review, FAQ) gain enhanced SERP features that drive higher CTR.',
    recommendation: 'Identify which schema types competitors use and implement the same (or better) on your comparison pages.',
  })
  findings.push({
    severity: 'info',
    category: 'content',
    title: 'Competitor Analysis: Content Differentiation',
    description: 'Effective competitor comparison pages highlight your unique advantages without being dismissive.',
    recommendation: 'Include comparison tables, unbiased feature lists, and genuine use case recommendations. Pages that are honest tend to rank better.',
  })
  findings.push({
    severity: 'info',
    category: 'technical',
    title: 'Competitor Analysis: Internal Linking',
    description: 'Comparison pages should be well-linked from your main navigation and product pages.',
    recommendation: 'Add "vs competitors" links in your site navigation and from relevant feature/pricing pages to boost the ranking potential of comparison pages.',
  })
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

  // Fetch robots.txt and sitemap
  const parsedUrlObj = new URL(url)
  const baseOrigin = `${parsedUrlObj.protocol}//${parsedUrlObj.hostname}`
  const llmsTxtUrl = `${baseOrigin}/llms.txt`
  const robotsTxtUrl = `${baseOrigin}/robots.txt`
  const sitemapUrl = `${baseOrigin}/sitemap.xml`

  let hasLlmsTxt = false
  let robotsContent: string | null = null
  let sitemapContent: string | null = null

  const [llmsRes, robotsRes, sitemapRes] = await Promise.allSettled([
    fetch(llmsTxtUrl, { signal: AbortSignal.timeout(5000) }),
    fetch(robotsTxtUrl, { signal: AbortSignal.timeout(5000) }),
    (command === 'sitemap' || command === 'audit') ? fetch(sitemapUrl, { signal: AbortSignal.timeout(8000) }) : Promise.reject(),
  ])

  if (llmsRes.status === 'fulfilled' && llmsRes.value.ok) hasLlmsTxt = true
  if (robotsRes.status === 'fulfilled' && robotsRes.value.ok) {
    robotsContent = await robotsRes.value.text()
  }
  if (sitemapRes.status === 'fulfilled' && sitemapRes.value.ok) {
    sitemapContent = await sitemapRes.value.text()
  }

  raw.checked = {
    llms_txt: llmsTxtUrl,
    robots_txt: robotsTxtUrl,
    has_llms_txt: hasLlmsTxt,
    has_robots_txt: !!robotsContent,
  }

  // Handle page-level errors up front for commands that need page data
  if (pageData && pageData.error && pageData.statusCode === 0 && command !== 'plan' && command !== 'programmatic' && command !== 'competitor-pages') {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: 'Page could not be fetched',
      description: `Unable to reach the URL: ${pageData.error}`,
      recommendation: 'Ensure the URL is accessible and the server is running correctly.',
    })
    return {
      overall_score: 10,
      technical_score: 10,
      content_score: null,
      schema_score: null,
      performance_score: null,
      images_score: null,
      geo_score: null,
      raw_data: raw,
      findings,
    }
  }

  if (pageData && pageData.statusCode >= 400) {
    findings.push({
      severity: 'critical',
      category: 'technical',
      title: `Page returns HTTP ${pageData.statusCode}`,
      description: `The URL returned an error status code ${pageData.statusCode}.`,
      recommendation: 'Fix the server error or redirect to the correct URL.',
    })
  }

  // --- Dispatch command-specific analysis ---

  let technicalCritical = 0
  let technicalWarnings = 0
  let contentCritical = 0
  let contentWarnings = 0
  let schemaCritical = 0
  let schemaWarnings = 0
  let perfCritical = 0
  let perfWarnings = 0
  let imageCritical = 0
  let imageWarnings = 0
  let geoCritical = 0
  let geoWarnings = 0

  switch (command) {
    case 'technical': {
      if (pageData && !pageData.error) {
        const t = generateTechnicalFindings(pageData, findings)
        technicalCritical = t.critical
        technicalWarnings = t.warnings
        const p = generatePerformanceFindings(pageData, findings)
        perfCritical = p.critical
        perfWarnings = p.warnings
      }
      break
    }

    case 'content': {
      if (pageData && !pageData.error) {
        const c = generateContentFindings(pageData, findings)
        contentCritical = c.critical
        contentWarnings = c.warnings
        const t = generateTechnicalFindings(pageData, findings)
        technicalCritical = t.critical
        technicalWarnings = t.warnings
      }
      break
    }

    case 'schema': {
      if (pageData && !pageData.error) {
        const s = generateSchemaFindings(pageData, findings)
        schemaCritical = s.critical
        schemaWarnings = s.warnings
      }
      break
    }

    case 'sitemap': {
      generateSitemapFindings(sitemapContent, sitemapUrl, findings).critical
      const sm = generateSitemapFindings(sitemapContent, sitemapUrl, findings)
      schemaCritical = sm.critical
      schemaWarnings = sm.warnings
      break
    }

    case 'images': {
      if (pageData && !pageData.error) {
        const i = generateImageFindings(pageData, findings)
        imageCritical = i.critical
        imageWarnings = i.warnings
      }
      break
    }

    case 'geo': {
      const g = generateGeoFindings(hasLlmsTxt, robotsContent, findings)
      geoCritical = g.critical
      geoWarnings = g.warnings
      if (pageData && !pageData.error) {
        const c = generateContentFindings(pageData, findings)
        contentCritical = c.critical
        contentWarnings = c.warnings
      }
      break
    }

    case 'hreflang': {
      if (pageData && !pageData.error) {
        const h = generateHreflangFindings(pageData, findings)
        technicalCritical = h.critical
        technicalWarnings = h.warnings
      }
      break
    }

    case 'plan': {
      generatePlanFindings(url, pageData, findings)
      break
    }

    case 'programmatic': {
      generateProgrammaticFindings(url, pageData, findings)
      break
    }

    case 'competitor-pages': {
      generateCompetitorFindings(url, findings)
      break
    }

    case 'page':
    case 'audit':
    default: {
      if (pageData && !pageData.error) {
        const t = generateTechnicalFindings(pageData, findings)
        technicalCritical = t.critical
        technicalWarnings = t.warnings
        const c = generateContentFindings(pageData, findings)
        contentCritical = c.critical
        contentWarnings = c.warnings
        const s = generateSchemaFindings(pageData, findings)
        schemaCritical = s.critical
        schemaWarnings = s.warnings
        const p = generatePerformanceFindings(pageData, findings)
        perfCritical = p.critical
        perfWarnings = p.warnings
        const i = generateImageFindings(pageData, findings)
        imageCritical = i.critical
        imageWarnings = i.warnings
        const g = generateGeoFindings(hasLlmsTxt, robotsContent, findings)
        geoCritical = g.critical
        geoWarnings = g.warnings
        if (command === 'audit') {
          const sm = generateSitemapFindings(sitemapContent, sitemapUrl, findings)
          schemaCritical += sm.critical
          schemaWarnings += sm.warnings
        }
      }
      break
    }
  }

  // --- Score computation ---

  const technicalFindings = findings.filter(f => f.category === 'technical')
  const contentFindings = findings.filter(f => f.category === 'content')
  const schemaFindings = findings.filter(f => f.category === 'schema')
  const perfFindings = findings.filter(f => f.category === 'performance')
  const imageFindings = findings.filter(f => f.category === 'images')
  const geoFindings = findings.filter(f => f.category === 'geo')

  const technicalScore = ['technical', 'audit', 'page', 'content', 'hreflang'].includes(command)
    ? scoreFromIssues(technicalCritical, technicalWarnings, technicalFindings.length + 5)
    : null

  const contentScore = ['content', 'audit', 'page', 'geo', 'plan', 'programmatic', 'competitor-pages'].includes(command)
    ? scoreFromIssues(contentCritical, contentWarnings, contentFindings.length + 3)
    : null

  const schemaScore = ['schema', 'audit', 'page', 'sitemap'].includes(command)
    ? (command === 'sitemap'
        ? scoreFromIssues(schemaCritical, schemaWarnings, schemaFindings.length + 2)
        : (pageData?.schemaMarkup && pageData.schemaMarkup.length > 0 ? 80 : 40))
    : null

  const performanceScore = ['technical', 'audit', 'page'].includes(command)
    ? scoreFromIssues(perfCritical, perfWarnings, perfFindings.length + 3)
    : null

  const imagesScore = ['images', 'audit', 'page'].includes(command)
    ? scoreFromIssues(imageCritical, imageWarnings, imageFindings.length + 2)
    : null

  const geoScore = ['geo', 'audit'].includes(command)
    ? scoreFromIssues(geoCritical, geoWarnings, geoFindings.length + 2)
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
