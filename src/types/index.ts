export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  membershipType: 'Full' | 'Associate' | 'Junior';
  club: string;
  disciplines: string[];
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  discipline: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  registrationDeadline: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  results?: Result[];
  images: string[];
}

export interface Result {
  id: string;
  eventId: string;
  userId: string;
  score: number;
  position: number;
  details: {
    prone?: number;
    standing?: number;
    kneeling?: number;
    total?: number;
  };
  createdAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: Date;
  type: 'competition' | 'training' | 'certification';
  image?: string;
}

export interface Discipline {
  id: string;
  name: string;
  category: 'Target Rifle' | 'F-Class';
  description: string;
  rules: string;
  equipment: {
    rifle: string[];
    ammunition: string[];
    accessories: string[];
  };
  distances: string[];
  targets: string[];
  scoring: string;
  image: string;
} 