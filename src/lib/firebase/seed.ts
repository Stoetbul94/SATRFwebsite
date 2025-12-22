import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Discipline } from '@/types';

const disciplines: Omit<Discipline, 'id'>[] = [
  {
    name: '50m Rifle 3 Positions (3P)',
    category: 'Target Rifle',
    description: 'A precision shooting discipline where competitors shoot in three positions: prone, standing, and kneeling. Each position requires different techniques and skills.',
    rules: 'Follows ISSF rules for 50m Rifle 3 Positions. Competitors must complete the course of fire in the specified time limits for each position.',
    equipment: {
      rifle: [
        'Smallbore rifle chambered in .22LR',
        'Maximum weight: 8.0kg',
        'Maximum trigger pull: 1.5kg',
        'Maximum sight radius: 850mm'
      ],
      ammunition: [
        '.22LR rimfire ammunition',
        'Match grade recommended',
        'No tracer or incendiary rounds'
      ],
      accessories: [
        'Shooting jacket',
        'Shooting pants',
        'Shooting boots',
        'Shooting glove',
        'Sling',
        'Sight hood'
      ]
    },
    distances: ['50 meters'],
    targets: ['ISSF 50m Rifle Target'],
    scoring: 'Maximum score of 1200 points (40 shots per position, 10 points per shot)',
    image: '/images/disciplines/3p.jpg'
  },
  {
    name: '50m Rifle Prone (.22)',
    category: 'Target Rifle',
    description: 'A precision shooting discipline where competitors shoot in the prone position only. This discipline emphasizes stability and consistency.',
    rules: 'Follows ISSF rules for 50m Rifle Prone. Competitors must complete the course of fire in the specified time limit.',
    equipment: {
      rifle: [
        'Smallbore rifle chambered in .22LR',
        'Maximum weight: 8.0kg',
        'Maximum trigger pull: 1.5kg',
        'Maximum sight radius: 850mm'
      ],
      ammunition: [
        '.22LR rimfire ammunition',
        'Match grade recommended',
        'No tracer or incendiary rounds'
      ],
      accessories: [
        'Shooting jacket',
        'Shooting pants',
        'Shooting boots',
        'Shooting glove',
        'Sling',
        'Sight hood'
      ]
    },
    distances: ['50 meters'],
    targets: ['ISSF 50m Rifle Target'],
    scoring: 'Maximum score of 600 points (60 shots, 10 points per shot)',
    image: '/images/disciplines/prone.jpg'
  },
  {
    name: 'F-Class Open',
    category: 'F-Class',
    description: 'A long-range precision shooting discipline where competitors shoot from the prone position using a bipod or rest. Open class allows for more equipment modifications.',
    rules: 'Follows ICFRA F-Class rules. Competitors must shoot from the prone position using a bipod or rest.',
    equipment: {
      rifle: [
        'Centerfire rifle',
        'Maximum caliber: .35',
        'No weight restrictions',
        'Bipod or rest allowed'
      ],
      ammunition: [
        'Centerfire ammunition',
        'Match grade recommended',
        'No tracer or incendiary rounds'
      ],
      accessories: [
        'Shooting mat',
        'Rear bag',
        'Scope with adjustable magnification',
        'Wind meter',
        'Data book'
      ]
    },
    distances: ['300m', '500m', '600m', '900m', '1000m'],
    targets: ['F-Class Target'],
    scoring: 'Maximum score of 600 points (20 shots, 30 points per shot)',
    image: '/images/disciplines/fclass-open.jpg'
  },
  {
    name: 'F-Class Standard',
    category: 'F-Class',
    description: 'A long-range precision shooting discipline where competitors shoot from the prone position using a bipod only. Standard class has stricter equipment limitations.',
    rules: 'Follows ICFRA F-Class Standard rules. Competitors must shoot from the prone position using a bipod only.',
    equipment: {
      rifle: [
        'Centerfire rifle',
        'Maximum caliber: .35',
        'No weight restrictions',
        'Bipod only, no front rest'
      ],
      ammunition: [
        'Centerfire ammunition',
        'Match grade recommended',
        'No tracer or incendiary rounds'
      ],
      accessories: [
        'Shooting mat',
        'Rear bag',
        'Scope with adjustable magnification',
        'Wind meter',
        'Data book'
      ]
    },
    distances: ['300m', '500m', '600m', '900m', '1000m'],
    targets: ['F-Class Target'],
    scoring: 'Maximum score of 600 points (20 shots, 30 points per shot)',
    image: '/images/disciplines/fclass-standard.jpg'
  }
];

export const seedDisciplines = async () => {
  const disciplinesCollection = collection(db, 'disciplines');
  
  for (const discipline of disciplines) {
    try {
      await addDoc(disciplinesCollection, discipline);
      console.log(`Added discipline: ${discipline.name}`);
    } catch (error) {
      console.error(`Error adding discipline ${discipline.name}:`, error);
    }
  }
}; 