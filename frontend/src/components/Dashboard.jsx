import React from 'react';
import OverviewSection from './sections/OverviewSection';
import DustbinsSection from './sections/DustbinsSection';
import LockersSection from './sections/LockersSection';
import ManagementSection from './sections/ManagementSection';
import '../styles/Dashboard.css';
const Dashboard = ({ activeSection = 'overview', onNavigate }) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={onNavigate} />;
      case 'dustbins':
        return <DustbinsSection onNavigate={onNavigate} />;
      case 'lockers':
        return <LockersSection onNavigate={onNavigate} />;
      case 'management':
        return <ManagementSection onNavigate={onNavigate} />;
      default:
        return <OverviewSection onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="dashboard-container">
      {renderSection()}
    </div>
  );
};

export default Dashboard;