import React, { useState } from 'react';
import { X, Search, Store, ShoppingBag } from 'lucide-react';

import type { RepairPart } from './RepairDetailModal';

interface AddLineItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: RepairPart) => void;
}

export const AddLineItemModal: React.FC<AddLineItemModalProps> = ({ isOpen, onClose, onAdd }) => {
    // TIPO DE ORIGEN: ¿De mi estante o de la calle?
    const [sourceType, setSourceType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');

    const [formData, setFormData] = useState({
        name: '',
        cost: 0,   // Costo para mí
        price: 0,  // Precio para el cliente
        supplier: '', // Solo si es externo
        isPaid: false // ¿Ya le pagué al proveedor?
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ ...formData, sourceType, id: Date.now().toString() });
        onClose();
        // Reset form
        setFormData({ name: '', cost: 0, price: 0, supplier: '', isPaid: false });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Agregar Repuesto o Servicio</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Selector de Origen (Switch Visual) */}
                    <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setSourceType('INTERNAL')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${sourceType === 'INTERNAL' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Store size={16} /> Inventario
                        </button>
                        <button
                            type="button"
                            onClick={() => setSourceType('EXTERNAL')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${sourceType === 'EXTERNAL' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ShoppingBag size={16} /> Compra Externa
                        </button>
                    </div>

                    {/* Campos Dinámicos */}
                    <div className="space-y-4">

                        {/* 1. Nombre del Producto */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                                {sourceType === 'INTERNAL' ? 'Buscar en Inventario' : 'Descripción del Repuesto'}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder={sourceType === 'INTERNAL' ? "Ej: Vidrio Temp. A50..." : "Ej: Pantalla OLED (Barrio Chino)"}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>

                        {/* 2. Proveedor (Solo si es Externo) */}
                        {sourceType === 'EXTERNAL' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Proveedor / Tienda</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-orange-200 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-orange-800 placeholder-orange-300"
                                    placeholder="Ej: Tienda de Juan, Importadora X..."
                                    value={formData.supplier}
                                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                />
                            </div>
                        )}

                        {/* 3. Costos y Precios */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                                    Costo <span className="text-[10px] font-normal text-slate-400">(Mío)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">Bs.</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-slate-600"
                                        placeholder="0.00"
                                        value={formData.cost || ''}
                                        onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-teal-600 mb-1 uppercase flex items-center gap-1">
                                    Precio <span className="text-[10px] font-normal text-teal-400">(Cliente)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-teal-500 text-sm">Bs.</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border border-teal-200 bg-teal-50/30 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold text-teal-700"
                                        placeholder="0.00"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Rentabilidad Calculada (Visual Feedback) */}
                        {formData.price > 0 && (
                            <div className="flex justify-between items-center text-xs px-2">
                                <span className="text-slate-400">Ganancia estimada:</span>
                                <span className={`font-bold ${formData.price - formData.cost > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    Bs. {(formData.price - formData.cost).toFixed(2)}
                                </span>
                            </div>
                        )}

                    </div>

                    {/* Footer Botones */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-2.5 rounded-xl text-white font-medium shadow-lg transition-transform active:scale-95 ${sourceType === 'INTERNAL'
                                ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-200/50'
                                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200/50'
                                }`}
                        >
                            Agregar Ítem
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
