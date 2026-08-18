import Link from 'next/link';
import { Calendar, MapPin, Users, FileText, BookOpen, Award, BadgeCheck, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getResearchPapers, getResearchPapersCount, getPageHero, researchPaperHref } from '@/lib/identity';

const PAGE_SIZE = 20;

// Q1 (best) → Q4, colour-coded so a scan of the grid reads quality at a
// glance. Falls back to a neutral pill for any other quartile string.
const QUARTILE_STYLES: Record<string, string> = {
  Q1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Q2: 'bg-sky-50 text-sky-700 border-sky-200',
  Q3: 'bg-amber-50 text-amber-700 border-amber-200',
  Q4: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const metadata = {
  title: 'Research — Department of Computer Science & Engineering',
  description:
    'Published research papers from the Department of Computer Science & Engineering, Sonargaon University.',
};

type SearchParams = Promise<{ page?: string | string[] }>;

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const pageNum = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const [papers, total, hero] = await Promise.all([
    getResearchPapers({ skip, take: PAGE_SIZE }),
    getResearchPapersCount(),
    getPageHero('research'),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Research Publications'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Academic Excellence'}
      image={hero?.heroImageUrl ?? undefined}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
          <p className="text-[15px] md:text-[16px] leading-[1.85] text-gray-700">
            A selection of research publications by faculty and students of the
            Department of Computer Science & Engineering, Sonargaon University, spanning
            software engineering, artificial intelligence, machine learning, computer networks,
            and more.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
            <FileText size={14} />
            {total} Publications
          </p>
        </div>

        {papers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No research papers yet.</p>
          </div>
        ) : (
          <>
          <div className="mx-auto max-w-6xl grid gap-5 md:gap-6 lg:grid-cols-2">
            {papers.map((paper, idx) => (
              <article
                key={paper.id}
                className="flex gap-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-5 md:p-6"
              >
                <div className="shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-[15px]">
                    {skip + idx + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] md:text-[16px] font-bold leading-snug text-primary mb-3">
                    {(() => {
                      const target = researchPaperHref(paper);
                      if (!target) return paper.title;
                      return (
                        <a
                          href={target.href}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="hover:text-accent transition-colors inline-flex items-start gap-1.5"
                        >
                          <span>{paper.title}</span>
                          {target.isPdf && (
                            <FileDown
                              size={14}
                              aria-label="PDF available"
                              className="shrink-0 mt-1 text-accent"
                            />
                          )}
                        </a>
                      );
                    })()}
                  </h3>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3 text-[12.5px]">
                    {paper.date && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-accent" />
                        {paper.date}
                      </span>
                    )}
                    {paper.publisher && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <BookOpen size={13} className="text-accent" />
                        {paper.publisher}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 mb-2 text-[13px] leading-[1.6]">
                    <Users size={13} className="shrink-0 mt-1 text-accent" />
                    <span className="text-gray-700 font-medium">
                      {paper.authors}
                      {paper.authorPosition && (
                        <span className="ml-1.5 text-[11px] font-semibold text-accent">
                          ({paper.authorPosition} Author)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mb-3 text-[12.5px] leading-[1.6]">
                    <MapPin size={13} className="shrink-0 mt-1 text-gray-400" />
                    <span className="text-gray-500">{paper.area}</span>
                  </div>

                  {(paper.indexStatus || paper.quartile || paper.citeScore) && (
                    <div className="flex flex-wrap gap-1.5">
                      {paper.indexStatus && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[11px] font-semibold text-primary">
                          <BadgeCheck size={11} />
                          {paper.indexStatus.replace(/\s*\n\s*/g, ' ')}
                        </span>
                      )}
                      {paper.quartile && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                            QUARTILE_STYLES[paper.quartile.trim().toUpperCase()] ??
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {paper.quartile}
                        </span>
                      )}
                      {paper.citeScore && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-700">
                          <Award size={11} />
                          {paper.citeScore.replace(/\s*\n\s*/g, ' · ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Research pagination"
              className="mt-10 md:mt-14 flex items-center justify-center gap-2"
            >
              {pageNum > 1 ? (
                <Link
                  href={pageNum === 2 ? '/research' : `/research?page=${pageNum - 1}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-accent hover:text-accent transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed">
                  <ChevronLeft size={16} />
                  Previous
                </span>
              )}
              <span className="px-4 py-2 text-sm text-gray-600">
                Page <span className="font-semibold text-primary">{pageNum}</span> of <span className="font-semibold text-primary">{totalPages}</span>
              </span>
              {pageNum < totalPages ? (
                <Link
                  href={`/research?page=${pageNum + 1}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-accent hover:text-accent transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed">
                  Next
                  <ChevronRight size={16} />
                </span>
              )}
            </nav>
          )}
          </>
        )}
      </Container>
    </PageShell>
  );
}
