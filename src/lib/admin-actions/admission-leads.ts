'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  admissionLeadPopupSettingsUpdateSchema,
  admissionLeadStatusUpdateSchema,
} from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// The popup lives on the homepage, so settings changes must
// invalidate '/' as well as the admin surfaces.
function revalidatePopupSurfaces() {
  revalidatePath('/');
  revalidatePath('/admin/admission-lead-popup');
  revalidatePath('/admin');
}

// ─────────────────────────────────────────────────────────────────
//  Settings — singleton upsert
// ─────────────────────────────────────────────────────────────────

export async function updateAdmissionLeadPopupSettingsAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    // An unchecked checkbox submits nothing at all, so absence = off.
    enabled:              formData.get('enabled') === 'on',
    delaySeconds:         getStr(formData, 'delaySeconds'),
    heading:              getStr(formData, 'heading'),
    subheading:           getStr(formData, 'subheading'),
    nameLabel:            getStr(formData, 'nameLabel'),
    namePlaceholder:      getStr(formData, 'namePlaceholder'),
    phoneLabel:           getStr(formData, 'phoneLabel'),
    phonePlaceholder:     getStr(formData, 'phonePlaceholder'),
    programmeLabel:       getStr(formData, 'programmeLabel'),
    programmePlaceholder: getStr(formData, 'programmePlaceholder'),
    buttonLabel:          getStr(formData, 'buttonLabel'),
    footnote:             getStr(formData, 'footnote'),
    successMessage:       getStr(formData, 'successMessage'),
    notifyEmail:          getStr(formData, 'notifyEmail'),
  };

  const parsed = admissionLeadPopupSettingsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.admissionLeadPopupSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePopupSurfaces();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Leads — status update + delete
// ─────────────────────────────────────────────────────────────────

export async function updateAdmissionLeadStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = admissionLeadStatusUpdateSchema.safeParse({ status });
  if (!parsed.success) {
    return { ok: false, error: 'Invalid status' };
  }

  try {
    await prisma.admissionLead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Lead not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/admission-leads');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function deleteAdmissionLeadAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await prisma.admissionLead.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Lead not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/admission-leads');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true };
}
