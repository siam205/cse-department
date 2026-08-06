'use client';

import Image from 'next/image';
import { Download, FileText } from 'lucide-react';

type Props = {
  title: string;
  cover: string;
  pdf: string;
};

export default function DepartmentLayoutClient({ title, cover, pdf }: Props) {
  return (
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

        <div className="p-5">
          <h2 className="font-display text-lg font-bold text-primary leading-snug mb-1">
            {title}
          </h2>
          <p className="text-sm text-gray-600 mb-5">Official department layout document</p>

          {pdf ? (
            <a
              href={pdf}
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
  );
}
