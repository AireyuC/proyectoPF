import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { 
  Search, 
  Smartphone, 
  MessageCircle, 
  RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import { GET_REPAIR_ORDERS } from '../../../api/graphql';
import { formatMoney, createWhatsAppLink } from '../../../utils/format';
import { RepairDetailModal } from '../components/RepairDetailModal';

export const WorkshopPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, loading, refetch } = useQuery<any>(GET_REPAIR_ORDERS, {
    variables: { 
      status: statusFilter === 'ALL' ? null : statusFilter, 
      search: searchTerm.trim() || null 
    },
    fetchPolicy: 'network-only'
  });

  const orders = data?.repairOrders || [];

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string, display: string) => {
    switch (status) {
      case 'ENTREGADO_REPARADO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">Entregado</span>;
      case 'REPARADO_ESPERA':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]">Listo para Retiro</span>;
      case 'EN_PROCESO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">En Reparación</span>;
      case 'DIAGNOSTICO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">En Diagnóstico</span>;
      case 'DECLARADO_ABANDONO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Activo / Abandono</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1E293B] text-[#94A3B8] border border-[#334155]">{display}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Taller Activo & Reparaciones
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Monitoreo en vivo de dispositivos, estados, costos y entregas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-[#131926] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl border border-[#1E293B] transition-all cursor-pointer"
            title="Actualizar listado"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Pestañas de Estado */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
        
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por ticket, cliente, modelo o IMEI..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white text-xs placeholder-[#64748B] outline-none focus:border-[#00E5FF]"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'EN_PROCESO', label: 'En Taller' },
            { key: 'REPARADO_ESPERA', label: 'Por Retirar' },
            { key: 'ENTREGADO_REPARADO', label: 'Entregados' },
            { key: 'DECLARADO_ABANDONO', label: 'Abandono' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 border ${
                statusFilter === tab.key
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/40 font-bold glow-cyan-subtle'
                  : 'bg-[#0D121F] text-[#94A3B8] border-[#1E293B] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Grid de Órdenes */}
      {loading && (
        <div className="py-20 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#00E5FF]" />
          <span>Cargando órdenes del taller...</span>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="py-20 text-center bg-[#0D121F] rounded-3xl border border-[#1E293B] p-8 space-y-3">
          <Smartphone className="mx-auto text-[#64748B]" size={36} />
          <h3 className="font-bold text-white text-sm">No se encontraron órdenes de servicio</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            No hay dispositivos registrados con los filtros seleccionados.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order: any) => (
          <div
            key={order.id}
            onClick={() => handleOpenDetail(order)}
            className="bg-[#0D121F] border border-[#1E293B] hover:border-[#00E5FF]/40 rounded-2xl p-5 space-y-4 cursor-pointer transition-all hover:glow-cyan-subtle group relative"
          >
            {/* Top row: Ticket & Badge */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-extrabold text-[#00E5FF] tracking-wider">
                #{order.ticketNumber}
              </span>
              {getStatusBadge(order.status, order.statusDisplay)}
            </div>

            {/* Info Dispositivo */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base group-hover:text-[#00E5FF] transition-colors">
                {order.device?.brand} {order.device?.model}
              </h3>
              <p className="text-xs text-[#94A3B8] line-clamp-1">
                {order.issueDescription}
              </p>
            </div>

            {/* Cliente y WhatsApp */}
            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">{order.clientName}</p>
                <p className="text-[11px] text-[#64748B]">{order.clientPhone}</p>
              </div>

              <a
                href={createWhatsAppLink(order.clientPhone, `Hola ${order.clientName}, de PhoneFix Montero. Tu equipo ${order.device?.brand} ${order.device?.model} (Ticket #${order.ticketNumber}) está en estado: ${order.statusDisplay}.`)}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors cursor-pointer"
                title="Mensaje WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>

            {/* Finanzas */}
            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#64748B] text-[10px]">Cotizado:</span>
                <p className="font-bold text-white">{formatMoney(order.estimatedTotal)}</p>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] text-[10px]">Saldo Pendiente:</span>
                <p className="font-extrabold text-[#00E5FF]">
                  {formatMoney(order.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Garantía si ya fue entregado */}
            {order.warrantyExpiresAt && (
              <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#10B981]">
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck size={13} /> Garantía Vence:
                </span>
                <span className="font-bold font-mono">{order.warrantyExpiresAt}</span>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Modal de Detalle de Reparación */}
      <RepairDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        onRefresh={() => {
          refetch();
          if (selectedOrder) {
            // Actualizar modal con datos refrescados
            const updated = orders.find((o: any) => o.ticketNumber === selectedOrder.ticketNumber);
            if (updated) setSelectedOrder(updated);
          }
        }}
      />

    </div>
  );
};
