import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentLayout, getDepartmentIdentity, getUniversityIdentity } from '@/lib/identity';
import DepartmentLayoutClient from './DepartmentLayoutClient';

export const metadata = {
  title: 'Department Layout',
  description: 'Department layout and building plan.',
};

type Room = { label: string; value: string };

function asRooms(value: unknown): Room[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is Room =>
      typeof r === 'object' && r !== null &&
      typeof (r as Room).label === 'string' && typeof (r as Room).value === 'string',
  );
}

export default async function DepartmentLayoutPage() {
  const [layout, dept, uni] = await Promise.all([
    getDepartmentLayout(),
    getDepartmentIdentity(),
    getUniversityIdentity(),
  ]);
  const rooms = asRooms(layout?.rooms);
  // Routed through the dynamic /api/cloudinary/download redirect so the
  // signed Cloudinary URL (time-limited timestamp) is generated fresh on
  // each click, instead of being baked into this ISR-cached page — a
  // stale-signature "Stale request" error otherwise surfaces once the
  // page has been served from cache for over an hour.
  const pdfDownload = layout?.pdfPublicId
    ? `/api/cloudinary/download?publicId=${encodeURIComponent(layout.pdfPublicId)}&format=pdf`
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
          universityName={uni.name}
          departmentName={`Department of ${dept.name}`}
          rooms={rooms}
          cover={layout?.coverUrl ?? ''}
          pdfView={layout?.pdfUrl ?? ''}
          pdfDownload={pdfDownload}
        />
      </Container>
    </PageShell>
  );
}
