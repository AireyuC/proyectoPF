import React, { useState } from 'react';
import { Save, Camera, Smartphone, User, FileText, DollarSign } from 'lucide-react';
import { PatternLock } from '../../../components/common/PatternLock';

export const NewOrderPage = () => {
    // Estado local del formulario
    const [formData, setFormData] = useState({
        clientName: '',
        clientPhone: '',
        clientCi: '',
        deviceBrand: '',
        deviceModel: '',
        deviceColor: '',
        passcode: [] as number[], // Secuencia del patrón
        failure: '', // "Pantalla rota"
        condition: [] as string[], // ["Mojado", "Rayado"]
        isScreenChange: false, // Para calcular lógica rápida
        estimatedPrice: 0,
        deposit: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Guardando Orden...", formData);
        alert("¡Orden Guardada! (Simulación)");
        // Aquí conectaremos con Apollo/GraphQL más adelante
    };

    const [ticketNumber] = useState(() => Math.floor(Math.random() * 1000));

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nueva Recepción</h1>
                    <p className="text-sm text-slate-500">Registra el ingreso de un equipo al taller</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-lg font-bold shadow-sm border border-blue-200">
                    Ticket #{ticketNumber}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* COLUMNA 1: CLIENTE */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Cliente</h2>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50"
                                placeholder="Ej: Juan Pérez"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Celular</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50"
                                    placeholder="77000000"
                                    value={formData.clientPhone}
                                    onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">CI / NIT</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50"
                                    placeholder="Opcional"
                                    value={formData.clientCi}
                                    onChange={e => setFormData({ ...formData, clientCi: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2: EQUIPO */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Smartphone size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Equipo</h2>
                    </div>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Marca</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500"
                                    value={formData.deviceBrand}
                                    onChange={e => setFormData({ ...formData, deviceBrand: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Xiaomi">Xiaomi</option>
                                    <option value="Apple">iPhone</option>
                                    <option value="Huawei">Huawei</option>
                                    <option value="Motorola">Motorola</option>
                                    <option value="Honor">Honor</option>
                                    <option value="Infinix">Infinix</option>
                                    <option value="Tecno">Tecno</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Modelo</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej: A50"
                                    value={formData.deviceModel}
                                    onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Patrón / PIN</label>
                            <div className="flex gap-4 items-start">
                                <PatternLock onChange={(seq: number[]) => setFormData({ ...formData, passcode: seq })} />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="PIN numérico"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 mb-2"
                                    />
                                    <button type="button" className="flex items-center gap-2 text-xs text-purple-600 hover:bg-purple-50 p-2 rounded-lg border border-dashed border-purple-200 w-full justify-center transition-colors">
                                        <Camera size={14} />
                                        Adjuntar Fotos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 3: COSTOS Y SEÑA (Nueva Ubicación) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Cotización</h2>
                    </div>
                    <div className="space-y-5">
                        <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Precio Estimado (Bs.)</label>
                            <input
                                type="number"
                                className="w-full p-3 border border-green-200 rounded-xl font-bold text-2xl text-green-700 outline-none focus:ring-2 focus:ring-green-500 placeholder-green-300 bg-white"
                                placeholder="0.00"
                                value={formData.estimatedPrice}
                                onChange={e => setFormData({ ...formData, estimatedPrice: parseFloat(e.target.value) })}
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                                *Sujeto a revisión técnica
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">A cuenta / Seña</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Bs.</span>
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50 font-medium"
                                    placeholder="0.00"
                                    value={formData.deposit}
                                    onChange={e => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DIAGNÓSTICO (ANCHO COMPLETO) */}
                <div className="md:col-span-2 xl:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h2 className="font-bold text-slate-700">Diagnóstico Inicial</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Falla Reportada</label>
                            <textarea
                                className="w-full p-3 border border-slate-200 rounded-xl h-24 bg-slate-50 outline-none focus:ring-2 focus:ring-orange-500 resize-none transition-all"
                                placeholder="Describa el problema detalladamente..."
                                value={formData.failure}
                                onChange={e => setFormData({ ...formData, failure: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col justify-center gap-3">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Estado Físico:</p>
                            <div className="flex gap-4 flex-wrap">
                                {['Pantalla Rota', 'Mojado', 'No Enciende', 'Tapa Rota', 'Sin Señal'].map((cond) => (
                                    <label key={cond} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-colors">
                                        <input type="checkbox" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                        <span className="text-sm font-medium text-slate-600">{cond}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTÓN DE ACCIÓN */}
                <div className="md:col-span-2 xl:col-span-3 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        className="bg-slate-900 hover:bg-black text-white py-4 px-10 rounded-xl font-bold text-lg flex items-center gap-3 shadow-xl shadow-slate-200 transition-transform active:scale-95"
                    >
                        <Save size={22} />
                        Registrar Recepción
                    </button>
                </div>

            </form>
        </div>
    );
};