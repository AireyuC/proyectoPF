import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Save, Package } from 'lucide-react';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'REPUESTO',
        costPrice: '',
        salePrice: '',
        stock: '',
        minStock: '2'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Creando producto:", formData);
        // Aquí iría la mutación de GraphQL
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Producto">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Nombre y Categoría */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre del Producto</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Funda Silicona A30 Negra"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Categoría</label>
                        <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="REPUESTO">Repuesto</option>
                            <option value="ACCESORIO">Accesorio</option>
                            <option value="HERRAMIENTA">Herramienta</option>
                        </select>
                    </div>
                </div>

                {/* Precios (Sección Dinero) */}
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                    <h4 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> Definición de Precios
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Costo de Compra (Bs.)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full p-2 border border-slate-200 rounded-lg"
                                value={formData.costPrice}
                                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-teal-600 font-bold mb-1">Precio de Venta (Bs.)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full p-2 border border-teal-200 rounded-lg font-bold text-teal-700"
                                value={formData.salePrice}
                                onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Stock Inicial */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cantidad Inicial</label>
                        <div className="relative">
                            <Package size={18} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="number"
                                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl"
                                placeholder="0"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Alerta Mínima</label>
                        <input
                            type="number"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-center"
                            value={formData.minStock}
                            onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-center">Avisar si baja de esto</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium">
                        Cancelar
                    </button>
                    <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-teal-200/50 flex items-center gap-2 transform active:scale-95 transition-all">
                        <Save size={18} />
                        Guardar Producto
                    </button>
                </div>
            </form>
        </Modal>
    );
};
