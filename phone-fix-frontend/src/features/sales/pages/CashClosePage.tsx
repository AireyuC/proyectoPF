import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  Wallet, 
  DollarSign, 
  QrCode, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  History
} from 'lucide-react';
import { GET_DRAWER_SUMMARY, CREATE_CASH_CLOSE, GET_CASH_CLOSES } from '../../../api/graphql';
import { formatMoney } from '../../../utils/format';

export const CashClosePage: React.FC = () => {
  const [initialCash, setInitialCash] = useState<number | ''>(200);
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [expensesCash, setExpensesCash] = useState<number | ''>(0);
  const [closeSuccess, setCloseSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // GraphQL
  const { data: drawerData, loading: loadingDrawer, refetch: refetchDrawer } = useQuery<any>(GET_DRAWER_SUMMARY, {
    variables: { initialCash: Number(initialCash || 0) },
    fetchPolicy: 'network-only'
  });

  const { data: historyData, refetch: refetchHistory } = useQuery<any>(GET_CASH_CLOSES, {
    variables: { limit: 10 }
  });

  const [createCloseMutation, { loading: savingClose }] = useMutation<any>(CREATE_CASH_CLOSE);

  const summary = drawerData?.activeDrawerSummary;

  const expectedCash = summary ? summary.expectedDrawerCash : 0;
  const expectedQr = summary ? summary.expectedBankQr : 0;
  const counted = Number(actualCash || 0);
  const difference = actualCash !== '' ? counted - expectedCash : 0;

  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (actualCash === '') {
      setErrorMsg('Ingresa el monto de efectivo físico contado en caja.');
      return;
    }

    try {
      const res = await createCloseMutation({
        variables: {
          input: {
            initialCash: Number(initialCash || 0),
            actualCash: Number(actualCash),
            expensesCash: Number(expensesCash || 0)
          }
        }
      });
      setCloseSuccess(res.data.createCashClose);
      setActualCash('');
      refetchDrawer();
      refetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar el cierre de caja.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Arqueo & Cierre de Caja Diario
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Conciliación de dinero físico en gaveta versus extracto bancario QR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchDrawer()}
            className="p-2 bg-[#131926] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl border border-[#1E293B] transition-all cursor-pointer"
            title="Recalcular arqueo"
          >
            <RefreshCw size={16} className={loadingDrawer ? 'animate-spin' : ''} />
          </button>
          <span className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 rounded-xl text-xs font-bold">
            {summary?.date || new Date().toISOString().split('T')[0]}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid de Métricas del Arqueo en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Efectivo Esperado */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Efectivo en Mano</span>
            <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {formatMoney(expectedCash)}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Base inicial + Ventas + Cobros taller
          </p>
        </div>

        {/* QR Bancario Esperado */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total en Banco (QR)</span>
            <div className="p-1.5 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF]">
              <QrCode size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#00E5FF]">
            {formatMoney(expectedQr)}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Verificar contra extracto bancario
          </p>
        </div>

        {/* Ventas Mostrador Hoy */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ventas Mostrador (Hoy)</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {formatMoney((summary?.todaySalesCash || 0) + (summary?.todaySalesQr || 0))}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Ef: {formatMoney(summary?.todaySalesCash || 0)} • QR: {formatMoney(summary?.todaySalesQr || 0)}
          </p>
        </div>

        {/* Cobros de Taller Hoy */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Cobros Taller (Hoy)</span>
            <div className="p-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {formatMoney((summary?.todayRepairsCash || 0) + (summary?.todayRepairsQr || 0))}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Señas + Retiros del día
          </p>
        </div>

      </div>

      {/* Formulario de Cierre Diario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <form onSubmit={handleSubmitClose} className="lg:col-span-2 bg-[#0D121F] border border-[#1E293B] rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
            <span className="w-2 h-5 bg-[#00E5FF] rounded-full" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Formulario de Arqueo Físico
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Base Inicial de Caja (Bs.)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={initialCash}
                onChange={e => setInitialCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                placeholder="200.00"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Salidas Menores / Gastos (Bs.)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={expensesCash}
                onChange={e => setExpensesCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Efectivo Contado en Mano (Bs.) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={actualCash}
                onChange={e => setActualCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#00E5FF]/40 rounded-xl text-[#00E5FF] font-extrabold text-sm outline-none glow-cyan-subtle"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Resultado del Cuadre */}
          {actualCash !== '' && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              Math.abs(difference) < 0.01
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : difference > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div>
                <span className="font-bold">
                  {Math.abs(difference) < 0.01 
                    ? '¡Caja Cuadrada Perfectamente!' 
                    : difference > 0 
                    ? 'Sobrante en Gaveta:' 
                    : 'Faltante en Gaveta:'}
                </span>
                <p className="text-[11px] opacity-80">
                  Esperado: {formatMoney(expectedCash)} • Contado: {formatMoney(counted)}
                </p>
              </div>
              <span className="text-lg font-extrabold font-mono">
                {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={savingClose}
            className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs disabled:opacity-50"
          >
            {savingClose ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Guardar Cierre de Caja Diario
          </button>
        </form>

        {/* Historial de Cierres Recientes */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
            <History size={16} className="text-[#00E5FF]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Últimos Cierres Registrados
            </h4>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 text-xs">
            {historyData?.cashCloses?.map((c: any) => (
              <div key={c.id} className="p-3 bg-[#131926] border border-[#1E293B] rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{c.date}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    c.difference >= 0 ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-red-500/15 text-red-400'
                  }`}>
                    Dif: {formatMoney(c.difference)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#94A3B8]">
                  <span>Físico: {formatMoney(c.actualCash)}</span>
                  <span>QR: {formatMoney(c.expectedQrTotal)}</span>
                </div>
                <p className="text-[10px] text-[#64748B]">Por: {c.closedByName}</p>
              </div>
            ))}
            {(!historyData?.cashCloses || historyData.cashCloses.length === 0) && (
              <p className="text-center text-xs text-[#64748B] py-8">
                No hay cierres registrados aún.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Modal Éxito Cierre */}
      {closeSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-[#00E5FF]/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 glow-cyan shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white">¡Cierre Guardado!</h3>
            <p className="text-xs text-[#94A3B8]">
              Diferencia registrada: <strong className="text-[#00E5FF]">{formatMoney(closeSuccess.difference)}</strong>
            </p>
            <button
              onClick={() => setCloseSuccess(null)}
              className="w-full py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
