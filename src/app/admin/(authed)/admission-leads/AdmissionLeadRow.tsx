'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, GraduationCap, MailCheck, Archive, Inbox, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';
import {
  updateAdmissionLeadStatusAction,
  deleteAdmissionLeadAction,
} from '@/lib/admin-actions/admission-leads';

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  programmeName: string;
  status: string;
  submittedAt: string;
  emailSentAt: string | null;
  emailError: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdmissionLeadRow({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const confirm = useConfirm();
  // The row lives in a status-filtered list, so once its status
  // changes it no longer belongs here — hide it immediately rather
  // than waiting for the refresh to drop it.
  const [removed, setRemoved] = useState(false);

  async function handleStatus(next: 'new' | 'read' | 'archived', label: string) {
    const res = await updateAdmissionLeadStatusAction(lead.id, next);
    if (res.ok) {
      setRemoved(true);
      toast.success(label);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete lead?',
      message: `${lead.name}'s enquiry will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteAdmissionLeadAction(lead.id);
    if (res.ok) {
      setRemoved(true);
      toast.success('Lead removed');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (removed) return null;

  return (
    <li className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-semibold text-gray-900">{lead.name}</span>
            <span className="text-xs text-gray-400">{formatDate(lead.submittedAt)}</span>
            {lead.emailSentAt ? (
              <span className="text-[10px] text-emerald-600">✓ emailed</span>
            ) : lead.emailError ? (
              <span className="text-[10px] text-amber-600" title={lead.emailError}>
                email skipped
              </span>
            ) : null}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <a
              href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <Phone size={12} className="text-accent shrink-0" />
              <span className="font-medium">{lead.phone}</span>
            </a>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={12} className="text-accent shrink-0" />
              <span className="truncate">{lead.programmeName}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {lead.status !== 'new' && (
            <button
              type="button"
              onClick={() => handleStatus('new', 'Moved back to New')}
              aria-label="Move back to new"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Inbox size={16} />
            </button>
          )}
          {lead.status !== 'read' && (
            <button
              type="button"
              onClick={() => handleStatus('read', 'Marked as contacted')}
              aria-label="Mark as contacted"
              className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <MailCheck size={16} />
            </button>
          )}
          {lead.status !== 'archived' && (
            <button
              type="button"
              onClick={() => handleStatus('archived', 'Archived')}
              aria-label="Archive"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Archive size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${lead.name}`}
            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
