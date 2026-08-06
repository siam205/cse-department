import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getProspectusEntries, getPageHero } from '@/lib/identity';
import { getPrivateDownloadUrl } from '@/lib/cloudinary';
import ProspectusClient from './ProspectusClient';

export const metadata = {
  title: 'Prospectus — Department of Mechanical Engineering',
  description: 'Program prospectus PDFs for Mechanical Engineering at Sonargaon University.',
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
    pdf: p.pdfUrl && p.pdfPublicId ? getPrivateDownloadUrl(p.pdfPublicId) : '',
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
