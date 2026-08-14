// Single source of truth for the site's public origin.
//
// Used by the root layout (metadataBase → canonical + OG/Twitter image
// URLs), sitemap.xml, and robots.txt. Keeping it in one place means the
// eventual move off Vercel to Hostinger is a one-line env change rather
// than a hunt through three files.
//
// Override per environment with NEXT_PUBLIC_SITE_URL (no trailing
// slash), e.g. NEXT_PUBLIC_SITE_URL=https://cse.su.edu.bd
const FALLBACK_SITE_URL = 'https://su-cse.vercel.app';

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL,
);
