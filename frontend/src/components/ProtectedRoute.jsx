import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  const location = useLocation();

  // If user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not permitted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the role's default landing page
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/my-fees';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default ProtectedRoute;
