import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getFirebaseApp } from './app';

let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let rtdbInstance: Database | null = null;
let analyticsInstance: Analytics | null = null;

export function getClientDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export function getClientStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }
  return storageInstance;
}

export function getClientRtdb(): Database {
  if (!rtdbInstance) {
    rtdbInstance = getDatabase(getFirebaseApp());
  }
  return rtdbInstance;
}

export function getClientAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (!analyticsInstance) {
    analyticsInstance = getAnalytics(getFirebaseApp());
  }
  return analyticsInstance;
}
