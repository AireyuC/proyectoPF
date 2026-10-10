import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  QrCode, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Package
} from 'lucide-react';
import { GET_PRODUCTS, CREATE_SALE } from '../../../api/graphql';
import { formatMoney } from '../../../utils/format';
import { Can } from '../../../components/auth/Can';

interface CartItem {
  id: string; // Puede ser 'prod-ID' o 'manual-TIMESTAMP'
  productId?: number;
  isManual: boolean;
  name: string;
  price: number;
  cost: number;
  qty: number;
  saveToCatalog?: boolean;
}

export const PosPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState<any | null>(null);

  // Venta Libre / Al Aire (Manual)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState<number | ''>(0);
  const [manualCost, setManualCost] = useState<number | ''>(0);
  const [manualSaveCatalog, setManualSaveCatalog] = useState(false);

  // Formulario Cobro Bicanal
  const [payCash, setPayCash] = useState<number | ''>(0);
  const [payQr, setPayQr] = useState<number | ''>(0);
  const [cashReceived, setCashReceived] = useState<number | ''>(0);
  const [checkoutError, setCheckoutError] = useState('');

  // GraphQL
  const { data: productsData, loading, refetch } = useQuery<any>(GET_PRODUCTS, {
    variables: { 
      search: searchTerm.trim() || null, 
      category: selectedCategory === 'ALL' ? null : selectedCategory 
    }
  });

  const [createSaleMutation, { loading: creatingSale }] = useMutation<any>(CREATE_SALE);

  const products = productsData?.products || [];

  // Totales del carrito
  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const addToCart = (prod: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === prod.id);
      if (existing) {
        return prev.map(item => item.productId === prod.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [
        ...prev,
        {
          id: `prod-${prod.id}`,
          productId: prod.id,
          isManual: false,
          name: prod.name,
          price: prod.salePrice,
          cost: prod.costPrice,
          qty: 1
        }
      ];
    });
  };

  const addManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || Number(manualPrice || 0) <= 0) return;

    setCart(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        isManual: true,
        name: manualName.trim(),
        price: Number(manualPrice || 0),
        cost: Number(manualCost || 0),
        qty: 1,
        saveToCatalog: manualSaveCatalog
      }
    ]);

    setManualName('');
    setManualPrice(0);
    setManualCost(0);
    setManualSaveCatalog(false);
    setShowManualModal(false);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleOpenCheckout = () => {
    setPayCash(totalAmount);
    setPayQr(0);
    setCashReceived(totalAmount);
    setCheckoutError('');
    setShowCheckout(true);
  };

  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    const cash = Number(payCash || 0);
    const qr = Number(payQr || 0);
    const paidSum = cash + qr;

    if (Math.abs(paidSum - totalAmount) > 0.01) {
      setCheckoutError(`La suma de Efectivo + QR (Bs. ${paidSum.toFixed(2)}) debe coincidir con el total (Bs. ${totalAmount.toFixed(2)}).`);
      return;
    }

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.productId || null,
        isManualEntry: item.isManual,
        customName: item.isManual ? item.name : null,
        saveToCatalog: item.saveToCatalog || false,
        quantity: item.qty,
        unitPrice: item.price,
        unitCost: item.cost
      }));

      const res = await createSaleMutation({
        variables: {
          input: {
            paymentCash: cash,
            paymentQr: qr,
            items: itemsPayload
          }
        }
      });

      setSaleCompleted(res.data.createSale);
      setShowCheckout(false);
      setCart([]);
      refetch();
    } catch (err: any) {
      setCheckoutError(err.message || 'Error al procesar la venta.');
    }
  };

  const changeDue = Math.max(0, Number(cashReceived || 0) - Number(payCash || 0));

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-full min-h-0">
      
      {/* ======================================================== */}
      {/* SECCIÓN IZQUIERDA: CATÁLOGO DE PRODUCTOS */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        
        {/* Barra de Filtros y Buscador */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar accesorios, cables, pantallas..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white text-xs placeholder-[#64748B] outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Venta Libre / Al Aire (Exclusivo ADMIN o permiso) */}
            <Can permission="ventas.pos.venta_libre">
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 rounded-xl text-xs font-bold transition-all cursor-pointer glow-cyan-subtle shrink-0"
              >
                <Sparkles size={14} />
                Venta al Aire / Manual
              </button>
            </Can>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-xs text-[#94A3B8] outline-none"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="ACCESORIO">Accesorios</option>
              <option value="REPUESTO">Repuestos</option>
              <option value="SERVICIO">Servicios Express</option>
              <option value="HERRAMIENTA">Herramientas</option>
            </select>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading && (
            <div className="py-20 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-[#00E5FF]" />
              <span>Cargando productos del almacén...</span>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="py-20 text-center bg-[#0D121F] rounded-2xl border border-[#1E293B] p-6 space-y-2">
              <Package size={32} className="mx-auto text-[#64748B]" />
              <p className="text-xs text-[#94A3B8]">No hay productos registrados con este criterio.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((prod: any) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="bg-[#0D121F] border border-[#1E293B] hover:border-[#00E5FF]/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:glow-cyan-subtle group space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] mb-1">
                    <span>{prod.category}</span>
                    {prod.isStockManaged && (
                      <span className={`font-semibold ${prod.isLowStock ? 'text-red-400' : 'text-[#10B981]'}`}>
                        Stock: {prod.stock}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs group-hover:text-[#00E5FF] transition-colors line-clamp-2">
                    {prod.name}
                  </h4>
                </div>

                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
                  <span className="font-extrabold text-[#00E5FF] text-sm">
                    {formatMoney(prod.salePrice)}
                  </span>
                  <button className="w-6 h-6 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center group-hover:bg-[#00E5FF] group-hover:text-black transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SECCIÓN DERECHA: CARRITO DE VENTA Y COBRO */}
      {/* ======================================================== */}
      <div className="w-full lg:w-96 bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between shrink-0 space-y-4">
        
        {/* Cabecera Carrito */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#00E5FF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Carrito ({cart.reduce((a, b) => a + b.qty, 0)})
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[11px] text-[#64748B] hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[200px] max-h-[420px] pr-1">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64748B] space-y-2">
              <ShoppingCart size={28} className="mx-auto text-[#334155]" />
              <p>El carrito está vacío.</p>
              <p className="text-[10px]">Toca un producto o usa Venta al Aire para agregar.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-3 bg-[#131926] border border-[#1E293B] rounded-xl flex items-center justify-between text-xs gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.isManual && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[#00E5FF] font-bold">
                        AIRE
                      </span>
                    )}
                    <p className="font-semibold text-white truncate">{item.name}</p>
                  </div>
                  <p className="text-[11px] text-[#00E5FF] font-bold mt-0.5">
                    {formatMoney(item.price * item.qty)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0D121F] border border-[#1E293B] rounded-lg p-0.5">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="p-1 hover:text-[#00E5FF] text-[#94A3B8] cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center font-bold text-white text-xs">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="p-1 hover:text-[#00E5FF] text-[#94A3B8] cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-[#64748B] hover:text-[#EF4444] transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totales y Botón Cobrar */}
        <div className="pt-3 border-t border-[#1E293B] space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#94A3B8]">Total a Cobrar:</span>
            <span className="text-xl font-extrabold text-[#00E5FF]">
              {formatMoney(totalAmount)}
            </span>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm disabled:opacity-40"
          >
            <DollarSign size={18} />
            Cobrar Venta
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL VENTA AL AIRE / LIBRE (ADMIN) */}
      {/* ======================================================== */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-[#00E5FF]/30 rounded-3xl p-6 max-w-md w-full space-y-5 glow-cyan-subtle">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2 text-[#00E5FF]">
                <Sparkles size={18} />
                <h3 className="font-bold text-white text-sm">Venta Libre / Al Aire</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-[#64748B] hover:text-white">✕</button>
            </div>

            <form onSubmit={addManualItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1">Descripción del Producto / Ítem *</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Ej. Pegamento B7000, Adaptador OTG..."
                  className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Precio Venta (Bs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={manualPrice}
                    onChange={e => setManualPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] font-bold"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Costo Caja Chica (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={manualCost}
                    onChange={e => setManualCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#131926] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualSaveCatalog}
                  onChange={e => setManualSaveCatalog(e.target.checked)}
                  className="accent-[#00E5FF]"
                />
                <span className="text-[#94A3B8] text-[11px]">
                  Guardar automáticamente en catálogo para ventas futuras (Poblamiento Orgánico)
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer"
              >
                Agregar al Carrito
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE COBRO BICANAL (EFECTIVO + QR) */}
      {/* ======================================================== */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-3xl p-6 max-w-md w-full space-y-5 glow-cyan-subtle">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <h3 className="font-extrabold text-white text-base">Cobro Mostrador</h3>
              <button onClick={() => setShowCheckout(false)} className="text-[#64748B] hover:text-white">✕</button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {checkoutError}
              </div>
            )}

            <div className="p-4 bg-[#131926] rounded-2xl border border-[#1E293B] text-center space-y-1">
              <span className="text-xs text-[#94A3B8]">Total a Liquidar</span>
              <p className="text-3xl font-extrabold text-[#00E5FF]">{formatMoney(totalAmount)}</p>
            </div>

            <form onSubmit={handleProcessSale} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1 flex items-center gap-1">
                    <DollarSign size={13} className="text-[#10B981]" /> Cobro Efectivo (Bs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={payCash}
                    onChange={e => setPayCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1 flex items-center gap-1">
                    <QrCode size={13} className="text-[#00E5FF]" /> Cobro QR / Banco (Bs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={payQr}
                    onChange={e => setPayQr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] font-bold"
                  />
                </div>
              </div>

              {Number(payCash || 0) > 0 && (
                <div className="p-3 bg-[#131926] rounded-xl border border-[#1E293B] space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[#94A3B8]">Efectivo Recibido en Mano:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 bg-[#0D121F] border border-[#1E293B] rounded-lg text-white text-right font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#1E293B]">
                    <span className="text-[#94A3B8]">Cambio / Vuelto:</span>
                    <span className="font-bold text-[#10B981] text-sm">{formatMoney(changeDue)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creatingSale}
                className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs disabled:opacity-50"
              >
                {creatingSale ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirmar y Finalizar Venta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO VENTA */}
      {saleCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-[#00E5FF]/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 glow-cyan shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white">¡Venta Registrada!</h3>
            <p className="text-xs text-[#94A3B8]">
              Total cobrado: <strong className="text-[#00E5FF]">{formatMoney(saleCompleted.total)}</strong>
            </p>
            <button
              onClick={() => setSaleCompleted(null)}
              className="w-full py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
