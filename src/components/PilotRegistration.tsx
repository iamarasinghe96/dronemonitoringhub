import React, { useState } from 'react';
import { DroneCategory, Pilot } from '../types';
import { registerPilot } from '../services/pilotsService';
import { isConfigured } from '../services/firebase';

const CATEGORIES = Object.values(DroneCategory);

const EMPTY: Omit<Pilot, 'id'> = {
  licenseId: '',
  name: '',
  nic: '',
  phone: '',
  email: '',
  address: '',
  droneModel: '',
  droneSerial: '',
  category: DroneCategory.CATEGORY_C,
};

const PilotRegistration: React.FC = () => {
  const [form, setForm] = useState<Omit<Pilot, 'id'>>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nic.trim() || !form.phone.trim()) {
      setError('Name, NIC, and Phone are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await registerPilot(form);
      setSuccess(true);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed. Please check your Firebase configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1] bg-white';

  const Field = ({
    label, required, children,
  }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );

  if (success) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa fa-check text-3xl text-green-500"></i>
          </div>
          <h2 className="text-2xl font-black text-[#030f27] mb-3">Registration Submitted</h2>
          <p className="text-gray-500 mb-8">Your pilot registration has been submitted successfully. You will receive confirmation shortly.</p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-[#1388d1] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#030f27] transition-colors border-none cursor-pointer"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#030f27] p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1388d1] rounded-2xl flex items-center justify-center">
              <i className="fa fa-id-card text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black m-0">Pilot Registration</h2>
              <p className="text-blue-300 text-sm m-0">Register as a certified drone operator</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <i className="fa fa-exclamation-triangle mr-2"></i>
              Firebase is not configured. Registrations will not be saved. Set VITE_FIREBASE_* env variables.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <i className="fa fa-times-circle mr-2"></i>{error}
            </div>
          )}

          {/* Personal Details */}
          <div>
            <h3 className="text-sm font-black text-[#030f27] uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input className={inputClass} value={form.name} onChange={set('name')} placeholder="As per NIC" />
              </Field>
              <Field label="NIC Number" required>
                <input className={inputClass} value={form.nic} onChange={set('nic')} placeholder="e.g. 199012345678" />
              </Field>
              <Field label="Phone Number" required>
                <input className={inputClass} type="tel" value={form.phone} onChange={set('phone')} placeholder="+94 7X XXX XXXX" />
              </Field>
              <Field label="Email Address">
                <input className={inputClass} type="email" value={form.email} onChange={set('email')} placeholder="pilot@example.com" />
              </Field>
              <Field label="Address">
                <input className={inputClass} value={form.address} onChange={set('address')} placeholder="Residential address" />
              </Field>
              <Field label="License ID (if existing)">
                <input className={inputClass} value={form.licenseId} onChange={set('licenseId')} placeholder="CAASL-XXXX-XXXX" />
              </Field>
            </div>
          </div>

          {/* Drone Details */}
          <div>
            <h3 className="text-sm font-black text-[#030f27] uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
              Drone Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Drone Model">
                <input className={inputClass} value={form.droneModel} onChange={set('droneModel')} placeholder="e.g. DJI Mini 3 Pro" />
              </Field>
              <Field label="Serial Number">
                <input className={inputClass} value={form.droneSerial} onChange={set('droneSerial')} placeholder="Manufacturer serial" />
              </Field>
              <Field label="Drone Category">
                <select className={inputClass} value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1388d1] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#030f27] transition-colors disabled:opacity-50 border-none cursor-pointer shadow-lg"
            >
              {submitting ? (
                <><i className="fa fa-spinner fa-spin mr-2"></i>Submitting...</>
              ) : (
                <><i className="fa fa-paper-plane mr-2"></i>Submit Registration</>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              By submitting, you agree to comply with CAASL drone regulations and Sri Lanka Aviation Act.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PilotRegistration;
