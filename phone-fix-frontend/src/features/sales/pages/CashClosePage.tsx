import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Save, DollarSign, Calculator } from 'lucide-react';
import { formatMoney } from '../../../utils/format';

interface SummaryCardProps {
    title: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
}

// Subcomponente auxiliar para tarjetas
const SummaryCard = ({ title, amount, icon, color }: SummaryCardProps) => (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">{title}</p>
            <p className="text-xl font-bold text-slate-800">{formatMoney(amount)}</p>
        </div>
    </div>
);

export const CashClosePage = () => {
    // Estado simulado del día
    const dailyStats = {
        salesTotal: 450,      // Ventas POS
        repairsTotal: 1200,   // Reparaciones Taller
        expensesTotal: 180,   // Gastos (Almuerzo, Repuestos)
        initialCash: 200      // Base de caja (Cambio)
    };

    const expectedCash = dailyStats.initialCash + dailyStats.salesTotal + dailyStats.repairsTotal - dailyStats.expensesTotal;

    const [actualCash, setActualCash] = useState<string>(''); // Lo que el usuario cuenta físicamente
    const difference = actualCash ? parseFloat(actualCash) - expectedCash : 0;

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* Título */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cierre de Caja Diario</h1>
                    <p className="text-slate-500 text-sm">Resumen de movimientos del día</p>
                </div>
                <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-mono text-sm border border-slate-200">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Tarjetas de Resumen Superior */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <SummaryCard
                    title="Base Inicial"
                    amount={dailyStats.initialCash}
                    icon={<Wallet size={20} />}
                    color="bg-slate-50 text-slate-600"
                />
                <SummaryCard
                    title="Ventas (+)"
                    amount={dailyStats.salesTotal}
                    icon={<TrendingUp size={20} />}
                    color="bg-teal-50 text-teal-600"
                />
                <SummaryCard
                    title="Reparaciones (+)"
                    amount={dailyStats.repairsTotal}
                    icon={<TrendingUp size={20} />}
                    color="bg-blue-50 text-blue-600"
                />
                <SummaryCard
                    title="Gastos (-)"
                    amount={dailyStats.expensesTotal}
                    icon={<TrendingDown size={20} />}
                    color="bg-red-50 text-red-600"
                />
            </div>

            {/* Sección Principal de Arqueo (Layout de 3 Columnas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

                {/* COLUMNA 1: DETALLE DE INGRESOS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Detalle de Ingresos</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-teal-50/30">
                            <span className="text-slate-600 text-sm font-medium">Ventas de Mostrador</span>
                            <span className="font-bold text-slate-800">{formatMoney(dailyStats.salesTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/30">
                            <span className="text-slate-600 text-sm font-medium">Servicio Técnico</span>
                            <span className="font-bold text-slate-800">{formatMoney(dailyStats.repairsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-500 text-sm">Base / Cambio Inicial</span>
                            <span className="font-bold text-slate-600">{formatMoney(dailyStats.initialCash)}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-2">
                            <span className="font-bold text-slate-500">Total Entradas</span>
                            <span className="font-bold text-teal-600 text-lg">
                                {formatMoney(dailyStats.initialCash + dailyStats.salesTotal + dailyStats.repairsTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2: EGRESOS Y BALANCE TEÓRICO */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Balance del Sistema</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-red-50/30 border border-red-50">
                            <span className="text-red-700 text-sm font-medium">Total Egresos (Gastos)</span>
                            <span className="font-bold text-red-600">-{formatMoney(dailyStats.expensesTotal)}</span>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Debería existir en caja</p>
                            <p className="text-3xl font-black text-slate-800">{formatMoney(expectedCash)}</p>
                        </div>
                        <p className="text-xs text-slate-400 text-center">
                            Este es el monto calculado automáticamente por el sistema basado en los registros.
                        </p>
                    </div>
                </div>

                {/* COLUMNA 3: ARQUEO FÍSICO (LA HORA DE LA VERDAD) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-slate-800 text-white rounded-lg">
                                <DollarSign size={20} />
                            </div>
                            <h2 className="font-bold text-slate-700">Arqueo Físico</h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Conteo Real (Billetes)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-slate-400 font-bold">Bs.</span>
                                <input
                                    type="number"
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-2xl font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all bg-slate-50 focus:bg-white"
                                    placeholder="0.00"
                                    value={actualCash}
                                    onChange={(e) => setActualCash(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Feedback Visual de Diferencia */}
                        {actualCash !== '' && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 duration-200 ${difference === 0
                                ? 'bg-green-50 border-green-100 text-green-700'
                                : difference > 0
                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                    : 'bg-red-50 border-red-100 text-red-700'
                                }`}>
                                <AlertCircle size={24} className="shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">
                                        {difference === 0 ? '¡Cuadre Perfecto!' : difference > 0 ? 'Sobrante Detectado' : 'Faltante Detectado'}
                                    </p>
                                    <p className="text-2xl font-bold mt-1 tracking-tight">
                                        {difference > 0 ? '+' : ''}{formatMoney(difference)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg">
                            <Save size={20} />
                            Cerrar Turno
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
