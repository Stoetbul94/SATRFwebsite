import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { User, Event, Result, Achievement, Discipline } from '@/types';

// User Services
export const getUser = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? (userDoc.data() as User) : null;
};

export const updateUser = async (userId: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', userId), data);
};

// Event Services
export const getEvents = async (filters?: {
  discipline?: string;
  status?: string;
  limit?: number;
}): Promise<Event[]> => {
  const constraints: any[] = [];
  
  if (filters?.discipline) {
    constraints.push(where('discipline', '==', filters.discipline));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  
  constraints.push(orderBy('startDate', 'asc'));
  
  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }
  
  const q = query(collection(db, 'events'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
};

export const createEvent = async (eventData: Omit<Event, 'id'>) => {
  const docRef = await addDoc(collection(db, 'events'), {
    ...eventData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Result Services
export const getResults = async (eventId: string): Promise<Result[]> => {
  const q = query(
    collection(db, 'results'),
    where('eventId', '==', eventId),
    orderBy('score', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

export const addResult = async (resultData: Omit<Result, 'id'>) => {
  const docRef = await addDoc(collection(db, 'results'), {
    ...resultData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Achievement Services
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  const q = query(
    collection(db, 'achievements'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
};

export const addAchievement = async (achievementData: Omit<Achievement, 'id'>) => {
  const docRef = await addDoc(collection(db, 'achievements'), {
    ...achievementData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Discipline Services
export const getDisciplines = async (): Promise<Discipline[]> => {
  const snapshot = await getDocs(collection(db, 'disciplines'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discipline));
};

// File Upload Service
export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}; 