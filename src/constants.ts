import { Zone } from './types';

export const APP_PRIMARY_BLUE = '#1388d1';
export const APP_NAVY = '#030f27';

// Fallback zones used when Firestore is unavailable
export const DEFAULT_ZONES: Zone[] = [
  {
    id: 'bka',
    name: 'Bandaranaike International Airport (BIA)',
    type: 'PROHIBITED',
    description: 'Strictly no-fly zone within 5km of BIA airport perimeter.',
    radius: 5,
    lat: 7.1802,
    lng: 79.8837,
  },
  {
    id: 'rma',
    name: 'Ratmalana Airport',
    type: 'PROHIBITED',
    description: 'Airport vicinity restriction zone.',
    radius: 5,
    lat: 6.8222,
    lng: 79.8864,
  },
  {
    id: 'hsz-colombo',
    name: 'Colombo High Security Zone',
    type: 'PROHIBITED',
    description: 'Security sensitive area. Flying requires special Ministry of Defence approval.',
    radius: 3,
    lat: 6.9271,
    lng: 79.8436,
  },
  {
    id: 'sigiriya',
    name: 'Sigiriya Ancient Site',
    type: 'RESTRICTED',
    description: 'Heritage site. Drone flying requires archaeological department clearance.',
    radius: 2,
    lat: 7.9570,
    lng: 80.7603,
  },
];

export const SRI_LANKA_REGIONS: Record<string, string[]> = {
  "Western": ["Colombo", "Gampaha", "Kalutara"],
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern": ["Galle", "Matara", "Hambantota"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern": ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Uva": ["Badulla", "Moneragala"],
  "Sabaragamuwa": ["Ratnapura", "Kegalle"],
};

export const DISTRICT_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Colombo": { lat: 6.9271, lng: 79.8612, zoom: 12 },
  "Gampaha": { lat: 7.0840, lng: 79.9925, zoom: 11 },
  "Kalutara": { lat: 6.5854, lng: 79.9607, zoom: 11 },
  "Kandy": { lat: 7.2906, lng: 80.6337, zoom: 11 },
  "Galle": { lat: 6.0535, lng: 80.2210, zoom: 11 },
  "Jaffna": { lat: 9.6615, lng: 80.0074, zoom: 11 },
  "Default": { lat: 7.8731, lng: 80.7718, zoom: 7 },
};

export const GEOJSON_URL =
  'https://raw.githubusercontent.com/arimacdev/sri-lanka-geojson/master/sri-lanka-districts.json';
