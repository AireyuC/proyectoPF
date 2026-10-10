import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Wrench, 
  Package, 
  Users, 
  DollarSign, 
  ClipboardList, 
  LogOut, 
  Menu, 
  X, 
  Zap, 
  Activity,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const { logout, user, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { 
      path: '/', 
      label: 'Recepción', 
      icon: <ClipboardList size={20} />, 
      permission: 'recepcion.ordenes.crear' 
    },
    { 
      path: '/taller', 
      label: 'Taller Activo', 
      icon: <Wrench size={20} />, 
      permission: 'taller.reparaciones.ver' 
    },
    { 
      path: '/inventario', 
      label: 'Inventario', 
      icon: <Package size={20} />, 
      permission: 'inventario.productos.ver' 
    },
    { 
      path: '/ventas', 
      label: 'Venta Mostrador (POS)', 
      icon: <Receipt size={20} />, 
      permission: 'ventas.pos.vender' 
    },
    { 
      path: '/caja', 
      label: 'Arqueo de Caja', 
      icon: <DollarSign size={20} />, 
      permission: 'caja.movimientos.ver' 
    },
    { 
      path: '/clientes', 
      label: 'Clientes', 
      icon: <Users size={20} />, 
      permission: 'clientes.cartera.ver' 
    },
    { 
      path: '/usuarios', 
      label: 'Personal & Roles', 
      icon: <ShieldCheck size={20} />, 
      permission: 'seguridad.usuarios.ver' 
    },
  ];

  // Filtramos por permisos o rol de Administrador
  const visibleItems = menuItems.filter(item => hasPermission(item.permission));

  const roleName = user?.role || 'Staff';

  return (
    <div className="flex h-screen h-dvh bg-[#080B11] font-sans text-white overflow-hidden">
      
      {/* ======================================================== */}
      {/* SIDEBAR DESKTOP */}
      {/* ======================================================== */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0D121F] border-r border-[#1E293B] select-none transition-all duration-300">
        
        {/* Logo PhoneFix */}
        <div className="p-6 flex items-center gap-3 border-b border-[#1E293B]/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#00E5FF]/5 border border-[#00E5FF]/40 flex items-center justify-center glow-cyan-subtle">
            <Zap className="text-[#00E5FF]" size={22} />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-wider text-white">
              PHONE<span className="text-[#00E5FF]">FIX</span>
            </span>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#64748B]">
              Taller & Punto de Venta
            </p>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-150 text-sm font-medium group relative ${
                  isActive
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border border-[#00E5FF]/30 glow-cyan-subtle'
                    : 'text-[#94A3B8] hover:bg-[#131926] hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-[#00E5FF]' : 'text-[#64748B] group-hover:text-white transition-colors'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Usuario & Logout */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0E18]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#131926] border border-[#1E293B]">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#00E5FF] to-[#3B82F6] flex items-center justify-center text-[#080B11] font-extrabold text-sm shadow-md">
              {roleName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate capitalize">
                {roleName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <p className="text-[10px] text-[#94A3B8] truncate">Montero Central</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* ======================================================== */}
      {/* DRAWER MÓVIL */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80%] bg-[#0D121F] border-r border-[#1E293B] flex flex-col h-full z-10 p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Zap className="text-[#00E5FF]" size={20} />
                <span className="text-lg font-bold text-white">PHONE<span className="text-[#00E5FF]">FIX</span></span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#131926]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border border-[#00E5FF]/30'
                        : 'text-[#94A3B8] hover:bg-[#131926] hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#1E293B]">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold transition-all"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ======================================================== */}
      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080B11]">
        
        {/* Header Superior Glassmorphism */}
        <header className="h-16 px-4 md:px-8 bg-[#0D121F]/80 backdrop-blur-md border-b border-[#1E293B] flex items-center justify-between shrink-0 z-20">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#131926] cursor-pointer"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base md:text-lg font-bold text-white tracking-wide">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Panel de Control'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131926] border border-[#1E293B] text-xs text-[#94A3B8]">
              <Activity size={14} className="text-[#00E5FF] animate-pulse" />
              <span>Bolivia (BOB) • Montero</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-lg text-xs font-semibold text-[#00E5FF]">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
              <span className="capitalize">{roleName}</span>
            </div>
          </div>

        </header>

        {/* Contenedor scrolleable con altura 100% controlada */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default MainLayout;
