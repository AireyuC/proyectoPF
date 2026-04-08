import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, DollarSign, CreditCard } from 'lucide-react';
import { formatMoney } from '../../../utils/format';

// Datos Mock (Simulando inventario)
interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
}

const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Cable USB-C Carga Rápida', price: 35, category: 'ACCESORIO', stock: 10 },
    { id: '2', name: 'Cargador Samsung 25W', price: 120, category: 'ACCESORIO', stock: 5 },
    { id: '3', name: 'Vidrio Templado 9D', price: 20, category: 'ACCESORIO', stock: 50 },
    { id: '4', name: 'Funda Silicona iPhone 13', price: 45, category: 'ACCESORIO', stock: 8 },
];

export const PosPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
    const [showCheckout, setShowCheckout] = useState(false); // Modal de cobro

    // Filtrar productos
    const products = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Totales
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Acciones del Carrito
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">

            {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Buscador */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-lg"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar pb-4 pr-2">
                    {products.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 transition-all text-left group flex flex-col h-32 justify-between"
                        >
                            <div>
                                <h3 className="font-bold text-slate-100 group-hover:text-teal-400 line-clamp-2 transition-colors">{product.name}</h3>
                                <span className="text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded mt-1 inline-block border border-slate-600">Stock: {product.stock}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-white">{formatMoney(product.price)}</span>
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                    <Plus size={18} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* SECCIÓN DERECHA: CARRITO (TICKET) */}
            <div className="w-96 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full">
                {/* Header Carrito */}
                <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-700">
                        <ShoppingCart size={20} />
                        <h2 className="font-bold">Venta Actual</h2>
                    </div>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded-full">{cart.length} ítems</span>
                </div>

                {/* Lista de Ítems */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p>Carrito vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-700 line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-teal-600 font-bold">{formatMoney(item.price * item.qty)}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center text-slate-700">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <button onClick={() => removeFromCart(item.id)} className="ml-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Resumen y Botón de Cobro */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-slate-500 font-medium">Total a Cobrar</span>
                        <span className="text-3xl font-bold text-slate-800 tracking-tight">{formatMoney(total)}</span>
                    </div>

                    <button
                        disabled={cart.length === 0}
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-200/50 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <DollarSign size={24} />
                        Cobrar Venta
                    </button>
                </div>
            </div>

            {/* MODAL DE COBRO RÁPIDO */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Confirmar Cobro</h3>
                            <p className="text-3xl font-bold text-teal-600 mb-6">{formatMoney(total)}</p>

                            <div className="space-y-3">
                                <button className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                                    <DollarSign size={20} /> Efectivo Exacto
                                </button>
                                <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                                    <CreditCard size={20} /> QR / Transferencia
                                </button>
                                <button
                                    onClick={() => setShowCheckout(false)}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
