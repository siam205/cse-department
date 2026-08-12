'use client';

import { MapPin, ArrowRight, FileText, Download } from 'lucide-react';
import type { ServiceCharterItem } from '@prisma/client';

type Props = {
  introBody: string;
  noteBody: string;
  items: ServiceCharterItem[];
  pdfDownload: string;
};

// Splits a process description around its first URL (if any) so the
// link renders as a real <a> instead of plain text — same convention
// as the Faculty publications / Research Papers link extraction.
function renderProcess(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  if (!match) return <span>{text}</span>;
  const url = match[0].replace(/[.,;:)\]]+$/, '');
  const before = text.slice(0, text.indexOf(url));
  const after = text.slice(text.indexOf(url) + url.length);
  return (
    <span>
      {before}
      <a
        href={url}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="text-accent hover:underline break-all"
      >
        {url}
      </a>
      {after}
    </span>
  );
}

export default function ServiceCharterClient({ introBody, noteBody, items, pdfDownload }: Props) {
  return (
    <div className="space-y-10 md:space-y-14">
      {introBody && (
        <p className="max-w-3xl mx-auto text-center text-[15px] md:text-base text-gray-600 leading-[1.85]">
          {introBody}
        </p>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Service charter content coming soon.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 md:p-6 flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-[13px] shrink-0">
                  {i + 1}
                </div>
                <h3 className="font-display text-[15px] md:text-base font-bold text-primary leading-snug">
                  {item.service}
                </h3>
              </div>

              <div className="flex items-start gap-2 text-[13.5px] leading-relaxed text-gray-700 flex-1">
                <ArrowRight size={14} className="shrink-0 mt-1 text-accent" />
                <p>{renderProcess(item.process)}</p>
              </div>

              {item.roomNo && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[12.5px] text-gray-500">
                  <MapPin size={13} className="text-accent shrink-0" />
                  Room no: {item.roomNo}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {noteBody && (
        <p className="max-w-3xl mx-auto text-center text-[13px] text-gray-500 leading-relaxed">
          {noteBody}
        </p>
      )}

      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-md">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-bold text-primary">Service Charter as a PDF</h3>
            <p className="text-[13px] text-gray-500">
              All {items.length} services, their steps and the person responsible for each — in one document you can keep or print.
            </p>
          </div>
        </div>

        {pdfDownload ? (
          <a
            href={pdfDownload}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 whitespace-nowrap"
          >
            <Download size={16} />
            Download PDF
          </a>
        ) : (
          <span className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed shrink-0 whitespace-nowrap">
            PDF coming soon
          </span>
        )}
      </div>
    </div>
  );
}
