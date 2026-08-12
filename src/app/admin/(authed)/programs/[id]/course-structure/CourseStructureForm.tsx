'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { ProgramCourseStructure } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import IconInputField from '@/components/admin/IconInputField';
import CourseStructureEditor from '@/components/admin/CourseStructureEditor';
import {
  upsertProgramCourseStructureAction,
  deleteProgramCourseStructureAction,
  type ActionResult,
} from '@/lib/admin-actions/program-course-structure';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type State = ActionResult | { ok: null };

type ProgramSummary = { id: string; programName: string; degreeCode: string };

type PdfState = { url: string; publicId: string; fileName: string };

export default function CourseStructureForm({
  program,
  initial,
}: {
  program: ProgramSummary;
  initial: ProgramCourseStructure | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const action = upsertProgramCourseStructureAction.bind(null, program.id);
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  const [pdf, setPdf] = useState<PdfState>({
    url:      initial?.pdfUrl ?? '',
    publicId: initial?.pdfPublicId ?? '',
    fileName: initial?.pdfFileName ?? '',
  });

  const [sessionalIcon, setSessionalIcon] = useState(initial?.sessionalBadgeIconName ?? 'FlaskConical');

  useEffect(() => {
    if (state.ok === true) toast.success('Course structure saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete course structure?',
      message: `The Career Prospects / Course Structure / Credit Distribution section for "${program.programName}" will be removed from the public page. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteProgramCourseStructureAction(program.id);
    if (res.ok) {
      toast.success('Course structure deleted');
      router.push('/admin/programs');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Career Prospects">
        <TextField label="Section heading" name="careerProspectsHeading" required
                   defaultValue={initial?.careerProspectsHeading ?? 'Career Prospects'} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <RichTextEditor
            name="careerProspectsBody"
            initialValue={initial?.careerProspectsBody ?? ''}
            placeholder="Graduates of this program…"
            minHeight="220px"
          />
        </div>
      </Card>

      <Card title="Course structure & credit distribution">
        <p className="text-xs text-gray-500 -mt-2">
          One entry per semester, in display order. Drag to reorder semesters and courses.
          Core / Elective / Lab / Project / Total / Cumulative are the Credit Distribution
          table columns shown on the public page.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            &quot;Sessional&quot; badge icon
          </label>
          <IconInputField
            name="sessionalBadgeIconName"
            value={sessionalIcon}
            onChange={setSessionalIcon}
            placeholder="e.g. FlaskConical"
            helperText="Shown next to any course whose title contains “Sessional”."
          />
        </div>
        <CourseStructureEditor name="semesters" initialValue={initial?.semesters ?? []} />
      </Card>

      <Card title="Download PDF (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          If uploaded, a &quot;Download PDF&quot; button appears below the tables on the public page.
        </p>
        <ImageUploader
          kind="program-course-pdf"
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

      <div className="flex justify-between items-center">
        {initial ? (
          <button type="button" onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
            <Trash2 size={14} />
            Delete course structure
          </button>
        ) : <span />}
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : initial ? 'Save changes' : 'Create course structure'}
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

function TextField({
  label, name, defaultValue, required, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="text"
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
    </div>
  );
}
