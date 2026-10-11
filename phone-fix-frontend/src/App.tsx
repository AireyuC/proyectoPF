// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionRoute } from './components/auth/PermissionRoute';
import { LoginPage } from './features/staff/pages/LoginPage';

import { NewOrderPage } from './features/reception/pages/NewOrderPage';
import { WorkshopPage } from './features/workshop/pages/WorkshopPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { PosPage } from './features/sales/pages/PosPage';
import { CashClosePage } from './features/sales/pages/CashClosePage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { UsersPage } from './features/staff/pages/UsersPage';
import { SuppliersPage } from './features/workshop/pages/SuppliersPage';
import { AccountingLedgerPage } from './features/sales/pages/AccountingLedgerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de acceso */}
        <Route path="/login" element={<LoginPage />} />

        {/* Todas las rutas del Dashboard están protegidas por sesión */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            
            {/* Recepción de Equipos */}
            <Route element={<PermissionRoute permission="recepcion.ordenes.crear" />}>
              <Route index element={<NewOrderPage />} />
            </Route>

            {/* Taller Activo */}
            <Route element={<PermissionRoute permission="taller.reparaciones.ver" />}>
              <Route path="taller" element={<WorkshopPage />} />
            </Route>

            {/* Inventario */}
            <Route element={<PermissionRoute permission="inventario.productos.ver" />}>
              <Route path="inventario" element={<InventoryPage />} />
            </Route>
            
            {/* Directorio de Proveedores y Casetas */}
            <Route element={<PermissionRoute permission="taller.reparaciones.ver" />}>
              <Route path="proveedores" element={<SuppliersPage />} />
            </Route>
            
            {/* Venta Mostrador (POS) */}
            <Route element={<PermissionRoute permission="ventas.pos.vender" />}>
              <Route path="ventas" element={<PosPage />} />
            </Route>

            {/* Arqueo de Caja */}
            <Route element={<PermissionRoute permission="caja.movimientos.ver" />}>
              <Route path="caja" element={<CashClosePage />} />
            </Route>

            {/* Libro Contable General Inmutable */}
            <Route element={<PermissionRoute permission="caja.movimientos.ver" />}>
              <Route path="contabilidad" element={<AccountingLedgerPage />} />
            </Route>

            {/* Clientes */}
            <Route element={<PermissionRoute permission="clientes.cartera.ver" />}>
              <Route path="clientes" element={<ClientsPage />} />
            </Route>

            {/* Personal & Matriz de Roles (Seguridad) */}
            <Route element={<PermissionRoute permission="seguridad.usuarios.ver" />}>
              <Route path="usuarios" element={<UsersPage />} />
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