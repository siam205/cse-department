import type { Metadata } from 'next';
import { Poppins, Montserrat, Hind_Siliguri } from 'next/font/google';
import { getDepartmentIdentity } from '@/lib/identity';
import { SITE_URL } from '@/lib/site-url';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

const SITE_NAME = 'Sonargaon University — CSE Department';
const SITE_DESCRIPTION =
  'Department of Computer Science & Engineering at Sonargaon University — programs, faculty, research areas, labs, admissions, and campus services.';
// Renamed (not just re-uploaded) from og-banner.webp so social
// platforms that cache OG previews by URL (Facebook, LinkedIn,
// WhatsApp, etc.) are forced to fetch fresh content instead of
// continuing to serve their old cached snapshot.
const OG_IMAGE = '/assets/og-banner-cse.webp';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Plain string, not { default, template } — every page under (public)/
  // already sets its own full title (e.g. "Research — Department of
  // Computer Science & Engineering"), so a parent template would
  // double-suffix it. This plain string is what the homepage (which sets
  // no metadata of its own) falls back to.
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // NO `alternates.canonical` here on purpose. A canonical set on the
  // root layout is inherited by every page that doesn't override it,
  // which pointed all 36 public pages at '/' — telling search engines
  // each one was a duplicate of the homepage. Pages that want a
  // canonical set their own; the rest self-canonicalize, which is the
  // correct default.
  //
  // Likewise `openGraph` omits title/description/url: Next.js fills
  // those from each page's own title/description, so a share of
  // /research gets the research card instead of the homepage's.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Sonargaon University — Department of Computer Science & Engineering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGE],
  },
};

// Phase 18 — minimal root layout. The previous root layout pulled in
// the admin-vs-public chrome conditional via `headers()` to read
// x-pathname, which forced every public route into dynamic rendering
// and blocked ISR. Chrome rendering now lives in the (public)/ and
// admin/ route group layouts; this root layout only sets up the
// HTML shell, fonts, and the DB-driven brand-color CSS vars on
// <html>. getDepartmentIdentity is React.cache-wrapped and a plain
// DB query, so it does NOT force dynamic rendering — the resulting
// brand vars are baked into the ISR cache for public routes.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dept = await getDepartmentIdentity();
  const brandVars = {
    '--color-primary': dept.primaryColor,
    '--color-accent': dept.accentColor,
    '--color-button-yellow': dept.buttonColor,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${montserrat.variable} ${hindSiliguri.variable}`}
      style={brandVars}
    >
      <body className="min-h-screen flex flex-col selection:bg-accent/30">
        {children}
      </body>
    </html>
  );
}
