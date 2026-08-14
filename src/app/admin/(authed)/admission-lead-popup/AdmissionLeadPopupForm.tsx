'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AdmissionLeadPopupSettings } from '@prisma/client';
import {
  updateAdmissionLeadPopupSettingsAction,
  type ActionResult,
} from '@/lib/admin-actions/admission-leads';

type State = ActionResult | { ok: null };

// Launch copy — also the fallback shown on an unseeded install so the
// admin never faces a blank form.
const DEFAULTS = {
  heading: 'Start your journey with Sonargaon University',
  subheading: 'Get personalized admission guidance from our admission team.',
  nameLabel: 'Full name',
  namePlaceholder: 'As written on your certificate',
  phoneLabel: 'Mobile number',
  phonePlaceholder: '01XXXXXXXXX',
  programmeLabel: 'Programme you are interested in',
  programmePlaceholder: 'Choose a programme',
  buttonLabel: 'Get admission guidance',
  footnote: 'Our admission team will contact you shortly.',
  successMessage:
    'Our admission team will contact you shortly with personalized guidance.',
};

export default function AdmissionLeadPopupForm({
  initial,
}: {
  initial: AdmissionLeadPopupSettings | null;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateAdmissionLeadPopupSettingsAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Popup settings saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Behaviour">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial?.enabled ?? true}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-2 focus:ring-accent/40"
          />
          <span>
            <span className="block text-sm font-medium text-gray-700">
              Show the popup on the homepage
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Uncheck to switch it off entirely without losing the copy below.
            </span>
          </span>
        </label>

        <TextField
          label="Delay before showing (seconds)"
          name="delaySeconds"
          type="number"
          required
          defaultValue={String(initial?.delaySeconds ?? 15)}
          hint="How long a visitor stays on the homepage before the popup opens. Each visitor sees it only once per browser."
        />
      </Card>

      <Card title="Copy">
        <TextField label="Heading" name="heading" required
                   defaultValue={initial?.heading ?? DEFAULTS.heading} />
        <TextAreaField label="Subheading" name="subheading" required rows={2}
                       defaultValue={initial?.subheading ?? DEFAULTS.subheading} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Name field label" name="nameLabel" required
                     defaultValue={initial?.nameLabel ?? DEFAULTS.nameLabel} />
          <TextField label="Name field placeholder" name="namePlaceholder" required
                     defaultValue={initial?.namePlaceholder ?? DEFAULTS.namePlaceholder} />
          <TextField label="Mobile field label" name="phoneLabel" required
                     defaultValue={initial?.phoneLabel ?? DEFAULTS.phoneLabel} />
          <TextField label="Mobile field placeholder" name="phonePlaceholder" required
                     defaultValue={initial?.phonePlaceholder ?? DEFAULTS.phonePlaceholder} />
          <TextField label="Programme field label" name="programmeLabel" required
                     defaultValue={initial?.programmeLabel ?? DEFAULTS.programmeLabel} />
          <TextField label="Programme dropdown placeholder" name="programmePlaceholder" required
                     defaultValue={initial?.programmePlaceholder ?? DEFAULTS.programmePlaceholder}
                     hint="The options themselves come from Programs." />
        </div>

        <TextField label="Button label" name="buttonLabel" required
                   defaultValue={initial?.buttonLabel ?? DEFAULTS.buttonLabel} />
        <TextField label="Footnote (under the button)" name="footnote" required
                   defaultValue={initial?.footnote ?? DEFAULTS.footnote} />
        <TextAreaField label="Success message (after submitting)" name="successMessage" required rows={2}
                       defaultValue={initial?.successMessage ?? DEFAULTS.successMessage} />
      </Card>

      <Card title="Notifications">
        <TextField
          label="Notify this email on each new lead"
          name="notifyEmail"
          type="email"
          defaultValue={initial?.notifyEmail ?? ''}
          hint="Leave empty to use the same address as Contact Submissions (set in University Identity)."
        />
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

function TextField({
  label, name, defaultValue, required, placeholder, type = 'text', hint,
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
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
