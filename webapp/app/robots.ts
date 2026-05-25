import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing'],
        disallow: ['/dashboard', '/projects', '/audits', '/settings', '/api/'],
      },
    ],
    sitemap: 'https://claudeseo.app/sitemap.xml',
  }
}
