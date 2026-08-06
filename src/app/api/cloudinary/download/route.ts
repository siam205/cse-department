import { NextResponse } from 'next/server';
import { getPrivateDownloadUrl } from '@/lib/cloudinary';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get('publicId')?.trim() ?? '';
  const format = searchParams.get('format')?.trim() || 'pdf';
  const root = process.env.CLOUDINARY_UPLOAD_FOLDER || '';

  if (!publicId || !root || !publicId.startsWith(`${root}/`) || format !== 'pdf') {
    return NextResponse.json({ error: 'Invalid asset' }, { status: 400 });
  }

  return NextResponse.redirect(getPrivateDownloadUrl(publicId, format));
}
