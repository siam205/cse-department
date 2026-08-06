import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentLayout } from '@/lib/identity';
import { getPrivateDownloadUrl } from '@/lib/cloudinary';
import DepartmentLayoutClient from './DepartmentLayoutClient';

export const metadata = {
  title: 'Department Layout',
  description: 'Department layout and building plan.',
};

export default async function DepartmentLayoutPage() {
  const layout = await getDepartmentLayout();
  const pdf = layout?.pdfUrl && layout.pdfPublicId
    ? getPrivateDownloadUrl(layout.pdfPublicId)
    : '';

  return (
    <PageShell
      title={layout?.title ?? 'Department Layout'}
      subtitle={layout?.description ?? undefined}
      overline="About"
      image={layout?.heroImageUrl ?? layout?.coverUrl ?? '/assets/admission-hero.webp'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <DepartmentLayoutClient
          title={layout?.title ?? 'Department Layout'}
          cover={layout?.coverUrl ?? ''}
          pdf={pdf}
        />
      </Container>
    </PageShell>
  );
}
