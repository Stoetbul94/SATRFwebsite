import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseApp } from './app';

let authInstance: Auth | null = null;

export function getClientAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}
