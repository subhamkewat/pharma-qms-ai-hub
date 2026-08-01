import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LogComplaint from './pages/LogComplaint';
import ComplaintHistory from './pages/ComplaintHistory';
import ComplaintDetails from './pages/ComplaintDetails';
import AICopilot from './pages/AICopilot';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log-complaint" element={<LogComplaint />} />
        <Route path="/history" element={<ComplaintHistory />} />
        <Route path="/history/:id" element={<ComplaintDetails />} />
        <Route path="/copilot" element={<AICopilot />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;
