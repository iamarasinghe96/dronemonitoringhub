import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Restrictions from './components/Restrictions';
import CategoryGuide from './components/CategoryGuide';
import AIAssistant from './components/AIAssistant';
import PilotRegistration from './components/PilotRegistration';

type Tab = 'dashboard' | 'restrictions' | 'category' | 'assistant' | 'registration';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void}>
      <div>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'restrictions' && <Restrictions />}
        {activeTab === 'category' && <CategoryGuide />}
        {activeTab === 'assistant' && <AIAssistant />}
        {activeTab === 'registration' && <PilotRegistration />}
      </div>
    </Layout>
  );
};

export default App;
