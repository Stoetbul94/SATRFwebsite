import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBGOJjccvNu8nBHXPqkpdG-an_zTtz3Bn0",
  authDomain: "satrf-website.firebaseapp.com",
  projectId: "satrf-website",
  storageBucket: "satrf-website.firebasestorage.app",
  messagingSenderId: "6560150752",
  appId: "1:6560150752:web:8d0fdb63317fe24f4c4c85",
  measurementId: "G-68F7B7F032",
  databaseURL: "https://satrf-website-default-rtdb.firebaseio.com" // Adding Realtime Database URL
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, storage, rtdb, auth, analytics }; 