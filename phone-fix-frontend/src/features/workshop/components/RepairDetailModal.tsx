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
  DollarSign,
  AlertTriangle,
  Lock,
  Wrench
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
  // Determinación de la Fase del Ciclo de Vida
  const isDiagnosticoPhase = ['RECIBIDO', 'DIAGNOSTICO', 'ESPERA_CLIENTE'].includes(order?.status);
  const isReparacionPhase = order?.status === 'EN_PROCESO';
  const isRetiroPhase = ['REPARADO_ESPERA', 'NO_REPARABLE_ESPERA', 'RECHAZADO_ESPERA'].includes(order?.status);
  const isOrderClosed = ['ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO'].includes(order?.status);

  // Tab activo contextual
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'REPUESTOS' | 'ENTREGA'>('GENERAL');
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);

  // Estados independientes de diagnóstico y cotización
  const [techNotes, setTechNotes] = useState(order?.technicianNotes || '');
  const [authorizedWork, setAuthorizedWork] = useState(order?.authorizedWork || '');
  const [techObs, setTechObs] = useState(order?.techObservations || '');
  const [deliveryPromiseDate, setDeliveryPromiseDate] = useState(order?.deliveryPromiseDate || '');
  const [quoteAmount, setQuoteAmount] = useState<number | ''>(order?.estimatedTotal || 0);
  
  // Estado de Liquidación / Entrega
  const [finalCash, setFinalCash] = useState<number | ''>(order?.remainingBalance || 0);
  const [finalQr, setFinalQr] = useState<number | ''>(0);
  const [warrantyChoice, setWarrantyChoice] = useState('3_SEMANAS');
  const [warrantyNotes] = useState('');
  
  // Estado de Devolución de seña
  const [refundCash, setRefundCash] = useState<number | ''>(order?.depositCash || 0);
  const [refundMethod, setRefundMethod] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
  const [refundReason, setRefundReason] = useState('');

  // Mutaciones
  const [updateStatusMutation] = useMutation<any>(UPDATE_REPAIR_STATUS);
  const [deliverMutation] = useMutation<any>(DELIVER_REPAIR_ORDER);
  const [refundMutation] = useMutation<any>(REFUND_REPAIR_DEPOSIT);
  const [abandonMutation] = useMutation<any>(DECLARE_REPAIR_ABANDONMENT);
  const [updateQuoteMutation, { loading: updatingQuote }] = useMutation<any>(UPDATE_REPAIR_QUOTE);
  const [generateInvoiceMutation, { loading: generatingInvoice }] = useMutation<any>(GENERATE_REPAIR_INVOICE);

  // Inicialización reactiva según orden y fase
  useEffect(() => {
    if (order) {
      setTechNotes(order.technicianNotes || '');
      setAuthorizedWork(order.authorizedWork || '');
      setTechObs(order.techObservations || '');
      setDeliveryPromiseDate(order.deliveryPromiseDate || '');
      setQuoteAmount(order.estimatedTotal || 0);
      setFinalCash(order.remainingBalance || 0);
      const totalPaidDeposit = (order.depositCash || 0) + (order.depositQr || 0);
      setRefundCash(totalPaidDeposit > 0 ? totalPaidDeposit : (order.depositCash || 0));
      if (order.depositQr > 0 && order.depositCash === 0) {
        setRefundMethod('QR');
      } else {
        setRefundMethod('EFECTIVO');
      }

      // Asignar tab predeterminado según la fase activa
      if (['REPARADO_ESPERA', 'NO_REPARABLE_ESPERA', 'RECHAZADO_ESPERA', 'ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO'].includes(order.status)) {
        setActiveTab('ENTREGA');
      } else if (order.status === 'EN_PROCESO') {
        setActiveTab('REPUESTOS');
      } else {
        setActiveTab('GENERAL');
      }
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Cálculos de Techo Presupuestario
  const agreedBudget = Number(order.estimatedTotal || 0);
  const totalPartsCost = (order.parts || []).reduce((acc: number, p: any) => acc + Number(p.cost || 0), 0);
  const grossProfit = agreedBudget - totalPartsCost;
  const isOverBudget = agreedBudget > 0 && totalPartsCost > agreedBudget;

  const handleStatusChange = async (newStatus: string) => {
    if (isOrderClosed) return;
    await updateStatusMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        status: newStatus,
        technicianNotes: techNotes,
        authorizedWork: authorizedWork,
        techObservations: techObs
      }
    });
    onRefresh?.();
  };

  const handleSaveNotes = async () => {
    if (isOrderClosed) return;
    await updateQuoteMutation({
      variables: {
        ticketNumber: order.ticketNumber,
        estimatedTotal: Number(quoteAmount || 0),
        technicianNotes: techNotes,
        authorizedWork: authorizedWork,
        techObservations: techObs,
        deliveryPromiseDate: deliveryPromiseDate || null,
        status: order.status
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
        technicianNotes: techNotes,
        authorizedWork: authorizedWork,
        techObservations: techObs,
        deliveryPromiseDate: deliveryPromiseDate || null,
        status: newStatus || order.status
      }
    });
    onRefresh?.();
    onClose(); // Cierra automáticamente al decidir estado
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
        refundMethod: refundMethod,
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
        
        {/* BANNER DE ABANDONO SI LLEVA >= 90 DÍAS */}
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
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-xl shadow-purple-600/40 transition active:scale-95 shrink-0 cursor-pointer"
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
              <Lock size={18} className="text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-xs">
                  Orden Finalizada y Cerrada ({order.statusDisplay})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Esta orden se encuentra en modo estrictamente de SOLO LECTURA para garantizar la inmutabilidad contable y auditoría.
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

        {/* Header Superior del Equipo y Cliente con Estado Contextual */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#131926] border border-[#1E293B]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30 glow-cyan-subtle shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5 flex-wrap">
                <span>Cliente: <strong className="text-white">{order.clientName}</strong></span>
                <span>•</span>
                <span>IMEI: {order.device?.imei || 'No registrado'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Estado Actual Distintivo */}
            <div className="flex items-center gap-2">
              {isDiagnosticoPhase && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {order.status === 'RECIBIDO' ? 'Recién Recibido' : order.status === 'ESPERA_CLIENTE' ? 'Espera Autorización' : 'En Diagnóstico'}
                </span>
              )}
              {isReparacionPhase && (
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  En Reparación Activa
                </span>
              )}
              {isRetiroPhase && (
                <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Listo para Retiro ({order.statusDisplay})
                </span>
              )}
              {isOrderClosed && (
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs">
                  {order.statusDisplay}
                </span>
              )}
            </div>

            {/* Transición Rápida si recién ingresó */}
            {!isOrderClosed && order.status === 'RECIBIDO' && (
              <button
                onClick={() => handleStatusChange('DIAGNOSTICO')}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Poner en diagnóstico en laboratorio"
              >
                🔬 Iniciar Diagnóstico
              </button>
            )}

            {/* WhatsApp Directo */}
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

        {/* PESTAÑAS DE NAVEGACIÓN CONTEXTUALES (FILTRADAS SEGÚN FASE) */}
        <div className="flex border-b border-[#1E293B] gap-6 text-xs font-bold">
          {/* TAB 1: DIAGNÓSTICO & COTIZACIÓN */}
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GENERAL'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {isDiagnosticoPhase ? '1. Diagnóstico & Cotización' : 'Ficha de Diagnóstico'}
          </button>

          {/* TAB 2: PIEZAS & GASTOS */}
          <button
            onClick={() => setActiveTab('REPUESTOS')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REPUESTOS'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span>2. Piezas & Gastos ({order.parts?.length || 0})</span>
            {isOverBudget && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Presupuesto excedido" />
            )}
          </button>

          {/* TAB 3: LIQUIDACIÓN & FACTURA (OCULTA EN DIAGNÓSTICO Y REPARACIÓN) */}
          {(isRetiroPhase || isOrderClosed) && (
            <button
              onClick={() => setActiveTab('ENTREGA')}
              className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ENTREGA'
                  ? 'border-[#00E5FF] text-[#00E5FF]'
                  : 'border-transparent text-[#94A3B8] hover:text-white'
              }`}
            >
              <span>3. Liquidación & Factura</span>
              {order.invoicePdfUrl && <FileText size={12} className="text-cyan-400" />}
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DIAGNÓSTICO & COTIZACIÓN */}
        {/* ======================================================== */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-4 text-xs">
            {isDiagnosticoPhase ? (
              /* MODO EDITABLE: EN DIAGNÓSTICO Y REVISIÓN */
              <div className="space-y-4">
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
                          Cotización y Compromiso de Entrega
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          {order.estimatedTotal === 0 
                            ? '⚠️ El equipo ingresó con Bs. 0 (Pendiente de Diagnóstico o Consulta a Proveedor).' 
                            : 'Fija el monto acordado y la fecha de entrega tras abrir el equipo en laboratorio.'}
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
                    {/* 1. Presupuesto Total */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Presupuesto Total Acordado (Bs.) *
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
                          className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-bold text-sm outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">Bs.</span>
                      </div>
                    </div>

                    {/* 2. Fecha Prometida */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Fecha Prometida de Entrega
                      </label>
                      <input
                        type="date"
                        disabled={isOrderClosed}
                        value={deliveryPromiseDate}
                        onChange={e => setDeliveryPromiseDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-bold text-xs outline-none"
                      />
                    </div>

                    {/* 3. Trabajo Autorizado */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Trabajo Expresamente Autorizado
                      </label>
                      <input
                        type="text"
                        disabled={isOrderClosed}
                        value={authorizedWork}
                        onChange={e => setAuthorizedWork(e.target.value)}
                        placeholder="Ej: Cambio de pantalla OLED + limpieza"
                        className="w-full px-3 py-2 bg-[#0D121F] border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Acciones de Decisión y WhatsApp */}
                  {!isOrderClosed && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                      <a
                        href={createWhatsAppLink(
                          order.clientPhone, 
                          `Hola ${order.clientName}, te escribimos de PhoneFix Montero. Ya revisamos tu equipo ${order.device?.brand} ${order.device?.model} (Ticket #${order.ticketNumber}). El presupuesto total es de Bs. ${quoteAmount || 0} por ${authorizedWork || techNotes || order.issueDescription}${deliveryPromiseDate ? ` con entrega estimada para el ${deliveryPromiseDate}` : ''}. Por favor confírmanos si autorizas realizar el trabajo.`
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
                          title="Marcar como rechazado y pasar a Listos para Retiro"
                        >
                          ❌ Presupuesto Rechazado
                        </button>

                        <button
                          type="button"
                          disabled={updatingQuote}
                          onClick={() => handleUpdateQuote('EN_PROCESO')}
                          className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          title="Cliente autorizó el presupuesto: pasa a En Reparación y cierra la ventana"
                        >
                          <Check size={14} />
                          ✅ Cliente Autorizó Trabajo
                        </button>

                        <button
                          type="button"
                          disabled={updatingQuote}
                          onClick={handleSaveNotes}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          {updatingQuote ? 'Guardando...' : '💾 Guardar Avance'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnóstico Técnico de Laboratorio */}
                <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
                  <label className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                    Diagnóstico Técnico / Hallazgos en Laboratorio
                  </label>
                  <textarea
                    rows={3}
                    disabled={isOrderClosed}
                    value={techNotes}
                    onChange={e => setTechNotes(e.target.value)}
                    placeholder="Detalla qué fallas reales encontraste al desmontar el equipo en microscopio o multímetro..."
                    className="w-full p-3 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] resize-none"
                  />
                </div>
              </div>
            ) : (
              /* MODO SOLO LECTURA: CUANDO YA ESTÁ EN REPARACIÓN, RETIRO O CERRADO */
              <div className="p-5 rounded-2xl bg-[#131926] border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-cyan-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                      Ficha de Diagnóstico & Acuerdo (Solo Lectura)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Registrado en Fase de Revisión
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#0D121F] rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Diagnóstico de Laboratorio:</span>
                    <p className="text-white text-xs whitespace-pre-wrap">{order.technicianNotes || 'Sin diagnóstico registrado'}</p>
                  </div>
                  <div className="p-3 bg-[#0D121F] rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Trabajo Autorizado por Cliente:</span>
                    <p className="text-emerald-300 font-semibold text-xs">{order.authorizedWork || 'Trabajo estándar según diagnóstico'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Presupuesto Aprobado:</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{formatMoney(order.estimatedTotal)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Promesa de Entrega:</span>
                    <span className="text-xs font-bold text-white font-mono">{order.deliveryPromiseDate || 'No fijada'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Falla Declarada y Clave / Patrón */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="p-4 rounded-xl bg-[#131926] border border-[#1E293B] space-y-2">
                <p className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                  Código o Patrón de Seguridad
                </p>
                <div className="p-3 bg-[#0D121F] rounded-lg border border-[#1E293B] font-mono text-[#00E5FF] text-sm">
                  {order.device?.passcode || 'Sin código registrado'}
                </div>
              </div>
            </div>

            {/* Observaciones Internas del Personal */}
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
                placeholder="Anotaciones privadas del personal: placa delicada, cliente conflictivo, pruebas internas..."
                className="w-full p-3 bg-[#0D121F] border border-amber-500/20 rounded-xl text-amber-100 placeholder-slate-500 text-xs outline-none focus:border-amber-400 resize-none disabled:opacity-50"
              />
              {!isOrderClosed && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    💾 Guardar Notas Internas
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PIEZAS & GASTOS IMPUTADOS (CON TECHO PRESUPUESTARIO) */}
        {/* ======================================================== */}
        {activeTab === 'REPUESTOS' && (
          <div className="space-y-4 text-xs">
            
            {/* AUDÍMETRO DE CONTROL PRESUPUESTARIO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#131926] border border-[#1E293B]">
              <div className="p-3 rounded-xl bg-[#0D121F] border border-slate-800">
                <span className="text-[#94A3B8] block text-[11px] font-semibold">Presupuesto Aprobado Cliente:</span>
                <span className="text-lg font-black text-white font-mono">{formatMoney(agreedBudget)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D121F] border border-slate-800">
                <span className="text-[#94A3B8] block text-[11px] font-semibold">Gasto en Repuestos (Caja Chica):</span>
                <span className={`text-lg font-black font-mono ${isOverBudget ? 'text-red-400' : 'text-amber-400'}`}>
                  {formatMoney(totalPartsCost)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D121F] border border-slate-800">
                <span className="text-[#94A3B8] block text-[11px] font-semibold">Margen / Ganancia Taller:</span>
                <span className={`text-lg font-black font-mono ${grossProfit < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatMoney(grossProfit)}
                </span>
              </div>
            </div>

            {/* ALERTA VISUAL DE TECHO PRESUPUESTARIO EXCEDIDO */}
            {isOverBudget && (
              <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2.5 font-bold shadow-lg shadow-red-500/10">
                <AlertTriangle size={18} className="shrink-0 text-red-400" />
                <span>
                  ⚠️ ATENCIÓN: El costo de los repuestos ({formatMoney(totalPartsCost)}) supera el presupuesto acordado con el cliente ({formatMoney(agreedBudget)}). Se requiere autorización expresa del cliente antes de incurrir en más compras de repuestos.
                </span>
              </div>
            )}

            {/* Listado de Repuestos */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Desglose de Piezas y Mano de Obra Imputadas
              </h4>
              {!isOrderClosed && (
                <button
                  type="button"
                  onClick={() => setIsAddPartOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer text-xs"
                >
                  <Plus size={14} />
                  Imputar Pieza o Gasto
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
                    <th className="p-3">Precio Cliente</th>
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

            {/* BOTÓN DE TRANSICIÓN RÁPIDA DESDE MESA DE TRABAJO */}
            {isReparacionPhase && (
              <div className="p-4 rounded-2xl bg-[#131926] border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 mt-4">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Wrench size={14} className="text-blue-400" /> Conclusión de Mesa de Trabajo
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Al terminar de reparar o comprobar falla irreparable, envía la orden a la sección de Listos para Retiro.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuote('NO_REPARABLE_ESPERA')}
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold rounded-xl transition cursor-pointer"
                  >
                    ⚠️ Sin Solución Técnica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuote('REPARADO_ESPERA')}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle size={15} />
                    ✅ Marcar Reparado (Listo para Retiro)
                  </button>
                </div>
              </div>
            )}

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
                      Documento PDF con logo oficial PhoneFix, afiliación ASOTTECMO y póliza de garantía de 3 semanas.
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
                <span className="text-[#94A3B8] block text-[11px]">Total Cotizado / Acordado:</span>
                <span className="font-extrabold text-white text-lg">{formatMoney(order.estimatedTotal)}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Seña Pagada al Ingresar:</span>
                <span className="font-extrabold text-[#10B981] text-lg">
                  {formatMoney(order.depositCash + order.depositQr)}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Saldo Pendiente de Cobro:</span>
                <span className="font-extrabold text-[#00E5FF] text-xl font-mono">
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
                    className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold rounded-xl shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-95"
                  >
                    <CheckCircle size={16} />
                    Entregar Reparado & Finalizar Orden
                  </button>
                </div>

                {/* Opción B: Devolver Sin Reparar / Devolución de Seña */}
                <div className="p-5 rounded-2xl bg-[#131926] border border-[#1E293B] space-y-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <XCircle size={18} />
                    <span>Sin Solución / Rechazado</span>
                  </div>

                  <p className="text-[#94A3B8] text-[11px]">
                    Si el equipo no tiene arreglo o el cliente rechazó la cotización, se devuelve el dispositivo sin garantía. Si dejó seña al entrar, registra el reintegro.
                  </p>

                  {/* Selector de Canal de Devolución */}
                  <div className="space-y-1.5">
                    <label className="block text-[#94A3B8] font-semibold text-xs">
                      Canal de Devolución de Seña:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRefundMethod('EFECTIVO')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          refundMethod === 'EFECTIVO'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-[#0D121F] text-slate-400 border-slate-850 hover:text-white'
                        }`}
                      >
                        💵 En Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundMethod('QR')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          refundMethod === 'QR'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                            : 'bg-[#0D121F] text-slate-400 border-slate-850 hover:text-white'
                        }`}
                      >
                        📱 Por QR / Transferencia
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[#94A3B8] font-semibold">
                      Monto a Reintegrar (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={refundCash}
                      onChange={e => setRefundCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-red-400 font-mono font-bold"
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
                      placeholder="Ej. Placa en corto sin repuesto, cliente rechazó..."
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white outline-none focus:border-red-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRefund}
                    className="w-full py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <XCircle size={16} />
                    Devolver Dispositivo & Reintegrar Seña
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
        budgetCap={agreedBudget}
        currentCost={totalPartsCost}
        onSuccess={onRefresh}
      />
    </Modal>
  );
};