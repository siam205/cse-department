'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { ServiceCharterItem } from '@prisma/client';
import {
  createServiceCharterItemAction,
  updateServiceCharterItemAction,
  type ActionResult,
} from '@/lib/admin-actions/service-charter';

type State = ActionResult | { ok: null };

export default function ServiceCharterItemForm({ initial }: { initial: ServiceCharterItem | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateServiceCharterItemAction.bind(null, initial!.id) : createServiceCharterItemAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Service saved' : 'Service created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Service">
        <TextField label="Slug" name="slug" required monospace
                   defaultValue={initial?.slug ?? ''} placeholder="course-pre-registration" />
        <TextField label="Service name" name="service" required
                   defaultValue={initial?.service ?? ''} placeholder="Course pre-registration" />
        <TextAreaField label="Process" name="process" required rows={4}
                       defaultValue={initial?.process ?? ''}
                       placeholder="The department will announce the pre-registration schedule. Students must complete all outstanding dues..." />
        <TextField label="Room no. (optional)" name="roomNo"
                   defaultValue={initial?.roomNo ?? ''} placeholder="501 or 501, 311 or Reception Desk" />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/service-charter-items" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to service charter items
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create service'}
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
  label, name, defaultValue, required, placeholder, monospace,
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; monospace?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="text"
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${monospace ? 'font-mono' : ''}`} />
    </div>
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
