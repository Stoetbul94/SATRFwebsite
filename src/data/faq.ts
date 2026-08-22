export type FAQCategoryId =
  | 'about'
  | 'getting-started'
  | 'disciplines'
  | 'events'
  | 'scores'
  | 'membership'
  | 'coaching'
  | 'rules';

export type FAQInline = string | { label: string; href: string };

export type FAQItem = {
  id: string;
  category: FAQCategoryId;
  question: string;
  paragraphs: FAQInline[][];
  featured?: boolean;
};

export const FAQ_CATEGORIES: { id: FAQCategoryId; label: string }[] = [
  { id: 'about', label: 'About SATRF' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'disciplines', label: 'Rifle Disciplines' },
  { id: 'events', label: 'Events & Competitions' },
  { id: 'scores', label: 'Scores & Rankings' },
  { id: 'membership', label: 'Membership' },
  { id: 'coaching', label: 'Coaching & Development' },
  { id: 'rules', label: 'Rules & Governance' },
];

export const FAQ_PAGE_TITLE = 'Target Rifle Shooting in South Africa FAQs | SATRF';
export const FAQ_META_DESCRIPTION =
  'Find answers about SATRF, target rifle shooting in South Africa, 50 m prone, 3-position rifle, F-Class, membership, competitions, scores, coaching and ISSF rules.';
export const FAQ_H1 = 'Target Rifle Shooting FAQs';
export const FAQ_INTRO =
  'Answers to common questions about the South African Target Rifle Federation, competitive target rifle shooting, disciplines, events, membership, scores, coaching and getting started.';

export const faqItems: FAQItem[] = [
  {
    id: 'what-is-satrf',
    category: 'about',
    featured: true,
    question: 'What is the South African Target Rifle Federation (SATRF)?',
    paragraphs: [
      [
        'The South African Target Rifle Federation (SATRF) promotes and develops competitive target rifle shooting in South Africa. Through its website, SATRF provides access to competitions, scores, rules, coaching and development resources, and information for target rifle shooters.',
      ],
      [
        'SATRF is listed as an affiliate of the South African Shooting Sport Confederation (SASSCo).',
      ],
    ],
  },
  {
    id: 'what-satrf-does',
    category: 'about',
    question: 'What does SATRF do?',
    paragraphs: [
      [
        'SATRF publishes upcoming competitions, scores and rankings, rules documentation, coaching information and articles for target rifle shooters. The website is the public hub for event listings, results and federation notices.',
      ],
      [
        'For current competitions see ',
        { label: 'Events', href: '/events' },
        '. For published results see ',
        { label: 'Scores', href: '/scores' },
        '.',
      ],
    ],
  },
  {
    id: 'sassco-issf',
    category: 'about',
    question: 'Is SATRF affiliated with SASSCo and the ISSF?',
    paragraphs: [
      [
        'SATRF is listed as an affiliate of the South African Shooting Sport Confederation (SASSCo).',
      ],
      [
        'The International Shooting Sport Federation (ISSF) lists SASSCo as its South African member federation (RSA — South Africa). SATRF therefore operates within the South African shooting-sport structure through SASSCo, rather than as the ISSF member federation itself.',
      ],
    ],
  },
  {
    id: 'air-rifle',
    category: 'about',
    question: 'Does SATRF govern air rifle shooting?',
    paragraphs: [
      [
        'SATRF focuses on target-rifle disciplines within its non-air-rifle scope, including the rifle events listed on this website such as 50 m prone, 50 m Rifle 3 Positions, F-Class Open and F-Class Target Rifle (F-TR).',
      ],
      [
        'Air-rifle target shooting in South Africa is administered separately through the South African Air Rifle Association (SAARA).',
      ],
    ],
  },
  {
    id: 'how-to-start',
    category: 'getting-started',
    featured: true,
    question: 'How do I start target rifle shooting in South Africa?',
    paragraphs: [
      [
        'Start by reading SATRF’s coaching and development pages, then look at upcoming events to see how competitions are organised. Many shooters begin through a local club; event pages list venues when those details are published.',
      ],
      [
        'Visit ',
        { label: 'Coaching', href: '/coaching' },
        ' for development information and ',
        { label: 'Events', href: '/events' },
        ' for current competitions. Firearm licensing and range access follow South African law and range rules — this site does not give legal advice.',
      ],
    ],
  },
  {
    id: 'beginners',
    category: 'getting-started',
    question: 'Can beginners participate in SATRF events?',
    paragraphs: [
      [
        'SATRF lists competitions open to registered participants according to each event’s programme. Some events may be more suitable for experienced competitors; others may welcome a wider field.',
      ],
      [
        'Check the relevant ',
        { label: 'event listing', href: '/events' },
        ' for disciplines, categories and any stated entry conditions. Do not assume every competition is an introductory clinic.',
      ],
    ],
  },
  {
    id: 'juniors',
    category: 'getting-started',
    question: 'Can junior shooters participate?',
    paragraphs: [
      [
        'Junior and youth participation depends on the event. Where a competition publishes junior, youth or similar categories, those appear on the event page together with other eligibility notes.',
      ],
      [
        'Always confirm age groups and any supervision requirements on the specific ',
        { label: 'event page', href: '/events' },
        ' rather than treating one format as universal.',
      ],
    ],
  },
  {
    id: 'equipment',
    category: 'getting-started',
    question: 'What equipment do I need to start target rifle shooting?',
    paragraphs: [
      [
        'Requirements differ by discipline and rule set. In general, shooters use an appropriate target rifle and sights, ammunition suited to the event, and personal equipment such as a shooting jacket, sling or glove where the rules allow or require them. Eye and ear protection are used where appropriate.',
      ],
      [
        'F-Class equipment is not the same as 50 m ISSF-style rifle kit. Confirm what is permitted in the current rules for the discipline you intend to shoot — see ',
        { label: 'Rules', href: '/rules' },
        '. This FAQ does not advise on purchasing firearms or on South African firearm law.',
      ],
    ],
  },
  {
    id: 'disciplines',
    category: 'disciplines',
    featured: true,
    question: 'What rifle shooting disciplines does SATRF support?',
    paragraphs: [
      [
        'SATRF’s current event and scoring system uses these rifle disciplines: Prone (50 m Rifle Prone), 3-Position (50 m Rifle 3 Positions), F-Class Open (F-Open) and F-Class Target Rifle (F-TR).',
      ],
      [
        'These are not interchangeable rule sets. 50 m prone and 3-position events follow ISSF-style smallbore rifle formats as applied in SATRF competitions; F-Class is a separate target-rifle family. Air rifle is outside SATRF’s published event categories.',
      ],
    ],
  },
  {
    id: 'prone',
    category: 'disciplines',
    question: 'What is 50 m prone rifle shooting?',
    paragraphs: [
      [
        '50 m prone is a precision rifle discipline shot from the prone (lying) position at 50 metres. Shooters work on a consistent position, trigger control, sight alignment and reading conditions such as wind. A sling or other support is used only as the applicable rules allow.',
      ],
      [
        'SATRF publishes prone competitions and season rankings on this website. Course of fire, timing and scoring for a given match are those stated for that event — they are not identical at every competition.',
      ],
    ],
  },
  {
    id: 'three-position',
    category: 'disciplines',
    question: 'What is 50 m Rifle 3 Positions?',
    paragraphs: [
      [
        '50 m Rifle 3 Positions (often shortened to 3P) is a precision rifle discipline in which competitors shoot from three positions: kneeling, prone and standing, typically at 50 metres.',
      ],
      [
        'SATRF lists 3-position events and rankings separately from prone-only matches. Shot counts, time limits and finals formats vary by programme, so use the event information and current rules rather than assuming one international template applies to every SATRF match.',
      ],
    ],
  },
  {
    id: 'f-class',
    category: 'disciplines',
    question: 'What is F-Class rifle shooting?',
    paragraphs: [
      [
        'F-Class is a precision target-rifle family distinct from 50 m ISSF-style prone and 3-position rifle. It is not an ISSF Olympic rifle discipline.',
      ],
      [
        'SATRF events and scores currently include F-Class Open (F-Open) and F-Class Target Rifle (F-TR). Equipment limits and course of fire are defined by the relevant competition rules, not by ISSF Olympic rifle regulations. Check the event listing and ',
        { label: 'Rules', href: '/rules' },
        ' for the edition in force.',
      ],
    ],
  },
  {
    id: 'upcoming-events',
    category: 'events',
    featured: true,
    question: 'Where can I find upcoming SATRF competitions?',
    paragraphs: [
      [
        'Upcoming competitions are listed on the ',
        { label: 'Events', href: '/events' },
        ' page. A calendar view is also available at ',
        { label: 'Events calendar', href: '/events/calendar' },
        '.',
      ],
      [
        'Event pages are the source for date, venue, disciplines and registration status when those fields have been published. Listings change as competitions are added or updated.',
      ],
    ],
  },
  {
    id: 'event-register',
    category: 'events',
    question: 'How do I register for an SATRF event?',
    paragraphs: [
      [
        'Open the competition on ',
        { label: 'Events', href: '/events' },
        ' and follow the registration option shown for that event, if one is available.',
      ],
      [
        'Not every listing supports online entry. If registration is closed, full, managed off-site, or not offered on the website, the event page is the place to see the current status.',
      ],
    ],
  },
  {
    id: 'event-venues',
    category: 'events',
    question: 'Where are SATRF events held?',
    paragraphs: [
      [
        'Venues are published per competition. SATRF events take place at ranges and facilities named on the individual event page — there is no single national venue for every match.',
      ],
      [
        'Check ',
        { label: 'Events', href: '/events' },
        ' or the ',
        { label: 'calendar', href: '/events/calendar' },
        ' for location details on each listing.',
      ],
    ],
  },
  {
    id: 'view-scores',
    category: 'scores',
    featured: true,
    question: 'Where can I view SATRF competition scores?',
    paragraphs: [
      [
        'Season qualification rankings are on the ',
        { label: 'Scores', href: '/scores' },
        ' page (Rankings & Scores). They show qualification results as season averages by discipline.',
      ],
      [
        'Finals results, where published, are on the ',
        { label: 'Finals Leaderboard', href: '/scores/leaderboard' },
        '.',
      ],
    ],
  },
  {
    id: 'scores-vs-leaderboard',
    category: 'scores',
    question: 'What is the difference between the Scores page and the Finals Leaderboard?',
    paragraphs: [
      [
        'The ',
        { label: 'Scores', href: '/scores' },
        ' page is qualification results only — season averages by discipline.',
      ],
      [
        'The ',
        { label: 'Finals Leaderboard', href: '/scores/leaderboard' },
        ' is finals results only — ranked by final score. Qualification standings and finals tables are separate views.',
      ],
    ],
  },
  {
    id: 'rules',
    category: 'rules',
    question: 'Where can I find the latest rifle competition rules?',
    paragraphs: [
      [
        'SATRF provides access to relevant rules and documentation on the ',
        { label: 'Rules', href: '/rules' },
        ' page. Shooters should check the current rule edition and any published amendments before competition.',
      ],
      [
        'For ISSF rule interpretation, the official ISSF documentation remains authoritative. SATRF’s website is a convenient copy and index, not a substitute for the ISSF’s own publications.',
      ],
    ],
  },
  {
    id: 'coaching',
    category: 'coaching',
    question: 'Does SATRF provide coaching or development resources?',
    paragraphs: [
      [
        'SATRF provides coaching and development information for shooters at different stages of the sport. Visit the ',
        { label: 'Coaching', href: '/coaching' },
        ' section for current information.',
      ],
      [
        'Articles and educational pieces also appear in ',
        { label: 'From the Firing Line', href: '/insights' },
        '.',
      ],
    ],
  },
  {
    id: 'become-member',
    category: 'membership',
    featured: true,
    question: 'How can I become a member of SATRF?',
    paragraphs: [
      [
        'You can create a SATRF website account on the ',
        { label: 'registration page', href: '/register' },
        '. That flow collects profile details used on this site (for example name, club, province and disciplines of interest).',
      ],
      [
        'A website account is not described here as automatic national-federation membership, licence status, or event entry. Fees, approval steps and any separate federation membership process are not published in this FAQ — use event pages and official SATRF communications for those details when they are issued.',
      ],
    ],
  },
];

export function inlineToText(parts: FAQInline[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.label)).join('');
}

export function faqAnswerPlainText(item: FAQItem): string {
  return item.paragraphs.map(inlineToText).join(' ');
}

export function faqItemsByCategory(category: FAQCategoryId): FAQItem[] {
  return faqItems.filter((item) => item.category === category);
}

export function featuredFaqItems(): FAQItem[] {
  return faqItems.filter((item) => item.featured);
}

export function faqInternalHrefs(item: FAQItem): string[] {
  const hrefs: string[] = [];
  for (const paragraph of item.paragraphs) {
    for (const part of paragraph) {
      if (typeof part !== 'string') hrefs.push(part.href);
    }
  }
  return hrefs;
}
