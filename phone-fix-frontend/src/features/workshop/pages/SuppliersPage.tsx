import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { 
  Store, Plus, Search, MapPin, Phone, User, 
  MessageCircle, Edit3, Trash2, ShieldCheck, Tag
} from 'lucide-react';
import { SupplierModal } from '../components/SupplierModal';
import type { SupplierData } from '../components/SupplierModal';

const GET_SUPPLIERS_QUERY = gql`
  query GetSuppliers($search: String) {
    suppliers(search: $search) {
      id
      name
      isInternal
      marketPlace
      boothNumber
      address
      contactName
      phoneReference
      notes
    }
  }
`;

const DELETE_SUPPLIER_MUTATION = gql`
  mutation DeleteSupplier($id: Int!) {
    deleteSupplier(id: $id)
  }
`;

export const SuppliersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);

  const { data, loading, refetch } = useQuery<any>(GET_SUPPLIERS_QUERY, {
    variables: { search: searchTerm.trim() || null },
    fetchPolicy: 'cache-and-network'
  });

  const [deleteSupplier] = useMutation<any>(DELETE_SUPPLIER_MUTATION);

  const suppliers = data?.suppliers || [];

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al proveedor "${name}"?`)) return;

    try {
      await deleteSupplier({ variables: { id } });
      refetch();
    } catch (err: any) {
      alert(`Error al eliminar proveedor: ${err.message}`);
    }
  };

  const internalCount = suppliers.filter((s: any) => s.isInternal).length;
  const externalCount = suppliers.length - internalCount;

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-black text-white tracking-wide">
              Directorio de Proveedores y Casetas
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Red de abastecimiento de repuestos en Montero (Mercado Central) y Santa Cruz (Chiriguano, Ramada)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Registrar Proveedor
        </button>
      </div>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1420] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Proveedores</div>
            <div className="text-2xl font-black text-white mt-0.5">{suppliers.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1420] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Casetas Comerciales Externas</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{externalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1420] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Stock Propio PhoneFix</div>
            <div className="text-2xl font-black text-blue-400 mt-0.5">{internalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por tienda, caseta, mercado o técnico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0F1420] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
        />
      </div>

      {/* Grilla de Proveedores */}
      {loading && suppliers.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">Cargando directorio de proveedores...</div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0F1420] border border-slate-800">
          <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No se encontraron proveedores</h3>
          <p className="text-xs text-slate-400 mt-1">Registra tu primera caseta o proveedor comercial para cotizar repuestos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier: any) => {
            const cleanPhone = (supplier.phoneReference || '').replace(/\D/g, '');
            const hasPhone = cleanPhone.length >= 7;

            return (
              <div
                key={supplier.id}
                className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-black/20"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-cyan-400 transition">
                        {supplier.name}
                      </h3>
                      {supplier.isInternal ? (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Stock Propio PhoneFix
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Caseta Externa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(supplier)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                        title="Editar Proveedor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id, supplier.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                        title="Eliminar Proveedor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Datos de Ubicación y Contacto */}
                  <div className="space-y-2 text-xs text-slate-300">
                    {(supplier.marketPlace || supplier.boothNumber) && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>
                          {supplier.marketPlace || 'Mercado'}
                          {supplier.boothNumber ? ` • Caseta ${supplier.boothNumber}` : ''}
                        </span>
                      </div>
                    )}

                    {supplier.contactName && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Contacto: <b className="text-slate-200">{supplier.contactName}</b></span>
                      </div>
                    )}

                    {supplier.phoneReference && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Telf: <b className="text-slate-200">{supplier.phoneReference}</b></span>
                      </div>
                    )}

                    {supplier.notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#161D2C] border border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-300">
                        <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{supplier.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón WhatsApp de Contacto Directo */}
                {hasPhone && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <a
                      href={`https://wa.me/591${cleanPhone}?text=${encodeURIComponent('Hola, te consulto de PhoneFix Montero por cotización de repuestos.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Consultar Precios por WhatsApp
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro / Edición */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplierToEdit={selectedSupplier}
        onSaved={() => refetch()}
      />
    </div>
  );
};
