# Demo Data System

## Overview

The demo data system automatically generates dummy events and scores for development and demo purposes. This allows new users to immediately see populated dashboards, leaderboards, and analytics without needing real competition data.

## Features

- **Automatic Generation**: Demo data is automatically created when users register or log in (first time)
- **Environment Safe**: Only enabled in development mode or when `NEXT_PUBLIC_DEMO_MODE=true`
- **Stable Data**: Same user always gets the same demo data (deterministic based on user ID)
- **Clearly Marked**: All demo data has `isDemoData: true` flag for easy identification
- **Safe to Remove**: Demo data can be easily filtered out or deleted

## Configuration

### Enable Demo Mode

Demo data is automatically enabled when:
- `NODE_ENV === "development"` OR
- `NEXT_PUBLIC_DEMO_MODE === "true"`

To enable in production (for demos):
```bash
NEXT_PUBLIC_DEMO_MODE=true npm run build
```

### Disable Demo Mode

Demo data is automatically disabled in production unless explicitly enabled via `NEXT_PUBLIC_DEMO_MODE`.

## What Gets Generated

### Demo Events (4 events)
1. **[DEMO] SATRF National Championship 2024** - 3P, Senior, 2 months ago
2. **[DEMO] SATRF Prone Match Series** - Prone, All Categories, 1 month ago
3. **[DEMO] Air Rifle Development Camp** - Air Rifle, Junior, 2 weeks ago
4. **[DEMO] ISSF World Cup - Target Rifle** - Target Rifle, International, 1 week ago

All events are marked with `[DEMO]` prefix and `isDemoData: true`.

### Demo Scores (2-4 per user)
- Each user gets 2-4 scores assigned to different demo events
- Scores are realistic for each discipline:
  - **3P**: 550-590 points, 5-15 X-count
  - **Prone**: 580-600 points, 10-20 X-count
  - **Air Rifle**: 600-630 points, 15-30 X-count
  - **Target Rifle**: 570-600 points, 8-18 X-count
- All scores are automatically approved (`status: 'approved'`)
- Scores are deterministic (same user = same scores every time)

## How It Works

### Registration Flow
1. User registers → User profile created
2. Demo data generator runs in background (non-blocking)
3. Demo events created (if they don't exist)
4. Demo scores created for the new user

### Login Flow
1. User logs in → Authentication successful
2. Demo data generator checks if user has demo scores
3. If no demo scores exist, they are generated (non-blocking)

### Data Stability
- Demo events are shared across all users (created once)
- Demo scores are unique per user
- Same user ID always generates the same scores (hash-based)

## Removing Demo Data

### Remove All Demo Data

```typescript
import { removeAllDemoData } from '@/lib/demoData';

// Remove all demo events and scores
await removeAllDemoData();
```

### Filter Demo Data in Queries

```typescript
// In Firestore queries
const scoresRef = collection(db, 'scores');
const realScoresQuery = query(
  scoresRef,
  where('isDemoData', '!=', true) // Exclude demo data
);
```

### Remove Demo Data from Production

1. Set up a migration script to delete all documents with `isDemoData: true`
2. Or use Firestore console to query and delete:
   - Events: `isDemoData == true`
   - Scores: `isDemoData == true`

## File Structure

```
src/lib/
  ├── demoData.ts          # Demo data generator
  └── auth.ts              # Registration/login hooks
```

## API Reference

### `generateDemoDataForUser(userId, userInfo)`

Generates demo events and scores for a user.

**Parameters:**
- `userId` (string): User ID
- `userInfo` (object): User information
  - `id`: User ID
  - `firstName`: First name
  - `lastName`: Last name
  - `club`: Club name
  - `membershipType`: 'junior' | 'senior' | 'veteran'

**Returns:**
- `Promise<{ eventIds: string[], scoreCount: number }>`

### `isDemoModeEnabled()`

Checks if demo mode is enabled.

**Returns:**
- `boolean`

### `removeAllDemoData()`

Removes all demo events and scores from the database.

**Returns:**
- `Promise<void>`

## Notes

- Demo data generation is **non-blocking** - it won't slow down registration/login
- Demo data generation failures are logged but don't affect user registration/login
- Demo events are created once and reused across all users
- Demo scores are unique per user and stable (same user = same scores)

## Troubleshooting

### Demo data not appearing

1. Check if demo mode is enabled:
   ```typescript
   import { isDemoModeEnabled } from '@/lib/demoData';
   console.log('Demo mode enabled:', isDemoModeEnabled());
   ```

2. Check browser console for errors during registration/login

3. Verify Firestore security rules allow creating events and scores

4. Check that user has proper permissions

### Demo data appearing in production

1. Ensure `NEXT_PUBLIC_DEMO_MODE` is not set to `"true"` in production
2. Verify `NODE_ENV` is `"production"` in production builds
3. Check environment variables in your deployment platform

## Future Enhancements

- Add more demo events (different categories, disciplines)
- Add demo event registrations
- Add demo notifications
- Add admin UI to manage demo data
