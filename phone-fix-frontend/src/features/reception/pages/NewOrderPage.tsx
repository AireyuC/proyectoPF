import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { 
  User, 
  Smartphone, 
  DollarSign, 
  CheckCircle2, 
  MessageCircle, 
  RefreshCw,
  QrCode,
  Calendar,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { PatternLock } from '../../../components/common/PatternLock';
import { CREATE_CLIENT, CREATE_REPAIR_ORDER, GET_CLIENTS } from '../../../api/graphql';
import { formatMoney, createWhatsAppLink } from '../../../utils/format';

const GET_DEVICE_BRAND_PRESETS = gql`
  query GetDeviceBrandPresets {
    deviceBrandPresets {
      brand
      models
    }
  }
`;

const DEFAULT_PRESETS = [
  { brand: 'Samsung', models: ['Galaxy A12', 'Galaxy A13', 'Galaxy A14', 'Galaxy A03 Core', 'Galaxy A54', 'Galaxy S23'] },
  { brand: 'Apple', models: ['iPhone 7', 'iPhone 8', 'iPhone X', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'] },
  { brand: 'Xiaomi', models: ['Redmi 9', 'Redmi 10', 'Redmi 12', 'Redmi Note 10', 'Redmi Note 11', 'Redmi Note 12', 'Poco X3'] },
  { brand: 'Motorola', models: ['Moto E20', 'Moto E22', 'Moto G22', 'Moto G31', 'Moto G52', 'Moto G84'] },
  { brand: 'Infinix', models: ['Hot 10', 'Hot 11', 'Hot 12', 'Hot 20', 'Hot 30', 'Smart 7', 'Note 30'] },
  { brand: 'Tecno Mobile', models: ['Spark 7', 'Spark 8', 'Spark 9', 'Spark 10', 'Spark 20', 'Pova 5'] },
  { brand: 'Honor', models: ['Honor X6', 'Honor X7', 'Honor X8', 'Honor 50', 'Honor 70', 'Honor 90'] },
  { brand: 'Huawei', models: ['Y6', 'Y7', 'Y9', 'P30 Lite', 'Nova 9'] },
  { brand: 'Realme', models: ['Realme C11', 'Realme C21', 'Realme C35', 'Realme C53', 'Realme C55'] },
];

const COMMON_CONDITIONS = [
  'Pantalla Rota / Táctil Dañado',
  'Equipo Mojado / Humedad',
  'No Enciende / Apagado',
  'Tapa Trasera Rota',
  'Puerto de Carga Suelto',
  'Batería Agotada / Hinchada',
  'Cámara Dañada',
  'Chasis Doblado / Golpes'
];

export const NewOrderPage: React.FC = () => {
  // Estado del Formulario
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCi, setClientCi] = useState('');
  const [clientRefPhone, setClientRefPhone] = useState('');
  
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceColor, setDeviceColor] = useState('');
  const [deviceImei, setDeviceImei] = useState('');
  const [devicePasscode, setDevicePasscode] = useState('');
  const [patternSequence, setPatternSequence] = useState<number[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  
  // Finanzas y Seña Bicanal
  const [isPendingQuote, setIsPendingQuote] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState<number | ''>(0);
  const [depositCash, setDepositCash] = useState<number | ''>(0);
  const [depositQr, setDepositQr] = useState<number | ''>(0);
  const [deliveryPromiseDate, setDeliveryPromiseDate] = useState('');

  // Ticket creado
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Queries & Mutations
  const { refetch: refetchClients } = useQuery<any>(GET_CLIENTS, { variables: { search: '' } });
  const { data: presetsData } = useQuery<any>(GET_DEVICE_BRAND_PRESETS);
  const [createClientMutation] = useMutation<any>(CREATE_CLIENT);
  const [createOrderMutation, { loading: creatingOrder }] = useMutation<any>(CREATE_REPAIR_ORDER);

  const brandPresets = presetsData?.deviceBrandPresets || DEFAULT_PRESETS;
  const currentBrandPreset = brandPresets.find(
    (p: any) => p.brand.toLowerCase() === deviceBrand.trim().toLowerCase()
  );
  const availableModels = currentBrandPreset?.models || [];

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const calcRemaining = () => {
    const total = Number(estimatedTotal || 0);
    const paid = Number(depositCash || 0) + Number(depositQr || 0);
    return Math.max(0, total - paid);
  };

  const handleResetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientCi('');
    setClientRefPhone('');
    setDeviceBrand('');
    setDeviceModel('');
    setDeviceColor('');
    setDeviceImei('');
    setDevicePasscode('');
    setPatternSequence([]);
    setSelectedConditions([]);
    setIssueDescription('');
    setEstimatedTotal(0);
    setDepositCash(0);
    setDepositQr(0);
    setDeliveryPromiseDate('');
    setCreatedOrder(null);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMessage('El nombre y celular del cliente son requeridos.');
      return;
    }
    if (!deviceBrand.trim() || !deviceModel.trim()) {
      setErrorMessage('La marca y modelo del dispositivo son obligatorios.');
      return;
    }

    try {
      // 1. Crear o Registrar Cliente
      const clientRes = await createClientMutation({
        variables: {
          input: {
            fullName: clientName.trim(),
            phonePrimary: clientPhone.trim(),
            ci: clientCi.trim() || null,
            phoneReference: clientRefPhone.trim() || null
          }
        }
      });
      const clientId = clientRes.data.createClient.id;

      // 2. Resolver código o patrón
      const passcodeFinal = patternSequence.length > 0 
        ? `PATRÓN: ${patternSequence.join('-')}` 
        : devicePasscode.trim() || null;

      // 3. Crear Orden de Reparación
      const orderRes = await createOrderMutation({
        variables: {
          input: {
            clientId: clientId,
            brand: deviceBrand.trim(),
            model: deviceModel.trim(),
            color: deviceColor.trim() || null,
            imei: deviceImei.trim() || null,
            passcode: passcodeFinal,
            physicalCondition: selectedConditions,
            issueDescription: issueDescription.trim() || 'Revisión técnica general',
            estimatedTotal: Number(estimatedTotal || 0),
            depositCash: Number(depositCash || 0),
            depositQr: Number(depositQr || 0),
            deliveryPromiseDate: deliveryPromiseDate || null
          }
        }
      });

      setCreatedOrder({
        ...orderRes.data.createRepairOrder,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        device: `${deviceBrand.trim()} ${deviceModel.trim()}`
      });

      refetchClients();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la orden de trabajo.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Título de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Nueva Recepción de Equipo
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Ingreso y emisión de ticket para servicio técnico y cambio de piezas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 text-xs font-semibold">
            Garantía Estándar: 3 Semanas
          </span>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulario Principal de 3 Columnas */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ======================================================== */}
        {/* COLUMNA 1: DATOS DEL CLIENTE */}
        {/* ======================================================== */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1E293B]">
            <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <User size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Datos del Cliente
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ej. Ronald Aguilera"
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Celular Principal (WhatsApp) *
              </label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Ej. 77012345"
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                C.I. / NIT <span className="text-[#64748B]">(Opcional)</span>
              </label>
              <input
                type="text"
                value={clientCi}
                onChange={e => setClientCi(e.target.value)}
                placeholder="Ej. 8923412 SC"
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Teléfono de Referencia <span className="text-[#64748B]">(Familiar/Trabajo)</span>
              </label>
              <input
                type="text"
                value={clientRefPhone}
                onChange={e => setClientRefPhone(e.target.value)}
                placeholder="Ej. 39221144"
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 2: DISPOSITIVO Y ESTADO */}
        {/* ======================================================== */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1E293B]">
            <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Smartphone size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dispositivo & Diagnóstico
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Marca *</label>
                <input
                  type="text"
                  required
                  list="brands-list"
                  value={deviceBrand}
                  onChange={e => setDeviceBrand(e.target.value)}
                  placeholder="Ej. Samsung / iPhone"
                  className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
                />
                <datalist id="brands-list">
                  {brandPresets.map((p: any) => (
                    <option key={p.brand} value={p.brand} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Modelo *</label>
                <input
                  type="text"
                  required
                  list="models-list"
                  value={deviceModel}
                  onChange={e => setDeviceModel(e.target.value)}
                  placeholder="Ej. Galaxy A54"
                  className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
                />
                <datalist id="models-list">
                  {availableModels.map((m: string) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5">Color</label>
                <input
                  type="text"
                  value={deviceColor}
                  onChange={e => setDeviceColor(e.target.value)}
                  placeholder="Ej. Negro / Azul"
                  className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5 flex items-center justify-between">
                  <span>IMEI</span>
                  <span className="text-[10px] text-[#00E5FF] font-medium">Opcional</span>
                </label>
                <input
                  type="text"
                  value={deviceImei}
                  onChange={e => setDeviceImei(e.target.value)}
                  placeholder="15 dígitos (*#06#)"
                  className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1.5">
                Falla Reportada por el Cliente *
              </label>
              <textarea
                rows={2}
                required
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                placeholder="Ej. Pantalla rota no da luz, se cayó en agua..."
                className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:border-[#00E5FF] outline-none resize-none"
              />
            </div>

            {/* Checklist de Estado Físico */}
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-2">
                Detalles Físicos al Recibir
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {COMMON_CONDITIONS.map(cond => {
                  const checked = selectedConditions.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={`px-3 py-1.5 rounded-lg text-left text-[11px] transition-all flex items-center justify-between cursor-pointer border ${
                        checked
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/40'
                          : 'bg-[#131926] text-[#94A3B8] border-[#1E293B] hover:text-white'
                      }`}
                    >
                      <span>{cond}</span>
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                        checked ? 'bg-[#00E5FF] border-[#00E5FF] text-black font-bold' : 'border-[#64748B]'
                      }`}>
                        {checked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desbloqueo: Patrón o PIN */}
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-2">
                Patrón o Código de Desbloqueo
              </label>
              <div className="p-3 bg-[#131926] border border-[#1E293B] rounded-xl space-y-3">
                <input
                  type="text"
                  value={devicePasscode}
                  onChange={e => setDevicePasscode(e.target.value)}
                  placeholder="PIN numérico o contraseña (ej: 1234)"
                  className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-lg text-white placeholder-[#64748B] text-xs outline-none"
                />
                <div className="pt-2 border-t border-[#1E293B] flex justify-center">
                  <PatternLock onChange={seq => setPatternSequence(seq)} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 3: COTIZACIÓN, SEÑA BICANAL Y EMISIÓN */}
        {/* ======================================================== */}
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 md:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#1E293B]">
              <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <DollarSign size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Finanzas & Anticipo
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Modalidad de Cotización: Acordada vs Pendiente Diagnóstico */}
              <div className="space-y-2">
                <label className="block text-[#94A3B8] font-semibold">
                  Modalidad de Cotización
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#131926] border border-[#1E293B] rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPendingQuote(false);
                      if (estimatedTotal === 0) setEstimatedTotal('');
                    }}
                    className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                      !isPendingQuote
                        ? 'bg-[#00E5FF] text-black shadow-md shadow-[#00E5FF]/20 font-extrabold'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Cotización Acordada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPendingQuote(true);
                      setEstimatedTotal(0);
                    }}
                    className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                      isPendingQuote
                        ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-extrabold'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Pendiente Diagnóstico (Bs. 0)
                  </button>
                </div>
              </div>

              {isPendingQuote ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Wrench size={13} />
                    <span>Equipo Ingresa en Diagnóstico</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Presupuesto fijado en <b>Bs. 0.00</b>. El técnico revisará el teléfono, consultará precios a las casetas y podrá ingresar el costo real en el Taller para avisar al cliente por WhatsApp.
                  </p>
                </div>
              ) : (
                /* Presupuesto Total Editable */
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1.5">
                    Presupuesto Total Cotizado (Bs.) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimatedTotal}
                      onChange={e => setEstimatedTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3.5 py-3 bg-[#131926] border border-[#1E293B] rounded-xl text-white text-lg font-bold placeholder-[#64748B] focus:border-[#00E5FF] outline-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3.5 top-3.5 text-[#64748B] font-bold">Bs.</span>
                  </div>
                </div>
              )}

              {/* Seña Efectivo vs QR */}
              <div className="p-4 bg-[#131926] border border-[#1E293B] rounded-xl space-y-3">
                <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Seña / Anticipo al Ingresar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#94A3B8] text-[11px] font-medium mb-1 flex items-center gap-1">
                      <DollarSign size={12} className="text-[#10B981]" />
                      Efectivo (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={depositCash}
                      onChange={e => setDepositCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-lg text-white font-semibold outline-none focus:border-[#00E5FF]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-[11px] font-medium mb-1 flex items-center gap-1">
                      <QrCode size={12} className="text-[#00E5FF]" />
                      QR / Banco (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={depositQr}
                      onChange={e => setDepositQr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-lg text-white font-semibold outline-none focus:border-[#00E5FF]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1E293B] flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8]">Saldo por Cobrar al Retirar:</span>
                  <span className="font-bold text-[#00E5FF] text-sm">
                    {formatMoney(calcRemaining())}
                  </span>
                </div>
              </div>

              {/* Fecha Promesa de Entrega */}
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#00E5FF]" />
                  Fecha Prometida de Entrega
                </label>
                <input
                  type="date"
                  value={deliveryPromiseDate}
                  onChange={e => setDeliveryPromiseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                />
              </div>
            </div>
          </div>

          {/* Botón de Emisión */}
          <div className="pt-4 border-t border-[#1E293B]">
            <button
              type="submit"
              disabled={creatingOrder}
              className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm disabled:opacity-50"
            >
              {creatingOrder ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Emitiendo Ticket...
                </span>
              ) : (
                <span>Emitir Orden & Imprimir Ticket</span>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* ======================================================== */}
      {/* MODAL DE ÉXITO CON TICKET Y BOTÓN WHATSAPP */}
      {/* ======================================================== */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D121F] border border-[#00E5FF]/40 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 glow-cyan shadow-2xl">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center justify-center mx-auto glow-cyan-subtle">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-white">¡Orden Recibida con Éxito!</h3>
              <p className="text-xs text-[#94A3B8]">
                El equipo ha sido registrado en el sistema PhoneFix
              </p>
            </div>

            {/* Ficha Resumen del Ticket */}
            <div className="bg-[#131926] border border-[#1E293B] rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">Número de Ticket:</span>
                <span className="text-base font-extrabold text-[#00E5FF] font-mono tracking-wider">
                  #{createdOrder.ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Cliente:</span>
                <span className="font-semibold text-white">{createdOrder.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Dispositivo:</span>
                <span className="font-semibold text-white">{createdOrder.device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Total Cotizado:</span>
                <span className="font-semibold text-white">{formatMoney(createdOrder.estimatedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Seña Recibida:</span>
                <span className="font-semibold text-[#10B981]">{formatMoney(createdOrder.totalCollected)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#1E293B]">
                <span className="text-[#94A3B8] font-bold">Saldo Pendiente:</span>
                <span className="font-bold text-[#00E5FF] text-sm">{formatMoney(createdOrder.remainingBalance)}</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <a
                href={createWhatsAppLink(
                  createdOrder.clientPhone, 
                  `Hola ${createdOrder.clientName}, tu dispositivo ${createdOrder.device} fue recibido en PhoneFix Montero. Tu Ticket es #${createdOrder.ticketNumber}. Cotización: Bs. ${createdOrder.estimatedTotal}. Seña: Bs. ${createdOrder.totalCollected}. Saldo por pagar al retirar: Bs. ${createdOrder.remainingBalance}. Garantía: 3 semanas.`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-lg shadow-[#10B981]/20 cursor-pointer"
              >
                <MessageCircle size={18} />
                Enviar Comprobante por WhatsApp al Cliente
              </a>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Registrar Otra Orden
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};