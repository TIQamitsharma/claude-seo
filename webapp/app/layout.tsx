import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Claude SEO — AI-Powered SEO Analysis",
    template: "%s | Claude SEO",
  },
  description: "Comprehensive SEO analysis powered by AI. Audit your website, analyze content quality, optimize for AI search, and build strategic SEO plans.",
  metadataBase: new URL('https://claudeseo.app'),
  openGraph: {
    type: 'website',
    siteName: 'Claude SEO',
    title: 'Claude SEO — AI-Powered SEO Analysis',
    description: 'Comprehensive SEO analysis powered by AI. Run full site audits, technical checks, schema validation, and GEO optimization.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude SEO — AI-Powered SEO Analysis',
    description: 'Run full site audits, content quality analysis, schema validation, and GEO optimization from Claude.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
