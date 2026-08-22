import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getStorageBucket } from '@/lib/firebaseAdmin';
import {
  assertSafeStoragePath,
  buildEventDocumentStoragePath,
  DRAFT_SIGNED_URL_TTL_MS,
  PUBLISHED_SIGNED_URL_TTL_MS,
} from '@/lib/eventDocuments/storagePaths';

export {
  assertSafeDocumentId,
  assertSafeStoragePath,
  buildEventDocumentStoragePath,
  DRAFT_SIGNED_URL_TTL_MS,
  PUBLISHED_SIGNED_URL_TTL_MS,
} from '@/lib/eventDocuments/storagePaths';

function getBucketFile(storagePath: string) {
  assertSafeStoragePath(storagePath);
  const bucket = getStorage(getAdminApp()).bucket(getStorageBucket());
  return bucket.file(storagePath);
}

export async function uploadEventDocumentPdf(input: {
  documentId: string;
  version: number;
  type: string;
  buffer: Buffer;
  /** When true, returns a short-lived URL for immediate admin use only. */
  includeDraftSignedUrl?: boolean;
}): Promise<{ storagePath: string; fileUrl: string | null }> {
  if (!input.buffer.length) throw new Error('PDF buffer is empty');

  const storagePath = buildEventDocumentStoragePath(
    input.documentId,
    input.version,
    input.type,
  );
  const file = getBucketFile(storagePath);

  await file.save(input.buffer, {
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'private, max-age=3600',
    },
    resumable: false,
  });

  if (!input.includeDraftSignedUrl) {
    return { storagePath, fileUrl: null };
  }

  const [fileUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + DRAFT_SIGNED_URL_TTL_MS,
  });

  return { storagePath, fileUrl };
}

export async function createSignedReadUrl(
  storagePath: string,
  ttlMs: number,
): Promise<string> {
  const file = getBucketFile(storagePath);
  const [fileUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + ttlMs,
  });
  return fileUrl;
}

export async function createPublishedReadUrl(storagePath: string): Promise<string> {
  return createSignedReadUrl(storagePath, PUBLISHED_SIGNED_URL_TTL_MS);
}

export async function createDraftReadUrl(storagePath: string): Promise<string> {
  return createSignedReadUrl(storagePath, DRAFT_SIGNED_URL_TTL_MS);
}

/**
 * Idempotent Storage delete. Missing objects are treated as success.
 */
export async function deleteEventDocumentStorageObject(
  storagePath: string | null | undefined,
): Promise<{ deleted: boolean; missing: boolean }> {
  if (!storagePath) return { deleted: false, missing: true };
  assertSafeStoragePath(storagePath);

  const file = getBucketFile(storagePath);
  try {
    await file.delete({ ignoreNotFound: true });
    return { deleted: true, missing: false };
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? Number((error as { code: unknown }).code)
        : null;
    if (code === 404) return { deleted: false, missing: true };
    throw error;
  }
}

export function isSafeExternalFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
