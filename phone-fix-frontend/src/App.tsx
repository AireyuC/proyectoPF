// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
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
        <Route path="/" element={<MainLayout />}>
          <Route index element={<NewOrderPage />} />
          <Route path="taller" element={<WorkshopPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="ventas" element={<PosPage />} />
          <Route path="caja" element={<CashClosePage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;