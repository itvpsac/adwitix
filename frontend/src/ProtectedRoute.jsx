import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './utils/auth';
import { NAVIGATION_CONFIG } from './navigationConfig';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to custodian login if we are in a custodian route
    if (location.pathname.startsWith('/custodian')) {
      return <Navigate to="/custodian/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // If a role is required, check if the user has it
  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    // Redirect to a 'not-authorized' page or back to dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
