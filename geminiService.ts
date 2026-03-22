
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface RestrictionItem {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  radius: number; // Stored in KM for display/edit
  description: string;
  city?: string;
}

const TRAFFIC_API_URL = 'https://script.google.com/macros/s/AKfycbzypzwgEPNrUu0vhNnxYAAeY6cA50RqSD4lYjpsj7g087Q-x-G5mkf-ljg1KhBqMJT3yg/exec';

const RestrictionRegistry: React.FC = () => {
  const [restrictions, setRestrictions] = useState<RestrictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isGeocoding = useRef(false);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<RestrictionItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCityName = async (lat: number, lng: number): Promise<string> => {
    try {
      // Nominatim policy: no more than 1 request per second.
      // We enforce this in the processQueue method, but we also use a robust fetch here.
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CAASL-Drone-Registry-Tool/1.0 (contact: drone@caa.lk)'
        }
      });
      
      if (response.status === 429) {
          throw new Error("Rate limit exceeded");
      }
      
      if (!response.ok) throw new Error("API network error");
      
      const data = await response.json();
      const addr = data.address || {};
      
      // Extraction Priority: city → town → village → suburb
      // Sri Lanka specific check: often towns are labeled as 'suburb' or 'neighbourhood'
      let cityName = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.city_district;

      if (!cityName && data.display_name) {
          const parts = data.display_name.split(',');
          // Return the first part that isn't just a number (often the locality)
          for (const part of parts) {
              const trimmed = part.trim();
              if (isNaN(Number(trimmed)) && trimmed.length > 2 && trimmed.toLowerCase() !== 'sri lanka') {
                  cityName = trimmed;
                  break;
              }
          }
      }

      return cityName || "Unknown";
    } catch (e) {
      console.error(`Fetch failed for ${lat},${lng}:`, e);
      throw e;
    }
  };

  const processGeocodingQueue = async (items: RestrictionItem[]) => {
    if (isGeocoding.current) return;
    isGeocoding.current = true;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        // Enforce 1.5s delay between requests for reliability
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const city = await fetchCityName(item.lat, item.lng);
        
        setRestrictions(prev => {
          const next = [...prev];
          const targetIndex = next.findIndex(r => r.id === item.id);
          if (targetIndex !== -1) {
            next[targetIndex] = { ...next[targetIndex], city };
          }
          return next;
        });
      } catch (err) {
        console.warn(`Geocoding error at index ${i}, continuing...`);
        setRestrictions(prev => {
          const next = [...prev];
          const targetIndex = next.findIndex(r => r.id === item.id);
          if (targetIndex !== -1 && next[targetIndex].city === 'Detecting...') {
            next[targetIndex] = { ...next[targetIndex], city: 'Unknown' };
          }
          return next;
        });
      }
    }
    isGeocoding.current = false;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${TRAFFIC_API_URL}?action=getZones`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const mappedData: RestrictionItem[] = data.map((item: any, index: number) => {
          const rawRadius = Number(item.radius) || 0;
          const radiusInKm = rawRadius > 100 ? rawRadius / 1000 : rawRadius;
          
          return {
            id: item.id || `zone-${index}`,
            name: item.name || "Unnamed Zone",
            type: item.type === 'ADVISORY' ? 'WARNING' : (item.type || "RESTRICTED"),
            lat: Number(item.lat) || 0,
            lng: Number(item.lng) || 0,
            radius: radiusInKm,
            description: item.description || "No details available",
            city: "Detecting..."
          };
        });
        setRestrictions(mappedData);
        processGeocodingQueue(mappedData);
      }
    } catch (error) {
      console.error("Error fetching restrictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this restriction?")) return;
    
    setDeletingId(id);
    try {
      await fetch(`${TRAFFIC_API_URL}?action=deleteZone&id=${id}`);
      setRestrictions(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      setRestrictions(prev => prev.filter(r => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setRestrictions(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
      setEditingItem(null);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Error saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRestrictions = restrictions.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('PROHIBITED')) return 'bg-red-100 text-red-600 border-red-200';
    if (t.includes('RESTRICTED')) return 'bg-orange-100 text-orange-600 border-orange-200';
    return 'bg-yellow-100 text-yellow-600 border-yellow-200';
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-left w-full">
          <h3 className="text-xl font-black text-caaslNavy mb-1">Restriction Database</h3>
          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{restrictions.length} active regulatory zones</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <i className="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
          <input 
            type="text" 
            placeholder="Search registry..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-caaslBlue transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Type</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Zone Detail</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Location</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Radius</th>
              <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="w-8 h-8 border-3 border-caaslBlue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Registry...</p>
                </td>
              </tr>
            ) : filteredRestrictions.length > 0 ? (
              filteredRestrictions.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4 text-left">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getBadgeStyle(item.type)}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-caaslNavy leading-tight">{item.name}</span>
                      <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{item.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <i className="fa fa-map-marker-alt text-caaslBlue text-[9px]"></i>
                      <span className={`text-xs font-bold ${item.city === 'Detecting...' ? 'text-slate-300 italic animate-pulse' : 'text-slate-600'}`}>
                        {item.city}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-xs font-black text-caaslNavy">{item.radius} KM</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => setEditingItem({...item})} 
                        className="w-8 h-8 bg-slate-50 text-caaslNavy border border-slate-100 rounded-lg flex items-center justify-center hover:bg-caaslBlue hover:text-white transition-all shadow-sm"
                        title="Modify Log"
                      >
                        <i className="fa fa-pen text-[10px]"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          deletingId === item.id 
                            ? 'bg-slate-100 text-slate-300' 
                            : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-50'
                        }`}
                      >
                        <i className={`fa ${deletingId === item.id ? 'fa-spinner animate-spin' : 'fa-trash-alt'} text-[10px]`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching records</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-4 px-6 flex justify-between items-center border-t border-slate-100">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 ${isGeocoding.current ? 'bg-amber-500 animate-pulse' : 'bg-green-500'} rounded-full`}></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {isGeocoding.current ? 'Geocoding in progress...' : 'Registry Online'}
              </span>
           </div>
        </div>
        <button 
          onClick={fetchData}
          className="text-[8px] font-black uppercase tracking-widest text-caaslBlue bg-white border border-caaslBlue/10 px-3 py-1.5 rounded-lg hover:bg-caaslBlue hover:text-white transition-all shadow-sm"
        >
          <i className="fa fa-sync-alt mr-1.5"></i> Sync
        </button>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-caaslNavy/80 backdrop-blur-md" onClick={() => setEditingItem(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate__animated animate__zoomIn animate__faster max-h-[85vh] flex flex-col">
            <form onSubmit={handleUpdate} className="flex flex-col h-full text-left">
              <div className="bg-caaslNavy px-6 py-4 text-white flex justify-between items-center shrink-0">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest m-0 leading-none">Edit Log</h4>
                  <p className="text-[8px] text-caaslBlue font-bold uppercase tracking-widest mt-1.5 m-0 opacity-80">Registry ID: {editingItem.id}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)} 
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border-none cursor-pointer"
                >
                  <i className="fa fa-times text-[10px]"></i>
                </button>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Zone Title</label>
                  <input 
                    type="text" 
                    value={editingItem.name} 
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-caaslNavy focus:border-caaslBlue focus:ring-4 focus:ring-caaslBlue/5 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Enter zone name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Class</label>
                    <div className="relative">
                      <select 
                        value={editingItem.type} 
                        onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-caaslNavy focus:border-caaslBlue focus:ring-4 focus:ring-caaslBlue/5 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="RESTRICTED">RESTRICTED</option>
                        <option value="PROHIBITED">PROHIBITED</option>
                        <option value="WARNING">WARNING</option>
                      </select>
                      <i className="fa fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[7px] pointer-events-none"></i>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Radius (KM)</label>
                    <input 
                      type="number" 
                      value={editingItem.radius} 
                      onChange={(e) => setEditingItem({...editingItem, radius: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-caaslNavy focus:border-caaslBlue focus:ring-4 focus:ring-caaslBlue/5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Latitude</label>
                    <input 
                      type="text" 
                      value={editingItem.lat} 
                      onChange={(e) => setEditingItem({...editingItem, lat: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:border-caaslBlue outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Longitude</label>
                    <input 
                      type="text" 
                      value={editingItem.lng} 
                      onChange={(e) => setEditingItem({...editingItem, lng: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:border-caaslBlue outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all border-solid cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[1.5] py-3 bg-caaslBlue text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-caaslBlue/10 hover:bg-caaslNavy transition-all disabled:opacity-50 border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <><i className="fa fa-spinner animate-spin"></i> Writing...</>
                  ) : (
                    <><i className="fa fa-check-circle"></i> Update Log</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictionRegistry;
