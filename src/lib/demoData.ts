/**
 * Demo Data Generator for Development
 * 
 * This module generates dummy events and scores for development and demo purposes.
 * 
 * IMPORTANT: This is for DEVELOPMENT ONLY
 * - Only enabled when NODE_ENV === "development" OR NEXT_PUBLIC_DEMO_MODE === "true"
 * - All demo data is clearly marked with isDemoData: true
 * - Demo data can be safely removed later by filtering on isDemoData flag
 * 
 * Usage:
 * - Call generateDemoDataForUser(userId, userInfo) after user registration
 * - Data is stable (deterministic based on userId) - same data every time
 * - Demo events are created once and shared across all users
 * - Demo scores are assigned to the specific user
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENVIRONMENT CHECK
// ============================================================================

/**
 * Check if demo mode is enabled
 */
export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    );
  }
  
  // Client-side: check both process.env and window
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_DEMO_MODE === 'true'
  );
}

// ============================================================================
// TYPES
// ============================================================================

export interface DemoEvent {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location: string;
  category: string;
  discipline: string;
  price: number;
  maxSpots: number;
  currentSpots: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
  registrationDeadline: Date;
  isLocal: boolean;
  source: 'SATRF' | 'ISSF';
  isDemoData: true; // Always true for demo data
}

export interface DemoScore {
  eventId: string;
  discipline: string;
  score: number;
  xCount: number;
  status: 'approved';
  isDemoData: true; // Always true for demo data
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  club: string;
  membershipType: 'junior' | 'senior' | 'veteran';
}

// ============================================================================
// DEMO EVENTS GENERATOR
// ============================================================================

/**
 * Generate demo events (shared across all users)
 * These events are created once and reused
 */
export function generateDemoEvents(): DemoEvent[] {
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);
  
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  return [
    {
      title: '[DEMO] SATRF National Championship 2024',
      description: 'Demo event: The premier target rifle shooting championship. This is demo data for development purposes.',
      start: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15, 8, 0),
      end: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 17, 18, 0),
      location: 'Johannesburg Shooting Range',
      category: 'Senior',
      discipline: '3P',
      price: 500,
      maxSpots: 50,
      currentSpots: 35,
      status: 'CLOSED',
      registrationDeadline: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1, 23, 59),
      isLocal: true,
      source: 'SATRF',
      isDemoData: true,
    },
    {
      title: '[DEMO] SATRF Prone Match Series',
      description: 'Demo event: Monthly prone shooting competition. This is demo data for development purposes.',
      start: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10, 9, 0),
      end: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10, 17, 0),
      location: 'Pretoria Shooting Range',
      category: 'All Categories',
      discipline: 'Prone',
      price: 150,
      maxSpots: 40,
      currentSpots: 28,
      status: 'CLOSED',
      registrationDeadline: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 8, 23, 59),
      isLocal: true,
      source: 'SATRF',
      isDemoData: true,
    },
    {
      title: '[DEMO] Air Rifle Development Camp',
      description: 'Demo event: Training camp for air rifle shooters. This is demo data for development purposes.',
      start: new Date(twoWeeksAgo.getFullYear(), twoWeeksAgo.getMonth(), twoWeeksAgo.getDate(), 8, 0),
      end: new Date(twoWeeksAgo.getFullYear(), twoWeeksAgo.getMonth(), twoWeeksAgo.getDate() + 2, 16, 0),
      location: 'Cape Town Shooting Club',
      category: 'Junior',
      discipline: 'Air Rifle',
      price: 300,
      maxSpots: 30,
      currentSpots: 25,
      status: 'CLOSED',
      registrationDeadline: new Date(twoWeeksAgo.getFullYear(), twoWeeksAgo.getMonth(), twoWeeksAgo.getDate() - 7, 23, 59),
      isLocal: true,
      source: 'SATRF',
      isDemoData: true,
    },
    {
      title: '[DEMO] ISSF World Cup - Target Rifle',
      description: 'Demo event: International Shooting Sport Federation World Cup. This is demo data for development purposes.',
      start: new Date(oneWeekAgo.getFullYear(), oneWeekAgo.getMonth(), oneWeekAgo.getDate(), 9, 0),
      end: new Date(oneWeekAgo.getFullYear(), oneWeekAgo.getMonth(), oneWeekAgo.getDate() + 5, 17, 0),
      location: 'Munich, Germany',
      category: 'International',
      discipline: 'Target Rifle',
      price: 0,
      maxSpots: 200,
      currentSpots: 150,
      status: 'CLOSED',
      registrationDeadline: new Date(oneWeekAgo.getFullYear(), oneWeekAgo.getMonth(), oneWeekAgo.getDate() - 10, 23, 59),
      isLocal: false,
      source: 'ISSF',
      isDemoData: true,
    },
  ];
}

// ============================================================================
// DEMO SCORES GENERATOR
// ============================================================================

/**
 * Generate demo scores for a specific user
 * Scores are deterministic based on userId (same scores every time)
 * 
 * @param userId - User ID to generate scores for
 * @param events - Array of events with IDs and disciplines
 * @param userInfo - User information for score metadata
 */
export function generateDemoScores(
  userId: string,
  events: Array<{ id: string; discipline: string }>,
  userInfo: UserInfo
): DemoScore[] {
  // Use userId hash to generate stable but varied scores
  // This ensures same user always gets same scores, but different users get different scores
  const hash = simpleHash(userId);
  
  const scores: DemoScore[] = [];
  
  // Generate 2-4 scores per user (one per event, but not all events)
  const numScores = 2 + (hash % 3); // 2, 3, or 4 scores
  
  // Score ranges by discipline (realistic shooting scores)
  const scoreRanges: Record<string, { min: number; max: number; xMin: number; xMax: number }> = {
    '3P': { min: 550, max: 590, xMin: 5, xMax: 15 },
    'Prone': { min: 580, max: 600, xMin: 10, xMax: 20 },
    'Air Rifle': { min: 600, max: 630, xMin: 15, xMax: 30 },
    'Target Rifle': { min: 570, max: 600, xMin: 8, xMax: 18 },
  };
  
  // Select events to assign scores to (deterministic based on hash)
  const selectedEventIndices: number[] = [];
  for (let i = 0; i < numScores && i < events.length; i++) {
    selectedEventIndices.push((hash + i) % events.length);
  }
  
  // Get unique event indices
  const uniqueIndices = Array.from(new Set(selectedEventIndices));
  
  uniqueIndices.forEach((eventIndex, scoreIndex) => {
    const event = events[eventIndex];
    const discipline = event.discipline;
    
    const range = scoreRanges[discipline] || scoreRanges['3P'];
    
    // Generate score based on hash + scoreIndex (stable per user)
    const scoreSeed = (hash + scoreIndex * 100) % 1000;
    const score = range.min + Math.floor((scoreSeed / 1000) * (range.max - range.min));
    const xCount = range.xMin + Math.floor((scoreSeed / 1000) * (range.xMax - range.xMin));
    
    scores.push({
      eventId: event.id,
      discipline,
      score,
      xCount,
      status: 'approved',
      isDemoData: true,
    });
  });
  
  return scores;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple hash function for deterministic value generation
 * @param str - String to hash
 * @returns Hash value (0-999)
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000;
}

/**
 * Convert Date to Firestore Timestamp
 */
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert Date to ISO string for API
 */
function dateToISO(date: Date): string {
  return date.toISOString();
}

// ============================================================================
// MAIN EXPORT: Generate Demo Data for User
// ============================================================================

/**
 * Generate and create demo data for a user
 * 
 * This function:
 * 1. Creates demo events (if they don't exist)
 * 2. Creates demo scores for the user
 * 
 * @param userId - User ID
 * @param userInfo - User information
 * @returns Object with created event IDs and score count
 */
export async function generateDemoDataForUser(
  userId: string,
  userInfo: UserInfo
): Promise<{ eventIds: string[]; scoreCount: number }> {
  // Check if demo mode is enabled
  if (!isDemoModeEnabled()) {
    console.log('[DEMO DATA] Demo mode is disabled. Skipping demo data generation.');
    return { eventIds: [], scoreCount: 0 };
  }
  
  console.log('[DEMO DATA] Generating demo data for user:', userId);
  
  try {
    // Import Firebase functions
    const { collection, addDoc, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    // Step 1: Create or get demo events
    const demoEvents = generateDemoEvents();
    const eventIds: string[] = [];
    
    for (const event of demoEvents) {
      // Check if demo event already exists (by title)
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('title', '==', event.title),
        where('isDemoData', '==', true)
      );
      
      const existingEvents = await getDocs(q);
      
      let eventId: string;
      
      if (!existingEvents.empty) {
        // Event already exists, use its ID
        eventId = existingEvents.docs[0].id;
        console.log('[DEMO DATA] Using existing demo event:', event.title);
      } else {
        // Create new demo event
        const eventData = {
          ...event,
          start: dateToTimestamp(event.start),
          end: dateToTimestamp(event.end),
          registrationDeadline: dateToTimestamp(event.registrationDeadline),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        const docRef = await addDoc(eventsRef, eventData);
        eventId = docRef.id;
        console.log('[DEMO DATA] Created demo event:', event.title, eventId);
      }
      
      eventIds.push(eventId);
    }
    
    // Step 2: Fetch event disciplines for score generation
    const eventsWithDisciplines = await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          const eventDocRef = doc(db, 'events', eventId);
          const eventDoc = await getDoc(eventDocRef);
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            return { id: eventId, discipline: eventData.discipline || '3P' };
          }
        } catch (error) {
          console.warn('[DEMO DATA] Could not fetch event discipline for', eventId, error);
        }
        // Fallback: use event index to determine discipline
        const demoEvents = generateDemoEvents();
        const eventIndex = eventIds.indexOf(eventId);
        return { id: eventId, discipline: demoEvents[eventIndex]?.discipline || '3P' };
      })
    );
    
    // Step 3: Create demo scores for this user
    // Check if user already has demo scores
    const scoresRef = collection(db, 'scores');
    const userScoresQuery = query(
      scoresRef,
      where('userId', '==', userId),
      where('isDemoData', '==', true)
    );
    
    const existingScores = await getDocs(userScoresQuery);
    
    if (!existingScores.empty) {
      console.log('[DEMO DATA] User already has demo scores. Skipping score generation.');
      return { eventIds, scoreCount: existingScores.size };
    }
    
    // Generate scores
    const demoScores = generateDemoScores(userId, eventsWithDisciplines, userInfo);
    
    // Create score documents
    for (const score of demoScores) {
      const scoreData = {
        ...score,
        userId,
        userName: `${userInfo.firstName} ${userInfo.lastName}`,
        club: userInfo.club,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await addDoc(scoresRef, scoreData);
    }
    
    console.log('[DEMO DATA] Created', demoScores.length, 'demo scores for user:', userId);
    
    return {
      eventIds,
      scoreCount: demoScores.length,
    };
  } catch (error) {
    console.error('[DEMO DATA] Error generating demo data:', error);
    // Don't throw - demo data is optional
    return { eventIds: [], scoreCount: 0 };
  }
}

/**
 * Remove all demo data (for cleanup/testing)
 * WARNING: This will delete all demo events and scores
 */
export async function removeAllDemoData(): Promise<void> {
  if (!isDemoModeEnabled()) {
    console.log('[DEMO DATA] Demo mode is disabled. Cannot remove demo data.');
    return;
  }
  
  console.warn('[DEMO DATA] Removing all demo data...');
  
  try {
    const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    // Remove demo events
    const eventsRef = collection(db, 'events');
    const demoEventsQuery = query(eventsRef, where('isDemoData', '==', true));
    const demoEvents = await getDocs(demoEventsQuery);
    
    for (const eventDoc of demoEvents.docs) {
      await deleteDoc(doc(db, 'events', eventDoc.id));
    }
    
    console.log('[DEMO DATA] Removed', demoEvents.size, 'demo events');
    
    // Remove demo scores
    const scoresRef = collection(db, 'scores');
    const demoScoresQuery = query(scoresRef, where('isDemoData', '==', true));
    const demoScores = await getDocs(demoScoresQuery);
    
    for (const scoreDoc of demoScores.docs) {
      await deleteDoc(doc(db, 'scores', scoreDoc.id));
    }
    
    console.log('[DEMO DATA] Removed', demoScores.size, 'demo scores');
    
    console.log('[DEMO DATA] Demo data removal complete');
  } catch (error) {
    console.error('[DEMO DATA] Error removing demo data:', error);
    throw error;
  }
}
