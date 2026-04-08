import { Link, Outlet, useLocation } from 'react-router-dom';
import { Wrench, Smartphone, Users, DollarSign, ClipboardList, Search } from 'lucide-react';

const MainLayout = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Recepción', icon: <ClipboardList size={22} /> },
        { path: '/taller', label: 'Taller Activo', icon: <Wrench size={22} /> },
        { path: '/inventario', label: 'Inventario', icon: <Smartphone size={22} /> },
        { path: '/ventas', label: 'Caja & Ventas', icon: <DollarSign size={22} /> },
        { path: '/caja', label: 'Cierre de Caja', icon: <DollarSign size={22} /> },
        { path: '/clientes', label: 'Clientes', icon: <Users size={22} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-600">
            {/* Sidebar Minimalista Blanco */}
            <aside className="w-20 md:w-64 bg-white border-r border-slate-100 flex flex-col transition-all duration-300">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-200">
                        <Wrench className="text-white" size={18} />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight hidden md:block">
                        PHONE<span className="text-teal-500">FIX</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-teal-50 text-teal-600 font-semibold shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                    }`}
                            >
                                <span className={isActive ? 'text-teal-500' : 'text-slate-400 group-hover:text-slate-500'}>
                                    {item.icon}
                                </span>
                                <span className="hidden md:block">{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 hidden md:block" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-50 mx-4 mb-4">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-300 flex items-center justify-center text-white font-bold shadow-md">
                            A
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-bold text-slate-700">Admin</p>
                            <p className="text-xs text-teal-500 font-medium">Sucursal Montero</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Área Principal */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
                <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        {menuItems.find(i => i.path === location.pathname)?.label || 'Panel'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 rounded-full px-4 py-2 flex items-center gap-2 text-slate-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                            <Search size={18} />
                            <input type="text" placeholder="Buscar ticket o cliente..." className="bg-transparent outline-none text-sm text-slate-600 w-48" />
                        </div>
                    </div>
                </header>

                <div className="p-6 w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
