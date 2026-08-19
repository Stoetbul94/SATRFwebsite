import { faqAnswerPlainText, faqItems } from '@/data/faq';
import { buildFaqBreadcrumbJsonLd, buildFaqPageJsonLd } from '@/lib/faqStructuredData';

describe('FAQ structured data', () => {
  it('emits valid FAQPage JSON matching visible FAQ source', () => {
    const jsonLd = buildFaqPageJsonLd();
    const serialised = JSON.stringify(jsonLd);
    expect(() => JSON.parse(serialised)).not.toThrow();
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity).toHaveLength(faqItems.length);
    jsonLd.mainEntity.forEach((entity, index) => {
      expect(entity['@type']).toBe('Question');
      expect(entity.name).toBe(faqItems[index].question);
      expect(entity.acceptedAnswer.text).toBe(faqAnswerPlainText(faqItems[index]));
    });
    expect(serialised).not.toContain('satrf.org.za');
    expect(serialised).not.toContain('123 Shooting Range Road');
  });

  it('emits BreadcrumbList to production /faq', () => {
    const crumbs = buildFaqBreadcrumbJsonLd();
    expect(crumbs['@type']).toBe('BreadcrumbList');
    expect(crumbs.itemListElement[0].item).toBe('https://www.rifleshooting.co.za/');
    expect(crumbs.itemListElement[1].item).toBe('https://www.rifleshooting.co.za/faq');
    expect(JSON.stringify(crumbs)).not.toContain('satrf.org.za');
  });
});
