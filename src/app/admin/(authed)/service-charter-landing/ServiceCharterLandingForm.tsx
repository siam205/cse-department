'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ServiceCharterLanding } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  updateServiceCharterLandingAction,
  type ActionResult,
} from '@/lib/admin-actions/service-charter';

type State = ActionResult | { ok: null };
type PdfState = { url: string; publicId: string; fileName: string };

export default function ServiceCharterLandingForm({ initial }: { initial: ServiceCharterLanding | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateServiceCharterLandingAction,
    { ok: null },
  );
  const [pdf, setPdf] = useState<PdfState>({
    url: initial?.pdfUrl ?? '',
    publicId: initial?.pdfPublicId ?? '',
    fileName: initial?.pdfFileName ?? '',
  });

  useEffect(() => {
    if (state.ok === true) toast.success('Service charter landing saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextAreaField label="Intro paragraph" name="introBody" required rows={3}
                       defaultValue={initial?.introBody ?? ''}
                       placeholder="What to do, in what order, and who to ask — for the things students need from the department office through the semester." />
      </Card>

      <Card title="Closing note (optional)">
        <TextAreaField label="Note" name="noteBody" rows={3}
                       defaultValue={initial?.noteBody ?? ''}
                       placeholder="Note: Students are encouraged to regularly check the SU ERP, official university notices, and departmental communication channels for updates." />
      </Card>

      <Card title="Printable PDF (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Delivered through the site download route so protected Cloudinary files remain accessible. Leave empty to show &quot;PDF coming soon&quot; on the public page.
        </p>
        <ImageUploader
          kind="service-charter-pdf"
          name="pdf"
          accept="application/pdf"
          initialUrl={pdf.url}
          initialPublicId={pdf.publicId}
          initialFileType="pdf"
          initialFileName={pdf.fileName}
          onChange={(url, publicId, meta) => {
            setPdf({ url, publicId, fileName: meta?.fileName ?? '' });
          }}
        />
        <input type="hidden" name="pdfUrl" value={pdf.url} />
        <input type="hidden" name="pdfPublicId" value={pdf.publicId} />
        <input type="hidden" name="pdfFileName" value={pdf.fileName} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function TextAreaField({
  label, name, defaultValue, required, rows = 4, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
