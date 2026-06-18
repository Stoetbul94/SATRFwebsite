export type FiringLineContentType = 'article' | 'podcast' | 'coaching' | 'event';

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
}

export const FIRING_LINE_TYPE_LABELS: Record<FiringLineContentType, string> = {
  article: 'Article',
  podcast: 'Inner Tens Podcast',
  coaching: 'Coaching Note',
  event: 'Event Update',
};

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
  {
    id: 'inner-tens-podcast',
    type: 'podcast',
    category: 'Inner Tens',
    title: 'Inner Tens Podcast',
    summary:
      'Conversations from the firing line — coaching, competition and the future of target rifle shooting in South Africa.',
    readTime: 'Watch playlist',
    image: '/images/affiliates/TeamSa.jpg',
    href: 'https://www.youtube.com/playlist?list=PL1c6eGWLy7nsraMVFZkfhHOq8EdCPJObf',
    external: true,
  },
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

export function getFiringLineItemBySlug(slug: string): FiringLineItem | undefined {
  return FIRING_LINE_ITEMS.find((item) => item.slug === slug);
}

export function getArticleSlugs(): string[] {
  return FIRING_LINE_ITEMS.filter((item) => item.slug).map((item) => item.slug as string);
}

export function getArticleItems(): FiringLineItem[] {
  return FIRING_LINE_ITEMS.filter((item) => item.type === 'article');
}

export function getFeaturedItem(): FiringLineItem {
  return FIRING_LINE_ITEMS.find((item) => item.featured) ?? FIRING_LINE_ITEMS[0];
}

export function getSecondaryItems(): FiringLineItem[] {
  const featured = getFeaturedItem();
  return FIRING_LINE_ITEMS.filter((item) => item.id !== featured.id);
}
