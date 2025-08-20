import React from 'react';
import { Card } from 'react-bootstrap';

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  color = 'primary', 
  icon, 
  trend,
  onClick 
}) => {
  const getColorClass = () => {
    const colorMap = {
      primary: 'text-primary',
      success: 'text-success', 
      warning: 'text-warning',
      danger: 'text-danger',
      info: 'text-info',
      secondary: 'text-secondary'
    };
    return colorMap[color] || 'text-primary';
  };

  return (
    <Card 
      className={`h-100 metric-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Card.Body className="d-flex flex-column p-3">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h6 className="text-muted text-uppercase fw-semibold mb-0 small">
            {title}
          </h6>
          {icon && (
            <i className={`bi ${icon} fs-4 ${getColorClass()} opacity-75`}></i>
          )}
        </div>
        
        <div className="text-center flex-grow-1 d-flex flex-column justify-content-center my-2">
          <div className={`display-4 fw-bold ${getColorClass()} mb-2`}>
            {value}
          </div>
          {trend && (
            <div className={`small fw-semibold ${trend.type === 'up' ? 'text-success' : 'text-danger'} mb-1`}>
              <i className={`bi ${trend.type === 'up' ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
              {trend.value}% from last month
            </div>
          )}
        </div>
        
        {subtitle && (
          <div className="text-muted small mt-auto fw-medium">
            {subtitle}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MetricCard;
