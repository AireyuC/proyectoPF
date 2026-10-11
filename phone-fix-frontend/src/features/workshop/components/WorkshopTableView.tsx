import React from 'react';
import { 
  MessageCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Calendar
} from 'lucide-react';
import { formatMoney, createWhatsAppLink } from '../../../utils/format';

interface WorkshopTableViewProps {
  orders: any[];
  onSelectOrder: (order: any) => void;
  getStatusBadge: (status: string, display: string) => React.ReactNode;
}

export const WorkshopTableView: React.FC<WorkshopTableViewProps> = ({
  orders,
  onSelectOrder,
  getStatusBadge
}) => {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center bg-[#0D121F] rounded-2xl border border-[#1E293B] p-8 text-slate-400">
        No se encontraron dispositivos en esta sección del taller.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1E293B] bg-[#0D121F] shadow-xl">
      <table className="w-full min-w-[1180px] text-left border-collapse text-xs">
        <thead className="bg-[#131926] text-slate-400 border-b border-[#1E293B] text-[11px] uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-3.5 px-4 whitespace-nowrap min-w-[165px]" style={{ whiteSpace: 'nowrap' }}>Ticket</th>
            <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]" style={{ whiteSpace: 'nowrap' }}>Dispositivo</th>
            <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]" style={{ whiteSpace: 'nowrap' }}>Cliente / Contacto</th>
            <th className="py-3.5 px-4 min-w-[200px]">Falla & Diagnóstico</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]" style={{ whiteSpace: 'nowrap' }}>Cotizado</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[100px]" style={{ whiteSpace: 'nowrap' }}>Saldo</th>
            <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]" style={{ whiteSpace: 'nowrap' }}>Promesa Entrega</th>
            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[95px]" style={{ whiteSpace: 'nowrap' }}>Días Taller</th>
            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]" style={{ whiteSpace: 'nowrap' }}>Estado</th>
            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[85px]" style={{ whiteSpace: 'nowrap' }}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E293B]/70">
          {orders.map((order) => {
            const isOverdue = order.isAbandonmentEligible;
            const days = order.daysInWorkshop || 0;

            return (
              <tr 
                key={order.id} 
                onClick={() => onSelectOrder(order)}
                className={`hover:bg-[#131926]/70 transition-colors cursor-pointer group ${
                  isOverdue ? 'bg-purple-950/20' : ''
                }`}
              >
                {/* Ticket */}
                <td className="py-3.5 px-4 font-mono font-black text-cyan-400 group-hover:underline whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  #{order.ticketNumber}
                </td>

                {/* Dispositivo */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                    {order.device?.brand} {order.device?.model}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {order.device?.color || 'Sin color'} • IMEI: {order.device?.imei ? `${order.device.imei.slice(0, 6)}...` : 'N/R'}
                  </div>
                </td>

                {/* Cliente */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-200">
                    {order.clientName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <span>{order.clientPhone}</span>
                  </div>
                </td>

                {/* Falla & Diagnóstico */}
                <td className="py-3.5 px-4 max-w-xs">
                  <p className="text-slate-300 font-medium truncate" title={order.issueDescription}>
                    {order.issueDescription}
                  </p>
                  {order.technicianNotes && (
                    <p className="text-[10px] text-cyan-400/80 truncate italic" title={order.technicianNotes}>
                      Diag: {order.technicianNotes}
                    </p>
                  )}
                </td>

                {/* Presupuesto Cotizado */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {order.estimatedTotal === 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      Bs. 0 (Por Cotizar)
                    </span>
                  ) : (
                    <span className="font-bold text-white font-mono">
                      {formatMoney(order.estimatedTotal)}
                    </span>
                  )}
                </td>

                {/* Saldo Pendiente */}
                <td className="py-3.5 px-4 text-right font-black font-mono whitespace-nowrap">
                  {order.remainingBalance > 0 ? (
                    <span className="text-cyan-400">
                      {formatMoney(order.remainingBalance)}
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[11px]">Pagado</span>
                  )}
                </td>

                {/* Fecha Promesa Entrega */}
                <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  {order.deliveryPromiseDate ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                      <Calendar size={11} />
                      {order.deliveryPromiseDate}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic" style={{ whiteSpace: 'nowrap' }}>No fijada</span>
                  )}
                </td>

                {/* Días en Taller */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  <div className="flex items-center justify-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                    {isOverdue ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-500/60 animate-pulse flex items-center gap-1 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                        <AlertTriangle size={11} /> {days}d
                      </span>
                    ) : (
                      <span className={`text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap ${days > 15 ? 'text-amber-400' : 'text-slate-400'}`} style={{ whiteSpace: 'nowrap' }}>
                        <Clock size={11} /> {days}d
                      </span>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  {getStatusBadge(order.status, order.statusDisplay)}
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap" style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-lg transition border border-slate-700 hover:border-cyan-500/30 cursor-pointer"
                      title="Abrir Detalle / Diagnóstico"
                    >
                      <ExternalLink size={13} />
                    </button>

                    <a
                      href={createWhatsAppLink(order.clientPhone, `Hola ${order.clientName}, te escribimos de PhoneFix Montero sobre tu ${order.device?.brand} ${order.device?.model} (Ticket #${order.ticketNumber}). Estado: ${order.statusDisplay}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition border border-emerald-500/30 cursor-pointer"
                      title="WhatsApp al Cliente"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
