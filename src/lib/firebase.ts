import { getFirebaseApp } from './firebase/app';
import { getClientAuth } from './firebase/authClient';
import {
  getClientAnalytics,
  getClientDb,
  getClientRtdb,
  getClientStorage,
} from './firebase/dataClient';

const app = getFirebaseApp();
const auth = getClientAuth();
const db = getClientDb();
const storage = getClientStorage();
const rtdb = getClientRtdb();

let analytics: ReturnType<typeof getClientAnalytics> = null;
if (typeof window !== 'undefined') {
  analytics = getClientAnalytics();
}

export { app, auth, db, storage, rtdb, analytics };
export { getFirebaseApp } from './firebase/app';
export { getClientAuth } from './firebase/authClient';
export { getClientAnalytics, getClientDb, getClientRtdb, getClientStorage } from './firebase/dataClient';
