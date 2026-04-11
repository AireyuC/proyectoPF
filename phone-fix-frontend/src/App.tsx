// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminOnlyRoute } from './components/auth/AdminOnlyRoute';
import { LoginPage } from './features/staff/pages/LoginPage';

import { NewOrderPage } from './features/reception/pages/NewOrderPage';
import { WorkshopPage } from './features/workshop/pages/WorkshopPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { PosPage } from './features/sales/pages/PosPage';
import { CashClosePage } from './features/sales/pages/CashClosePage';
import { ClientsPage } from './features/clients/pages/ClientsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de acceso */}
        <Route path="/login" element={<LoginPage />} />

        {/* Todas las rutas del Dashboard están protegidas */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Rutas compartidas (STAFF y ADMIN) */}
            <Route index element={<NewOrderPage />} />
            <Route path="taller" element={<WorkshopPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            
            {/* Rutas exclusivas para ADMIN */}
            <Route element={<AdminOnlyRoute />}>
              <Route path="ventas" element={<PosPage />} />
              <Route path="caja" element={<CashClosePage />} />
              <Route path="clientes" element={<ClientsPage />} />
            </Route>

            {/* Error 404 local del dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;