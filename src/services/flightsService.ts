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
  where,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { ActiveFlight } from '../types';

const COLLECTION = 'flights';

export function subscribeToActiveFlights(callback: (flights: ActiveFlight[]) => void): Unsubscribe {
  if (!isConfigured || !db) {
    callback([]);
    return () => {};
  }
  const now = Timestamp.now();
  // Fetch approved flights that have started (endTime >= now handled client-side)
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'APPROVED'),
    where('toTimestamp', '>=', now),
  );
  return onSnapshot(q, snapshot => {
    const nowMs = Date.now();
    const flights = snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          license: data.license ?? '',
          pilotName: data.pilotName ?? 'Registered Pilot',
          contact: data.contact ?? '',
          from: data.from ?? '',
          to: data.to ?? '',
          lat: data.lat ?? 0,
          lng: data.lng ?? 0,
          status: data.status ?? 'APPROVED',
          notes: data.notes ?? '',
        } as ActiveFlight;
      })
      .filter(f => {
        const startMs = new Date(f.from).getTime();
        return nowMs >= startMs;
      });
    callback(flights);
  }, () => callback([]));
}

export async function addFlight(flight: Omit<ActiveFlight, 'id'>): Promise<string> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  const fromDate = new Date(flight.from);
  const toDate = new Date(flight.to);
  const ref = await addDoc(collection(db, COLLECTION), {
    ...flight,
    fromTimestamp: Timestamp.fromDate(fromDate),
    toTimestamp: Timestamp.fromDate(toDate),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateFlightStatus(id: string, status: ActiveFlight['status']): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, COLLECTION, id), { status });
}

export async function deleteFlight(id: string): Promise<void> {
  if (!isConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getAllFlights(): Promise<ActiveFlight[]> {
  if (!isConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActiveFlight));
  } catch {
    return [];
  }
}
