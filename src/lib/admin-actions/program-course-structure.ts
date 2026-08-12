'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { programCourseStructureUpdateSchema } from '@/lib/validation';

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
function parseJsonArray(fd: FormData, key: string): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateSurfaces(degreeCode?: string) {
  revalidatePath('/admin/programs');
  revalidatePath('/admin');
  if (degreeCode) revalidatePath(`/programs/${degreeCode}`);
  revalidatePath('/', 'layout');
}

// Upsert keyed by programId — admin form lives at
// /admin/programs/[id]/course-structure, so the same action handles
// both "create" and "update" for this program's 1:1 row.
export async function upsertProgramCourseStructureAction(
  programId: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true, degreeCode: true },
  });
  if (!program) return { ok: false, error: 'Program not found' };

  const raw = {
    programId,
    careerProspectsHeading: getStr(formData, 'careerProspectsHeading'),
    careerProspectsBody:    getStr(formData, 'careerProspectsBody'),
    sessionalBadgeIconName: getStr(formData, 'sessionalBadgeIconName') || 'FlaskConical',
    semesters:               parseJsonArray(formData, 'semesters'),
    pdfUrl:                  emptyToNull(formData.get('pdfUrl')),
    pdfPublicId:             emptyToNull(formData.get('pdfPublicId')),
    pdfFileName:             emptyToNull(formData.get('pdfFileName')),
  };

  const parsed = programCourseStructureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const data = {
    programId,
    careerProspectsHeading: parsed.data.careerProspectsHeading,
    careerProspectsBody:    sanitizeHtml(parsed.data.careerProspectsBody),
    sessionalBadgeIconName: parsed.data.sessionalBadgeIconName,
    semesters:               parsed.data.semesters as unknown as Prisma.InputJsonValue,
    pdfUrl:                  parsed.data.pdfUrl ?? null,
    pdfPublicId:             parsed.data.pdfPublicId ?? null,
    pdfFileName:             parsed.data.pdfFileName ?? null,
  };

  try {
    await prisma.programCourseStructure.upsert({
      where:  { programId },
      create: data,
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateSurfaces(program.degreeCode);
  return { ok: true };
}

export async function deleteProgramCourseStructureAction(programId: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { degreeCode: true },
  });

  try {
    await prisma.programCourseStructure.delete({ where: { programId } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Course structure not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSurfaces(program?.degreeCode);
  return { ok: true };
}
