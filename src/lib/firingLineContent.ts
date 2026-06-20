import type { InsightDocument } from '@/lib/insightsServer';

export type FiringLineContentType = 'article' | 'podcast' | 'coaching' | 'event' | 'notice';

export interface FiringLineItem {
  id: string;
  type: FiringLineContentType;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  image: string;
  href: string;
  external?: boolean;
  featured?: boolean;
  slug?: string;
  bodyMarkdown?: string;
}

export const FIRING_LINE_TYPE_LABELS: Record<FiringLineContentType, string> = {
  article: 'Article',
  podcast: 'Inner Tens Podcast',
  coaching: 'Coaching Note',
  event: 'Event Update',
  notice: 'Official Notice',
};

/** Static items not managed via CMS (e.g. Inner Tens podcast, official notices). */
export const STATIC_FIRING_LINE_ITEMS: FiringLineItem[] = [
  {
    id: 'satrf-governance-clarification',
    type: 'notice',
    category: 'Governance',
    title: 'Official Notice: SATRF Governance Clarification',
    summary:
      'Signed communiqué clarifying recognised governance for non-air-rifle ISSF rifle disciplines in South Africa.',
    readTime: 'Official notice',
    image: '/images/notices/satrf-governance-communique-page-1.png',
    href: '/notices/satrf-governance-clarification',
  },
  {
    id: 'inner-tens-podcast',
    type: 'podcast',
    category: 'Inner Tens',
    title: 'Inner Tens Podcast',
    summary:
      'Conversations from the firing line — coaching, competition and the future of target rifle shooting in South Africa.',
    readTime: 'Watch playlist',
    image: '/images/inner-tens-podcast.png',
    href: 'https://www.youtube.com/playlist?list=PL1c6eGWLy7nsraMVFZkfhHOq8EdCPJObf',
    external: true,
  },
];

/** @deprecated Use STATIC_FIRING_LINE_ITEMS + Firestore insights */
export const FIRING_LINE_ITEMS: FiringLineItem[] = [
  {
    id: 'understanding-3p',
    type: 'article',
    category: '3P',
    title: 'Understanding 3-Position Rifle',
    summary: 'A quick guide to kneeling, prone and standing in 50m rifle competition.',
    readTime: '3 min read',
    image: '/images/sport-collage-satrf.png',
    href: '/insights/understanding-3-position-rifle',
    slug: 'understanding-3-position-rifle',
    featured: true,
  },
  ...STATIC_FIRING_LINE_ITEMS,
  {
    id: 'strong-prone',
    type: 'article',
    category: 'Prone',
    title: 'What Makes a Strong Prone Position?',
    summary: 'Stability, natural point of aim and repeatability explained in simple terms.',
    readTime: '2 min read',
    image: '/images/affiliates/ISSF-Logo.jpg',
    href: '/insights/strong-prone-position',
    slug: 'strong-prone-position',
  },
  {
    id: 'f-class-intro',
    type: 'article',
    category: 'F-Class',
    title: 'F-Class and Long-Range Precision',
    summary: 'A short introduction to rifle setup, wind reading and long-range discipline.',
    readTime: '2 min read',
    image: '/images/affiliates/SASSCO_Logo.jpeg',
    href: '/insights/f-class-long-range-precision',
    slug: 'f-class-long-range-precision',
  },
];

const FALLBACK_IMAGE = '/images/sport-collage-satrf.png';

export function mapInsightDocToItem(doc: InsightDocument): FiringLineItem {
  return {
    id: doc.id,
    type: doc.type,
    category: doc.category,
    title: doc.title,
    summary: doc.summary,
    readTime: doc.readTime,
    image: doc.coverImageUrl || FALLBACK_IMAGE,
    href: doc.external && doc.href ? doc.href : `/insights/${doc.slug}`,
    external: doc.external,
    featured: doc.featured,
    slug: doc.slug,
    bodyMarkdown: doc.bodyMarkdown,
  };
}

export function mergeFiringLineItems(
  published: FiringLineItem[],
  staticItems: FiringLineItem[] = STATIC_FIRING_LINE_ITEMS
): FiringLineItem[] {
  const articles = published.filter((item) => item.type === 'article' || !item.external);
  const notices = staticItems.filter((item) => item.type === 'notice');
  const podcast = staticItems.filter((item) => item.type === 'podcast');
  const featured = articles.find((item) => item.featured) ?? articles[0];
  const restArticles = articles.filter((item) => item.id !== featured?.id);

  const merged: FiringLineItem[] = [];
  if (featured) merged.push(featured);
  notices.forEach((item) => {
    if (!merged.some((m) => m.id === item.id)) merged.push(item);
  });
  if (podcast[0]) merged.push(podcast[0]);
  restArticles.forEach((item) => {
    if (!merged.some((m) => m.id === item.id)) merged.push(item);
  });

  return merged;
}

export function getFeaturedItem(items: FiringLineItem[]): FiringLineItem {
  return items.find((item) => item.featured) ?? items[0];
}

export function getSecondaryItems(items: FiringLineItem[]): FiringLineItem[] {
  const featured = getFeaturedItem(items);
  return items.filter((item) => item.id !== featured.id);
}

export function getFiringLineItemBySlug(slug: string, items: FiringLineItem[]): FiringLineItem | undefined {
  return items.find((item) => item.slug === slug);
}

export function getArticleSlugs(items: FiringLineItem[]): string[] {
  return items.filter((item) => item.slug && !item.external).map((item) => item.slug as string);
}

export function getArticleItems(items: FiringLineItem[]): FiringLineItem[] {
  return items.filter((item) => item.type === 'article');
}
