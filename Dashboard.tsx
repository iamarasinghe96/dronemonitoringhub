
import React from 'react';

const categories = [
  {
    title: 'Category A',
    weight: 'Above 25kg',
    color: 'bg-red-500',
    icon: 'fa-truck',
    rules: [
      'Registration with CAASL mandatory',
      'Ministry of Defence (MOD) clearance required',
      'TRCSL Import permit mandatory',
      'Flight permit for every mission required',
      'Insurance coverage mandatory'
    ]
  },
  {
    title: 'Category B',
    weight: '1kg - 25kg',
    color: 'bg-yellow-500',
    icon: 'fa-box',
    rules: [
      'Registration with CAASL mandatory',
      'TRCSL certification for radio equipment',
      'Operation permitted only in specific height/zones',
      'Safety assessment for urban flight required',
      'Insurance recommended'
    ]
  },
  {
    title: 'Category C',
    weight: 'Below 1kg',
    color: 'bg-green-500',
    icon: 'fa-feather',
    rules: [
      'Identification marking mandatory',
      'No-fly near airports and security zones',
      'Visual Line of Sight (VLOS) only',
      'Max altitude 200ft unless specified',
      'No MOD clearance for hobbyist flight in open areas'
    ]
  }
];

const CategoryGuide: React.FC = () => {
  return (
    <div className="container">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-caaslNavy mb-2">Drone Categories</h2>
        <p className="text-gray-600">Understand your drone's legal requirements based on mass and purpose.</p>
      </div>
      <div className="row">
        {categories.map((cat, i) => (
          <div key={i} className="col-lg-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-caaslBlue overflow-hidden transition-transform hover:-translate-y-1">
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg ${cat.color} text-white flex items-center justify-center text-xl mb-4`}>
                  <i className={`fa ${cat.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold text-caaslNavy mb-1">{cat.title}</h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat.weight}</span>
                <ul className="mt-6 space-y-3">
                  {cat.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-700">
                      <i className="fa fa-check-circle text-caaslBlue mt-1"></i>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <button className="w-full bg-white border border-caaslBlue text-caaslBlue py-2 rounded font-semibold text-sm hover:bg-caaslBlue hover:text-white transition-all">
                  View Full Regulations
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-caaslNavy text-white rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="text-4xl">
          <i className="fa fa-exclamation-triangle text-yellow-400"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Commercial Operations</h3>
          <p className="text-sm text-gray-300">
            Regardless of category, all commercial drone operations (aerial photography for hire, surveying, etc.) require an Operating Permit from CAASL and often Ministry of Defence clearance.
          </p>
        </div>
        <button className="whitespace-nowrap bg-caaslBlue text-white px-6 py-3 rounded font-bold hover:bg-blue-600 transition-all uppercase text-sm">
          Permit Guidance
        </button>
      </div>
    </div>
  );
};

export default CategoryGuide;
