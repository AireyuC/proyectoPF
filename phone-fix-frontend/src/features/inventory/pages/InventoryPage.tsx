import React, { useState } from 'react';
import { Search, Plus, Package, AlertCircle, TrendingUp, Pencil, Archive, DollarSign, AlertTriangle } from 'lucide-react';
import { formatMoney } from '../../../utils/format';
import { ProductFormModal } from '../components/ProductFormModal';

// Datos de prueba (Mock)
const MOCK_INVENTORY = [
    { id: '1', name: 'Pantalla Samsung A50 Incell', category: 'REPUESTO', stock: 5, minStock: 3, costPrice: 120, salePrice: 250 },
    { id: '2', name: 'Vidrio Templado 9D Genérico', category: 'ACCESORIO', stock: 15, minStock: 10, costPrice: 5, salePrice: 20 },
    { id: '3', name: 'Pin de Carga Tipo C', category: 'REPUESTO', stock: 1, minStock: 5, costPrice: 2, salePrice: 40 }, // Stock Crítico
    { id: '4', name: 'Funda Silicona iPhone 11', category: 'ACCESORIO', stock: 8, minStock: 2, costPrice: 15, salePrice: 50 },
    { id: '5', name: 'Batería Xiaomi RN8', category: 'REPUESTO', stock: 4, minStock: 2, costPrice: 60, salePrice: 130 },
    { id: '6', name: 'Cargador Carga Rápida 33W', category: 'ACCESORIO', stock: 12, minStock: 5, costPrice: 45, salePrice: 90 },
];

export const InventoryPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('TODOS');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Lógica de filtrado simple
    const filteredProducts = MOCK_INVENTORY.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'TODOS' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // KPI: Dinero invertido (Costo * Stock)
    const totalInvestment = filteredProducts.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
    const lowStockCount = filteredProducts.filter(p => p.stock <= p.minStock).length;
    const totalItems = filteredProducts.length;

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Cabecera y KPIs Dashboard */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario General</h1>
                    <p className="text-slate-500 text-sm">Gestiona tus repuestos y accesorios</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 xl:max-w-4xl">
                    {/* KPI 1: Total Items */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Archive size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Productos</p>
                            <p className="text-xl font-bold text-slate-700">{totalItems}</p>
                        </div>
                    </div>

                    {/* KPI 2: Valor del Stock */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                            <DollarSign size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Capital Invertido</p>
                            <p className="text-xl font-bold text-slate-700">{formatMoney(totalInvestment)}</p>
                        </div>
                    </div>

                    {/* KPI 3: Stock Bajo */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Stock Bajo</p>
                            <p className="text-xl font-bold text-slate-700">{lowStockCount} ítems</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-200/50 flex items-center gap-3 transition-transform active:scale-95 whitespace-nowrap"
                >
                    <Plus size={20} />
                    Nuevo Producto
                </button>
            </div>

            {/* 2. Barra de Herramientas (Búsqueda y Filtros) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-10 backdrop-blur-md bg-white/90">

                {/* Buscador */}
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre (ej: A50)..."
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categorías (Tabs) */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {['TODOS', 'REPUESTO', 'ACCESORIO'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filterCategory === cat
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Grid de Productos (Cards Responsivas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => {
                    const isLowStock = product.stock <= product.minStock;

                    return (
                        <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-300 group flex flex-col justify-between">

                            {/* Header Card */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${product.category === 'REPUESTO' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                                        }`}>
                                        <Package size={22} />
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${isLowStock
                                        ? 'bg-red-50 text-red-600 border-red-100'
                                        : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                        {isLowStock ? '¡STOCK BAJO!' : 'NORMAL'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem]">
                                    {product.name}
                                </h3>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                                        {product.category}
                                    </span>
                                    {isLowStock && <AlertCircle size={14} className="text-red-500" />}
                                </div>

                                {/* Stats Internos */}
                                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase">Stock</p>
                                        <p className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>{product.stock}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">Costo</p>
                                        <p className="font-medium text-slate-600">{formatMoney(product.costPrice)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Card */}
                            <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Precio Venta</p>
                                    <p className="text-xl font-black text-teal-600 tracking-tight">{formatMoney(product.salePrice)}</p>
                                </div>
                                <button
                                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm flex items-center gap-2 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm active:scale-95"
                                >
                                    <Pencil size={16} />
                                    Editar
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Estado Vacío */}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Package size={40} className="opacity-30" />
                        </div>
                        <p className="text-lg font-medium">No se encontraron productos.</p>
                        <p className="text-sm">Intenta con otro término de búsqueda.</p>
                    </div>
                )}
            </div>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
