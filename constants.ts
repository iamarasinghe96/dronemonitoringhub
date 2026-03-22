
import { Zone } from './types';

export const RESTRICTED_ZONES: Zone[] = [
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
    description: 'Heritage site. Drone flying requires archeological department clearance.',
    radius: 2,
    lat: 7.9570,
    lng: 80.7603,
  }
];

export const APP_PRIMARY_BLUE = '#1388d1';
export const APP_NAVY = '#030f27';
