import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ServiceCharterLandingForm from './ServiceCharterLandingForm';

export const metadata = { title: 'Service Charter Landing (CMS)' };

export default async function ServiceCharterLandingAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const landing = await prisma.serviceCharterLanding.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Service Charter Landing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Page chrome for <code className="font-mono">/student-society/service-charter</code> — intro, closing note, and the optional printable PDF. The services themselves are edited via <a href="/admin/service-charter-items" className="text-accent hover:underline">Service Charter Items</a>.
        </p>
      </header>
      <ServiceCharterLandingForm initial={landing} />
    </div>
  );
}
