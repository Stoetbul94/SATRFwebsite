# Deploy Firestore Rules - Quick Guide

## Current Status
✅ Firebase Auth is working (user accounts are being created)
❌ Firestore rules are NOT deployed (causing "Permission denied" errors)

## Quick Deploy via Firebase Console

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/satrf-website/firestore/rules

### Step 2: Copy Rules
Copy the entire contents of `firestore.rules` file (see below)

### Step 3: Paste & Publish
1. Paste the rules into the Firebase Console editor
2. Click **"Publish"** button

## Rules Content (Copy This)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================================================
    // USERS COLLECTION RULES
    // ============================================================================
    // Users can read their own profile and create their own user document during registration
    // Admins can read/write all user documents
    // ============================================================================
    
    match /users/{userId} {
      // Allow users to read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to create their own user document during registration
      // This is critical for the registration flow to work
      allow create: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.data.id == userId
                   && request.resource.data.email == request.auth.token.email
                   && request.resource.data.role == 'user'; // Prevent users from creating admin accounts
      
      // Allow users to update their own profile (but not change critical fields)
      allow update: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.data.id == userId
                   && request.resource.data.email == request.auth.token.email
                   && request.resource.data.role == resource.data.role; // Cannot change role
      
      // Admins can read/write all user documents
      allow read, write: if request.auth != null 
                        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================================================
    // SCORES COLLECTION RULES
    // ============================================================================
    // Users can read all scores (public leaderboard)
    // Users can create their own scores
    // Admins can read/write all scores
    // ============================================================================
    
    match /scores/{scoreId} {
      // Public read access for leaderboard
      allow read: if true;
      
      // Users can create their own scores
      allow create: if request.auth != null 
                   && request.resource.data.userId == request.auth.uid;
      
      // Users can update their own pending scores
      allow update: if request.auth != null 
                   && resource.data.userId == request.auth.uid
                   && resource.data.status == 'pending';
      
      // Admins can read/write all scores
      allow read, write: if request.auth != null 
                        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================================================
    // ADMIN ACTIONS COLLECTION RULES
    // ============================================================================
    // Only admins can read/write admin actions
    // ============================================================================
    
    match /adminActions/{actionId} {
      allow read, write: if request.auth != null 
                        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================================================
    // EVENTS COLLECTION RULES
    // ============================================================================
    // Public read access for events
    // Admins can create/update/delete events
    // ============================================================================
    
    match /events/{eventId} {
      // Public read access
      allow read: if true;
      
      // Only admins can create/update/delete events
      allow write: if request.auth != null 
                  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================================================
    // DEFAULT DENY
    // ============================================================================
    // All other collections are denied by default
    // ============================================================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## After Deployment

Once rules are deployed:
1. Test registration again at `/register`
2. Registration should now work completely
3. User will be created in both Firebase Auth AND Firestore

## Alternative: CLI Deployment

If you prefer CLI (requires `firebase login` first):

```bash
firebase login
firebase deploy --only firestore:rules
```


