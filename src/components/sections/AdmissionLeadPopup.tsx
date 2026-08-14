'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';

// Per-browser "already seen" marker. Written the moment the modal
// OPENS (not on close) — otherwise a visitor who reloads mid-countdown
// restarts the timer forever and gets shown the modal on every visit.
const SEEN_KEY = 'su-cse-admission-lead-popup';

type Programme = { id: string; programName: string };

export type AdmissionLeadPopupSettings = {
  delaySeconds: number;
  heading: string;
  subheading: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  programmeLabel: string;
  programmePlaceholder: string;
  buttonLabel: string;
  footnote: string;
  successMessage: string;
};

type FormState = 'idle' | 'submitting' | 'submitted' | 'error';

export default function AdmissionLeadPopup({
  settings,
  programmes,
}: {
  settings: AdmissionLeadPopupSettings;
  programmes: readonly Programme[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>('idle');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [programmeName, setProgrammeName] = useState('');
  // Honeypot — hidden from humans; bots that fill every input trip it
  // and get silently discarded server-side.
  const [website, setWebsite] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Delayed open. Bails out entirely if this browser has seen it.
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) !== null;
    } catch {
      // Private mode / storage disabled — treat as unseen and just
      // don't persist. Better to show it than to crash.
    }
    if (seen) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      try {
        window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
      } catch {
        // ignore — see above
      }
    }, Math.max(0, settings.delaySeconds) * 1000);

    return () => window.clearTimeout(timer);
  }, [settings.delaySeconds]);

  const close = useCallback(() => setOpen(false), []);

  // Escape to dismiss + body scroll lock, mirroring the public Navbar
  // mobile-drawer convention.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  // Move focus into the dialog when it opens so keyboard and screen
  // reader users land on the content rather than staying behind it.
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admission-lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, programmeName, website }),
      });
      if (res.ok) {
        setState('submitted');
        window.setTimeout(() => setOpen(false), 3500);
        return;
      }
      let serverMessage = 'Something went wrong. Please try again.';
      try {
        const data = await res.json();
        if (typeof data?.error === 'string' && data.error.length > 0) {
          serverMessage = data.error;
        }
      } catch {
        // non-JSON response — keep the generic message
      }
      setErrorMsg(serverMessage);
      setState('error');
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
      setState('error');
    }
  };

  if (!open) return null;

  const isSubmitting = state === 'submitting';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.button
        type="button"
        aria-label="Close"
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-primary/50 backdrop-blur-[2px]"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admission-lead-heading"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Gradient top edge — matches the site's primary→accent chrome */}
        <div className="h-1.5 rounded-t-2xl gradient-blue-magenta" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-5 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <X size={16} />
        </button>

        <div className="p-7 md:p-8">
          {state === 'submitted' ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary mb-2">
                Thank you!
              </h2>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                {settings.successMessage}
              </p>
            </div>
          ) : (
            <>
              <h2
                id="admission-lead-heading"
                className="font-display text-[22px] md:text-[24px] font-bold text-primary leading-tight pr-8 mb-2"
              >
                {settings.heading}
              </h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                {settings.subheading}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot — off-screen, out of the tab order. */}
                <div aria-hidden="true" style={honeypotWrapStyle}>
                  <label htmlFor="lead-website">Website (leave empty)</label>
                  <input
                    id="lead-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <Field label={settings.nameLabel} htmlFor="lead-name" required>
                  <input
                    id="lead-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete="name"
                    placeholder={settings.namePlaceholder}
                    className={inputClass}
                  />
                </Field>

                <Field label={settings.phoneLabel} htmlFor="lead-phone" required>
                  <input
                    id="lead-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder={settings.phonePlaceholder}
                    className={inputClass}
                  />
                </Field>

                <Field label={settings.programmeLabel} htmlFor="lead-programme" required>
                  <select
                    id="lead-programme"
                    value={programmeName}
                    onChange={(e) => setProgrammeName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={`${inputClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10 ${
                      programmeName ? 'text-gray-800' : 'text-gray-400'
                    }`}
                    style={{ backgroundImage: CHEVRON_SVG }}
                  >
                    <option value="" disabled>
                      {settings.programmePlaceholder}
                    </option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.programName} className="text-gray-800">
                        {p.programName}
                      </option>
                    ))}
                  </select>
                </Field>

                {state === 'error' && errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-white text-[15px] font-semibold rounded-xl shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      {settings.buttonLabel}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-[12px] text-gray-400">
                  {settings.footnote}
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/15 transition disabled:opacity-60';

// Inline chevron for the <select> (appearance-none strips the native
// arrow; a data URI avoids an extra network request).
const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const honeypotWrapStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 mb-1.5 text-[13px] font-semibold text-primary"
      >
        {label}
        {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
