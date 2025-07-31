# SATRF Database Schema Documentation

## Overview

The SATRF API uses **Firestore** as the NoSQL database with the following collections:

- `users` - User accounts and profiles
- `events` - Shooting events and competitions
- `scores` - User scores and results
- `leaderboard` - Calculated rankings and statistics

## Collection Schemas

### 1. Users Collection (`users`)

**Purpose**: Store user account information and profiles

**Document Structure**:
```json
{
  "id": "auto-generated-document-id",
  "firstName": "string (2-50 chars)",
  "lastName": "string (2-50 chars)",
  "email": "string (valid email)",
  "hashedPassword": "string (bcrypt hash)",
  "membershipType": "junior | senior | veteran",
  "club": "string (2-100 chars)",
  "role": "user | admin | event_scorer",
  "isActive": "boolean (default: true)",
  "createdAt": "datetime (ISO format)",
  "updatedAt": "datetime (ISO format)"
}
```

**Indexes**:
- `email` (unique)
- `club`
- `membershipType`
- `role`
- `isActive`

**Example Document**:
```json
{
  "id": "user_123456",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "hashedPassword": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS8s.m",
  "membershipType": "senior",
  "club": "Cape Town Shooting Club",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Events Collection (`events`)

**Purpose**: Store shooting events and competitions

**Document Structure**:
```json
{
  "id": "auto-generated-document-id",
  "title": "string (3-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "date": "datetime (ISO format)",
  "location": "string (2-200 chars)",
  "type": "string (2-100 chars)",
  "maxParticipants": "integer (optional, > 0)",
  "currentParticipants": "integer (default: 0)",
  "status": "open | full | closed",
  "createdAt": "datetime (ISO format)",
  "updatedAt": "datetime (ISO format)"
}
```

**Indexes**:
- `date`
- `location`
- `type`
- `status`
- `maxParticipants`

**Example Document**:
```json
{
  "id": "event_789012",
  "title": "Cape Town Championship 2024",
  "description": "Annual championship event for all categories",
  "date": "2024-03-15T09:00:00Z",
  "location": "Cape Town Shooting Range",
  "type": "Championship",
  "maxParticipants": 50,
  "currentParticipants": 25,
  "status": "open",
  "createdAt": "2024-01-10T14:20:00Z",
  "updatedAt": "2024-01-15T16:45:00Z"
}
```

### 3. Scores Collection (`scores`)

**Purpose**: Store user scores and shooting results

**Document Structure**:
```json
{
  "id": "auto-generated-document-id",
  "userId": "string (reference to users.id)",
  "eventId": "string (reference to events.id)",
  "score": "integer (0-600)",
  "xCount": "integer (0-60)",
  "notes": "string (optional, max 500 chars)",
  "status": "pending | approved | rejected",
  "createdAt": "datetime (ISO format)",
  "updatedAt": "datetime (ISO format)"
}
```

**Indexes**:
- `userId`
- `eventId`
- `score`
- `status`
- `createdAt`

**Example Document**:
```json
{
  "id": "score_345678",
  "userId": "user_123456",
  "eventId": "event_789012",
  "score": 595,
  "xCount": 45,
  "notes": "Excellent performance in windy conditions",
  "status": "approved",
  "createdAt": "2024-03-15T14:30:00Z",
  "updatedAt": "2024-03-16T09:15:00Z"
}
```

### 4. Leaderboard Collection (`leaderboard`)

**Purpose**: Store calculated rankings and statistics

**Document Structure**:
```json
{
  "id": "auto-generated-document-id",
  "userId": "string (reference to users.id)",
  "firstName": "string",
  "lastName": "string",
  "club": "string",
  "totalScore": "integer",
  "totalXCount": "integer",
  "averageScore": "float",
  "eventsParticipated": "integer",
  "rank": "integer",
  "category": "junior | senior | veteran | overall",
  "lastUpdated": "datetime (ISO format)"
}
```

**Indexes**:
- `category`
- `rank`
- `totalScore`
- `averageScore`
- `club`

**Example Document**:
```json
{
  "id": "leaderboard_901234",
  "userId": "user_123456",
  "firstName": "John",
  "lastName": "Smith",
  "club": "Cape Town Shooting Club",
  "totalScore": 1785,
  "totalXCount": 135,
  "averageScore": 595.0,
  "eventsParticipated": 3,
  "rank": 1,
  "category": "senior",
  "lastUpdated": "2024-03-16T10:00:00Z"
}
```

## Data Relationships

### One-to-Many Relationships

1. **User → Scores**: One user can have multiple scores
   - `scores.userId` references `users.id`

2. **Event → Scores**: One event can have multiple scores
   - `scores.eventId` references `events.id`

3. **User → Leaderboard**: One user can have multiple leaderboard entries (different categories)
   - `leaderboard.userId` references `users.id`

### Many-to-Many Relationships

1. **Users ↔ Events**: Users can register for multiple events, events can have multiple participants
   - Currently handled through `events.currentParticipants` counter
   - Future: Separate `event_registrations` collection

## Data Validation Rules

### User Data
- Email must be unique
- Password must be hashed with bcrypt
- Membership type must be valid enum value
- Role must be valid enum value

### Event Data
- Date must be in the future for new events
- Current participants cannot exceed max participants
- Status must be valid enum value

### Score Data
- Score must be between 0-600
- X count must be between 0-60
- User and event must exist
- Status must be valid enum value

### Leaderboard Data
- Rank must be unique within category
- Average score calculated as totalScore / eventsParticipated
- Auto-updated when scores are approved

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events are readable by all authenticated users
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Scores are readable by all, writable by owner or admin
    match /scores/{scoreId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Leaderboard is readable by all, writable by system only
    match /leaderboard/{entryId} {
      allow read: if request.auth != null;
      allow write: if false; // System updates only
    }
  }
}
```

## Performance Considerations

### Indexing Strategy

1. **Composite Indexes**:
   - `events`: `(status, date)` for filtering open events by date
   - `scores`: `(userId, createdAt)` for user score history
   - `scores`: `(eventId, score)` for event rankings
   - `leaderboard`: `(category, rank)` for category rankings

2. **Query Optimization**:
   - Use pagination for large result sets
   - Limit query results with `limit()`
   - Use specific field selection to reduce data transfer

### Data Consistency

1. **Event Registration**:
   - Use Firestore transactions for participant count updates
   - Implement optimistic locking for concurrent registrations

2. **Score Updates**:
   - Update leaderboard entries atomically
   - Use batch writes for multiple updates

3. **User Deactivation**:
   - Soft delete users (set `isActive: false`)
   - Maintain referential integrity

## Backup and Recovery

### Backup Strategy

1. **Automated Backups**:
   - Daily Firestore exports to Cloud Storage
   - Point-in-time recovery capability
   - Cross-region backup replication

2. **Data Retention**:
   - User data: 7 years (legal compliance)
   - Event data: 3 years
   - Score data: 5 years
   - Leaderboard data: 3 years

### Disaster Recovery

1. **Recovery Procedures**:
   - Restore from latest backup
   - Validate data integrity
   - Update application configuration

2. **Monitoring**:
   - Database performance metrics
   - Error rate monitoring
   - Backup success monitoring

## Migration and Versioning

### Schema Evolution

1. **Backward Compatibility**:
   - Add new fields as optional
   - Maintain default values for missing fields
   - Version API endpoints

2. **Data Migration**:
   - Use Firestore batch operations
   - Validate migrated data
   - Rollback procedures

### Version Control

1. **API Versioning**:
   - URL-based versioning (`/api/v1/`)
   - Maintain multiple versions during transition
   - Deprecation notices

2. **Database Versioning**:
   - Schema version field in documents
   - Migration scripts for version updates
   - Rollback capabilities

This schema provides a solid foundation for the SATRF application with proper data relationships, security, and performance considerations. 