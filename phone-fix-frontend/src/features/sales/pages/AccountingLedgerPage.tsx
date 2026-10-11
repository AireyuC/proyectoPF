import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { 
  BookOpen, 
  Download, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  QrCode, 
  TrendingUp, 
  RefreshCw,
  Lock,
  Search
} from 'lucide-react';
import { GET_ACCOUNTING_LEDGER } from '../../../api/graphql';
import { formatMoney } from '../../../utils/format';

export const AccountingLedgerPage: React.FC = () => {
  // Rango de fechas por defecto: Últimos 30 días
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data, loading, refetch } = useQuery<any>(GET_ACCOUNTING_LEDGER, {
    variables: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    fetchPolicy: 'network-only'
  });

  const ledger = data?.accountingLedger;
  const summary = ledger?.summary || {
    totalCashIn: 0,
    totalQrIn: 0,
    totalCashOut: 0,
    totalRevenue: 0,
    netProfit: 0,
    totalEntriesCount: 0
  };
  const entries: any[] = ledger?.entries || [];

  // Filtrado local en tabla
  const filteredEntries = entries.filter((e: any) => {
    if (typeFilter !== 'ALL' && e.entryType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchConcept = e.concept?.toLowerCase().includes(q);
      const matchRef = e.referenceCode?.toLowerCase().includes(q);
      const matchUser = e.userOrTech?.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      if (!matchConcept && !matchRef && !matchUser && !matchNotes) return false;
    }
    return true;
  });

  // Exportar a CSV compatible con Microsoft Excel (UTF-8 con BOM)
  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert('No hay registros en el rango seleccionado para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Fecha y Hora',
      'Tipo de Operación',
      'Concepto',
      'Referencia / Ticket',
      'Ingreso Efectivo (Bs.)',
      'Ingreso QR (Bs.)',
      'Egreso Caja Chica (Bs.)',
      'Monto Neto (Bs.)',
      'Responsable / Origen',
      'Notas / Auditoría'
    ];

    const rows = entries.map((e: any) => {
      const typeLabel = 
        e.entryType === 'VENTA_MOSTRADOR' ? 'Venta Mostrador POS' :
        e.entryType === 'SEÑA_TALLER' ? 'Seña Inicial Taller' :
        e.entryType === 'ENTREGA_TALLER' ? 'Liquidación Entrega Taller' :
        e.entryType === 'COMPRA_REPUESTO_CASETA' ? 'Compra Repuesto Caseta Externa' :
        e.entryType === 'DEVOLUCION_SEÑA' ? 'Devolución de Seña' : e.entryType;

      return [
        `"${e.id}"`,
        `"${new Date(e.timestamp).toLocaleString('es-BO')}"`,
        `"${typeLabel}"`,
        `"${(e.concept || '').replace(/"/g, '""')}"`,
        `"${e.referenceCode || ''}"`,
        e.cashIn.toFixed(2),
        e.qrIn.toFixed(2),
        e.cashOut.toFixed(2),
        e.netAmount.toFixed(2),
        `"${(e.userOrTech || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    // Encabezado resumen
    const summaryHeader = [
      `"REPORTE DE LIBRO CONTABLE GENERAL - PHONEFIX MONTERO"`,
      `"Rango: ${startDate} al ${endDate}"`,
      `"Generado: ${new Date().toLocaleString('es-BO')}"`,
      `"Ingreso Efectivo Total (Bs.): ${summary.totalCashIn.toFixed(2)}"`,
      `"Ingreso QR Total (Bs.): ${summary.totalQrIn.toFixed(2)}"`,
      `"Ingresos Totales (Bs.): ${summary.totalRevenue.toFixed(2)}"`,
      `"Egresos Totales (Bs.): ${summary.totalCashOut.toFixed(2)}"`,
      `"Rendimiento Neto (Bs.): ${summary.netProfit.toFixed(2)}"`,
      ''
    ].join('\n');

    const csvContent = '\uFEFF' + summaryHeader + '\n' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Libro_Contable_PhoneFix_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEntryTypeBadge = (type: string) => {
    switch (type) {
      case 'VENTA_MOSTRADOR':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-fit">
            <DollarSign size={10} /> Venta POS
          </span>
        );
      case 'SEÑA_TALLER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <ArrowDownLeft size={10} /> Seña Taller
          </span>
        );
      case 'ENTREGA_TALLER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <ArrowDownLeft size={10} /> Liquidación Taller
          </span>
        );
      case 'COMPRA_REPUESTO_CASETA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
            <ArrowUpRight size={10} /> Compra Caseta
          </span>
        );
      case 'DEVOLUCION_SEÑA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
            <ArrowUpRight size={10} /> Devolución Seña
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-cyan-400" size={26} />
            <span>Libro Contable General</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Lock size={10} /> Inmutable (Solo Admin)
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Auditoría consolidada de ingresos y egresos (Mostrador POS, señas, liquidaciones y compras a casetas)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            title="Exportar archivo CSV con formato para Microsoft Excel"
          >
            <Download size={15} />
            <span>Exportar CSV para Excel</span>
          </button>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-[#131926] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-xl border border-[#1E293B] transition cursor-pointer"
            title="Refrescar datos contables"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros de Fecha y Presets */}
      <div className="p-4 rounded-2xl bg-[#0D121F] border border-[#1E293B] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Selector de Rango de Fechas */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Calendar size={15} className="text-cyan-400" />
            <span>Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-[#131926] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-mono text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <span>Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-[#131926] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-mono text-xs outline-none"
            />
          </div>

          {/* Presets rápidos */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                setStartDate(firstDay);
                setEndDate(todayStr);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Este Mes
            </button>
            <button
              onClick={() => { setStartDate(thirtyDaysAgoStr); setEndDate(todayStr); }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              30 Días
            </button>
          </div>
        </div>

        {/* Buscador y Filtro por Tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto o ticket..."
              className="pl-8 pr-3 py-1.5 bg-[#131926] border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-xs outline-none w-48"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#131926] border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-xs outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Movimientos</option>
            <option value="VENTA_MOSTRADOR">Ventas de Mostrador</option>
            <option value="SEÑA_TALLER">Señas de Taller</option>
            <option value="ENTREGA_TALLER">Liquidaciones de Taller</option>
            <option value="COMPRA_REPUESTO_CASETA">Compras a Casetas</option>
            <option value="DEVOLUCION_SEÑA">Devoluciones de Señas</option>
          </select>
        </div>

      </div>

      {/* KPI Cards Financieras */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Ingresos */}
        <div className="p-4 rounded-2xl bg-[#0D121F] border border-cyan-500/30 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>Ingresos Totales</span>
            <DollarSign size={15} className="text-cyan-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {formatMoney(summary.totalRevenue)}
          </p>
          <span className="text-[10px] text-cyan-400/80">Efectivo + QR</span>
        </div>

        {/* Ingresos en Efectivo */}
        <div className="p-4 rounded-2xl bg-[#0D121F] border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>Efectivo Ingresado</span>
            <ArrowDownLeft size={15} className="text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {formatMoney(summary.totalCashIn)}
          </p>
          <span className="text-[10px] text-slate-400">En gaveta de caja</span>
        </div>

        {/* Ingresos QR */}
        <div className="p-4 rounded-2xl bg-[#0D121F] border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>QR / Bancos</span>
            <QrCode size={15} className="text-blue-400" />
          </div>
          <p className="text-xl font-black text-blue-400 font-mono">
            {formatMoney(summary.totalQrIn)}
          </p>
          <span className="text-[10px] text-slate-400">Banco Unión / BCP / BNB</span>
        </div>

        {/* Egresos / Compras Caseta */}
        <div className="p-4 rounded-2xl bg-[#0D121F] border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>Salidas Caja Chica</span>
            <ArrowUpRight size={15} className="text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 font-mono">
            {formatMoney(summary.totalCashOut)}
          </p>
          <span className="text-[10px] text-slate-400">Repuestos casetas + devoluciones</span>
        </div>

        {/* Rendimiento Neto */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-emerald-950/40 border border-cyan-400/40 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-cyan-300 text-[11px] font-bold">
            <span>Rendimiento Neto</span>
            <TrendingUp size={15} className="text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-300 font-mono">
            {formatMoney(summary.netProfit)}
          </p>
          <span className="text-[10px] text-cyan-200/80">{summary.totalEntriesCount} movimientos</span>
        </div>

      </div>

      {/* Tabla del Libro Contable (Inmutable) */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0D121F] overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#131926] border-b border-[#1E293B] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-white">Asientos del Libro Contable</h3>
            <span className="text-[11px] text-slate-400 font-mono">({filteredEntries.length} registros)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Período: <strong className="text-white">{startDate}</strong> al <strong className="text-white">{endDate}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-cyan-400" />
            <span>Calculando libro contable general...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No se encontraron movimientos registrados en este rango de fechas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#101623] text-slate-400 border-b border-[#1E293B] text-[10px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Fecha / Hora</th>
                  <th className="py-3 px-3.5">Operación</th>
                  <th className="py-3 px-3.5">Concepto</th>
                  <th className="py-3 px-3.5">Referencia</th>
                  <th className="py-3 px-3.5 text-right">Efectivo (Bs.)</th>
                  <th className="py-3 px-3.5 text-right">QR (Bs.)</th>
                  <th className="py-3 px-3.5 text-right">Egreso (Bs.)</th>
                  <th className="py-3 px-3.5 text-right">Neto (Bs.)</th>
                  <th className="py-3 px-3.5">Responsable</th>
                  <th className="py-3 px-3.5">Notas Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/70">
                {filteredEntries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-[#131926]/60 transition-colors">
                    {/* Fecha / Hora */}
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString('es-BO', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getEntryTypeBadge(e.entryType)}
                    </td>

                    {/* Concepto */}
                    <td className="py-3 px-3.5 text-white font-medium max-w-xs truncate" title={e.concept}>
                      {e.concept}
                    </td>

                    {/* Referencia */}
                    <td className="py-3 px-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {e.referenceCode}
                    </td>

                    {/* Efectivo In */}
                    <td className="py-3 px-3.5 text-right font-mono">
                      {e.cashIn > 0 ? (
                        <span className="text-emerald-400 font-bold">+{e.cashIn.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* QR In */}
                    <td className="py-3 px-3.5 text-right font-mono">
                      {e.qrIn > 0 ? (
                        <span className="text-blue-400 font-bold">+{e.qrIn.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Egreso Out */}
                    <td className="py-3 px-3.5 text-right font-mono">
                      {e.cashOut > 0 ? (
                        <span className="text-rose-400 font-bold">-{e.cashOut.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Neto */}
                    <td className="py-3 px-3.5 text-right font-mono font-black">
                      <span className={e.netAmount >= 0 ? 'text-white' : 'text-rose-400'}>
                        {formatMoney(e.netAmount)}
                      </span>
                    </td>

                    {/* Responsable / Origen */}
                    <td className="py-3 px-3.5 text-slate-300 text-[11px] whitespace-nowrap">
                      {e.userOrTech}
                    </td>

                    {/* Notas */}
                    <td className="py-3 px-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={e.notes || ''}>
                      {e.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
