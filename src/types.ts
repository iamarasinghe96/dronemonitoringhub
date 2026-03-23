export enum DroneCategory {
  CATEGORY_A = 'Category A (Above 25kg)',
  CATEGORY_B = 'Category B (1kg - 25kg)',
  CATEGORY_C = 'Category C (Below 1kg)',
}

export type ZoneType = 'RESTRICTED' | 'PROHIBITED' | 'WARNING';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  radius: number; // in km
  lat: number;
  lng: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActiveFlight {
  id: string;
  license: string;
  pilotName: string;
  contact: string;
  from: string; // ISO date string
  to: string;   // ISO date string
  lat: number;
  lng: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  notes: string;
  createdAt?: Date;
}

export interface Pilot {
  id: string;
  licenseId: string;
  name: string;
  nic: string;
  phone: string;
  email: string;
  address: string;
  droneModel: string;
  droneSerial: string;
  category: DroneCategory;
  registeredAt?: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
