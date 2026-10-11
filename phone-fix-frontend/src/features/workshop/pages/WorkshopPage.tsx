import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { 
  Search, 
  Smartphone, 
  MessageCircle, 
  RefreshCw, 
  ShieldCheck,
  List,
  LayoutGrid,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { GET_REPAIR_ORDERS } from '../../../api/graphql';
import { formatMoney, createWhatsAppLink } from '../../../utils/format';
import { RepairDetailModal } from '../components/RepairDetailModal';
import { WorkshopTableView } from '../components/WorkshopTableView';

type WorkshopPhase = 'DIAGNOSTICO' | 'REPARACION' | 'ENTREGADOS' | 'TODOS';

export const WorkshopPage: React.FC = () => {
  const [activePhase, setActivePhase] = useState<WorkshopPhase>('DIAGNOSTICO');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSubFilter, setStatusSubFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, loading, refetch } = useQuery<any>(GET_REPAIR_ORDERS, {
    variables: { 
      status: null, 
      search: searchTerm.trim() || null 
    },
    fetchPolicy: 'network-only'
  });

  const allOrders: any[] = data?.repairOrders || [];

  // Conteo de órdenes por fase
  const counts = useMemo(() => {
    let diag = 0;
    let rep = 0;
    let ent = 0;

    allOrders.forEach(o => {
      if (['RECIBIDO', 'DIAGNOSTICO', 'ESPERA_CLIENTE'].includes(o.status)) {
        diag++;
      } else if (['EN_PROCESO', 'REPARADO_ESPERA', 'NO_REPARABLE_ESPERA', 'RECHAZADO_ESPERA'].includes(o.status)) {
        rep++;
      } else if (['ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO'].includes(o.status)) {
        ent++;
      }
    });

    return { diag, rep, ent, total: allOrders.length };
  }, [allOrders]);

  // Filtrado reactivo por Fase y Subfiltro
  const displayedOrders = useMemo(() => {
    return allOrders.filter(o => {
      // 1. Filtro por Fase
      if (activePhase === 'DIAGNOSTICO') {
        if (!['RECIBIDO', 'DIAGNOSTICO', 'ESPERA_CLIENTE'].includes(o.status)) return false;
      } else if (activePhase === 'REPARACION') {
        if (!['EN_PROCESO', 'REPARADO_ESPERA', 'NO_REPARABLE_ESPERA', 'RECHAZADO_ESPERA'].includes(o.status)) return false;
      } else if (activePhase === 'ENTREGADOS') {
        if (!['ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO'].includes(o.status)) return false;
      }

      // 2. Subfiltro específico
      if (statusSubFilter !== 'ALL' && o.status !== statusSubFilter) {
        return false;
      }

      return true;
    });
  }, [allOrders, activePhase, statusSubFilter]);

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string, display: string) => {
    switch (status) {
      case 'ENTREGADO_REPARADO':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 whitespace-nowrap inline-flex items-center justify-center">Entregado</span>;
      case 'REPARADO_ESPERA':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 shadow-[0_0_8px_rgba(0,229,255,0.2)] whitespace-nowrap inline-flex items-center justify-center">Listo para Retiro</span>;
      case 'EN_PROCESO':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap inline-flex items-center justify-center">En Reparación</span>;
      case 'DIAGNOSTICO':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 whitespace-nowrap inline-flex items-center justify-center">En Diagnóstico</span>;
      case 'RECIBIDO':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap inline-flex items-center justify-center">Recién Recibido</span>;
      case 'ESPERA_CLIENTE':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap inline-flex items-center justify-center">Espera Autorización</span>;
      case 'DECLARADO_ABANDONO':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30 whitespace-nowrap inline-flex items-center justify-center">Activo / Abandono</span>;
      case 'RECHAZADO_ESPERA':
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap inline-flex items-center justify-center">Cotiz. Rechazada</span>;
      default:
        return <span style={{ whiteSpace: 'nowrap' }} className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#1E293B] text-[#94A3B8] border border-[#334155] whitespace-nowrap inline-flex items-center justify-center">{display}</span>;
    }
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto space-y-6">
      
      {/* Header Superior y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Taller Activo & Mesa de Trabajo</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              Montero, SCZ
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Flujo en dos etapas: Diagnóstico inicial diferido vs. Mesa de trabajo autorizada
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vista: Tabla vs Tarjetas */}
          <div className="flex items-center bg-[#0D121F] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Lista Compacta (15-20 filas)"
            >
              <List size={14} />
              <span>Lista Compacta</span>
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid size={14} />
              <span>Tarjetas</span>
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-[#131926] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl border border-[#1E293B] transition-all cursor-pointer"
            title="Actualizar listado"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE FASES DEL TALLER */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0D121F] rounded-2xl border border-[#1E293B]">
        <button
          onClick={() => { setActivePhase('DIAGNOSTICO'); setStatusSubFilter('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
            activePhase === 'DIAGNOSTICO'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Search size={14} />
          <span>🔍 En Diagnóstico / Revisión</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/30 text-amber-200 font-mono">
            {counts.diag}
          </span>
        </button>

        <button
          onClick={() => { setActivePhase('REPARACION'); setStatusSubFilter('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
            activePhase === 'REPARACION'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Wrench size={14} />
          <span>🛠️ En Reparación / Mesa de Trabajo</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/30 text-cyan-200 font-mono">
            {counts.rep}
          </span>
        </button>

        <button
          onClick={() => { setActivePhase('ENTREGADOS'); setStatusSubFilter('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
            activePhase === 'ENTREGADOS'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>📦 Entregados & Historial</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-mono">
            {counts.ent}
          </span>
        </button>

        <button
          onClick={() => { setActivePhase('TODOS'); setStatusSubFilter('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
            activePhase === 'TODOS'
              ? 'bg-slate-700/50 text-white border border-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span>📋 Todos</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {counts.total}
          </span>
        </button>
      </div>

      {/* Barra de Búsqueda y Subfiltros contextuales */}
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

        {/* Subfiltros según la fase activa */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {activePhase === 'DIAGNOSTICO' && (
            <>
              <button
                onClick={() => setStatusSubFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'ALL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                Todos en Diagnóstico
              </button>
              <button
                onClick={() => setStatusSubFilter('RECIBIDO')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'RECIBIDO' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                Recién Recibidos
              </button>
              <button
                onClick={() => setStatusSubFilter('ESPERA_CLIENTE')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'ESPERA_CLIENTE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                Espera Respuesta Cliente
              </button>
            </>
          )}

          {activePhase === 'REPARACION' && (
            <>
              <button
                onClick={() => setStatusSubFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                Toda la Mesa
              </button>
              <button
                onClick={() => setStatusSubFilter('EN_PROCESO')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'EN_PROCESO' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                En Reparación Activa
              </button>
              <button
                onClick={() => setStatusSubFilter('REPARADO_ESPERA')}
                className={`px-3 py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                  statusSubFilter === 'REPARADO_ESPERA' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'bg-[#0D121F] text-slate-400 border-[#1E293B]'
                }`}
              >
                Reparado (Espera Retiro)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenido: Indicador de Carga o Listado */}
      {loading && (
        <div className="py-20 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#00E5FF]" />
          <span>Cargando equipos del taller...</span>
        </div>
      )}

      {!loading && displayedOrders.length === 0 && (
        <div className="py-20 text-center bg-[#0D121F] rounded-3xl border border-[#1E293B] p-8 space-y-3">
          <Smartphone className="mx-auto text-[#64748B]" size={36} />
          <h3 className="font-bold text-white text-sm">No hay dispositivos en esta sección</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            {activePhase === 'DIAGNOSTICO'
              ? 'No hay equipos pendientes de diagnóstico físico o cotización.'
              : activePhase === 'REPARACION'
              ? 'No hay equipos en mesa de trabajo activa.'
              : 'No se encontraron registros con los criterios aplicados.'}
          </p>
        </div>
      )}

      {/* VISTA 1: LISTA COMPACTA DE ALTA DENSIDAD (POR DEFECTO) */}
      {!loading && displayedOrders.length > 0 && viewMode === 'TABLE' && (
        <WorkshopTableView
          orders={displayedOrders}
          onSelectOrder={handleOpenDetail}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* VISTA 2: TARJETAS (GRID) */}
      {!loading && displayedOrders.length > 0 && viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedOrders.map((order: any) => {
            const isOverdue = order.isAbandonmentEligible;

            return (
              <div
                key={order.id}
                onClick={() => handleOpenDetail(order)}
                className={`border rounded-2xl p-5 space-y-4 cursor-pointer transition-all group relative ${
                  isOverdue
                    ? 'bg-[#120B1C] border-purple-500/70 shadow-lg shadow-purple-500/20 hover:border-purple-400'
                    : 'bg-[#0D121F] border-[#1E293B] hover:border-[#00E5FF]/40 hover:glow-cyan-subtle'
                }`}
              >
                {/* Top row: Ticket & Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-[#00E5FF] tracking-wider">
                    #{order.ticketNumber}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/25 text-purple-300 border border-purple-500/50 animate-pulse">
                        ⚠️ &gt;90d Abandono
                      </span>
                    )}
                    {order.estimatedTotal === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Bs. 0 (Diagnóstico)
                      </span>
                    )}
                    {getStatusBadge(order.status, order.statusDisplay)}
                  </div>
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
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Reparación */}
      <RepairDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        onRefresh={() => {
          refetch().then(res => {
            if (selectedOrder && res?.data?.repairOrders) {
              const updated = res.data.repairOrders.find((o: any) => o.ticketNumber === selectedOrder.ticketNumber);
              if (updated) setSelectedOrder(updated);
            }
          });
        }}
      />

    </div>
  );
};
