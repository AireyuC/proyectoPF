import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminOnlyRoute: React.FC = () => {
  const { user } = useAuth();

  const isAdmin = user && (
    user.role?.toUpperCase() === 'ADMIN' || 
    user.role?.toUpperCase() === 'ADMINISTRADOR' ||
    user.role?.toUpperCase() === 'SUPERUSER'
  );

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
