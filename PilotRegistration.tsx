
import React, { useState } from 'react';
import RestrictionMap from './RestrictionMap';
import RestrictionRegistry from './RestrictionRegistry';

const Restrictions: React.FC = () => {
  // Changed default to 'list' (Registry) for a database-first management approach
  const [subTab, setSubTab] = useState<'list' | 'map'>('list');

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-4 pb-12">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-2 rounded-2xl shadow-md border border-gray-100 flex flex-wrap justify-center gap-1">
          <button 
            onClick={() => setSubTab('list')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subTab === 'list' ? 'bg-caaslBlue text-white shadow-lg' : 'text-gray-400 hover:text-caaslNavy hover:bg-gray-50'
            }`}
          >
            <i className="fa fa-list-ul mr-2"></i> Registry
          </button>
          <button 
            onClick={() => setSubTab('map')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subTab === 'map' ? 'bg-caaslBlue text-white shadow-lg' : 'text-gray-400 hover:text-caaslNavy hover:bg-gray-50'
            }`}
          >
            <i className="fa fa-map-marked-alt mr-2"></i> Map View
          </button>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="animate__animated animate__fadeInUp animate__faster">
        {subTab === 'list' && (
          <div className="animate__animated animate__fadeIn">
            <RestrictionRegistry />
          </div>
        )}

        {subTab === 'map' && (
          <div className="bg-white rounded-[3rem] p-4 shadow-2xl border border-gray-50">
            <RestrictionMap />
          </div>
        )}
      </div>
    </div>
  );
};

export default Restrictions;
