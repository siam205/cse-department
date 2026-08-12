import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import CourseStructureForm from './CourseStructureForm';

export const metadata = { title: 'Edit course structure' };

export default async function EditCourseStructurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: { courseStructure: true },
  });
  if (!program) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <Link href="/admin/programs" className="text-xs text-gray-500 hover:text-accent transition-colors">
          ← All programs
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900 mt-2">
          Course structure: <span className="text-accent">{program.programName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          <code className="font-mono">{program.degreeCode}</code> ·{' '}
          {program.courseStructure ? 'Edit existing course structure' : 'Create course structure for this program'}
          {' · '}Renders on <code className="font-mono">/programs/{program.degreeCode}</code>
        </p>
      </header>
      <CourseStructureForm
        program={{ id: program.id, programName: program.programName, degreeCode: program.degreeCode }}
        initial={program.courseStructure}
      />
    </div>
  );
}
