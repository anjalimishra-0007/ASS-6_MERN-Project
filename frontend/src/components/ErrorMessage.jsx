import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message = 'An error occurred', onRetry }) => {
  return (
    <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry} style={{ padding: '0.2rem 0.5rem' }}>
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
