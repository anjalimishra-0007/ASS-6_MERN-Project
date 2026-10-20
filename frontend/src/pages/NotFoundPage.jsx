import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const NotFoundPage = ({ user }) => {
  const homePath = user ? (user.role === 'admin' ? '/admin/dashboard' : '/my-fees') : '/login';

  return (
    <div className="state-container" style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}
      >
        <AlertCircle size={32} />
      </div>
      <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.5rem' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        The page you are looking for does not exist or has been moved to another URL.
      </p>
      <Link to={homePath} className="btn btn-primary">
        <Home size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
