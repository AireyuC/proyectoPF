import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MessageCircle, MoreVertical, Smartphone } from 'lucide-react';
import { createWhatsAppLink } from '../../../utils/format';
import { RepairDetailModal } from '../components/RepairDetailModal';

interface Repair {
    id: string;
    device: string;
    client: string;
    phone: string;
    status: 'DIAGNOSTICO' | 'ESPERA_CLIENTE' | 'EN_PROCESO' | 'TERMINADO';
    issue: string;
    date: string;
    priority: 'high' | 'medium' | 'low';
}

// Datos falsos para visualizar el diseño
const MOCK_REPAIRS: Repair[] = [
    {
        id: '101',
        device: 'Samsung A50',
        client: 'Juan Perez',
        phone: '77001234',
        status: 'DIAGNOSTICO',
        issue: 'Pantalla rota, no da imagen',
        date: 'Hace 2 horas',
        priority: 'high'
    },
    {
        id: '102',
        device: 'iPhone 11',
        client: 'Maria Lopez',
        phone: '60005678',
        status: 'ESPERA_CLIENTE',
        issue: 'Cambio de batería (Pendiente aprobación)',
        date: 'Ayer',
        priority: 'medium'
    },
    {
        id: '103',
        device: 'Xiaomi Redmi Note 9',
        client: 'Carlos Aireyu',
        phone: '70000000',
        status: 'EN_PROCESO',
        issue: 'Pin de carga suelto',
        date: 'Hace 30 min',
        priority: 'low'
    }
];

// Componente de Badge (Etiqueta de estado)
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        DIAGNOSTICO: 'bg-orange-50 text-orange-600 border-orange-100',
        ESPERA_CLIENTE: 'bg-purple-50 text-purple-600 border-purple-100',
        EN_PROCESO: 'bg-teal-50 text-teal-600 border-teal-100',
        TERMINADO: 'bg-green-50 text-green-600 border-green-100',
    };

    const labels: Record<string, string> = {
        DIAGNOSTICO: 'Diagnóstico',
        ESPERA_CLIENTE: 'Esperando Aprob.',
        EN_PROCESO: 'En Reparación',
        TERMINADO: 'Listo',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
            {labels[status] || status}
        </span>
    );
};

export const WorkshopPage = () => {
    const [filter, setFilter] = useState('ALL');
    const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

    const filteredRepairs = React.useMemo(() => {
        if (filter === 'ALL') return MOCK_REPAIRS;

        // Map human-readable filter to status code
        const statusMap: Record<string, string> = {
            'Diagnóstico': 'DIAGNOSTICO',
            'En Proceso': 'EN_PROCESO',
            'Terminados': 'TERMINADO'
        };

        const targetStatus = statusMap[filter];
        return MOCK_REPAIRS.filter(repair => repair.status === targetStatus);
    }, [filter]);

    return (
        <div>
            {/* Filtros Superiores Minimalistas */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {['Todos', 'Diagnóstico', 'En Proceso', 'Terminados'].map((label) => (
                    <button
                        key={label}
                        onClick={() => setFilter(label === 'Todos' ? 'ALL' : label)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all border shadow-sm ${(filter === 'ALL' && label === 'Todos') || filter === label
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:text-teal-600'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredRepairs.map((repair) => (
                    <div key={repair.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">

                        {/* Cabecera de Tarjeta */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{repair.device}</h3>
                                    <p className="text-xs text-slate-400">Ticket #{repair.id}</p>
                                </div>
                            </div>
                            <button className="text-slate-300 hover:text-slate-600">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="space-y-3 mb-6">
                            <StatusBadge status={repair.status} />
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                {repair.issue}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <Clock size={14} />
                                <span>Ingresó: {repair.date}</span>
                            </div>
                        </div>

                        {/* Footer / Acciones */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">{repair.client}</span>
                                <span className="text-[10px] text-slate-400">Cliente</span>
                            </div>

                            <div className="flex gap-2">
                                {/* Botón WhatsApp */}
                                <a
                                    href={createWhatsAppLink(repair.phone, `Hola ${repair.client}, le escribo de PHONE FIX sobre su ${repair.device}...`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                                    title="Contactar por WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                </a>

                                {/* Botón Acción Principal */}
                                <button
                                    onClick={() => setSelectedRepairId(repair.id)}
                                    className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 shadow-lg shadow-teal-200/50 transition-all"
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Tarjeta de "Añadir Nuevo" (Acceso Rápido) */}
                <Link to="/" className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer min-h-[250px]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
                        <span className="text-2xl font-light">+</span>
                    </div>
                    <span className="font-medium">Nueva Reparación</span>
                </Link>
            </div>

            {/* Modal de Detalle */}
            {selectedRepairId && (
                <RepairDetailModal
                    isOpen={!!selectedRepairId}
                    onClose={() => setSelectedRepairId(null)}
                    repairId={selectedRepairId}
                />
            )}
        </div>
    );
};
