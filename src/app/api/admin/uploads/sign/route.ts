import { NextResponse } from 'next/server';
import {
  requireUser,
  withErrorHandling,
  readJson,
} from '@/lib/auth-server';
import { uploadSignSchema } from '@/lib/validation';
import { signUploadParams } from '@/lib/cloudinary';

// POST /api/admin/uploads/sign
//
//   Body: { kind: 'department-logo' | 'department-hero'
//                 | 'university-logo'  | 'program-image'
//                 | 'research-icon' }
//
//   Returns Cloudinary upload params signed with the server-side
//   API_SECRET. The browser then POSTs the file + these params
//   directly to Cloudinary (https://api.cloudinary.com/v1_1/{cloud}/auto/upload).
//   API_SECRET never leaves the server.
//
//   Any authenticated admin can sign uploads.
//
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Cloudinary uploads are not configured. Missing: ${missing.join(', ')}. Add these variables to .env and restart Next.js.` },
      { status: 503 },
    );
  }
  const body = await readJson(request);
  const { kind } = uploadSignSchema.parse(body);
  const params = signUploadParams(kind);
  return NextResponse.json(params);
});
