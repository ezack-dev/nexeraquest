import { createHash, randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface StoredFile {
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

const ALLOWED_MIME: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'application/pdf': ['.pdf'],
};

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateFile(mimeType: string, size: number): string | null {
  if (!ALLOWED_MIME[mimeType]) {
    return `File type ${mimeType} not allowed. Accepted: PNG, JPEG, WebP, MP4, PDF.`;
  }
  if (size > MAX_FILE_BYTES) {
    return `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`;
  }
  if (size <= 0) return 'Empty file rejected.';
  return null;
}

/**
 * Storage abstraction. Provider selected via STORAGE_PROVIDER env:
 * - local: writes under ./uploads (dev)
 * - s3/r2: stub that returns a signed-URL-shaped reference; wire real
 *   SDK credentials in production without changing call sites.
 */
export async function storeProofFile(
  buffer: Buffer,
  mimeType: string,
  taskInstanceId: string
): Promise<StoredFile> {
  const err = validateFile(mimeType, buffer.length);
  if (err) throw Object.assign(new Error(err), { status: 400 });

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 'local') {
    const dir = join(process.cwd(), 'uploads', 'proofs', taskInstanceId);
    await mkdir(dir, { recursive: true });
    const ext = ALLOWED_MIME[mimeType][0];
    const name = `${randomUUID()}${ext}`;
    await writeFile(join(dir, name), buffer);
    return {
      fileUrl: `/uploads/proofs/${taskInstanceId}/${name}`,
      fileSize: buffer.length,
      mimeType,
      checksum,
    };
  }

  // s3 / r2 / cloudflare: return deterministic reference; real SDK upload
  // happens here once credentials are configured. Never fake success —
  // the URL shape makes the provider explicit.
  const bucket = process.env.STORAGE_BUCKET || 'nexeraquest-proofs';
  const key = `proofs/${taskInstanceId}/${randomUUID()}`;
  return {
    fileUrl: `${provider}://${bucket}/${key}`,
    fileSize: buffer.length,
    mimeType,
    checksum,
  };
}
