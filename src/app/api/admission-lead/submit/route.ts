import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { admissionLeadCreateSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendAdmissionLeadNotification } from '@/lib/email';

// Honeypot field name — must match the hidden input in
// AdmissionLeadPopup. Same convention (and same silent-200 response)
// as the contact form: bots see success and move on.
const HONEYPOT_FIELD = 'website';

function getClientIp(request: NextRequest): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    if (first) return first.trim();
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const honeypotValue = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof honeypotValue === 'string' && honeypotValue.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Separate bucket from the contact form so a visitor who used one
  // form isn't blocked from the other.
  const limit = checkRateLimit(`admission-lead:${ip ?? 'no-ip'}`);
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetMs - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many submissions from your IP. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const parsed = admissionLeadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // notifyEmail overrides the shared contact address when set, so the
  // admission team can route leads separately from general enquiries.
  const [settings, identity] = await Promise.all([
    prisma.admissionLeadPopupSettings.findUnique({
      where: { id: 'singleton' },
      select: { notifyEmail: true },
    }),
    prisma.universityIdentity.findUnique({
      where: { id: 'singleton' },
      select: { contactSubmissionEmail: true },
    }),
  ]);
  const recipient = settings?.notifyEmail ?? identity?.contactSubmissionEmail ?? null;

  // Persist BEFORE the email attempt — the DB is the source of truth
  // and emailSentAt/emailError are dispatch metadata patched in after.
  const lead = await prisma.admissionLead.create({
    data: {
      ...parsed.data,
      ipAddress: ip,
      userAgent: userAgent ?? null,
    },
  });

  const dispatch = await sendAdmissionLeadNotification({
    to: recipient,
    name: lead.name,
    phone: lead.phone,
    programmeName: lead.programmeName,
    submittedAt: lead.submittedAt,
    ipAddress: lead.ipAddress,
  });

  let emailSentAt: Date | null = null;
  let emailError: string | null = null;
  if (dispatch.status === 'sent') {
    emailSentAt = new Date();
  } else if (dispatch.status === 'skipped') {
    emailError = `skipped: ${dispatch.reason}`;
  } else if (dispatch.status === 'failed') {
    emailError = dispatch.error;
  }

  if (emailSentAt || emailError) {
    await prisma.admissionLead.update({
      where: { id: lead.id },
      data: { emailSentAt, emailError },
    });
  }

  // Sidebar badge count + dashboard stat read from this table.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/admission-leads');
  revalidatePath('/admin');

  return NextResponse.json({ ok: true });
}
