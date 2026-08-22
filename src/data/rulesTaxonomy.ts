export type RuleDiscipline =
  | '50m-rifle-3p'
  | '50m-rifle-prone'
  | 'rifle-general'
  | 'general-technical';

export type RuleTopic =
  | 'timing'
  | 'preparation'
  | 'sighting'
  | 'positions'
  | 'clothing'
  | 'rifle'
  | 'equipment-control'
  | 'finals'
  | 'commands'
  | 'scoring'
  | 'penalties'
  | 'malfunctions'
  | 'targets'
  | 'range'
  | 'safety'
  | 'protests';

export const DISCIPLINE_SHORTCUTS: {
  id: RuleDiscipline;
  title: string;
  blurb: string;
  search?: string;
}[] = [
  {
    id: '50m-rifle-3p',
    title: '50 m Rifle 3 Positions',
    blurb: 'Kneeling · Prone · Standing · Timing · Sighting · Position change',
    search: '3P',
  },
  {
    id: '50m-rifle-prone',
    title: '50 m Rifle Prone',
    blurb: 'Position · Timing · Sighting · Sling · Equipment',
    search: '50m prone',
  },
  {
    id: 'rifle-general',
    title: 'Rifle Equipment & Clothing',
    blurb: 'Jacket · Trousers · Shoes · Glove · Rifle specifications',
    search: 'shooting jacket',
  },
  {
    id: 'general-technical',
    title: 'General Technical Rules',
    blurb: 'Range · Commands · Scoring · Penalties · Safety',
    search: 'range commands',
  },
];

export const TOPIC_SHORTCUTS: { id: RuleTopic; label: string }[] = [
  { id: 'timing', label: 'Competition Timing' },
  { id: 'preparation', label: 'Sighting & Preparation' },
  { id: 'sighting', label: 'Sighting' },
  { id: 'positions', label: 'Positions' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'rifle', label: 'Rifle Equipment' },
  { id: 'equipment-control', label: 'Equipment Control' },
  { id: 'finals', label: 'Finals' },
  { id: 'commands', label: 'Range Commands' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'penalties', label: 'Penalties' },
  { id: 'malfunctions', label: 'Malfunctions' },
  { id: 'targets', label: 'Targets & Range' },
  { id: 'protests', label: 'Protests & Appeals' },
  { id: 'safety', label: 'Safety' },
];

export const CLOTHING_SUBTOPICS = [
  { label: 'Shooting Jacket', q: 'shooting jacket' },
  { label: 'Shooting Trousers', q: 'shooting trousers' },
  { label: 'Shooting Shoes', q: 'shooting shoes' },
  { label: 'Shooting Glove', q: 'shooting glove' },
  { label: 'Underclothing', q: 'underclothing' },
  { label: 'Stiffness', q: 'stiffness' },
  { label: 'Thickness', q: 'thickness' },
  { label: 'Equipment Control', q: 'equipment control' },
];

export const THREE_P_SUBTOPICS = [
  { label: 'Qualification timing', q: '3P timing' },
  { label: 'Preparation & sighting', q: 'preparation and sighting' },
  { label: 'Kneeling', q: 'kneeling' },
  { label: 'Prone', q: 'prone position' },
  { label: 'Standing', q: 'standing position' },
  { label: 'Position change', q: 'position change' },
  { label: 'Finals', q: 'rifle finals' },
  { label: 'Equipment', q: 'rifle equipment' },
];

export const PRONE_SUBTOPICS = [
  { label: 'Competition timing', q: '50m prone timing' },
  { label: 'Preparation', q: 'preparation time' },
  { label: 'Sighting', q: 'prone sighters' },
  { label: 'Prone position', q: 'prone position' },
  { label: 'Sling', q: 'sling' },
  { label: 'Rifle', q: 'rifle weight' },
  { label: 'Clothing', q: 'shooting jacket' },
];

export const EXAMPLE_QUERIES = [
  '3P timing',
  'prone sighters',
  'shooting jacket',
  'rifle weight',
  'position change',
  'finals',
];

export const QUESTION_SHORTCUTS = [
  { label: 'How long is a 3P match?', q: '3P timing' },
  { label: 'What is the preparation and sighting time?', q: 'preparation and sighting' },
  { label: 'What are the prone position rules?', q: 'prone position' },
  { label: 'What are the shooting jacket requirements?', q: 'shooting jacket' },
  { label: 'What rifle equipment is permitted?', q: 'rifle weight' },
  { label: 'How does equipment control work?', q: 'equipment control' },
];

/** Aliases mapped to ISSF terminology present in the current rulebook. */
export const RULE_ALIASES: Record<string, string[]> = {
  '3p': ['3 position', '3-position', 'three position', 'rifle 3 positions', '50m rifle 3 positions', '50 m rifle 3 positions'],
  '3 p': ['3-position', 'three position'],
  'three position': ['3-position', '50m rifle 3 positions'],
  prone: ['50m prone', '50 m prone', 'rifle prone', 'prone position'],
  sighters: ['sighting shots', 'sighting', 'sighting series'],
  sighter: ['sighting shots', 'sighting'],
  prep: ['preparation time', 'preparation and sighting'],
  jacket: ['shooting jacket', 'clothing'],
  pants: ['trousers', 'shooting trousers'],
  trousers: ['shooting trousers'],
  boots: ['shoes', 'shooting shoes'],
  shoes: ['shooting shoes'],
  glove: ['shooting glove'],
  buttplate: ['butt plate'],
  'butt plate': ['buttplate'],
  iris: ['rear sight', 'aperture'],
  'rifle weight': ['maximum weight', 'rifle specification table', 'weights'],
};
