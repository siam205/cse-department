import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AdmissionLeadPopupForm from './AdmissionLeadPopupForm';

export const metadata = { title: 'Admission Lead Popup (CMS)' };

export default async function AdmissionLeadPopupPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const [settings, programCount] = await Promise.all([
    prisma.admissionLeadPopupSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.program.count(),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Admission Lead Popup
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          The timed popup on the homepage that collects admission enquiries.
          Submissions land in{' '}
          <a href="/admin/admission-leads" className="text-accent hover:underline">
            Admission Leads
          </a>
          .
        </p>
      </header>

      {programCount === 0 && (
        <div
          role="alert"
          className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
        >
          There are no Programs yet, so the popup will stay hidden even when
          enabled — its dropdown is populated from the Programs list.
        </div>
      )}

      <AdmissionLeadPopupForm initial={settings} />
    </div>
  );
}
