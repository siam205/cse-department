import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ServiceCharterItemForm from '../ServiceCharterItemForm';

export const metadata = { title: 'New service charter item' };

export default async function NewServiceCharterItemPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add service</h1>
        <p className="mt-1 text-sm text-gray-500">New service card for <code className="font-mono">/student-society/service-charter</code>.</p>
      </header>
      <ServiceCharterItemForm initial={null} />
    </div>
  );
}
