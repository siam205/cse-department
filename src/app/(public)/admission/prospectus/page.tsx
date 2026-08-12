import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getProspectusEntries, getPageHero } from '@/lib/identity';
import ProspectusClient from './ProspectusClient';

export const metadata = {
  title: 'Prospectus — Department of Computer Science & Engineering',
  description: 'Program prospectus PDFs for Computer Science & Engineering at Sonargaon University.',
};

export default async function ProspectusPage() {
  const [entries, hero] = await Promise.all([
    getProspectusEntries(),
    getPageHero('admission-prospectus'),
  ]);
  const items = entries.map((p) => ({
    slug: p.slug,
    title: p.title,
    shortTitle: p.shortTitle,
    department: p.department,
    level: p.level,
    cover: p.coverUrl,
    // Plain secure_url — safe to embed directly in an <iframe> for
    // inline viewing (confirmed publicly reachable, no signing
    // needed).
    pdfView: p.pdfUrl ?? '',
    // Routed through the dynamic /api/cloudinary/download redirect
    // instead of baking a signed private_download_url (time-limited
    // timestamp) into this ISR-cached page — the signature would go
    // stale and Cloudinary would reject it with "Stale request" once
    // the cached page is served more than ~1h after it was generated.
    pdfDownload: p.pdfUrl && p.pdfPublicId
      ? `/api/cloudinary/download?publicId=${encodeURIComponent(p.pdfPublicId)}&format=pdf`
      : '',
  }));

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Prospectus'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? '/assets/admission-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <ProspectusClient items={items} />
      </Container>
    </PageShell>
  );
}
