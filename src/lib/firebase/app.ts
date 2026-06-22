import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: 'AIzaSyBGOJjccvNu8nBHXPqkpdG-an_zTtz3Bn0',
  authDomain: 'satrf-website.firebaseapp.com',
  projectId: 'satrf-website',
  storageBucket: 'satrf-website.firebasestorage.app',
  messagingSenderId: '6560150752',
  appId: '1:6560150752:web:8d0fdb63317fe24f4c4c85',
  measurementId: 'G-68F7B7F032',
  databaseURL: 'https://satrf-website-default-rtdb.firebaseio.com',
};

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return firebaseApp;
}
