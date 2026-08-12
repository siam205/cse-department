'use client';

import Image from 'next/image';
import { Download, FileText, ExternalLink } from 'lucide-react';

type Room = { label: string; value: string };

type Props = {
  title: string;
  universityName: string;
  departmentName: string;
  rooms: Room[];
  cover: string;
  pdfView: string;
  pdfDownload: string;
};

export default function DepartmentLayoutClient({
  title,
  universityName,
  departmentName,
  rooms,
  cover,
  pdfView,
  pdfDownload,
}: Props) {
  return (
    <div className="space-y-10 md:space-y-14">
      {rooms.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
          <div className="text-center px-6 pt-8 pb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-primary">
              {universityName}
            </h2>
            <p className="text-[15px] md:text-base text-gray-600 mt-1">{departmentName}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Name of the Office
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Room No.
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, i) => {
                  const [primary, ...rest] = room.label.split('\n');
                  return (
                    <tr key={i} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-3.5 align-top">
                        <span className="text-[14px] font-semibold text-primary">{primary}</span>
                        {rest.length > 0 && (
                          <span className="block text-[13px] text-gray-500">{rest.join(' ')}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 align-top text-[14px] text-accent font-medium whitespace-nowrap">
                        {room.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <div className="text-center mb-6">
          <h2 className="font-display text-xl md:text-2xl font-bold text-primary">
            Download the plan
          </h2>
          <p className="text-sm text-gray-600 mt-1">The same directory as a printable document.</p>
        </div>

        <div className="flex justify-center">
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-md">
            {cover ? (
              <div className="bg-gray-50">
                <Image
                  src={cover}
                  alt={title}
                  width={1200}
                  height={800}
                  sizes="(min-width: 768px) 448px, 100vw"
                  className="block w-full h-auto"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center bg-gray-50 text-sm text-gray-400">
                Cover image not uploaded
              </div>
            )}

            <div className="p-5 space-y-2.5">
              <h2 className="font-display text-lg font-bold text-primary leading-snug mb-1">
                {title}
              </h2>

              {pdfView && (
                <a
                  href={pdfView}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 border-2 border-primary text-primary hover:bg-primary/5 text-sm font-semibold rounded-md transition-colors"
                >
                  <ExternalLink size={16} />
                  View Layout
                </a>
              )}

              {pdfDownload ? (
                <a
                  href={pdfDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  <Download size={16} />
                  Download
                </a>
              ) : (
                <span className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-gray-100 text-gray-400 text-sm font-semibold rounded-md">
                  <FileText size={16} />
                  PDF coming soon
                </span>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
