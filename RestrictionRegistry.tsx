
import React from 'react';

const PilotRegistration: React.FC = () => {
  return (
    <div className="container">
      <div className="bg-white rounded-xl shadow-sm p-12 border-t-4 border-caaslBlue text-center">
        <div className="mb-6">
          <i className="fa fa-id-card text-6xl text-caaslBlue opacity-20"></i>
        </div>
        <h2 className="text-3xl font-bold text-caaslNavy mb-4">Pilot Registration</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Register as a certified drone operator and manage your UAV inventory here.
        </p>
      </div>
    </div>
  );
};

export default PilotRegistration;
