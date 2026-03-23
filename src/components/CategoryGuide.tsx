import React from 'react';

const CATEGORIES = [
  {
    title: 'Category A',
    weight: 'Above 25 kg',
    color: 'bg-red-500',
    icon: 'fa-truck',
    rules: [
      'Registration with CAASL mandatory',
      'Ministry of Defence (MOD) clearance required',
      'TRCSL import permit mandatory',
      'Flight permit required for every mission',
      'Insurance coverage mandatory',
    ],
  },
  {
    title: 'Category B',
    weight: '1 kg – 25 kg',
    color: 'bg-yellow-500',
    icon: 'fa-box',
    rules: [
      'Registration with CAASL mandatory',
      'TRCSL certification for radio equipment',
      'Operation permitted only in specific heights/zones',
      'Safety assessment required for urban flight',
      'Insurance strongly recommended',
    ],
  },
  {
    title: 'Category C',
    weight: 'Below 1 kg',
    color: 'bg-green-500',
    icon: 'fa-feather',
    rules: [
      'Identification marking mandatory',
      'No-fly near airports and security zones',
      'Visual Line of Sight (VLOS) only',
      'Max altitude 200 ft unless specified',
      'No MOD clearance needed for hobbyist flight in open areas',
    ],
  },
];

const CategoryGuide: React.FC = () => {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#030f27] mb-2">Drone Categories</h2>
        <p className="text-gray-600">Understand your drone's legal requirements based on mass and purpose.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {CATEGORIES.map(cat => (
          <div
            key={cat.title}
            className="bg-white rounded-xl shadow-sm border-t-4 border-[#1388d1] overflow-hidden hover:-translate-y-1 transition-transform"
          >
            <div className="p-6">
              <div className={`w-12 h-12 rounded-lg ${cat.color} text-white flex items-center justify-center text-xl mb-4`}>
                <i className={`fa ${cat.icon}`}></i>
              </div>
              <h3 className="text-xl font-bold text-[#030f27] mb-1">{cat.title}</h3>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat.weight}</span>
              <ul className="mt-6 space-y-3">
                {cat.rules.map(rule => (
                  <li key={rule} className="flex gap-3 text-sm text-gray-700">
                    <i className="fa fa-check-circle text-[#1388d1] mt-0.5 shrink-0"></i>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100">
              <button className="w-full bg-white border border-[#1388d1] text-[#1388d1] py-2 rounded font-semibold text-sm hover:bg-[#1388d1] hover:text-white transition-all">
                View Full Regulations
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#030f27] text-white rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="text-4xl shrink-0">
          <i className="fa fa-exclamation-triangle text-yellow-400"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Commercial Operations</h3>
          <p className="text-sm text-gray-300">
            Regardless of category, all commercial drone operations (aerial photography for hire, surveying, etc.)
            require an Operating Permit from CAASL and often Ministry of Defence clearance.
          </p>
        </div>
        <button className="whitespace-nowrap bg-[#1388d1] text-white px-6 py-3 rounded font-bold hover:bg-blue-600 transition-all uppercase text-sm border-none cursor-pointer">
          Permit Guidance
        </button>
      </div>
    </div>
  );
};

export default CategoryGuide;
