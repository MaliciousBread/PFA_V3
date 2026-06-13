import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If user is a student but tries to access teacher routes
    if (user.role === 'student') {
      return <Navigate to="/my-results" replace />;
    }
    // If user is a teacher but tries to access student routes
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
