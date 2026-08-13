'use client';

import { useMemo, useState } from 'react';
import { Search, Download, ExternalLink, BookOpen } from 'lucide-react';

type Level = 'Undergraduate' | 'Postgraduate';

export interface ProspectusItem {
  slug: string;
  title: string;
  shortTitle: string;
  department: string;
  level: string; // 'Undergraduate' | 'Postgraduate' (Zod-validated upstream)
  cover: string;
  pdfView: string;
  pdfDownload: string;
}

const filters: ('All' | Level)[] = ['All', 'Undergraduate', 'Postgraduate'];

export default function ProspectusClient({ items }: { items: ProspectusItem[] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<'All' | Level>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (active !== 'All' && p.level !== active) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.level.toLowerCase().includes(q)
      );
    });
  }, [items, query, active]);

  return (
    <>
      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs..."
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => {
            const isActive = active === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-accent hover:text-accent'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-8">
        Showing <span className="font-semibold text-primary">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'program' : 'programs'}
      </p>

      {/* Program prospectus viewers */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          {active === 'Postgraduate' && !query ? (
            <>
              <p className="text-primary font-semibold text-base mb-1">
                Postgraduate prospectus coming soon
              </p>
              <p className="text-gray-500 text-sm">
                Postgraduate programs in Computer Science & Engineering are not offered yet. Please check back later for updates.
              </p>
            </>
          ) : (
            <p className="text-gray-500">No programs match your search.</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {filtered.map((p) => (
            <div key={p.slug}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <div>
                  <span
                    className={`inline-block w-fit px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-2 ${
                      p.level === 'Undergraduate'
                        ? 'bg-primary/8 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {p.level}
                  </span>
                  <h3 className="font-display text-lg md:text-xl font-bold text-primary leading-snug">
                    {p.shortTitle}
                  </h3>
                  <p className="text-sm text-gray-600">{p.department}</p>
                </div>
                {p.pdfView && (
                  <a
                    href={p.pdfView}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
                  >
                    <ExternalLink size={14} />
                    Open in a new tab
                  </a>
                )}
              </div>

              {/* Inline PDF viewer — #toolbar=0&navpanes=0 strips the
                  browser's built-in PDF.js toolbar and thumbnail
                  sidebar, leaving just the page content. */}
              {p.pdfView ? (
                <iframe
                  src={`${p.pdfView}#toolbar=0&navpanes=0&scrollbar=0`}
                  title={`${p.title} preview`}
                  className="mx-auto block w-full max-w-[640px] aspect-[210/297] rounded-2xl border border-gray-200 shadow-sm bg-gray-50 mb-4"
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400 text-sm mb-4">
                  PDF coming soon
                </div>
              )}

              {/* Download card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-md">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-primary text-sm">{p.shortTitle}</div>
                    <div className="text-xs text-gray-500">{p.department}</div>
                  </div>
                </div>
                {p.pdfDownload ? (
                  <a
                    href={p.pdfDownload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap"
                  >
                    <Download size={16} />
                    Download PDF
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed shrink-0 whitespace-nowrap">
                    PDF coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
