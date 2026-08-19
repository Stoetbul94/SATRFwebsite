import {
  FAQ_CATEGORIES,
  FAQ_H1,
  FAQ_META_DESCRIPTION,
  FAQ_PAGE_TITLE,
  faqAnswerPlainText,
  faqInternalHrefs,
  faqItems,
  featuredFaqItems,
} from '@/data/faq';
import { absoluteUrl } from '@/lib/siteUrl';

const PLACEHOLDER_PATTERNS = [
  '123 Shooting Range Road',
  '012 345 6789',
  '+27 (0)12 345 6789',
  'John Smith',
  'Jane Doe',
  'satrf.org.za',
  'example.com',
  'Lorem ipsum',
];

describe('FAQ content', () => {
  it('has 15–20 questions covering required categories', () => {
    expect(faqItems.length).toBeGreaterThanOrEqual(15);
    expect(faqItems.length).toBeLessThanOrEqual(20);
    const used = new Set(faqItems.map((item) => item.category));
    expect(used.size).toBe(FAQ_CATEGORIES.length);
  });

  it('renders unique ids and questions', () => {
    const ids = faqItems.map((item) => item.id);
    const questions = faqItems.map((item) => item.question);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('features six homepage questions', () => {
    const featured = featuredFaqItems();
    expect(featured).toHaveLength(6);
    expect(featured.map((item) => item.id)).toEqual([
      'what-is-satrf',
      'how-to-start',
      'disciplines',
      'upcoming-events',
      'view-scores',
      'become-member',
    ]);
  });

  it('uses production canonical helpers', () => {
    expect(absoluteUrl('/faq')).toBe('https://www.rifleshooting.co.za/faq');
    expect(absoluteUrl('/faq')).not.toContain('satrf.org.za');
    expect(FAQ_PAGE_TITLE).toBe('Target Rifle Shooting in South Africa FAQs | SATRF');
    expect(FAQ_PAGE_TITLE.match(/\| SATRF/g)).toHaveLength(1);
    expect(FAQ_H1).toBe('Target Rifle Shooting FAQs');
    expect(FAQ_META_DESCRIPTION.length).toBeGreaterThan(50);
    expect(FAQ_META_DESCRIPTION.length).toBeLessThan(200);
  });

  it('does not include placeholder contact or fabricated names in FAQ copy', () => {
    const blob = faqItems.map((item) => `${item.question} ${faqAnswerPlainText(item)}`).join('\n');
    for (const pattern of PLACEHOLDER_PATTERNS) {
      expect(blob).not.toContain(pattern);
    }
  });

  it('does not claim SATRF is the ISSF member federation', () => {
    const blob = faqItems.map(faqAnswerPlainText).join(' ');
    expect(blob).not.toMatch(/SATRF is the ISSF member federation/i);
    expect(blob).toMatch(/affiliate of the South African Shooting Sport Confederation/);
    expect(blob).toMatch(/lists SASSCo as its South African member federation/);
    expect(blob).toMatch(/South African Air Rifle Association/);
  });

  it('links core journeys without stuffing every answer', () => {
    const byId = Object.fromEntries(faqItems.map((item) => [item.id, faqInternalHrefs(item)]));
    expect(byId['upcoming-events']).toEqual(expect.arrayContaining(['/events', '/events/calendar']));
    expect(byId['become-member']).toEqual(['/register']);
    expect(byId['view-scores']).toEqual(expect.arrayContaining(['/scores', '/scores/leaderboard']));
    expect(byId['rules']).toContain('/rules');
    expect(byId['coaching']).toEqual(expect.arrayContaining(['/coaching', '/insights']));
    expect(byId['what-is-satrf']).toHaveLength(0);
  });
});
