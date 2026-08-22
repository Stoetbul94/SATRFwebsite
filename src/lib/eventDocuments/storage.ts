import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getStorageBucket } from '@/lib/firebaseAdmin';

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export function assertSafeDocumentId(documentId: string): void {
  if (!SAFE_SEGMENT.test(documentId)) {
    throw new Error('Invalid document ID');
  }
}

export function buildEventDocumentStoragePath(
  documentId: string,
  version: number,
  type: string,
): string {
  assertSafeDocumentId(documentId);
  const safeType = type.replace(/[^a-z0-9-]/gi, '') || 'document';
  return `eventDocuments/${documentId}/${safeType}-v${version}.pdf`;
}

export async function uploadEventDocumentPdf(input: {
  documentId: string;
  version: number;
  type: string;
  buffer: Buffer;
}): Promise<{ storagePath: string; fileUrl: string }> {
  if (!input.buffer.length) throw new Error('PDF buffer is empty');

  const storagePath = buildEventDocumentStoragePath(
    input.documentId,
    input.version,
    input.type,
  );
  const bucket = getStorage(getAdminApp()).bucket(getStorageBucket());
  const file = bucket.file(storagePath);

  await file.save(input.buffer, {
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=3600',
    },
    resumable: false,
  });

  const [fileUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
  });

  return { storagePath, fileUrl };
}

export function isSafeExternalFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
