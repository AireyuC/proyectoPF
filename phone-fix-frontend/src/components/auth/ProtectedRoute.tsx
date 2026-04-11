import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirigir al usuario a la página de login
    // Usamos replace para no sumar esta redirección al historial
    return <Navigate to="/login" replace />;
  }

  // Outlet renderiza las rutas hijas definidas en App.tsx
  return <Outlet />;
};
