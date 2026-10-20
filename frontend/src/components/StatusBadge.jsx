import React from 'react';
import { CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status, className = '' }) => {
  const normStatus = (status || '').toLowerCase();

  if (normStatus === 'paid') {
    return (
      <span className={`badge badge-paid ${className}`}>
        <CheckCircle2 size={13} />
        Paid
      </span>
    );
  }

  if (normStatus === 'partially paid' || normStatus === 'partial') {
    return (
      <span className={`badge badge-partial ${className}`}>
        <Clock size={13} />
        Partially Paid
      </span>
    );
  }

  if (normStatus === 'overdue') {
    return (
      <span className={`badge badge-unpaid ${className}`}>
        <AlertTriangle size={13} />
        Overdue
      </span>
    );
  }

  return (
    <span className={`badge badge-unpaid ${className}`}>
      <AlertCircle size={13} />
      Unpaid
    </span>
  );
};

export default StatusBadge;
