import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Database } from 'firebase/database';
import type { Analytics } from 'firebase/analytics';
import type { FirebaseApp } from 'firebase/app';
import { getFirebaseApp } from './firebase/app';
import { getClientAuth } from './firebase/authClient';
import {
  getClientAnalytics,
  getClientDb,
  getClientRtdb,
  getClientStorage,
} from './firebase/dataClient';

function lazyService<T extends object>(getInstance: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = getInstance();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}

export const app: FirebaseApp = lazyService(getFirebaseApp) as FirebaseApp;
export const auth: Auth = lazyService(getClientAuth);
export const db: Firestore = lazyService(getClientDb);
export const storage: FirebaseStorage = lazyService(getClientStorage);
export const rtdb: Database = lazyService(getClientRtdb);
export const analytics: Analytics | null =
  typeof window !== 'undefined' ? (lazyService(() => getClientAnalytics()!) as Analytics) : null;

export { getFirebaseApp } from './firebase/app';
export { getClientAuth } from './firebase/authClient';
export { getClientAnalytics, getClientDb, getClientRtdb, getClientStorage } from './firebase/dataClient';
