'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  serviceCharterLandingUpdateSchema,
  serviceCharterItemCreateSchema,
  serviceCharterItemUpdateSchema,
} from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateServiceCharterSurfaces() {
  revalidatePath('/student-society/service-charter');
  revalidatePath('/admin/service-charter-landing');
  revalidatePath('/admin/service-charter-items');
  revalidatePath('/admin');
}

// ─────────────────────────────────────────────────────────────────
//  LANDING (singleton)
// ─────────────────────────────────────────────────────────────────
export async function updateServiceCharterLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = serviceCharterLandingUpdateSchema.safeParse({
    introBody:   getStr(formData, 'introBody'),
    noteBody:    emptyToNull(formData.get('noteBody')),
    pdfUrl:      emptyToNull(formData.get('pdfUrl')),
    pdfPublicId: emptyToNull(formData.get('pdfPublicId')),
    pdfFileName: emptyToNull(formData.get('pdfFileName')),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.serviceCharterLanding.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateServiceCharterSurfaces();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  ITEMS (multi-row)
// ─────────────────────────────────────────────────────────────────
function readServiceCharterItemRow(formData: FormData) {
  return {
    slug:    getStr(formData, 'slug'),
    service: getStr(formData, 'service'),
    process: getStr(formData, 'process'),
    roomNo:  emptyToNull(formData.get('roomNo')),
  };
}

export async function createServiceCharterItemAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = serviceCharterItemCreateSchema.safeParse(readServiceCharterItemRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.serviceCharterItem.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.serviceCharterItem.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `Slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateServiceCharterSurfaces();
  redirect('/admin/service-charter-items');
}

export async function updateServiceCharterItemAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = serviceCharterItemUpdateSchema.safeParse(readServiceCharterItemRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.serviceCharterItem.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Service not found' };
    if (code === 'P2002') return { ok: false, error: 'Slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateServiceCharterSurfaces();
  revalidatePath(`/admin/service-charter-items/${id}`);
  return { ok: true };
}

export async function deleteServiceCharterItemAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.serviceCharterItem.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Service not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateServiceCharterSurfaces();
  return { ok: true };
}

export async function reorderServiceCharterItemsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.serviceCharterItem.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing services' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.serviceCharterItem.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateServiceCharterSurfaces();
  return { ok: true };
}
