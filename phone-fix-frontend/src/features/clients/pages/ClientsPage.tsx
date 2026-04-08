import { useState } from 'react';
import { Search, UserPlus, Phone, Star, Pencil, History, User } from 'lucide-react';
import { createWhatsAppLink, formatMoney } from '../../../utils/format';
import type { Client } from '../types';
import { ClientFormModal } from '../components/ClientFormModal';

// Datos Mock (Simulados)
const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        fullName: 'Juan Pérez',
        ci: '8956231 SC',
        phones: ['77001234', '60005678'],
        isVip: false,
        totalRepairs: 1,
        totalSpent: 150,
        lastVisit: '2023-10-15'
    },
    {
        id: '2',
        fullName: 'Maria Gomez (Revendedora)',
        ci: '1234567 CB',
        phones: ['71234567'],
        isVip: true, // VIP
        totalRepairs: 15,
        totalSpent: 4500,
        lastVisit: '2023-11-02'
    },
    {
        id: '3',
        fullName: 'Carlos Daniel Aireyu',
        ci: '2211187',
        phones: ['75555555'],
        isVip: true,
        totalRepairs: 4,
        totalSpent: 800,
        lastVisit: '2023-11-05'
    },
];

export const ClientsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Lógica de búsqueda (Nombre, CI o Teléfono)
    const filteredClients = MOCK_CLIENTS.filter(client => {
        const term = searchTerm.toLowerCase();
        const matchName = client.fullName.toLowerCase().includes(term);
        const matchCi = client.ci.toLowerCase().includes(term);
        const matchPhone = client.phones.some(p => p.includes(term));
        return matchName || matchCi || matchPhone;
    });

    const handleNewClient = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cartera de Clientes</h1>
                    <p className="text-slate-500 text-sm">Gestiona contactos y fidelización</p>
                </div>
                <button
                    onClick={handleNewClient}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-teal-200/50 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <UserPlus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* 2. Barra de Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, carnet o número de celular..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 3. Lista de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">

                        <div>
                            <div className="flex justify-between items-start">
                                {/* Info Principal */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${client.isVip
                                        ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-orange-500 ring-2 ring-orange-200'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {client.isVip ? <Star size={20} fill="currentColor" /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            {client.fullName}
                                            {client.isVip && (
                                                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold border border-orange-200">VIP</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-medium">
                                            CI: {client.ci}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEditClient(client)}
                                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm flex items-center gap-2 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm active:scale-95"
                                >
                                    <Pencil size={16} />
                                    Editar
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                                {/* Estadísticas Rápidas */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 uppercase font-bold">Historial</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                        <History size={16} className="text-teal-500" />
                                        {client.totalRepairs} Visitas
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1 uppercase font-bold">Inversión</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                        <span className="text-teal-500 font-bold">Bs.</span>
                                        {formatMoney(client.totalSpent).replace('Bs.', '')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teléfonos y Contacto */}
                        <div className="mt-4 pt-3 flex flex-wrap gap-2">
                            {client.phones.map((phone, idx) => (
                                <a
                                    key={idx}
                                    href={createWhatsAppLink(phone, `Hola ${client.fullName}, le escribimos de PHONE FIX...`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors border border-green-100 shadow-sm"
                                >
                                    <Phone size={14} />
                                    {phone}
                                </a>
                            ))}
                        </div>

                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <User size={40} className="opacity-30" />
                    </div>
                    <p className="text-lg font-medium">No se encontraron clientes.</p>
                    <p className="text-sm">Prueba buscar por otro dato.</p>
                </div>
            )}

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                clientToEdit={editingClient}
            />
        </div>
    );
};
