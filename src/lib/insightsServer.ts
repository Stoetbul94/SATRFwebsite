import type { DocumentData, Firestore } from 'firebase-admin/firestore';
import type { FiringLineContentType } from '@/lib/firingLineContent';
import { toIsoString } from '@/lib/firestoreSerialize';

export type InsightStatus = 'draft' | 'published';

export interface InsightDocument {
  id: string;
  slug: string;
  type: FiringLineContentType;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  bodyMarkdown: string;
  coverImageUrl: string;
  status: InsightStatus;
  featured: boolean;
  external?: boolean;
  href?: string;
  authorEmail: string;
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightWriteInput {
  slug?: string;
  type?: FiringLineContentType;
  category?: string;
  title?: string;
  summary?: string;
  readTime?: string;
  bodyMarkdown?: string;
  coverImageUrl?: string;
  status?: InsightStatus;
  featured?: boolean;
}

const COLLECTION = 'insights';

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function serializeInsightDoc(id: string, data: DocumentData): InsightDocument {
  return {
    id,
    slug: String(data.slug ?? ''),
    type: (data.type as FiringLineContentType) || 'article',
    category: String(data.category ?? ''),
    title: String(data.title ?? ''),
    summary: String(data.summary ?? ''),
    readTime: String(data.readTime ?? ''),
    bodyMarkdown: String(data.bodyMarkdown ?? ''),
    coverImageUrl: String(data.coverImageUrl ?? ''),
    status: data.status === 'published' ? 'published' : 'draft',
    featured: data.featured === true,
    external: data.external === true,
    href: data.href ? String(data.href) : undefined,
    authorEmail: String(data.authorEmail ?? ''),
    authorId: String(data.authorId ?? ''),
    publishedAt: toIsoString(data.publishedAt),
    createdAt: toIsoString(data.createdAt) ?? '',
    updatedAt: toIsoString(data.updatedAt) ?? '',
  };
}

export async function listInsightsForAdmin(db: Firestore): Promise<InsightDocument[]> {
  const snapshot = await db.collection(COLLECTION).limit(500).get();
  const items = snapshot.docs.map((doc) => serializeInsightDoc(doc.id, doc.data()));
  return items.sort((a, b) => {
    const aTime = a.publishedAt || a.updatedAt || a.createdAt;
    const bTime = b.publishedAt || b.updatedAt || b.createdAt;
    return bTime.localeCompare(aTime);
  });
}

export async function getInsightById(db: Firestore, id: string): Promise<InsightDocument | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeInsightDoc(doc.id, doc.data()!);
}

export async function getPublishedInsights(
  db: Firestore,
  options?: { featured?: boolean; limit?: number }
): Promise<InsightDocument[]> {
  let query = db.collection(COLLECTION).where('status', '==', 'published');

  if (options?.featured) {
    query = query.where('featured', '==', true);
  }

  const snapshot = await query.limit(options?.limit ?? 50).get();
  const items = snapshot.docs.map((doc) => serializeInsightDoc(doc.id, doc.data()));

  return items.sort((a, b) => {
    const aTime = a.publishedAt || a.updatedAt;
    const bTime = b.publishedAt || b.updatedAt;
    return bTime.localeCompare(aTime);
  });
}

export async function getPublishedInsightBySlug(
  db: Firestore,
  slug: string
): Promise<InsightDocument | null> {
  const snapshot = await db
    .collection(COLLECTION)
    .where('slug', '==', slug)
    .where('status', '==', 'published')
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return serializeInsightDoc(doc.id, doc.data());
}

export async function isSlugTaken(
  db: Firestore,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const snapshot = await db.collection(COLLECTION).where('slug', '==', slug).limit(5).get();
  return snapshot.docs.some((doc) => doc.id !== excludeId);
}

export async function clearFeaturedExcept(db: Firestore, keepId: string): Promise<void> {
  const snapshot = await db.collection(COLLECTION).where('featured', '==', true).get();
  const batch = db.batch();
  const now = new Date().toISOString();

  snapshot.docs.forEach((doc) => {
    if (doc.id !== keepId) {
      batch.update(doc.ref, { featured: false, updatedAt: now });
    }
  });

  if (!snapshot.empty) {
    await batch.commit();
  }
}

export async function createInsightDraft(
  db: Firestore,
  author: { userId: string; email: string },
  input: InsightWriteInput
): Promise<InsightDocument> {
  const now = new Date().toISOString();
  const title = input.title?.trim() || 'Untitled draft';
  const slug = slugifyTitle(input.slug?.trim() || title);

  const ref = db.collection(COLLECTION).doc();
  const data = {
    slug,
    type: input.type || 'article',
    category: input.category?.trim() || 'General',
    title,
    summary: input.summary?.trim() || '',
    readTime: input.readTime?.trim() || '3 min read',
    bodyMarkdown: input.bodyMarkdown?.trim() || '',
    coverImageUrl: input.coverImageUrl?.trim() || '',
    status: 'draft' as InsightStatus,
    featured: false,
    authorEmail: author.email,
    authorId: author.userId,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(data);
  return serializeInsightDoc(ref.id, data);
}

export async function updateInsight(
  db: Firestore,
  id: string,
  input: InsightWriteInput
): Promise<InsightDocument | null> {
  const existing = await getInsightById(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.category !== undefined) updates.category = input.category.trim();
  if (input.summary !== undefined) updates.summary = input.summary.trim();
  if (input.readTime !== undefined) updates.readTime = input.readTime.trim();
  if (input.bodyMarkdown !== undefined) updates.bodyMarkdown = input.bodyMarkdown;
  if (input.coverImageUrl !== undefined) updates.coverImageUrl = input.coverImageUrl.trim();
  if (input.type !== undefined) updates.type = input.type;

  if (input.slug !== undefined) {
    updates.slug = slugifyTitle(input.slug);
  }

  if (input.featured !== undefined) {
    updates.featured = input.featured;
    if (input.featured) {
      await clearFeaturedExcept(db, id);
    }
  }

  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === 'published') {
      const slug = slugifyTitle(
        (input.slug !== undefined ? input.slug : existing.slug) || existing.title
      );
      updates.slug = slug;
      if (await isSlugTaken(db, slug, id)) {
        throw new Error('Slug is already in use by another insight');
      }
      if (!existing.publishedAt) {
        updates.publishedAt = now;
      }
      if (input.featured === true || (input.featured === undefined && existing.featured)) {
        await clearFeaturedExcept(db, id);
        updates.featured = true;
      }
    }
  }

  await db.collection(COLLECTION).doc(id).update(updates);
  return getInsightById(db, id);
}

export async function deleteInsight(db: Firestore, id: string): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}
