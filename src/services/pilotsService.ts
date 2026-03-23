import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { Pilot } from '../types';

const COLLECTION = 'pilots';

export async function getPilots(): Promise<Pilot[]> {
  if (!isConfigured || !db) return [];
  try {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Pilot));
  } catch {
    return [];
  }
}

export async function registerPilot(pilot: Omit<Pilot, 'id'>): Promise<string> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  const ref = await addDoc(collection(db, COLLECTION), {
    ...pilot,
    registeredAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePilot(id: string, updates: Partial<Omit<Pilot, 'id'>>): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, COLLECTION, id), updates);
}

export async function deletePilot(id: string): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION, id));
}
