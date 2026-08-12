import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ClipboardList, CreditCard, Download, LayoutPanelLeft } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import { getProgramByDegreeCode } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import CourseStructureClient, { type SemesterRow } from './CourseStructureClient';

type OverviewStat = { iconName: string; label: string; value: string };

function coerceSemesters(value: unknown): SemesterRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      label:             typeof s.label === 'string' ? s.label : '',
      coreCredits:       typeof s.coreCredits === 'number' ? s.coreCredits : 0,
      electiveCredits:   typeof s.electiveCredits === 'number' ? s.electiveCredits : 0,
      labCredits:        typeof s.labCredits === 'number' ? s.labCredits : 0,
      projectCredits:    typeof s.projectCredits === 'number' ? s.projectCredits : 0,
      totalCredits:      typeof s.totalCredits === 'number' ? s.totalCredits : 0,
      cumulativeCredits: typeof s.cumulativeCredits === 'number' ? s.cumulativeCredits : 0,
      courses: Array.isArray(s.courses)
        ? (s.courses as unknown[])
            .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
            .map((c) => ({
              code:         typeof c.code === 'string' ? c.code : '',
              title:        typeof c.title === 'string' ? c.title : '',
              type:         typeof c.type === 'string' ? c.type : '',
              credits:      typeof c.credits === 'number' ? c.credits : 0,
              isSessional:  typeof c.isSessional === 'boolean' ? c.isSessional : false,
              prerequisite: typeof c.prerequisite === 'string' ? c.prerequisite : '',
            }))
        : [],
    }))
    .filter((s) => s.label);
}

function fmtCredits(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function overviewStats(value: unknown): OverviewStat[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      iconName: typeof item.iconName === 'string' ? item.iconName : 'GraduationCap',
      label: typeof item.label === 'string' ? item.label : '',
      value: typeof item.value === 'string' ? item.value : '',
    }))
    .filter((item) => item.label && item.value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ degreeCode: string }>;
}) {
  const { degreeCode } = await params;
  const program = await getProgramByDegreeCode(degreeCode);
  return {
    title: program ? `${program.programName} — Sonargaon University` : 'Program',
    description: program?.description,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ degreeCode: string }>;
}) {
  const { degreeCode } = await params;
  const program = await getProgramByDegreeCode(degreeCode);
  if (!program) notFound();

  const parts = program.programName.split(' — ');
  const heading = parts.length > 1 ? parts.slice(1).join(' — ') : program.programName;
  const stats = overviewStats(program.feeStructure?.overviewStats);
  const semesters = coerceSemesters(program.courseStructure?.semesters);
  const hasPdf = !!(program.courseStructure?.pdfUrl && program.courseStructure?.pdfPublicId);

  return (
    <PageShell
      title={heading}
      subtitle={`${program.duration}${program.duration && !program.duration.endsWith('.') ? '.' : ''} Explore the academic journey, course structure, and career opportunities in this program.`}
      overline="Programs"
      image={program.imageUrl ?? '/assets/program-undergraduate.webp'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container className="!max-w-[1500px]">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
            {program.description}
          </p>
        </div>

        {stats.length > 0 && (
          <section className="mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              At a Glance
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {stats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm text-center min-h-[138px] flex flex-col items-center justify-center">
                  <div className="inline-flex w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent text-white items-center justify-center mb-3 shadow-md">
                    <DynamicLucideIcon name={stat.iconName} size={20} strokeWidth={1.75} />
                  </div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-gray-500 mb-1">{stat.label}</div>
                  <div className="font-display text-lg md:text-xl font-bold text-primary leading-tight">{stat.value}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {program.specializations.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              Specializations
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {program.specializations.map((specialization) => (
                <li key={specialization} className="flex items-center gap-2.5 rounded-lg bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                  <CheckCircle2 size={18} className="shrink-0 text-accent" />
                  {specialization}
                </li>
              ))}
            </ul>
          </section>
        )}

        {program.courseStructure && (
          <section className="mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              {program.courseStructure.careerProspectsHeading}
            </h2>
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 text-gray-700 leading-[1.85] [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-primary [&_a]:text-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(program.courseStructure.careerProspectsBody) }}
            />
          </section>
        )}

        {semesters.length > 0 && (
          <section className="mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              Course Structure
            </h2>
            <CourseStructureClient
              semesters={semesters}
              sessionalIconName={program.courseStructure?.sessionalBadgeIconName}
            />
          </section>
        )}

        {semesters.length > 0 && (
          <section className="mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              Credit Distribution
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60">
                      <th className="px-5 py-3">Semester</th>
                      <th className="px-5 py-3 text-right">Core</th>
                      <th className="px-5 py-3 text-right">Elective</th>
                      <th className="px-5 py-3 text-right">Lab</th>
                      <th className="px-5 py-3 text-right">Project</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesters.map((s) => (
                      <tr key={s.label} className="border-t border-gray-50">
                        <td className="px-5 py-3 text-gray-800 whitespace-nowrap">{s.label}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{s.coreCredits ? fmtCredits(s.coreCredits) : '-'}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{s.electiveCredits ? fmtCredits(s.electiveCredits) : '-'}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{s.labCredits ? fmtCredits(s.labCredits) : '-'}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{s.projectCredits ? fmtCredits(s.projectCredits) : '-'}</td>
                        <td className="px-5 py-3 text-right font-bold text-primary">{fmtCredits(s.totalCredits)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-700">{fmtCredits(s.cumulativeCredits)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {hasPdf && (
          <section className="mb-16 md:mb-20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-md">
                  <LayoutPanelLeft size={20} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-primary text-sm">Course structure and credit distribution</div>
                  <div className="text-xs text-gray-500">The tables on this page, as a PDF you can keep.</div>
                </div>
              </div>
              <a
                href={`/api/cloudinary/download?publicId=${encodeURIComponent(program.courseStructure!.pdfPublicId!)}&format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary/90 transition shrink-0 whitespace-nowrap"
              >
                <Download size={16} />
                Download PDF
              </a>
            </div>
          </section>
        )}

        <section className="max-w-3xl mx-auto rounded-2xl bg-primary px-6 py-10 md:px-12 text-center text-white shadow-xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Ready to Apply?</h2>
          <p className="mt-3 mx-auto max-w-2xl text-white/75 leading-relaxed">
            Review the admission requirements or explore the tuition fee structure for this program.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/admission/requirements" className="inline-flex items-center justify-center gap-2 rounded-lg bg-button-yellow px-6 py-3 font-semibold text-primary hover:brightness-105 transition">
              <ClipboardList size={18} />
              View Requirements
            </Link>
            <Link href="/admission/tuition-fees" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10 transition">
              <CreditCard size={18} />
              Tuition Fees
            </Link>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}
