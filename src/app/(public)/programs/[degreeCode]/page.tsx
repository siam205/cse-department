import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ClipboardList, CreditCard } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import { getProgramByDegreeCode } from '@/lib/identity';

type OverviewStat = { iconName: string; label: string; value: string };

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
  const overline = parts.length > 1 ? parts[0] : 'Academic Program';
  const heading = parts.length > 1 ? parts.slice(1).join(' — ') : program.programName;
  const stats = overviewStats(program.feeStructure?.overviewStats);

  return (
    <PageShell
      title={heading}
      overline={overline}
      image={program.imageUrl ?? '/assets/program-undergraduate.webp'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
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
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10 mb-16 md:mb-20">
            <h2 className="text-center font-display text-2xl md:text-3xl font-bold text-primary mb-8">
              Specializations
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {program.specializations.map((specialization) => (
                <li key={specialization} className="flex items-center gap-2.5 rounded-lg bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                  <CheckCircle2 size={18} className="shrink-0 text-accent" />
                  {specialization}
                </li>
              ))}
            </ul>
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
