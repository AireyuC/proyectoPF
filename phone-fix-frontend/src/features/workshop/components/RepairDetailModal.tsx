import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { 
  Smartphone, 
  MessageCircle, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { AddLineItemModal } from './AddLineItemModal';
import { 
  UPDATE_REPAIR_STATUS, 
  DELIVER_REPAIR_ORDER, 
  REFUND_REPAIR_DEPOSIT, 
  DECLARE_REPAIR_ABANDONMENT 
} from '../../../api/graphql';
import { formatMoney, createWhatsAppLink } from '../../../utils/format';
import { Can } from '../../../components/auth/Can';

interface RepairDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  onRefresh?: () => void;
}

export const RepairDetailModal: React.FC<RepairDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'REPUESTOS' | 'ENTREGA'>('GENERAL');
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);

  // Estados de edición rápida
  const [techNotes, setTechNotes] = useState(order?.technicianNotes || '');
  const [techObs] = useState(order?.techObservations || '');
  
  // Estado de Liquidación / Entrega
  const [finalCash, setFinalCash] = useState<number | ''>(order?.remainingBalance || 0);
  const [finalQr, setFinalQr] = useState<number | ''>(0);
  const [warrantyChoice, setWarrantyChoice] = useState('3_SEMANAS');
  const [warrantyNotes] = useState('');
  
  // Estado de Devolución de seña
  const [refundCash, setRefundCash] = useState<number | ''>(order?.depositCash || 0);
  const [refundReason, setRefundReason] = useState('');

  // Mutaciones
  const [updateStatusMutation] = useMutation<any>(UPDATE_REPAIR_STATUS);
  const [deliverMutation] = useMutation<any>(DELIVER_REPAIR_ORDER);
  const [refundMutation] = useMutation<any>(REFUND_REPAIR_DEPOSIT);
  const [abandonMutation] = useMutation<any>(DECLARE_REPAIR_ABANDONMENT);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: string) => {
    await updateStatusMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        status: newStatus,
        technicianNotes: techNotes,
        techObservations: techObs
      }
    });
    onRefresh?.();
  };

  const handleDeliver = async (isFixed: boolean) => {
    await deliverMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        finalPaymentCash: Number(finalCash || 0),
        finalPaymentQr: Number(finalQr || 0),
        isFixed,
        warranty: isFixed ? warrantyChoice : 'SIN_GARANTIA',
        warrantyCustomNotes: warrantyNotes
      }
    });
    onRefresh?.();
    onClose();
  };

  const handleRefund = async () => {
    await refundMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        refundCash: Number(refundCash || 0),
        reason: refundReason
      }
    });
    onRefresh?.();
    onClose();
  };

  const handleAbandon = async () => {
    if (confirm(`¿Confirmas declarar en ABANDONO el equipo ticket #${order.ticketNumber}? Pasará a ser activo de la empresa.`)) {
      await abandonMutation({
        variables: {
          ticketNumber: order.ticketNumber,
          salePrice: order.estimatedTotal
        }
      });
      onRefresh?.();
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Orden #${order.ticketNumber} • ${order.device?.brand} ${order.device?.model}`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-6">
        
        {/* Header Superior del Equipo y Cliente */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#131926] border border-[#1E293B]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30 glow-cyan-subtle">
              <Smartphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  {order.device?.brand} {order.device?.model}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1E293B] text-[#94A3B8]">
                  {order.device?.color || 'Sin color'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>Cliente: <strong className="text-white">{order.clientName}</strong></span>
                <span>•</span>
                <span>IMEI: {order.device?.imei || 'No registrado'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={order.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-3 py-2 bg-[#0D121F] border border-[#00E5FF]/40 rounded-xl text-xs font-bold text-[#00E5FF] outline-none glow-cyan-subtle cursor-pointer"
            >
              <option value="RECIBIDO">Recibido en Recepción</option>
              <option value="DIAGNOSTICO">En Diagnóstico</option>
              <option value="ESPERA_CLIENTE">Esperando Autorización Cliente</option>
              <option value="EN_PROCESO">En Reparación</option>
              <option value="REPARADO_ESPERA">Reparado (En Espera de Retiro)</option>
              <option value="NO_REPARABLE_ESPERA">Sin Solución (Espera Retiro)</option>
              <option value="RECHAZADO_ESPERA">Presupuesto Rechazado (Espera Retiro)</option>
              <option value="ENTREGADO_REPARADO">Entregado al Cliente (Reparado)</option>
              <option value="ENTREGADO_SIN_REPARAR">Devuelto al Cliente (Sin Reparar)</option>
              <option value="DECLARADO_ABANDONO">Declarado Abandono (&gt;3 Meses)</option>
            </select>

            <a
              href={createWhatsAppLink(order.clientPhone, `Hola ${order.clientName}, te escribimos de PhoneFix sobre tu ${order.device?.brand} ${order.device?.model} (Ticket #${order.ticketNumber}). Estado: ${order.statusDisplay}.`)}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/30 rounded-xl transition-colors cursor-pointer"
              title="Contactar al WhatsApp del Cliente"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex border-b border-[#1E293B] gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            Diagnóstico & Falla
          </button>
          <button
            onClick={() => setActiveTab('REPUESTOS')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REPUESTOS'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            Piezas & Gastos ({order.parts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ENTREGA')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ENTREGA'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            Liquidación & Retiro
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DIAGNÓSTICO Y CONDICIONES */}
        {/* ======================================================== */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Falla declarada */}
              <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
                <p className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                  Falla Declarada por Cliente
                </p>
                <p className="text-white text-sm">
                  {order.issueDescription}
                </p>
                <div className="pt-2 border-t border-[#1E293B] flex flex-wrap gap-1.5">
                  {order.device?.physicalCondition?.map((cond: string) => (
                    <span key={cond} className="px-2 py-0.5 rounded-md bg-[#1E293B] text-[#00E5FF] text-[10px]">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>

              {/* Clave de desbloqueo / Patrón */}
              <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
                <p className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                  Código o Patrón de Seguridad
                </p>
                <div className="p-3 bg-[#0D121F] rounded-lg border border-[#1E293B] font-mono text-[#00E5FF] text-sm">
                  {order.device?.passcode || 'Sin código registrado'}
                </div>
              </div>

            </div>

            {/* Diagnóstico técnico */}
            <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
              <label className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                Notas Técnicas / Trabajo a Realizar
              </label>
              <textarea
                rows={3}
                value={techNotes}
                onChange={e => setTechNotes(e.target.value)}
                placeholder="Observaciones de laboratorio, transplante de IC, microscopio..."
                className="w-full p-3 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.status)}
                  className="px-4 py-2 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Guardar Diagnóstico
                </button>
              </div>
            </div>

            {/* Alerta de Abandono si lleva más de 3 meses */}
            <Can permission="taller.ordenes.declarar_abandono">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-purple-400 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-purple-300">Gestión de Abandono (&gt; 90 Días)</p>
                    <p className="text-[11px] text-purple-400">
                      Si el equipo no es reclamado por más de 3 meses, el Administrador puede absorberlo como activo para venta.
                    </p>
                  </div>
                </div>
                {!order.isAbandoned && (
                  <button
                    onClick={handleAbandon}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Declarar Abandono
                  </button>
                )}
              </div>
            </Can>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REPUESTOS Y GASTOS IMPUTADOS */}
        {/* ======================================================== */}
        {activeTab === 'REPUESTOS' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Desglose de Piezas y Mano de Obra Imputadas
              </h4>
              <button
                type="button"
                onClick={() => setIsAddPartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer text-xs"
              >
                <Plus size={14} />
                Agregar Pieza o Gasto
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#1E293B]">
              <table className="w-full text-left">
                <thead className="bg-[#131926] text-[#94A3B8] border-b border-[#1E293B] text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Pieza / Servicio</th>
                    <th className="p-3">Origen</th>
                    <th className="p-3">Costo (Caja Chica)</th>
                    <th className="p-3">Cobrado a Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs">
                  {order.parts?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#131926]/50">
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.sourceType === 'INTERNAL' ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}>
                          {p.sourceType === 'INTERNAL' ? 'Almacén PhoneFix' : `Caseta (${p.supplierName || 'Calle'})`}
                        </span>
                      </td>
                      <td className="p-3 text-[#94A3B8]">{formatMoney(p.cost)}</td>
                      <td className="p-3 font-bold text-[#00E5FF]">{formatMoney(p.price)}</td>
                    </tr>
                  ))}
                  {(!order.parts || order.parts.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-[#64748B]">
                        No hay piezas imputadas aún. Haz clic en "Agregar Pieza o Gasto".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen Financiero de la Orden */}
            <div className="p-4 bg-[#131926] border border-[#1E293B] rounded-2xl flex flex-wrap gap-6 justify-between items-center">
              <div>
                <p className="text-[#94A3B8] text-[10px]">Costo Salida Caja Chica</p>
                <p className="font-extrabold text-white text-base">{formatMoney(order.costCashOut)}</p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-[10px]">Total Cotizado a Cliente</p>
                <p className="font-extrabold text-[#00E5FF] text-base">{formatMoney(order.estimatedTotal)}</p>
              </div>
              <div>
                <p className="text-[#94A3B8] text-[10px]">Ganancia Estimada</p>
                <p className="font-extrabold text-[#10B981] text-base">{formatMoney(order.profit)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LIQUIDACIÓN, COBRO FINAL Y GARANTÍA */}
        {/* ======================================================== */}
        {activeTab === 'ENTREGA' && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Opción A: Entrega Exitosa Reparada */}
              <div className="p-5 rounded-2xl bg-[#131926] border border-[#1E293B] space-y-4">
                <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
                  <CheckCircle size={18} />
                  <span>Equipo Reparado con Éxito</span>
                </div>

                <div className="p-3 bg-[#0D121F] rounded-xl space-y-2 border border-[#1E293B]">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Total Cotizado:</span>
                    <span className="text-white font-bold">{formatMoney(order.estimatedTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Seña Recibida (Efectivo/QR):</span>
                    <span className="text-[#10B981] font-bold">{formatMoney(order.totalCollected)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#1E293B] text-sm">
                    <span className="text-[#94A3B8] font-bold">Saldo Pendiente:</span>
                    <span className="text-[#00E5FF] font-extrabold">{formatMoney(order.remainingBalance)}</span>
                  </div>
                </div>

                {/* Cobro Bicanal del Saldo Final */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">
                      Cobro Efectivo (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={finalCash}
                      onChange={e => setFinalCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">
                      Cobro QR (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={finalQr}
                      onChange={e => setFinalQr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Período de Garantía (Por defecto: 3 Semanas) */}
                <div className="space-y-1.5">
                  <label className="block text-[#94A3B8] font-semibold">
                    Garantía Otorgada (Corre desde hoy)
                  </label>
                  <select
                    value={warrantyChoice}
                    onChange={e => setWarrantyChoice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0D121F] border border-[#00E5FF]/30 rounded-xl text-white outline-none"
                  >
                    <option value="3_SEMANAS">3 Semanas (Estándar PhoneFix)</option>
                    <option value="2_SEMANAS">2 Semanas</option>
                    <option value="1_MES">1 Mes</option>
                    <option value="3_MESES">3 Meses (Pantallas OLED / Calidad Original)</option>
                    <option value="SIN_GARANTIA">Sin Garantía</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeliver(true)}
                  className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold rounded-xl shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110"
                >
                  <CheckCircle size={16} />
                  Entregar Reparado & Finalizar Ticket
                </button>
              </div>

              {/* Opción B: Devolver Sin Reparar / Devolución de Seña */}
              <div className="p-5 rounded-2xl bg-[#131926] border border-[#1E293B] space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <XCircle size={18} />
                  <span>Sin Solución / Rechazado</span>
                </div>

                <p className="text-[#94A3B8] text-[11px]">
                  Si el equipo no tiene arreglo o el cliente rechazó la cotización, se devuelve el dispositivo sin garantía. Si dejó seña, se registra la devolución correspondiente.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[#94A3B8] font-semibold">
                    Devolución de Seña en Efectivo (Bs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={refundCash}
                    onChange={e => setRefundCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-red-400"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#94A3B8] font-semibold">
                    Motivo de la Devolución
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    placeholder="Ej. Placa en corto, repuesto no disponible..."
                    className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-red-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRefund}
                  className="w-full py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <XCircle size={16} />
                  Devolver Sin Reparar & Devolver Seña
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Modal Hijo: Agregar Repuesto */}
      <AddLineItemModal
        isOpen={isAddPartOpen}
        onClose={() => setIsAddPartOpen(false)}
        ticketNumber={order.ticketNumber}
        onSuccess={onRefresh}
      />
    </Modal>
  );
};