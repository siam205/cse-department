// Client-side image compression — runs in the browser before upload
// so oversized photos (common from phone cameras, 15-40 MB) fit
// under Cloudinary's free-plan 10 MB per-resource limit without the
// admin needing to manually resize/compress anything themselves.
// PDFs are NOT handled here — this only touches raster images.

const MAX_DIMENSION = 3000; // longest side, px — generous ceiling for a hero banner
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];
const SCALE_STEPS = [1, 0.85, 0.7, 0.55, 0.4];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}

/**
 * Re-encodes `file` as WebP, trying progressively lower quality and
 * (if needed) smaller dimensions until the result fits under
 * `maxBytes`. Returns the original file unchanged if it's already
 * within budget. Throws only if the browser can't decode the image
 * at all — callers should let the original upload attempt proceed
 * in that case rather than block the admin.
 */
export async function compressImageToLimit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const img = await loadImage(file);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  const baseScale = Math.min(1, MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  let best: Blob | null = null;

  for (const scaleStep of SCALE_STEPS) {
    const scale = baseScale * scaleStep;
    const w = Math.max(1, Math.round(naturalWidth * scale));
    const h = Math.max(1, Math.round(naturalHeight * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (!blob) continue;
      best = blob; // keep the smallest attempt so far as a fallback
      if (blob.size <= maxBytes) {
        const name = file.name.replace(/\.[^./\\]+$/, '') + '.webp';
        return new File([blob], name, { type: 'image/webp' });
      }
    }
  }

  // Every combination was tried; return the smallest we produced
  // (still likely far smaller than the original) and let the normal
  // size-check downstream report if it's genuinely still too big.
  if (best) {
    const name = file.name.replace(/\.[^./\\]+$/, '') + '.webp';
    return new File([best], name, { type: 'image/webp' });
  }
  return file;
}
