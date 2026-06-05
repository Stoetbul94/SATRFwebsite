import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getAdminDb, getStorageBucket } from '@/lib/firebaseAdmin';

export async function uploadEventCoverImage(
  eventId: string,
  imageBase64: string,
  contentType?: string
): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB');
  }

  const type = typeof contentType === 'string' ? contentType : 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : 'jpg';
  const objectPath = `events/${eventId}/cover.${ext}`;

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

  await getAdminDb().collection('events').doc(eventId).set(
    { imageUrl, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return imageUrl;
}
