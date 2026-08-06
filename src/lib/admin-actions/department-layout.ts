'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { departmentLayoutUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function updateDepartmentLayoutAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const parsed = departmentLayoutUpdateSchema.safeParse({
    title:         getStr(formData, 'title'),
    description:   emptyToNull(formData.get('description')),
    heroImageUrl:  emptyToNull(formData.get('heroImageUrl')),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    coverUrl:      getStr(formData, 'coverUrl'),
    coverPublicId: emptyToNull(formData.get('coverPublicId')),
    pdfUrl:        emptyToNull(formData.get('pdfUrl')),
    pdfPublicId:   emptyToNull(formData.get('pdfPublicId')),
    pdfFileName:   emptyToNull(formData.get('pdfFileName')),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.departmentLayout.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Database error' };
  }

  revalidatePath('/admin/about-department-layout');
  revalidatePath('/admin');
  revalidatePath('/about/department-layout');
  return { ok: true };
}
