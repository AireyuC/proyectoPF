import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Plus, Trash2, Star } from 'lucide-react';
import type { Client } from '../types';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientToEdit?: Client | null;
}

export const ClientFormModal = ({ isOpen, onClose, clientToEdit }: ClientFormModalProps) => {
    // Initial State
    const initialFormState = {
        fullName: '',
        ci: '',
        phones: [''],
        email: '',
        isVip: false,
        notes: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    // Load data if editing
    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                fullName: clientToEdit.fullName,
                ci: clientToEdit.ci,
                phones: clientToEdit.phones.length > 0 ? clientToEdit.phones : [''],
                email: clientToEdit.email || '',
                isVip: clientToEdit.isVip,
                notes: clientToEdit.notes || ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [clientToEdit, isOpen]);

    const handlePhoneChange = (index: number, value: string) => {
        const newPhones = [...formData.phones];
        newPhones[index] = value;
        setFormData({ ...formData, phones: newPhones });
    };

    const addPhoneField = () => {
        setFormData({ ...formData, phones: [...formData.phones, ''] });
    };

    const removePhoneField = (index: number) => {
        const newPhones = formData.phones.filter((_, i) => i !== index);
        setFormData({ ...formData, phones: newPhones });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Filter empty phones
        const cleanPhones = formData.phones.filter(p => p.trim() !== '');

        console.log("Guardando Cliente:", { ...formData, phones: cleanPhones });
        alert(clientToEdit ? "Cliente Actualizado (Simulación)" : "Cliente Creado (Simulación)");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {clientToEdit ? (
                            <>
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User size={20} /></div>
                                Editar Cliente
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><User size={20} /></div>
                                Nuevo Cliente
                            </>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Nombre y CI */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                            placeholder="Ej: Juan Pérez"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">CI / NIT</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                                placeholder="Ej: 1234567 SC"
                                value={formData.ci}
                                onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">VIP</label>
                            <div
                                onClick={() => setFormData({ ...formData, isVip: !formData.isVip })}
                                className={`cursor-pointer p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.isVip
                                    ? 'bg-orange-50 border-orange-200 text-orange-600 ring-2 ring-orange-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                <Star size={20} fill={formData.isVip ? "currentColor" : "none"} />
                                <span className="font-bold text-sm">{formData.isVip ? 'Es VIP' : 'Normal'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Teléfonos Dinámicos */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Teléfonos / WhatsApp</label>
                        <div className="space-y-2">
                            {formData.phones.map((phone, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                        <input
                                            type="tel"
                                            className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                                            placeholder="70000000"
                                            value={phone}
                                            onChange={(e) => handlePhoneChange(index, e.target.value)}
                                        />
                                    </div>
                                    {formData.phones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePhoneField(index)}
                                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPhoneField}
                                className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-1"
                            >
                                <Plus size={16} /> Agregar otro número
                            </button>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg shadow-teal-200/50 flex items-center gap-2 transition-transform active:scale-95 text-sm"
                        >
                            <Save size={18} />
                            {clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
