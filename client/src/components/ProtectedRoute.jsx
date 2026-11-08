import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Route protection guard by authentication status and allowed roles
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Verifying security credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized home if role mismatch
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'hospital_admin') return <Navigate to="/hospital/dashboard" replace />;
    return <Navigate to="/patient/appointments" replace />;
  }

  return children;
};

export default ProtectedRoute;
