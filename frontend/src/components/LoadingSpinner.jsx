import React from 'react';

const LoadingSpinner = ({ message = 'Loading details, please wait...' }) => {
  return (
    <div className="state-container">
      <div className="spinner"></div>
      <p className="state-title">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
