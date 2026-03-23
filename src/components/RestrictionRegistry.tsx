import React, { useState, useEffect, useCallback } from 'react';
import { Zone, ZoneType } from '../types';
import { subscribeToZones, addZone, updateZone, deleteZone } from '../services/zonesService';
import { isConfigured } from '../services/firebase';

const ZONE_TYPES: ZoneType[] = ['PROHIBITED', 'RESTRICTED', 'WARNING'];

const typeStyle = (type: string) => {
  const t = type?.toUpperCase() ?? '';
  if (t === 'PROHIBITED') return 'bg-red-100 text-red-700';
  if (t === 'RESTRICTED') return 'bg-orange-100 text-orange-700';
  return 'bg-yellow-100 text-yellow-700';
};

const EMPTY_FORM: Omit<Zone, 'id'> = {
  name: '', type: 'PROHIBITED', lat: 0, lng: 0, radius: 1, description: '',
};

const RestrictionRegistry: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Omit<Zone, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToZones(z => { setZones(z); setLoading(false); });
    return unsub;
  }, []);

  const filtered = zones.filter(z =>
    z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openEdit = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({ name: zone.name, type: zone.type, lat: zone.lat, lng: zone.lng, radius: zone.radius, description: zone.description });
    setError(null);
  };

  const openAdd = () => {
    setShowAddModal(true);
    setFormData(EMPTY_FORM);
    setError(null);
  };

  const closeModals = () => {
    setEditingZone(null);
    setShowAddModal(false);
    setError(null);
  };

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) { setError('Zone name is required.'); return; }
    if (formData.radius <= 0) { setError('Radius must be greater than 0.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingZone) {
        await updateZone(editingZone.id, formData);
      } else {
        await addZone(formData);
      }
      closeModals();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save. Check Firebase configuration.');
    } finally {
      setSaving(false);
    }
  }, [formData, editingZone]);

  const handleDelete = async (zone: Zone) => {
    if (!window.confirm(`Delete "${zone.name}"? This action cannot be undone.`)) return;
    setDeletingId(zone.id);
    try {
      await deleteZone(zone.id);
    } catch {
      alert('Failed to delete zone. Check Firebase configuration.');
    } finally {
      setDeletingId(null);
    }
  };

  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]';

  const ZoneModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
        <h3 className="text-lg font-black text-[#030f27] mb-6 uppercase tracking-tight">
          {editingZone ? 'Edit Zone' : 'Add New Zone'}
        </h3>
        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-800">
            Firebase is not configured. Changes will not persist. Set VITE_FIREBASE_* env variables.
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">{error}</div>}
        <FormField label="Zone Name">
          <input className={inputClass} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Katunayake Airport" />
        </FormField>
        <FormField label="Zone Type">
          <select className={inputClass} value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as ZoneType }))}>
            {ZONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Latitude">
            <input type="number" step="0.0001" className={inputClass} value={formData.lat} onChange={e => setFormData(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))} />
          </FormField>
          <FormField label="Longitude">
            <input type="number" step="0.0001" className={inputClass} value={formData.lng} onChange={e => setFormData(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))} />
          </FormField>
          <FormField label="Radius (km)">
            <input type="number" step="0.1" min="0.1" className={inputClass} value={formData.radius} onChange={e => setFormData(p => ({ ...p, radius: parseFloat(e.target.value) || 1 }))} />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className={inputClass} rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the restriction..." />
        </FormField>
        <div className="flex gap-3 mt-6">
          <button onClick={closeModals} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1388d1] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#030f27] transition-colors disabled:opacity-50 border-none cursor-pointer">
            {saving ? 'Saving...' : 'Save Zone'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {(editingZone || showAddModal) && <ZoneModal />}

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search zones..."
              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]"
            />
          </div>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#1388d1] text-white px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#030f27] transition-colors flex items-center gap-2 border-none cursor-pointer shadow-lg"
        >
          <i className="fa fa-plus"></i> Add Zone
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <i className="fa fa-spinner fa-spin text-3xl text-[#1388d1] mb-3"></i>
          <p className="text-sm text-gray-500">Loading zones...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <i className="fa fa-map-marked-alt text-4xl text-gray-200 mb-4"></i>
          <p className="text-gray-500 text-sm">{searchTerm ? 'No zones match your search.' : 'No restriction zones found.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#030f27] text-white">
                {['Zone Name', 'Type', 'Radius', 'Coordinates', 'Actions'].map(h => (
                  <th key={h} className="py-4 px-4 text-left font-black uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((zone, i) => (
                <tr key={zone.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                  <td className="py-4 px-4">
                    <p className="font-black text-[#030f27]">{zone.name}</p>
                    {zone.description && <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{zone.description}</p>}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${typeStyle(zone.type)}`}>
                      {zone.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-700">{zone.radius} km</td>
                  <td className="py-4 px-4 font-mono text-[10px] text-gray-500">
                    {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(zone)}
                        className="w-8 h-8 bg-blue-50 text-[#1388d1] rounded-lg flex items-center justify-center hover:bg-[#1388d1] hover:text-white transition-colors"
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(zone)}
                        disabled={deletingId === zone.id}
                        className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === zone.id
                          ? <i className="fa fa-spinner fa-spin"></i>
                          : <i className="fa fa-trash"></i>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Showing {filtered.length} of {zones.length} zones
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictionRegistry;
