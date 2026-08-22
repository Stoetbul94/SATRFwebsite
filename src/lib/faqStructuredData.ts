import { faqAnswerPlainText, faqItems, type FAQItem } from '@/data/faq';
import { absoluteUrl } from '@/lib/siteUrl';

/** Semantic FAQPage markup only. Google FAQ rich results are no longer expected (retired 2026). */
export function buildFaqPageJsonLd(items: FAQItem[] = faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faqAnswerPlainText(item),
      },
    })),
  };
}

export function buildFaqBreadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: absoluteUrl('/faq'),
      },
    ],
  };
}
