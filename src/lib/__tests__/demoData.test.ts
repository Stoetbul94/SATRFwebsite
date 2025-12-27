/**
 * Demo Data System - Unit Tests
 * 
 * Tests for deterministic behavior, environment safety, and data integrity
 */

import { 
  isDemoModeEnabled, 
  generateDemoEvents, 
  generateDemoScores,
  simpleHash 
} from '../demoData';

// Mock environment variables
const originalEnv = process.env;

describe('Demo Data System', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    // Mock window for client-side tests
    (global as any).window = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (global as any).window;
  });

  describe('isDemoModeEnabled', () => {
    it('should return false in production without flag', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      
      expect(isDemoModeEnabled()).toBe(false);
    });

    it('should return true in development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(isDemoModeEnabled()).toBe(true);
    });

    it('should return true when NEXT_PUBLIC_DEMO_MODE is true', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
      
      expect(isDemoModeEnabled()).toBe(true);
    });

    it('should return false when NEXT_PUBLIC_DEMO_MODE is false', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
      
      expect(isDemoModeEnabled()).toBe(false);
    });
  });

  describe('generateDemoEvents', () => {
    it('should generate 4 demo events', () => {
      const events = generateDemoEvents();
      
      expect(events).toHaveLength(4);
    });

    it('should mark all events as demo data', () => {
      const events = generateDemoEvents();
      
      events.forEach(event => {
        expect(event.isDemoData).toBe(true);
        expect(event.title).toContain('[DEMO]');
      });
    });

    it('should have events in the past', () => {
      const events = generateDemoEvents();
      const now = new Date();
      
      events.forEach(event => {
        expect(event.start.getTime()).toBeLessThan(now.getTime());
        expect(event.end.getTime()).toBeLessThan(now.getTime());
      });
    });

    it('should have different disciplines', () => {
      const events = generateDemoEvents();
      const disciplines = events.map(e => e.discipline);
      
      // Should have at least 2 different disciplines
      expect(new Set(disciplines).size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateDemoScores - Deterministic Behavior', () => {
    const userInfo = {
      id: 'test-user-123',
      firstName: 'Test',
      lastName: 'User',
      club: 'Test Club',
      membershipType: 'senior' as const,
    };

    const events = [
      { id: 'event-1', discipline: '3P' },
      { id: 'event-2', discipline: 'Prone' },
      { id: 'event-3', discipline: 'Air Rifle' },
      { id: 'event-4', discipline: 'Target Rifle' },
    ];

    it('should generate same scores for same user', () => {
      const scores1 = generateDemoScores('user-123', events, userInfo);
      const scores2 = generateDemoScores('user-123', events, userInfo);
      
      expect(scores1).toHaveLength(scores2.length);
      expect(scores1.map(s => s.score)).toEqual(scores2.map(s => s.score));
      expect(scores1.map(s => s.xCount)).toEqual(scores2.map(s => s.xCount));
    });

    it('should generate different scores for different users', () => {
      const scores1 = generateDemoScores('user-123', events, userInfo);
      const scores2 = generateDemoScores('user-456', events, userInfo);
      
      // Scores should be different (very unlikely to be identical)
      const scores1Values = scores1.map(s => `${s.eventId}-${s.score}-${s.xCount}`).sort();
      const scores2Values = scores2.map(s => `${s.eventId}-${s.score}-${s.xCount}`).sort();
      
      expect(scores1Values).not.toEqual(scores2Values);
    });

    it('should generate 2-4 scores per user', () => {
      const scores = generateDemoScores('user-123', events, userInfo);
      
      expect(scores.length).toBeGreaterThanOrEqual(2);
      expect(scores.length).toBeLessThanOrEqual(4);
    });

    it('should mark all scores as demo data', () => {
      const scores = generateDemoScores('user-123', events, userInfo);
      
      scores.forEach(score => {
        expect(score.isDemoData).toBe(true);
        expect(score.status).toBe('approved');
      });
    });

    it('should generate realistic scores within ranges', () => {
      const scores = generateDemoScores('user-123', events, userInfo);
      
      const ranges: Record<string, { min: number; max: number }> = {
        '3P': { min: 550, max: 590 },
        'Prone': { min: 580, max: 600 },
        'Air Rifle': { min: 600, max: 630 },
        'Target Rifle': { min: 570, max: 600 },
      };
      
      scores.forEach(score => {
        const range = ranges[score.discipline] || ranges['3P'];
        expect(score.score).toBeGreaterThanOrEqual(range.min);
        expect(score.score).toBeLessThanOrEqual(range.max);
      });
    });

    it('should assign scores to different events', () => {
      const scores = generateDemoScores('user-123', events, userInfo);
      const eventIds = scores.map(s => s.eventId);
      
      // Should have unique event IDs (no duplicate event assignments)
      expect(new Set(eventIds).size).toBe(eventIds.length);
    });
  });

  describe('simpleHash', () => {
    it('should return same hash for same input', () => {
      const hash1 = simpleHash('test-user-123');
      const hash2 = simpleHash('test-user-123');
      
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different input', () => {
      const hash1 = simpleHash('user-123');
      const hash2 = simpleHash('user-456');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should return value between 0 and 999', () => {
      const hash = simpleHash('any-string');
      
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(1000);
    });
  });

  describe('Data Integrity', () => {
    it('should have consistent event structure', () => {
      const events = generateDemoEvents();
      
      events.forEach(event => {
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('discipline');
        expect(event).toHaveProperty('category');
        expect(event).toHaveProperty('isDemoData', true);
        expect(event).toHaveProperty('start');
        expect(event).toHaveProperty('end');
        expect(event).toHaveProperty('location');
      });
    });

    it('should have consistent score structure', () => {
      const events = [
        { id: 'event-1', discipline: '3P' },
      ];
      const userInfo = {
        id: 'user-123',
        firstName: 'Test',
        lastName: 'User',
        club: 'Test Club',
        membershipType: 'senior' as const,
      };
      
      const scores = generateDemoScores('user-123', events, userInfo);
      
      scores.forEach(score => {
        expect(score).toHaveProperty('eventId');
        expect(score).toHaveProperty('discipline');
        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('xCount');
        expect(score).toHaveProperty('status', 'approved');
        expect(score).toHaveProperty('isDemoData', true);
      });
    });
  });
});

// Helper function to expose simpleHash for testing
// Note: This would need to be exported from demoData.ts for actual testing
// For now, this test file documents the expected behavior
