import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveFlight, Zone } from '../types';
import { subscribeToZones } from '../services/zonesService';
import { subscribeToActiveFlights } from '../services/flightsService';
import { SRI_LANKA_REGIONS, DISTRICT_COORDS, GEOJSON_URL } from '../constants';

declare const L: any;

const getZoneColor = (type: string) => {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('PROHIBITED')) return '#ef4444';
  if (t.includes('RESTRICTED')) return '#f97316';
  return '#f59e0b';
};

const getPulseSvg = (zoom: number) => {
  const r = Math.max(12, 40 - (zoom - 6.5) * 4);
  const size = r * 2 + 10;
  const c = size / 2;
  return `data:image/svg+xml;base64,${btoa(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${c}" cy="${c}" r="3" fill="none" stroke="#22c55e" stroke-width="0.5">
      <animate attributeName="r" from="3" to="${r}" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="1" to="0" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${c}" cy="${c}" r="3" fill="#22c55e"/>
  </svg>`)}`;
};

const getDroneSvg = () =>
  `data:image/svg+xml;base64,${btoa(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
    <circle cx="19" cy="5" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
    <circle cx="5" cy="19" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
    <circle cx="19" cy="19" r="2.5" fill="#4ade80" fill-opacity="0.3" stroke="#4ade80" stroke-width="1"/>
    <path d="M7 7L17 17M17 7L7 17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
    <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#10b981" stroke="#22c55e" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="1.5" fill="#fff"/>
  </svg>`)}`;

const Dashboard: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState('Western');
  const [selectedDistrict, setSelectedDistrict] = useState('Default');
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zoom, setZoom] = useState(DISTRICT_COORDS['Default'].zoom);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [hoveredDrone, setHoveredDrone] = useState<ActiveFlight | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const droneMarkers = useRef<any[]>([]);
  const searchMarker = useRef<any>(null);
  const boundaryLayer = useRef<any>(null);
  const geoJsonCache = useRef<any>(null);

  // Subscribe to Firestore in real time
  useEffect(() => {
    const unsubZones = subscribeToZones(z => {
      setZones(z);
      setLoading(false);
    });
    const unsubFlights = subscribeToActiveFlights(f => setActiveFlights(f));
    return () => { unsubZones(); unsubFlights(); };
  }, []);

  // Load Leaflet script once
  useEffect(() => {
    if ((window as any).L) { setMapReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !mapReady || !(window as any).L) return;
    if (mapInstance.current) { try { mapInstance.current.remove(); } catch { /* ignore */ } }
    const { lat, lng, zoom: z } = DISTRICT_COORDS[selectedDistrict] ?? DISTRICT_COORDS['Default'];
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false })
      .setView([lat, lng], z);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 })
      .addTo(map);
    map.on('zoomend', () => setZoom(map.getZoom()));
    mapInstance.current = map;
    loadGeoJson();
  }, [mapReady, selectedDistrict]);

  useEffect(() => { initMap(); }, [initMap]);

  const loadGeoJson = async () => {
    if (!geoJsonCache.current) {
      try {
        const res = await fetch(GEOJSON_URL);
        geoJsonCache.current = await res.json();
      } catch { /* no boundaries */ }
    }
    renderBoundaries();
  };

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const { lat, lng, zoom: z } = DISTRICT_COORDS[selectedDistrict] ?? DISTRICT_COORDS['Default'];
    mapInstance.current.setView([lat, lng], z);
    renderBoundaries();
  }, [selectedDistrict, selectedProvince, mapReady]);

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    renderOverlays();
  }, [zones, activeFlights, zoom, mapReady]);

  const renderBoundaries = () => {
    if (!mapInstance.current || !geoJsonCache.current || !(window as any).L) return;
    if (boundaryLayer.current) boundaryLayer.current.remove();
    const target = selectedDistrict.toLowerCase();
    boundaryLayer.current = L.geoJson(geoJsonCache.current, {
      style: (feature: any) => {
        const d = (feature.properties.district ?? feature.properties.NAME_2 ?? '').toLowerCase();
        const p = (feature.properties.province ?? feature.properties.NAME_1 ?? '').toLowerCase();
        const match = selectedDistrict !== 'Default' ? d === target : p === selectedProvince.toLowerCase();
        return {
          color: match ? '#1388d1' : '#cbd5e1',
          weight: match ? 3 : 0.5,
          fillColor: match ? '#1388d1' : 'transparent',
          fillOpacity: match ? 0.12 : 0,
          opacity: match ? 1 : 0.3,
        };
      },
    }).addTo(mapInstance.current);
  };

  const renderOverlays = () => {
    if (!mapInstance.current || !(window as any).L) return;
    overlays.current.forEach(o => o?.remove?.());
    droneMarkers.current.forEach(o => o?.remove?.());
    overlays.current = [];
    droneMarkers.current = [];

    zones.forEach(zone => {
      const color = getZoneColor(zone.type);
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 1000,
        color, weight: 2, fillColor: color, fillOpacity: 0.15,
      }).addTo(mapInstance.current);
      circle.on('mouseover', (e: any) => { setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }); setHoveredZone(zone); });
      circle.on('mousemove', (e: any) => setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }));
      circle.on('mouseout', () => setHoveredZone(null));
      overlays.current.push(circle);
    });

    const pulseUrl = getPulseSvg(zoom);
    const droneUrl = getDroneSvg();
    const pulseR = Math.max(12, 40 - (zoom - 6.5) * 4);
    const pulseSize = pulseR * 2 + 10;

    activeFlights.forEach(flight => {
      if (!flight.lat || !flight.lng) return;
      const pulse = L.marker([flight.lat, flight.lng], {
        icon: L.icon({ iconUrl: pulseUrl, iconSize: [pulseSize, pulseSize], iconAnchor: [pulseSize / 2, pulseSize / 2] }),
        interactive: false, zIndexOffset: 1900,
      }).addTo(mapInstance.current);
      droneMarkers.current.push(pulse);

      const marker = L.marker([flight.lat, flight.lng], {
        icon: L.icon({ iconUrl: droneUrl, iconSize: [24, 24], iconAnchor: [12, 12] }),
        riseOnHover: true, zIndexOffset: 2000,
      }).addTo(mapInstance.current);
      marker.on('mouseover', (e: any) => { setHoverPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }); setHoveredDrone(flight); });
      marker.on('mouseout', () => setHoveredDrone(null));
      marker.on('click', () => {
        if (flight.contact) {
          let phone = flight.contact.replace(/\D/g, '');
          if (phone.startsWith('0') && phone.length === 10) phone = '94' + phone.slice(1);
          window.open(`https://wa.me/${phone}`, '_blank');
        }
      });
      droneMarkers.current.push(marker);
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !mapInstance.current) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Sri Lanka')}`,
      );
      const results = await res.json();
      if (results?.length > 0) {
        const { lat, lon } = results[0];
        mapInstance.current.setView([parseFloat(lat), parseFloat(lon)], 14);
        if (searchMarker.current) searchMarker.current.remove();
        searchMarker.current = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(mapInstance.current);
      }
    } catch { /* search failed silently */ }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Re-load GeoJSON and re-render; Firestore subscriptions auto-update
    geoJsonCache.current = null;
    await loadGeoJson();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (!mapInstance.current) return;
    if (type === 'in') mapInstance.current.zoomIn();
    else if (type === 'out') mapInstance.current.zoomOut();
    else {
      const { lat, lng, zoom: z } = DISTRICT_COORDS[selectedDistrict] ?? DISTRICT_COORDS['Default'];
      mapInstance.current.setView([lat, lng], z);
    }
  };

  const toggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) mapWrapperRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const districts = SRI_LANKA_REGIONS[selectedProvince] ?? [];

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-4 pb-12">
      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Province Selector */}
        <select
          value={selectedProvince}
          onChange={e => { setSelectedProvince(e.target.value); setSelectedDistrict('Default'); }}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]"
        >
          {Object.keys(SRI_LANKA_REGIONS).map(p => (
            <option key={p} value={p}>{p} Province</option>
          ))}
        </select>

        {/* District Selector */}
        <select
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]"
        >
          <option value="Default">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-sm">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]"
          />
          <button type="submit" className="bg-[#1388d1] text-white px-3 py-2 rounded-xl text-xs hover:bg-[#030f27] transition-colors border-none cursor-pointer">
            <i className="fa fa-search"></i>
          </button>
        </form>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <i className={`fa fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Active Zones', value: zones.length, icon: 'fa-shield-alt', color: 'text-red-500' },
          { label: 'Live Flights', value: activeFlights.length, icon: 'fa-plane', color: 'text-green-500' },
          { label: 'Districts', value: districts.length || 25, icon: 'fa-map', color: 'text-blue-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <i className={`fa ${stat.icon} text-xl ${stat.color}`}></i>
            <div>
              <div className="text-lg font-black text-[#030f27]">{loading ? '—' : stat.value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div
        ref={mapWrapperRef}
        className={`bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative ${isFullscreen ? 'h-screen' : 'h-[580px]'}`}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[500]">
            <div className="text-center">
              <i className="fa fa-spinner fa-spin text-3xl text-[#1388d1] mb-3"></i>
              <p className="text-sm text-gray-500">Loading map data...</p>
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
          {[
            { label: 'Prohibited', color: 'bg-red-500' },
            { label: 'Restricted', color: 'bg-orange-500' },
            { label: 'Warning', color: 'bg-yellow-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#030f27]">{item.label}</span>
            </div>
          ))}
          {activeFlights.length > 0 && (
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#030f27]">Live Flight</span>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          {[
            { title: 'Zoom In', icon: 'fa-plus', action: () => handleZoom('in') },
            { title: 'Zoom Out', icon: 'fa-minus', action: () => handleZoom('out') },
            { title: 'Reset View', icon: 'fa-expand-arrows-alt', action: () => handleZoom('reset') },
            { title: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen', icon: isFullscreen ? 'fa-compress' : 'fa-expand', action: toggleFullscreen },
          ].map(btn => (
            <button
              key={btn.title}
              title={btn.title}
              onClick={btn.action}
              className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-[#1388d1] hover:text-white transition-colors text-sm"
            >
              <i className={`fa ${btn.icon}`}></i>
            </button>
          ))}
        </div>

        {/* Zone Tooltip */}
        {hoveredZone && (
          <div
            className="fixed z-[1000] bg-[#030f27] text-white rounded-xl px-4 py-3 text-xs shadow-2xl pointer-events-none max-w-xs"
            style={{ left: hoverPos.x + 12, top: hoverPos.y - 10 }}
          >
            <p className="font-black uppercase tracking-wider mb-1">{hoveredZone.name}</p>
            <p className="text-gray-300">{hoveredZone.type} · {hoveredZone.radius} km radius</p>
          </div>
        )}

        {/* Drone Tooltip */}
        {hoveredDrone && (
          <div
            className="fixed z-[1000] bg-[#030f27] text-white rounded-xl px-4 py-3 text-xs shadow-2xl pointer-events-none max-w-xs"
            style={{ left: hoverPos.x + 12, top: hoverPos.y - 10 }}
          >
            <p className="font-black uppercase tracking-wider mb-1">{hoveredDrone.pilotName}</p>
            <p className="text-green-400">License: {hoveredDrone.license}</p>
            <p className="text-gray-300">Status: {hoveredDrone.status}</p>
            {hoveredDrone.contact && <p className="text-blue-300 mt-1">Click to contact via WhatsApp</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
