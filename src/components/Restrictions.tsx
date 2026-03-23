import React, { useState } from 'react';
import RestrictionRegistry from './RestrictionRegistry';
import RestrictionMap from './RestrictionMap';

type SubTab = 'list' | 'map';

const Restrictions: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('list');

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-4 pb-12">
      {/* Sub-nav */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-2 rounded-2xl shadow-md border border-gray-100 flex gap-1">
          {([
            { id: 'list' as SubTab, icon: 'fa-list-ul', label: 'Registry' },
            { id: 'map' as SubTab, icon: 'fa-map-marked-alt', label: 'Map View' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${
                subTab === tab.id
                  ? 'bg-[#1388d1] text-white shadow-lg'
                  : 'bg-transparent text-gray-400 hover:text-[#030f27] hover:bg-gray-50'
              }`}
            >
              <i className={`fa ${tab.icon} mr-2`}></i>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {subTab === 'list' && <RestrictionRegistry />}
        {subTab === 'map' && (
          <div className="bg-white rounded-[3rem] p-6 shadow-2xl border border-gray-50">
            <RestrictionMap />
          </div>
        )}
      </div>
    </div>
  );
};

export default Restrictions;
