
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore';
import PageLoader from '../layout/PageLoader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-screen bg-[#020617] flex items-center justify-center"><PageLoader /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAppStore();
    
    if (isLoading) {
        return <div className="h-screen w-screen bg-[#020617] flex items-center justify-center"><PageLoader /></div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
