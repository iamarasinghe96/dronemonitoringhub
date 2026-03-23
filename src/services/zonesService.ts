import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { Zone } from '../types';
import { DEFAULT_ZONES } from '../constants';

const COLLECTION = 'zones';

export async function getZones(): Promise<Zone[]> {
  if (!isConfigured || !db) return DEFAULT_ZONES;
  try {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Zone));
  } catch {
    return DEFAULT_ZONES;
  }
}

export function subscribeToZones(callback: (zones: Zone[]) => void): Unsubscribe {
  if (!isConfigured || !db) {
    callback(DEFAULT_ZONES);
    return () => {};
  }
  const q = query(collection(db, COLLECTION), orderBy('name'));
  return onSnapshot(q, snapshot => {
    const zones = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Zone));
    callback(zones.length > 0 ? zones : DEFAULT_ZONES);
  }, () => callback(DEFAULT_ZONES));
}

export async function addZone(zone: Omit<Zone, 'id'>): Promise<string> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  const ref = await addDoc(collection(db, COLLECTION), {
    ...zone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateZone(id: string, updates: Partial<Omit<Zone, 'id'>>): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteZone(id: string): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION, id));
}
