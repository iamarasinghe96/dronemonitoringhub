
export enum DroneCategory {
  CATEGORY_A = 'Category A (Above 25kg)',
  CATEGORY_B = 'Category B (1kg - 25kg)',
  CATEGORY_C = 'Category C (Below 1kg)',
}

export interface Zone {
  id: string;
  name: string;
  type: 'RESTRICTED' | 'PROHIBITED' | 'WARNING';
  description: string;
  radius: number; // in km
  lat: number;
  lng: number;
}

export interface ActiveFlight {
  license: string;
  from: string;
  to: string;
  lat: number;
  lng: number;
  status: string;
  notes: string;
  contact?: string;
  pilotName?: string;
  additionalData?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Fix: Added uri property to support links in the AI Assistant UI
export interface GroundingSource {
  title: string;
  uri: string;
}
