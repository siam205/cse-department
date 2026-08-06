import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import DepartmentLayoutForm from './DepartmentLayoutForm';

export const metadata = { title: 'About — Department Layout' };

export default async function DepartmentLayoutAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.departmentLayout.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">About — Department Layout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload the department layout cover image and downloadable PDF for <code className="font-mono">/about/department-layout</code>.
        </p>
      </header>
      <DepartmentLayoutForm initial={row} />
    </div>
  );
}
