
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Restrictions from './components/Restrictions';
import PilotRegistration from './components/PilotRegistration';

const App: React.FC = () => {
  // Changed default to 'restrictions' as requested
  const [activeTab, setActiveTab] = useState('restrictions');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate__animated animate__fadeIn">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'restrictions' && <Restrictions />}
        {activeTab === 'registration' && <PilotRegistration />}
      </div>
    </Layout>
  );
};

export default App;
