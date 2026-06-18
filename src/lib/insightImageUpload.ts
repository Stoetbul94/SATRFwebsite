import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getAdminDb, getStorageBucket } from '@/lib/firebaseAdmin';

async function uploadInsightImageBuffer(
  insightId: string,
  buffer: Buffer,
  contentType: string,
  objectName: string
): Promise<string> {
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB');
  }

  const type = contentType || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : type.includes('webp') ? 'webp' : 'jpg';
  const objectPath = `insights/${insightId}/${objectName}.${ext}`;

  const bucket = getStorage(getAdminApp()).bucket(getStorageBucket());
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    metadata: {
      contentType: type,
      cacheControl: 'public, max-age=31536000',
    },
    resumable: false,
  });

  const [imageUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
  });

  return imageUrl;
}

export async function uploadInsightCoverImage(
  insightId: string,
  imageBase64: string,
  contentType?: string
): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64');
  const type = typeof contentType === 'string' ? contentType : 'image/jpeg';
  const imageUrl = await uploadInsightImageBuffer(insightId, buffer, type, 'cover');

  await getAdminDb().collection('insights').doc(insightId).set(
    { coverImageUrl: imageUrl, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return imageUrl;
}

export async function uploadInsightInlineImage(
  insightId: string,
  imageBase64: string,
  contentType?: string
): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64');
  const type = typeof contentType === 'string' ? contentType : 'image/jpeg';
  const stamp = Date.now();
  return uploadInsightImageBuffer(insightId, buffer, type, `inline-${stamp}`);
}
