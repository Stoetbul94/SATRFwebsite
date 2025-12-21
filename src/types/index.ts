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

export interface MatchResult {
  // Event information
  eventName: 'Prone Match 1' | 'Prone Match 2' | '3P' | 'Air Rifle';
  matchNumber: number;
  
  // Shooter information
  shooterName: string;
  shooterId?: string | number;
  club: string;
  division?: string;
  veteran: boolean;
  
  // Scores
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  
  // Calculated fields
  total: number;
  place?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  source: 'manual' | 'upload';
}

export type MatchResultFormData = Omit<MatchResult, 'total' | 'createdAt' | 'updatedAt' | 'source'>

export interface MatchResultUpload {
  eventName: MatchResult['eventName'];
  matchNumber: number;
  shooterName: string;
  shooterId?: string | number;
  club: string;
  division?: string;
  veteran: 'Y' | 'N';
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  place?: number;
} 