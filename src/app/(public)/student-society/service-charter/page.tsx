import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getServiceCharterLanding, getServiceCharterItems, getPageHero } from '@/lib/identity';
import ServiceCharterClient from './ServiceCharterClient';

export const metadata = {
  title: 'Service Charter — Department of Computer Science & Engineering',
  description:
    'What to do, in what order, and who to ask — student services at the Department of Computer Science & Engineering, Sonargaon University.',
};

export default async function ServiceCharterPage() {
  const [landing, items, hero] = await Promise.all([
    getServiceCharterLanding(),
    getServiceCharterItems(),
    getPageHero('student-society-service-charter'),
  ]);

  // Routed through the dynamic /api/cloudinary/download redirect so the
  // signed Cloudinary URL is generated fresh on each click instead of
  // being baked into this ISR-cached page (see the department-layout /
  // prospectus / syllabus pages for the same fix).
  const pdfDownload = landing?.pdfPublicId
    ? `/api/cloudinary/download?publicId=${encodeURIComponent(landing.pdfPublicId)}&format=pdf`
    : '';

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Service Charter'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student Society'}
      image={hero?.heroImageUrl ?? '/assets/notice-board-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <ServiceCharterClient
          introBody={landing?.introBody ?? ''}
          noteBody={landing?.noteBody ?? ''}
          items={items}
          pdfDownload={pdfDownload}
        />
      </Container>
    </PageShell>
  );
}
