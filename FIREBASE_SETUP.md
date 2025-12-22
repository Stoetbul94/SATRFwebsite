# Firebase Setup Guide

## Firestore Security Rules Deployment

The Firestore security rules are defined in `firestore.rules`. To deploy them:

### Option 1: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `satrf-website`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## Security Rules Explanation

### Users Collection (`/users/{userId}`)

- **Read**: Users can read their own profile
- **Create**: Users can create their own user document during registration
  - Must match authenticated user's UID
  - Email must match authenticated user's email
  - Role must be 'user' (prevents privilege escalation)
- **Update**: Users can update their own profile (but cannot change role)
- **Admin Access**: Admins can read/write all user documents

### Scores Collection (`/scores/{scoreId}`)

- **Read**: Public access (for leaderboard)
- **Create**: Users can create their own scores
- **Update**: Users can update their own pending scores
- **Admin Access**: Admins can read/write all scores

### Admin Actions Collection (`/adminActions/{actionId}`)

- **Read/Write**: Only admins can access

### Events Collection (`/events/{eventId}`)

- **Read**: Public access
- **Write**: Only admins can create/update/delete events

## Registration Flow

The registration flow now uses Firebase Auth + Firestore:

1. **Firebase Auth**: Creates user account with `createUserWithEmailAndPassword`
2. **Firestore**: Creates user profile document in `users` collection
3. **Token Storage**: Stores Firebase ID token for session management

## Error Handling

The registration flow includes enhanced error handling for:
- `auth/email-already-in-use`: User-friendly message
- `auth/invalid-email`: Email validation error
- `auth/weak-password`: Password strength error
- `permission-denied`: Firestore rules error (with development logging)
- Generic errors: Fallback with detailed logging in development

## Testing Registration

1. Navigate to `/register`
2. Fill out the form with valid data
3. Submit and check:
   - Browser console for any errors
   - Firestore console to verify user document creation
   - Firebase Auth console to verify user account creation

## Troubleshooting

### "Permission denied" Error

- Check Firestore rules are deployed
- Verify user is authenticated (check Firebase Auth)
- Check that user document ID matches authenticated user's UID
- Verify email matches authenticated user's email

### "Email already in use" Error

- User already exists in Firebase Auth
- Check Firebase Auth console for existing users
- User should sign in instead of registering

### Registration succeeds but user document not created

- Check Firestore rules allow create operation
- Check browser console for Firestore errors
- Verify Firestore is enabled in Firebase Console

