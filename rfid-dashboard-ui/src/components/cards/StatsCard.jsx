import React from 'react';
import '../../styles/StatsCard.css';
const StatsCard = ({ title, value, icon, color, trend, description }) => {
  return (
    <div className="stats-card-enhanced" style={{ '--card-color': color }}>
      <div className="stats-card-header">
        <div className="stats-icon-container">
          <span className="stats-icon">{icon}</span>
        </div>
        <div className="stats-trend">{trend}</div>
      </div>
      
      <div className="stats-content">
        <h3 className="stats-value">{value}</h3>
        <p className="stats-title">{title}</p>
        <span className="stats-description">{description}</span>
      </div>
      
      <div className="stats-card-decoration"></div>
    </div>
  );
};

export default StatsCard;