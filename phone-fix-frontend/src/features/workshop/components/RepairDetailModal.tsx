import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { 
  Smartphone, 
  MessageCircle, 
  Plus, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Printer, 
  Check, 
  DollarSign 
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { AddLineItemModal } from './AddLineItemModal';
import { 
  UPDATE_REPAIR_STATUS, 
  DELIVER_REPAIR_ORDER, 
  REFUND_REPAIR_DEPOSIT, 
  DECLARE_REPAIR_ABANDONMENT,
  UPDATE_REPAIR_QUOTE,
  GENERATE_REPAIR_INVOICE
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

  // Estados de edición rápida y cotización
  const [techNotes, setTechNotes] = useState(order?.technicianNotes || '');
  const [techObs, setTechObs] = useState(order?.techObservations || '');
  const [deliveryPromiseDate, setDeliveryPromiseDate] = useState(order?.deliveryPromiseDate || '');
  const [quoteAmount, setQuoteAmount] = useState<number | ''>(order?.estimatedTotal || 0);
  const [quoteNotes, setQuoteNotes] = useState(order?.technicianNotes || '');
  
  // Estado de Liquidación / Entrega
  const [finalCash, setFinalCash] = useState<number | ''>(order?.remainingBalance || 0);
  const [finalQr, setFinalQr] = useState<number | ''>(0);
  const [warrantyChoice, setWarrantyChoice] = useState('3_SEMANAS');
  const [warrantyNotes] = useState('');
  
  // Estado de Devolución de seña
  const [refundCash, setRefundCash] = useState<number | ''>(order?.depositCash || 0);
  const [refundReason, setRefundReason] = useState('');

  // Inmutabilidad si ya fue entregada
  const isOrderClosed = ['ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO'].includes(order?.status);

  // Mutaciones
  const [updateStatusMutation] = useMutation<any>(UPDATE_REPAIR_STATUS);
  const [deliverMutation] = useMutation<any>(DELIVER_REPAIR_ORDER);
  const [refundMutation] = useMutation<any>(REFUND_REPAIR_DEPOSIT);
  const [abandonMutation] = useMutation<any>(DECLARE_REPAIR_ABANDONMENT);
  const [updateQuoteMutation, { loading: updatingQuote }] = useMutation<any>(UPDATE_REPAIR_QUOTE);
  const [generateInvoiceMutation, { loading: generatingInvoice }] = useMutation<any>(GENERATE_REPAIR_INVOICE);

  useEffect(() => {
    if (order) {
      setTechNotes(order.technicianNotes || '');
      setTechObs(order.techObservations || '');
      setDeliveryPromiseDate(order.deliveryPromiseDate || '');
      setQuoteAmount(order.estimatedTotal || 0);
      setQuoteNotes(order.technicianNotes || '');
      setFinalCash(order.remainingBalance || 0);
      setRefundCash(order.depositCash || 0);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (isOrderClosed) return;
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

  const handleSaveNotes = async () => {
    if (isOrderClosed) return;
    await updateStatusMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        status: order.status,
        technicianNotes: techNotes,
        techObservations: techObs
      }
    });
    onRefresh?.();
  };

  const handleUpdateQuote = async (newStatus?: string) => {
    if (isOrderClosed) return;
    await updateQuoteMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        estimatedTotal: Number(quoteAmount || 0),
        technicianNotes: quoteNotes,
        techObservations: techObs,
        deliveryPromiseDate: deliveryPromiseDate || null,
        status: newStatus || order.status
      }
    });
    onRefresh?.();
    onClose(); // Cierra automáticamente al aplicar cotización
  };

  const handleGenerateInvoice = async () => {
    await generateInvoiceMutation({
      variables: {
        ticketNumber: order.ticketNumber
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
    if (confirm(`¿Confirmas declarar en ABANDONO el equipo ticket #${order.ticketNumber}? Pasará a ser activo de la empresa para venta libre.`)) {
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
        
        {/* ======================================================== */}
        {/* BANNER GIGANTE REACTIVO SI LLEVA >= 90 DÍAS EN TALLER */}
        {/* ======================================================== */}
        {order.isAbandonmentEligible && !order.isAbandoned && (
          <Can permission="taller.ordenes.declarar_abandono">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-red-950/90 to-purple-950/90 border-2 border-purple-500 shadow-2xl shadow-purple-600/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                      Alerta de Abandono
                    </span>
                    <h4 className="text-sm font-black text-white">
                      Equipo con {order.daysInWorkshop || 90} Días en Taller (Excede 3 Meses)
                    </h4>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-1">
                    Superó los 90 días reglamentarios sin ser retirado. El Administrador puede absorberlo como activo para venta libre.
                  </p>
                </div>
              </div>
              <button
                onClick={handleAbandon}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-xl shadow-purple-600/40 animate-pulse transition active:scale-95 shrink-0 cursor-pointer"
              >
                Absorber como Activo
              </button>
            </div>
          </Can>
        )}

        {/* ALERTA DE INMUTABILIDAD SI LA ORDEN YA FUE ENTREGADA / CERRADA */}
        {isOrderClosed && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <h4 className="font-bold text-white text-xs">
                  Orden Finalizada y Cerrada ({order.statusDisplay})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Esta orden se encuentra en modo estrictamente de SOLO LECTURA para garantizar la inmutabilidad contable y de auditoría.
                </p>
              </div>
            </div>
            {order.invoicePdfUrl && (
              <a
                href={order.invoicePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Printer size={13} /> Ver Factura PDF
              </a>
            )}
          </div>
        )}

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
                {order.invoiceNumber && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                    {order.invoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>Cliente: <strong className="text-white">{order.clientName}</strong></span>
                <span>•</span>
                <span>IMEI: {order.device?.imei || 'No registrado'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Discreto de Abandono (Solo si NO es crítico >= 90d y no está cerrada) */}
            {!isOrderClosed && !order.isAbandonmentEligible && !order.isAbandoned && (
              <Can permission="taller.ordenes.declarar_abandono">
                <button
                  onClick={handleAbandon}
                  className="px-2.5 py-1.5 border border-slate-700/80 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 text-[10px] font-semibold rounded-xl transition cursor-pointer"
                  title="Declarar abandono anticipado"
                >
                  Abandono
                </button>
              </Can>
            )}

            <select
              disabled={isOrderClosed}
              value={order.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-3 py-2 bg-[#0D121F] border border-[#00E5FF]/40 rounded-xl text-xs font-bold text-[#00E5FF] outline-none glow-cyan-subtle cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
            Diagnóstico & Cotización
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
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ENTREGA'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            Liquidación & Factura {order.invoicePdfUrl && <FileText size={12} className="text-cyan-400" />}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DIAGNÓSTICO Y COTIZACIÓN DIFERIDA */}
        {/* ======================================================== */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-4 text-xs">

            {/* PANEL DE COTIZACIÓN DINÁMICA (PERMITE FIJAR O CAMBIAR PRECIO Y FECHA ENTREGA) */}
            <div className={`p-4 rounded-xl border transition-all ${
              order.estimatedTotal === 0 || order.status === 'DIAGNOSTICO' || order.status === 'ESPERA_CLIENTE'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-[#131926] border-cyan-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${
                    order.estimatedTotal === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    <DollarSign size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                      Gestión de Presupuesto y Fecha de Entrega
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {order.estimatedTotal === 0 
                        ? '⚠️ El equipo ingresó con Bs. 0 (Pendiente de Diagnóstico o Consulta a Proveedor).' 
                        : 'Actualiza el monto cotizado y la fecha de entrega prometida tras abrir el equipo.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Presupuesto Registrado:</span>
                  <span className="text-base font-black text-[#00E5FF]">
                    {formatMoney(order.estimatedTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                {/* 1. Presupuesto */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Presupuesto Cotizado Real (Bs.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={isOrderClosed}
                      min="0"
                      step="0.5"
                      value={quoteAmount}
                      onChange={e => setQuoteAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-bold text-sm outline-none disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">Bs.</span>
                  </div>
                </div>

                {/* 2. Fecha Prometida de Entrega */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fecha Prometida de Entrega
                  </label>
                  <input
                    type="date"
                    disabled={isOrderClosed}
                    value={deliveryPromiseDate}
                    onChange={e => setDeliveryPromiseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-bold text-xs outline-none disabled:opacity-50"
                  />
                </div>

                {/* 3. Trabajo Cotizado */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Trabajo Autorizado por Cliente
                  </label>
                  <input
                    type="text"
                    disabled={isOrderClosed}
                    value={quoteNotes}
                    onChange={e => setQuoteNotes(e.target.value)}
                    placeholder="Ej: Cambio de pantalla OLED + limpieza"
                    className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-xs outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Botones de Decisión y WhatsApp */}
              {!isOrderClosed && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <a
                    href={createWhatsAppLink(
                      order.clientPhone, 
                      `Hola ${order.clientName}, te escribimos de PhoneFix Montero. Ya revisamos tu equipo ${order.device?.brand} ${order.device?.model} (Ticket #${order.ticketNumber}). El presupuesto de reparación es de Bs. ${quoteAmount || 0} por ${quoteNotes || order.issueDescription}${deliveryPromiseDate ? ` con entrega estimada para el ${deliveryPromiseDate}` : ''}. Por favor indícanos si autorizas realizar el trabajo.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    Enviar Cotización por WhatsApp
                  </a>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={updatingQuote}
                      onClick={() => handleUpdateQuote('RECHAZADO_ESPERA')}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-xs transition cursor-pointer"
                      title="Marcar como rechazado y cerrar"
                    >
                      ❌ Rechazó Presupuesto
                    </button>

                    <button
                      type="button"
                      disabled={updatingQuote}
                      onClick={() => handleUpdateQuote('EN_PROCESO')}
                      className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      title="Actualizar monto y pasar a En Reparación (Cierra ventana)"
                    >
                      <Check size={14} />
                      ✅ Cliente Autorizó Trabajo
                    </button>

                    <button
                      type="button"
                      disabled={updatingQuote}
                      onClick={() => handleUpdateQuote()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {updatingQuote ? 'Guardando...' : '💾 Guardar Cotización'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Falla declarada */}
              <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
                <p className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                  Falla Declarada en Recepción
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
                Diagnóstico Técnico / Defectos Detectados en Laboratorio
              </label>
              <textarea
                rows={3}
                disabled={isOrderClosed}
                value={techNotes}
                onChange={e => setTechNotes(e.target.value)}
                placeholder="Detalle de fallas encontradas al desmontar el equipo, componentes dañados, sugerencias..."
                className="w-full p-3 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] resize-none disabled:opacity-50"
              />
            </div>

            {/* ESPACIO EXCLUSIVO DE OBSERVACIONES INTERNAS PARA EL PERSONAL */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2">
                  <span>🔒 Observaciones Internas del Personal</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Estrictamente Privado • No sale en Comprobante / Factura
                  </span>
                </label>
              </div>
              <textarea
                rows={2}
                disabled={isOrderClosed}
                value={techObs}
                onChange={e => setTechObs(e.target.value)}
                placeholder="Anotaciones privadas del personal: placa delicada, cliente conflictivo, pruebas internas, etc..."
                className="w-full p-3 bg-[#0D121F] border border-amber-500/20 rounded-xl text-amber-100 placeholder-slate-500 text-xs outline-none focus:border-amber-400 resize-none disabled:opacity-50"
              />
              {!isOrderClosed && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    💾 Guardar Notas & Observaciones
                  </button>
                </div>
              )}
            </div>

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
              {!isOrderClosed && (
                <button
                  type="button"
                  onClick={() => setIsAddPartOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer text-xs"
                >
                  <Plus size={14} />
                  Agregar Pieza o Gasto
                </button>
              )}
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
                <tbody className="divide-y divide-[#1E293B]">
                  {order.parts?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#64748B]">
                        No hay piezas ni gastos registrados para este equipo.
                      </td>
                    </tr>
                  ) : (
                    order.parts?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#131926]/50">
                        <td className="p-3 font-semibold text-white">{p.name}</td>
                        <td className="p-3 text-[#94A3B8]">
                          {p.sourceType === 'INTERNAL' ? 'Almacén PhoneFix' : `Caseta (${p.supplierName || 'Externa'})`}
                        </td>
                        <td className="p-3 font-mono text-red-400">{formatMoney(p.cost)}</td>
                        <td className="p-3 font-mono font-bold text-[#00E5FF]">{formatMoney(p.price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen Financiero del Servicio */}
            <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] flex flex-wrap justify-between gap-4 text-xs">
              <div>
                <span className="text-[#94A3B8] block">Total Cotizado / Acordado:</span>
                <span className="font-extrabold text-white text-base">{formatMoney(order.estimatedTotal)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Salida de Caja Chica (Costo Repuestos):</span>
                <span className="font-extrabold text-red-400 text-base">{formatMoney(order.costCashOut)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Ganancia Neta Estimada:</span>
                <span className="font-extrabold text-[#10B981] text-base">{formatMoney(order.profit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LIQUIDACIÓN, RETIRO Y FACTURACIÓN MINIO */}
        {/* ======================================================== */}
        {activeTab === 'ENTREGA' && (
          <div className="space-y-6 text-xs">

            {/* SECCIÓN FACTURA / COMPROBANTE DIGITAL EN MINIO */}
            <div className="p-5 rounded-2xl bg-[#131926] border border-cyan-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Comprobante de Servicio y Garantía (MinIO S3)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Documento PDF con logo oficial PhoneFix, afiliación ASOTTECMO, desglose financiero bicanal y póliza de garantía de 3 semanas.
                    </p>
                  </div>
                </div>

                {order.invoiceNumber && (
                  <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold self-start sm:self-auto">
                    {order.invoiceNumber}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {order.invoicePdfUrl && (
                  <a
                    href={order.invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-extrabold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/10 cursor-pointer"
                  >
                    <Printer size={15} />
                    Ver / Imprimir Comprobante PDF
                  </a>
                )}

                <button
                  type="button"
                  disabled={generatingInvoice}
                  onClick={handleGenerateInvoice}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <FileText size={15} />
                  {generatingInvoice
                    ? 'Generando PDF en MinIO...'
                    : order.invoicePdfUrl
                    ? 'Regenerar Comprobante PDF'
                    : 'Generar Comprobante PDF'}
                </button>
              </div>
            </div>

            {/* Cuadro de Saldos */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1E293B] flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Total Cotizado:</span>
                <span className="font-extrabold text-white text-lg">{formatMoney(order.estimatedTotal)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Seña Ya Cobrada:</span>
                <span className="font-extrabold text-[#10B981] text-lg">
                  {formatMoney(order.depositCash + order.depositQr)}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Saldo Pendiente de Cobro:</span>
                <span className="font-extrabold text-[#00E5FF] text-xl">
                  {formatMoney(order.remainingBalance)}
                </span>
              </div>
            </div>

            {!isOrderClosed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Opción A: Entregar Reparado */}
                <div className="p-5 rounded-2xl bg-[#131926] border border-[#1E293B] space-y-4">
                  <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
                    <CheckCircle size={18} />
                    <span>Cobro de Saldo & Entrega Conforme</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[#94A3B8] font-semibold">
                        Saldo Efectivo (Bs.)
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
                    <div className="space-y-1.5">
                      <label className="block text-[#94A3B8] font-semibold">
                        Saldo QR / Banco (Bs.)
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

                  {/* Selección de Garantía */}
                  <div className="space-y-1.5">
                    <label className="block text-[#94A3B8] font-semibold">
                      Póliza de Garantía Otorgada
                    </label>
                    <select
                      value={warrantyChoice}
                      onChange={e => setWarrantyChoice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                    >
                      <option value="3_SEMANAS">3 Semanas (Estándar de Taller)</option>
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
            ) : (
              <div className="p-8 rounded-2xl bg-[#0D121F] border border-slate-800 text-center space-y-2">
                <CheckCircle size={36} className="text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-white text-base">Equipo Entregado y Liquidado</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Este equipo ya concluyó su ciclo de taller. Si necesitas una copia del comprobante o historial de garantía, utiliza el botón de impresión superior.
                </p>
              </div>
            )}
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