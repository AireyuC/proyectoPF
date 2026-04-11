import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminOnlyRoute: React.FC = () => {
  const { user } = useAuth();

  // Si el usuario no existe o no tiene rol ADMIN, se lo envía a Recepción (ruta raíz)
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Si tiene permisos, permite renderizar la vista hija (Outlet)
  return <Outlet />;
};
