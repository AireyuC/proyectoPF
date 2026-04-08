import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { createWhatsAppLink, formatMoney } from '../../../utils/format';
import { Smartphone, Lock, MessageCircle, Save, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { AddLineItemModal } from './AddLineItemModal';

// Tipos temporales para esta vista
export interface RepairPart {
    id: string;
    name: string;
    cost: number; // Costo para el negocio (Visible para técnico)
    price: number; // Precio al cliente
    sourceType?: 'INTERNAL' | 'EXTERNAL';
    supplier?: string;
    isPaid?: boolean;
}

export const RepairDetailModal = ({ isOpen, onClose, repairId }: { isOpen: boolean; onClose: () => void; repairId: string }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'COSTOS' | 'HISTORIAL'>('GENERAL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Estado simulado (esto vendrá de tu Backend Django)
    const [parts, setParts] = useState<RepairPart[]>([
        { id: '1', name: 'Pantalla OLED Calidad A', cost: 180, price: 350, sourceType: 'INTERNAL' } // El técnico ve que costó 180
    ]);

    const [notes, setNotes] = useState("El cliente indica que se mojó un poco antes de fallar.");
    const [status, setStatus] = useState("EN_PROCESO");

    // Totales
    const totalParts = parts.reduce((acc, p) => acc + p.price, 0);
    const laborCost = 100; // Mano de obra
    const totalClient = totalParts + laborCost;

    const handleAddItem = (newItem: RepairPart) => {
        setParts([...parts, newItem]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionando Reparación #${repairId}`}>

            {/* 1. Barra de Estado Superior */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-teal-600">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Samsung Galaxy A50</h3>
                        <p className="text-xs text-slate-500">IMEI: 356987000123445</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-white border border-teal-200 text-teal-700 text-sm font-semibold py-2 px-4 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="DIAGNOSTICO">En Diagnóstico</option>
                        <option value="ESPERA_CLIENTE">Esperando Aprobación</option>
                        <option value="EN_PROCESO">En Reparación</option>
                        <option value="TERMINADO">Listo para Entregar</option>
                    </select>

                    <a
                        href={createWhatsAppLink('70000000', `Hola, su equipo Samsung A50 cambió de estado a: ${status}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                    >
                        <MessageCircle size={20} />
                    </a>
                </div>
            </div>

            {/* 2. Pestañas de Navegación */}
            <div className="flex border-b border-slate-200 mb-6">
                {(['GENERAL', 'COSTOS', 'HISTORIAL'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                            ? 'border-teal-500 text-teal-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 3. Contenido de las Pestañas */}
            <div className="min-h-[300px]">

                {/* PESTAÑA: GENERAL */}
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Falla Reportada</label>
                                <div className="p-3 bg-slate-50 rounded-lg text-slate-700 text-sm mt-1 border border-slate-100">
                                    Pantalla rota, vibra pero no da imagen.
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas del Técnico</label>
                                <textarea
                                    className="w-full mt-1 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Escribe aquí el diagnóstico técnico..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Lock size={14} /> Patrón de Seguridad
                            </label>
                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                                {/* Visualización Simple del Patrón (Solo lectura) */}
                                <div className="grid grid-cols-3 gap-4 p-2 pointer-events-none opacity-80">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
                                        <div key={dot} className={`w-4 h-4 rounded-full ${[1, 5, 9].includes(dot) ? 'bg-teal-500' : 'bg-slate-300'}`} />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Secuencia: 1 - 5 - 9</p>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                                    Ver Fotos (2)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PESTAÑA: COSTOS Y REPUESTOS */}
                {activeTab === 'COSTOS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg mb-4 text-xs text-orange-800 flex items-start gap-2">
                            <div className="mt-0.5"><Save size={14} /></div>
                            <p>Recuerda registrar el costo real del repuesto. Esto no será visible para el cliente, solo para control interno.</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="p-3">Repuesto / Servicio</th>
                                        <th className="p-3 text-right text-slate-400">Costo (Interno)</th>
                                        <th className="p-3 text-right">Precio (Cliente)</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parts.map((part) => (
                                        <tr key={part.id}>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700">{part.name}</span>
                                                    {/* Etiqueta condicional */}
                                                    {part.sourceType === 'EXTERNAL' && (
                                                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit mt-0.5 flex items-center gap-1">
                                                            <ShoppingBag size={10} /> Externo: {part.supplier}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right text-slate-400 font-mono text-xs">{formatMoney(part.cost)}</td>
                                            <td className="p-3 text-right font-medium text-slate-700 font-mono">{formatMoney(part.price)}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => setParts(parts.filter(p => p.id !== part.id))}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50/50">
                                        <td className="p-3 font-medium text-slate-600">Mano de Obra (Servicio)</td>
                                        <td className="p-3 text-right text-slate-300">-</td>
                                        <td className="p-3 text-right font-medium text-slate-700 font-mono">{formatMoney(laborCost)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 text-teal-600 font-medium text-sm hover:underline mb-6"
                        >
                            <Plus size={16} /> Agregar Repuesto o Servicio
                        </button>

                        <div className="flex justify-end border-t border-slate-100 pt-4">
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Total a Cobrar</p>
                                <p className="text-2xl font-bold text-slate-800">{formatMoney(totalClient)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PESTAÑA: HISTORIAL */}
                {activeTab === 'HISTORIAL' && (
                    <div className="space-y-6 pl-4 border-l-2 border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative">
                            <div className="absolute -left-[21px] bg-teal-500 w-3 h-3 rounded-full border-2 border-white shadow-sm"></div>
                            <p className="text-xs text-slate-400 mb-1">Hace 2 horas</p>
                            <p className="text-sm text-slate-700">El técnico <b>Juan</b> cambió el estado a <span className="text-teal-600 font-medium">En Reparación</span>.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] bg-slate-300 w-3 h-3 rounded-full border-2 border-white shadow-sm"></div>
                            <p className="text-xs text-slate-400 mb-1">Ayer 15:30</p>
                            <p className="text-sm text-slate-700">Recepción: Ingreso del equipo. Pantalla rota.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer de Acciones */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 font-medium transition-colors">
                    Cancelar
                </button>
                <button className="px-5 py-2.5 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 shadow-lg shadow-teal-200/50 flex items-center gap-2 transition-transform active:scale-95">
                    <Save size={18} />
                    Guardar Cambios
                </button>
            </div>

            <AddLineItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddItem}
            />
        </Modal>
    );
};