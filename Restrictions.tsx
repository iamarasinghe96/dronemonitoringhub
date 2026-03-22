
import React, { useState, useEffect, useRef } from 'react';
import { ActiveFlight } from '../types';

// Global declarations for external mapping libraries
declare const google: any;
declare const L: any;

interface ApiZone {
  lat: number;
  lng: number;
  radius: number; // Stored in KM
  type: string;
  name: string;
}

const SRI_LANKA_REGIONS: Record<string, string[]> = {
  "Western": ["Colombo", "Gampaha", "Kalutara"],
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern": ["Galle", "Matara", "Hambantota"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern": ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Uva": ["Badulla", "Moneragala"],
  "Sabaragamuwa": ["Ratnapura", "Kegalle"]
};

const DISTRICT_COORDS: Record<string, { lat: number, lng: number, zoom: number }> = {
  "Colombo": { lat: 6.9271, lng: 79.8612, zoom: 12.5 },
  "Gampaha": { lat: 7.0840, lng: 79.9925, zoom: 11 },
  "Kalutara": { lat: 6.5854, lng: 79.9607, zoom: 11 },
  "Kandy": { lat: 7.2906, lng: 80.6337, zoom: 11 },
  "Galle": { lat: 6.0535, lng: 80.2210, zoom: 11 },
  "Jaffna": { lat: 9.6615, lng: 80.0074, zoom: 11 },
  "Default": { lat: 7.8731, lng: 80.7718, zoom: 6.5 }
};

const GEOJSON_URL = 'https://raw.githubusercontent.com/arimacdev/sri-lanka-geojson/master/sri-lanka-districts.json';

const getPulseSvg = (zoom: number) => {
  const baseZoom = 6.5;
  const maxPulseRadius = Math.max(12, 40 - (zoom - baseZoom) * 4);
  const viewBoxSize = maxPulseRadius * 2 + 10;
  const center = viewBoxSize / 2;
  
  const svg = `
<svg width="${viewBoxSize}" height="${viewBoxSize}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#22c55e" stop-opacity="0" />
      <stop offset="60%" stop-color="#22c55e" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="${center}" cy="${center}" r="3" fill="url(#pulseGradient)" stroke="#22c55e" stroke-width="0.5">
    <animate attributeName="r" from="3" to="${maxPulseRadius}" dur="2.5s" begin="0s" repeatCount="indefinite" />
    <animate attributeName="opacity" from="1" to="0" dur="2.5s" begin="0s" repeatCount="indefinite" />
  </circle>
  <circle cx="${center}" cy="${center}" r="3" fill="url(#pulseGradient)" stroke="#22c55e" stroke-width="0.5">
    <animate attributeName="r" from="3" to="${maxPulseRadius}" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
    <animate attributeName="opacity" from="0.7" to="0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
  </circle>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getDroneChassisSvg = () => {
  const svg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="5" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
  <circle cx="19" cy="5" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
  <circle cx="5" cy="19" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
  <circle cx="19" cy="19" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
  <path d="M7 7L17 17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
  <path d="M17 7L7 17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
  <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#10b981" stroke="#22c55e" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="1.5" fill="#ffffff">
    <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
  </circle>
</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const Dashboard: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState('Western');
  const [selectedDistrict, setSelectedDistrict] = useState('Default');
  const [zones, setZones] = useState<ApiZone[]>([]);
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet' | 'pending'>('pending');
  const [zoomLevel, setZoomLevel] = useState(DISTRICT_COORDS["Default"].zoom);
  const [hoveredZone, setHoveredZone] = useState<ApiZone | null>(null);
  const [hoveredDrone, setHoveredDrone] = useState<ActiveFlight | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const droneMarkers = useRef<any[]>([]);
  const searchMarker = useRef<any>(null);
  const boundaryLayer = useRef<any>(null);
  const hasAuthFailed = useRef<boolean>(false);
  const geoJsonCache = useRef<any>(null);

  const TRAFFIC_API_URL = 'https://script.google.com/macros/s/AKfycbzypzwgEPNrUu0vhNnxYAAeY6cA50RqSD4lYjpsj7g087Q-x-G5mkf-ljg1KhBqMJT3yg/exec';
  const REGISTRY_API_URL = 'https://script.google.com/macros/s/AKfycbwuhbjXy2sSuPpUFD0sAeuj0Qe8f26bHMwd1KQilMp1f1KTj0LH5MevYCyQKGfbWGSKfg/exec';

  const openWhatsApp = (phone: any) => {
    const phoneStr = String(phone || '');
    if (!phoneStr || phoneStr === 'N/A' || phoneStr.includes('No Contact')) return;
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = '94' + cleaned.substring(1);
    if (cleaned.length < 8) return;
    const message = encodeURIComponent("Hi this is Ministry of Defense Drone monitoring division.");
    window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
  };

  const getZoneColor = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('PROHIBITED') || t.includes('RESTRICTED')) return '#ef4444';
    return '#f59e0b';
  };

  const safeFetchJson = async (url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      try { return JSON.parse(text); } catch (e) { return null; }
    } catch (e) { return null; }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [zoneData, trafficData, registryData, geoData] = await Promise.all([
        safeFetchJson(`${TRAFFIC_API_URL}?action=getZones`),
        safeFetchJson(`${TRAFFIC_API_URL}?action=getTraffic`),
        safeFetchJson(`${REGISTRY_API_URL}?action=list`),
        geoJsonCache.current ? Promise.resolve(geoJsonCache.current) : safeFetchJson(GEOJSON_URL)
      ]);
      if (Array.isArray(zoneData)) {
        const normalizedZones = zoneData.map(z => ({
          ...z,
          radius: Number(z.radius) > 100 ? Number(z.radius) / 1000 : Number(z.radius)
        }));
        setZones(normalizedZones);
      }
      if (geoData) geoJsonCache.current = geoData;
      const pilotMap: Record<string, { name: string, phone: string }> = {};
      if (Array.isArray(registryData)) {
        registryData.forEach((row: any) => {
          if (Array.isArray(row) && row.length >= 20) {
            const regId = String(row[19] || '').toUpperCase().trim(); 
            if (regId) pilotMap[regId] = { name: String(row[1] || "Authorized Operator"), phone: String(row[10] || "") };
          }
        });
      }
      if (trafficData) processActiveFlights(trafficData, pilotMap);
    } catch (err) { console.error("Manual refresh failed:", err); } finally { setRefreshing(false); }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    initialLoad();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    if (mapInstance.current) {
      const results = await safeFetchJson(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Sri Lanka')}`);
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        if (mapEngine === 'google') {
          mapInstance.current.setCenter({ lat: newLat, lng: newLon });
          mapInstance.current.setZoom(14);
        } else {
          mapInstance.current.setView([newLat, newLon], 14);
        }
        dropSearchMarker(newLat, newLon);
      }
    }
  };

  const dropSearchMarker = (lat: number, lng: number) => {
    if (searchMarker.current) {
      if (mapEngine === 'google') searchMarker.current.setMap(null);
      else searchMarker.current.remove();
    }
    if (mapEngine === 'google' && (window as any).google) {
      searchMarker.current = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current,
        animation: google.maps.Animation.DROP,
        icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      });
    } else if (mapEngine === 'leaflet' && (window as any).L) {
      searchMarker.current = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapInstance.current);
    }
  };

  const initAutocomplete = () => {
    if (mapEngine !== 'google' || !searchInputRef.current || !(window as any).google?.maps?.places) return;
    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "lk" },
      fields: ["geometry", "name"]
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;
      mapInstance.current.setCenter(place.geometry.location);
      mapInstance.current.setZoom(15);
      dropSearchMarker(place.geometry.location.lat(), place.geometry.location.lng());
    });
  };

  const processActiveFlights = (rawLogs: any[], pilotMap: Record<string, any>) => {
    if (!Array.isArray(rawLogs)) return;
    const now = new Date();
    const active = rawLogs.filter(log => {
      if (!Array.isArray(log) || log.length < 5) return false;
      const noteOrStatus = log[4]?.toString().toLowerCase() || "";
      if (!noteOrStatus.includes('approved')) return false;
      const startTime = new Date(log[1]);
      const endTime = new Date(log[2]);
      return now >= startTime && now <= endTime;
    }).map(log => {
      const coordStr = log[3]?.toString() || "0,0";
      const [lat, lng] = coordStr.split(',').map(v => parseFloat(v.trim()));
      const licenseId = String(log[0] || '').toUpperCase().trim();
      const pilotData = pilotMap[licenseId] || {};
      return {
        license: licenseId, from: String(log[1] || ''), to: String(log[2] || ''),
        lat: lat || 0, lng: lng || 0, status: 'APPROVED', notes: String(log[5] || ""),
        pilotName: pilotData.name || "Registered Pilot", contact: pilotData.phone || "",
      };
    });
    setActiveFlights(active);
  };

  const renderBoundaries = () => {
    if (!mapInstance.current || !geoJsonCache.current) return;
    const isGoogle = mapEngine === 'google';
    const map = mapInstance.current;
    const targetDistrict = selectedDistrict.toLowerCase();
    const targetProvince = selectedProvince.toLowerCase();

    if (isGoogle && (window as any).google) {
      map.data.forEach((feature: any) => map.data.remove(feature));
      map.data.addGeoJson(geoJsonCache.current);
      map.data.setStyle((feature: any) => {
        const districtName = feature.getProperty('district')?.toLowerCase() || feature.getProperty('NAME_2')?.toLowerCase();
        const provinceName = feature.getProperty('province')?.toLowerCase() || feature.getProperty('NAME_1')?.toLowerCase();
        const isSelected = selectedDistrict !== 'Default' ? (districtName === targetDistrict) : (provinceName === targetProvince);
        return {
          fillColor: isSelected ? '#1388d1' : 'transparent', fillOpacity: isSelected ? 0.15 : 0,
          strokeColor: isSelected ? '#1388d1' : '#cbd5e1', strokeWeight: isSelected ? 4 : 0.5,
          zIndex: isSelected ? 10 : 0, visible: selectedDistrict === 'Default' || isSelected
        };
      });
    } else if (mapEngine === 'leaflet' && (window as any).L) {
      if (boundaryLayer.current) boundaryLayer.current.remove();
      boundaryLayer.current = L.geoJson(geoJsonCache.current, {
        style: (feature: any) => {
          const districtName = feature.properties.district?.toLowerCase() || feature.properties.NAME_2?.toLowerCase();
          const provinceName = feature.properties.province?.toLowerCase() || feature.properties.NAME_1?.toLowerCase();
          const isSelected = selectedDistrict !== 'Default' ? (districtName === targetDistrict) : (provinceName === targetProvince);
          return {
            color: isSelected ? '#1388d1' : '#cbd5e1', weight: isSelected ? 4 : 0.5,
            fillColor: isSelected ? '#1388d1' : 'transparent', fillOpacity: isSelected ? 0.15 : 0,
            opacity: isSelected ? 1 : (selectedDistrict === 'Default' ? 0.2 : 0)
          };
        },
        filter: (feature: any) => {
          if (selectedDistrict === 'Default') return true;
          const districtName = feature.properties.district?.toLowerCase() || feature.properties.NAME_2?.toLowerCase();
          return districtName === targetDistrict;
        }
      }).addTo(map);
    }
  };

  const initGoogleMap = () => {
    if (!mapContainerRef.current) return;
    // Clear the container before initializing
    mapContainerRef.current.innerHTML = '';
    setMapEngine('google');
    const initial = DISTRICT_COORDS[selectedDistrict] || DISTRICT_COORDS["Default"];
    mapInstance.current = new google.maps.Map(mapContainerRef.current, {
      center: { lat: initial.lat, lng: initial.lng },
      zoom: initial.zoom, 
      disableDefaultUI: true, 
      gestureHandling: 'greedy',
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });
    mapInstance.current.addListener('zoom_changed', () => setZoomLevel(mapInstance.current.getZoom()));
    initAutocomplete();
    renderBoundaries();
    renderOverlays();
  };

  const initLeafletMap = () => {
    if (!mapContainerRef.current) return;
    // Clear the container before initializing
    mapContainerRef.current.innerHTML = '';
    setMapEngine('leaflet');
    const initial = DISTRICT_COORDS[selectedDistrict] || DISTRICT_COORDS["Default"];
    if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch(e) {}
    }
    mapInstance.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([initial.lat, initial.lng], initial.zoom);
    mapInstance.current.on('zoomend', () => setZoomLevel(mapInstance.current.getZoom()));
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapInstance.current);
    renderBoundaries();
    renderOverlays();
  };

  useEffect(() => {
    let googleTimeout: any;

    const loadScriptsAndInit = async () => {
      const key = process.env.API_KEY;
      const isInvalidKey = !key || key === 'undefined' || key.length < 10 || key.includes('YOUR_API_KEY');

      // Listen for Google Maps Auth Failures globally
      (window as any).gm_authFailure = () => {
        console.warn("Google Maps Auth Failure (InvalidKeyMapError). Falling back to Leaflet immediately.");
        hasAuthFailed.current = true;
        loadLeafletFallback();
      };

      if (!isInvalidKey && !hasAuthFailed.current) {
        try {
          if (!(window as any).google?.maps) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
            script.async = true;
            script.onload = () => {
                // Additional safety timeout to ensure window.google.maps is fully ready
                googleTimeout = setTimeout(() => {
                    if ((window as any).google?.maps && !hasAuthFailed.current) initGoogleMap();
                    else loadLeafletFallback();
                }, 1000);
            };
            script.onerror = () => {
              console.error("Google Maps script load failed. Switching to Leaflet.");
              loadLeafletFallback();
            };
            document.head.appendChild(script);
            
            // Failover timeout if script loads but doesn't init
            googleTimeout = setTimeout(() => {
                if (mapEngine === 'pending') {
                    console.warn("Google Maps initialization timed out. Switching to Leaflet.");
                    loadLeafletFallback();
                }
            }, 5000);
          } else {
            initGoogleMap();
          }
        } catch (e) {
          loadLeafletFallback();
        }
      } else {
        loadLeafletFallback();
      }
    };

    const loadLeafletFallback = () => {
      if (mapEngine === 'leaflet') return;
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initLeafletMap;
        document.head.appendChild(script);
      } else {
        initLeafletMap();
      }
    };

    loadScriptsAndInit();

    return () => {
        if (googleTimeout) clearTimeout(googleTimeout);
    }
  }, []);

  const renderOverlays = () => {
    if (!mapInstance.current || mapEngine === 'pending') return;
    overlays.current.forEach(o => mapEngine === 'google' ? o?.setMap?.(null) : o?.remove?.());
    droneMarkers.current.forEach(o => mapEngine === 'google' ? o?.setMap?.(null) : o?.remove?.());
    overlays.current = [];
    droneMarkers.current = [];
    const isGoogle = mapEngine === 'google';
    const map = mapInstance.current;

    zones.forEach(zone => {
      const color = getZoneColor(zone.type);
      const radiusInMeters = zone.radius * 1000;
      
      if (isGoogle && (window as any).google) {
        const circle = new google.maps.Circle({
          strokeColor: color, strokeOpacity: 0.9, strokeWeight: 2, fillColor: color, fillOpacity: 0.15,
          map, center: { lat: zone.lat, lng: zone.lng }, radius: radiusInMeters, clickable: true, zIndex: 20
        });
        google.maps.event.addListener(circle, 'mouseover', (e: any) => { setHoverPos({ x: e.domEvent.clientX, y: e.domEvent.clientY }); setHoveredZone(zone); });
        google.maps.event.addListener(circle, 'mousemove', (e: any) => setHoverPos({ x: e.domEvent.clientX, y: e.domEvent.clientY }));
        google.maps.event.addListener(circle, 'mouseout', () => setHoveredZone(null));
        overlays.current.push(circle);
      } else if (mapEngine === 'leaflet' && (window as any).L) {
        const circle = L.circle([zone.lat, zone.lng], { radius: radiusInMeters, color, weight: 2, fillColor: color, fillOpacity: 0.15, zIndex: 1000 }).addTo(map);
        circle.on('mouseover', (e: any) => { setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }); setHoveredZone(zone); });
        circle.on('mousemove', (e: any) => setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }));
        circle.on('mouseout', () => setHoveredZone(null));
        overlays.current.push(circle);
      }
    });

    const pulseIconUrl = getPulseSvg(zoomLevel);
    const droneIconUrl = getDroneChassisSvg();
    const maxPulseRadius = Math.max(12, 40 - (zoomLevel - 6.5) * 4);
    const calculatedPulseSize = maxPulseRadius * 2 + 10;

    activeFlights.forEach(flight => {
      if (isGoogle && (window as any).google) {
        const pulseMarker = new google.maps.Marker({
          position: { lat: flight.lat, lng: flight.lng }, map, clickable: false, optimized: false, zIndex: 29,
          icon: { url: pulseIconUrl, scaledSize: new google.maps.Size(calculatedPulseSize, calculatedPulseSize), origin: new google.maps.Point(0, 0), anchor: new google.maps.Point(calculatedPulseSize / 2, calculatedPulseSize / 2) }
        });
        droneMarkers.current.push(pulseMarker);
        const droneMarker = new google.maps.Marker({
          position: { lat: flight.lat, lng: flight.lng }, map, optimized: false, cursor: 'pointer', zIndex: 30,
          icon: { url: droneIconUrl, scaledSize: new google.maps.Size(24, 24), origin: new google.maps.Point(0, 0), anchor: new google.maps.Point(12, 12) },
          shape: { coords: [12, 12, 8], type: 'circle' }
        });
        droneMarker.addListener('mouseover', (e: any) => { setHoverPos({ x: e.domEvent.clientX, y: e.domEvent.clientY }); setHoveredDrone(flight); });
        droneMarker.addListener('mouseout', () => setHoveredDrone(null));
        droneMarker.addListener('click', () => { if (flight.contact) openWhatsApp(flight.contact); });
        droneMarkers.current.push(droneMarker);
      } else if (mapEngine === 'leaflet' && (window as any).L) {
        const pulseLayer = L.marker([flight.lat, flight.lng], { icon: L.icon({ iconUrl: pulseIconUrl, iconSize: [calculatedPulseSize, calculatedPulseSize], iconAnchor: [calculatedPulseSize/2, calculatedPulseSize/2] }), interactive: false, zIndexOffset: 1900 }).addTo(map);
        droneMarkers.current.push(pulseLayer);
        const marker = L.marker([flight.lat, flight.lng], { icon: L.icon({ iconUrl: droneIconUrl, iconSize: [24, 24], iconAnchor: [12, 12] }), riseOnHover: true, zIndexOffset: 2000 }).addTo(map);
        marker.on('mouseover', (e: any) => { setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }); setHoveredDrone(flight); });
        marker.on('mouseout', () => setHoveredDrone(null));
        marker.on('click', () => { if (flight.contact) openWhatsApp(flight.contact); });
        droneMarkers.current.push(marker);
      }
    });
  };

  useEffect(() => {
    if (!mapInstance.current || mapEngine === 'pending') return;
    const d = DISTRICT_COORDS[selectedDistrict] || DISTRICT_COORDS["Default"];
    if (mapEngine === 'google') { 
        mapInstance.current.panTo({ lat: d.lat, lng: d.lng }); 
        mapInstance.current.setZoom(d.zoom); 
    } else { 
        mapInstance.current.setView([d.lat, d.lng], d.zoom); 
    }
    renderBoundaries();
  }, [selectedDistrict, selectedProvince, mapEngine]);

  useEffect(() => {
    renderOverlays();
  }, [zones, activeFlights, mapEngine, zoomLevel]);

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    const map = mapInstance.current;
    if (!map) return;
    if (type === 'reset') {
      const d = DISTRICT_COORDS["Default"];
      if (mapEngine === 'google') { map.panTo({ lat: d.lat, lng: d.lng }); map.setZoom(d.zoom); }
      else { map.setView([d.lat, d.lng], d.zoom); }
      setSelectedDistrict('Default'); setSelectedProvince('Western');
      setSearchQuery('');
    } else {
      const current = mapEngine === 'google' ? map.getZoom() : map.getZoom();
      const next = current + (type === 'in' ? 1 : -1);
      if (mapEngine === 'google') map.setZoom(next);
      else map.setZoom(next);
    }
  };

  const toggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) mapWrapperRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!mapContainerRef.current) return {};
    const rect = mapContainerRef.current.getBoundingClientRect();
    const estWidth = 320; const estHeight = 180;
    let left = hoverPos.x - rect.left + 20; let top = hoverPos.y - rect.top - 40;
    if (left + estWidth > rect.width) left = hoverPos.x - rect.left - estWidth - 20;
    if (top + estHeight > rect.height) top = hoverPos.y - rect.top - estHeight;
    if (top < 0) top = 20; if (left < 0) left = 20;
    return { position: 'absolute', left: `${left}px`, top: `${top}px`, zIndex: 100, pointerEvents: 'none' };
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 animate__animated animate__fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-[#f8fafc] px-6 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-6">
            <div className="text-center">
              <span className="text-xl font-black text-red-600 block leading-none">{zones.length}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Static Zones</span>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="text-center">
              <span className="text-xl font-black text-caaslBlue block leading-none animate-pulse">{activeFlights.length}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Live Traffic</span>
            </div>
          </div>
          <button onClick={refreshData} disabled={refreshing} className={`h-12 flex items-center gap-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-sm border-none cursor-pointer ${refreshing ? 'bg-slate-100 text-slate-400' : 'bg-caaslBlue text-white hover:bg-caaslNavy hover:shadow-lg active:scale-95'}`}>
            <i className={`fa fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
            {refreshing ? 'Syncing Radar...' : 'Refresh Radar'}
          </button>
        </div>
        <div className="flex items-center bg-[#f8fafc] p-1.5 rounded-2xl border border-slate-100 gap-1">
          <div className="flex items-center px-4 py-2 hover:bg-white rounded-xl transition-colors group">
            <i className="fa fa-map-marked-alt text-slate-400 mr-3 group-hover:text-caaslBlue transition-colors"></i>
            <select value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setSelectedDistrict(SRI_LANKA_REGIONS[e.target.value][0]); }} className="bg-transparent text-[11px] font-black uppercase tracking-tight border-none cursor-pointer text-slate-600 focus:outline-none min-w-[120px]">
              {Object.keys(SRI_LANKA_REGIONS).map(p => <option key={p} value={p}>{p} Province</option>)}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center px-4 py-2 hover:bg-white rounded-xl transition-colors group">
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="bg-transparent text-sm font-black border-none cursor-pointer text-caaslNavy focus:outline-none min-w-[150px]">
              <option value="Default">National Overview</option>
              {SRI_LANKA_REGIONS[selectedProvince].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 p-2 relative group/map overflow-hidden">
        <div ref={mapWrapperRef} className="relative w-full aspect-[21/10] min-h-[400px] rounded-[3.2rem] overflow-hidden bg-slate-200 border border-gray-200 map-fullscreen-wrapper">
          <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />
          <div className="absolute top-8 left-8 z-30 w-full max-w-sm pointer-events-none">
            <form onSubmit={handleSearch} className="pointer-events-auto flex items-center bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden px-4">
              <i className="fa fa-search text-slate-400 mr-3"></i>
              <input ref={searchInputRef} type="text" placeholder="Search coordinates or landmarks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none py-3.5 text-sm font-medium text-caaslNavy focus:outline-none flex-1 placeholder:text-slate-400" />
            </form>
          </div>
          {(hoveredZone || hoveredDrone) && (
            <div style={getTooltipStyle()} className="animate__animated animate__fadeIn animate__faster pointer-events-none">
              <div className="bg-white/95 backdrop-blur-2xl border border-gray-100 px-6 py-4 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] flex items-center gap-4 w-max max-w-[420px]">
                {hoveredZone ? (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 ${getZoneColor(hoveredZone.type) === '#ef4444' ? 'bg-red-500' : 'bg-amber-500'}`}><i className="fa fa-ban text-lg"></i></div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 truncate">{getZoneColor(hoveredZone.type) === '#ef4444' ? 'Prohibited Airspace' : 'Warning Advisory'}</p>
                      <h4 className="text-sm font-black text-slate-900 m-0 uppercase tracking-tight leading-tight truncate text-left">{hoveredZone.name}</h4>
                      <div className="mt-1.5 flex items-center gap-2"><span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full text-white uppercase ${getZoneColor(hoveredZone.type) === '#ef4444' ? 'bg-red-600' : 'bg-amber-600'}`}>{hoveredZone.type}</span><span className="text-[9px] font-bold text-gray-500">{hoveredZone.radius.toFixed(1)} KM Radius</span></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg bg-caaslBlue animate-pulse shrink-0"><i className="fa fa-paper-plane text-lg"></i></div>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 truncate">Active Mission Insight</p>
                      <h4 className="text-sm font-black text-slate-900 m-0 uppercase tracking-tight leading-tight truncate">Reg: {hoveredDrone?.license}</h4>
                      <div className="mt-2.5 flex items-center gap-6 border-t border-gray-100 pt-2.5">
                        <div className="flex flex-col min-w-0 text-left"><span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">Pilot</span><span className="text-[10px] font-black text-caaslNavy truncate">{hoveredDrone?.pilotName}</span></div>
                        <div className="flex flex-col min-w-0 text-left"><span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">Comms</span><span className="text-[10px] font-black text-caaslBlue flex items-center gap-1 truncate"><i className="fa fa-phone-alt text-[8px] rotate-90"></i>{String(hoveredDrone?.contact || "No Signal")}</span></div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span><span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Live</span></div>
                        <div className="w-px h-2 bg-gray-200"></div><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">Ends: {new Date(hoveredDrone!.to).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-3 translate-x-4 opacity-0 group-hover/map:translate-x-0 group-hover/map:opacity-100 transition-all duration-500">
            <button onClick={() => handleZoom('in')} className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-caaslNavy hover:bg-caaslBlue hover:text-white transition-all border-none cursor-pointer" title="Zoom In"><i className="fa fa-plus"></i></button>
            <button onClick={() => handleZoom('out')} className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-caaslNavy hover:bg-caaslBlue hover:text-white transition-all border-none cursor-pointer" title="Zoom Out"><i className="fa fa-minus"></i></button>
            <button onClick={() => handleZoom('reset')} className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-caaslNavy hover:bg-caaslBlue hover:text-white transition-all border-none cursor-pointer" title="Reset View"><i className="fa fa-home"></i></button>
            <button onClick={toggleFullscreen} className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-caaslNavy hover:bg-caaslBlue hover:text-white transition-all border-none cursor-pointer" title="Toggle Fullscreen">
              <i className={`fa ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
          {(loading || refreshing || mapEngine === 'pending') && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md">
               <div className="p-12 bg-white rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] text-center border border-gray-50">
                  <div className="w-12 h-12 border-4 border-caaslBlue border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-[12px] font-black text-caaslNavy tracking-[0.3em] uppercase">Updating Radar Grid</h3>
               </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .gm-err-container, .gm-err-message, .gm-err-content, .gm-err-icon, .gm-err-title, .gm-style-cc, .gmnoprint { display: none !important; }
        .leaflet-container { font-family: 'Poppins', sans-serif; background: #e2e8f0; cursor: crosshair !important; z-index: 10 !important; width: 100%; height: 100%; }
        .map-fullscreen-wrapper:fullscreen { width: 100vw; height: 100vh; border-radius: 0; aspect-ratio: auto; background: #000; }
        .map-fullscreen-wrapper:fullscreen .absolute { border-radius: 0; }
      `}</style>
    </div>
  );
};

export default Dashboard;
