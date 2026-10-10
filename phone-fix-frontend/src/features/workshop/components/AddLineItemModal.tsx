import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Store, ShoppingBag, Plus, RefreshCw } from 'lucide-react';
import { ADD_REPAIR_PART, GET_SUPPLIERS, GET_PRODUCTS } from '../../../api/graphql';
import { SupplierModal } from './SupplierModal';

interface AddLineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  onSuccess?: () => void;
}

export const AddLineItemModal: React.FC<AddLineItemModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  onSuccess
}) => {
  const [sourceType, setSourceType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [cost, setCost] = useState<number | ''>(0);
  const [price, setPrice] = useState<number | ''>(0);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const { data: suppliersData, refetch: refetchSuppliers } = useQuery<any>(GET_SUPPLIERS);
  const { data: productsData } = useQuery<any>(GET_PRODUCTS);

  const [addPartMutation, { loading }] = useMutation<any>(ADD_REPAIR_PART, {
    onCompleted: () => {
      onSuccess?.();
      onClose();
      // Reset
      setName('');
      setCost(0);
      setPrice(0);
      setSelectedProductId(null);
      setSupplierId(null);
      setIsPaid(false);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Error al imputar pieza.');
    }
  });

  if (!isOpen) return null;

  const handleProductSelect = (prodIdStr: string) => {
    const id = parseInt(prodIdStr);
    setSelectedProductId(id || null);
    if (id && productsData?.products) {
      const p = productsData.products.find((item: any) => item.id === id);
      if (p) {
        setName(p.name);
        setCost(p.costPrice);
        setPrice(p.salePrice);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Ingresa una descripción para el repuesto o servicio.');
      return;
    }

    addPartMutation({
      variables: {
        input: {
          ticketNumber,
          sourceType,
          productId: sourceType === 'INTERNAL' ? selectedProductId : null,
          name: name.trim(),
          cost: Number(cost || 0),
          price: Number(price || 0),
          supplierId: sourceType === 'EXTERNAL' ? supplierId : null,
          isPaid
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden glow-cyan-subtle">
        
        {/* Header */}
        <div className="bg-[#0A0E18] px-5 py-4 border-b border-[#1E293B] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 bg-[#00E5FF] rounded-full" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Imputar Repuesto / Mano de Obra
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#131926] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Switch Origen */}
          <div className="grid grid-cols-2 gap-1 bg-[#131926] p-1 rounded-xl border border-[#1E293B]">
            <button
              type="button"
              onClick={() => setSourceType('INTERNAL')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                sourceType === 'INTERNAL'
                  ? 'bg-[#00E5FF] text-[#080B11] shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Store size={15} /> De Almacén
            </button>
            <button
              type="button"
              onClick={() => setSourceType('EXTERNAL')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                sourceType === 'EXTERNAL'
                  ? 'bg-[#F59E0B] text-black shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <ShoppingBag size={15} /> Compra Externa / Caseta
            </button>
          </div>

          {/* Selección o Descripción */}
          {sourceType === 'INTERNAL' ? (
            <div className="space-y-1.5">
              <label className="text-[#94A3B8] font-semibold">Seleccionar de Inventario Propio</label>
              <select
                value={selectedProductId || ''}
                onChange={e => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              >
                <option value="">-- Seleccionar pieza o escribir manual --</option>
                {productsData?.products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock}) - Bs. {p.salePrice}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#94A3B8] font-semibold">Proveedor / Caseta</label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-[11px] text-[#F59E0B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Nueva Caseta
                </button>
              </div>
              <select
                value={supplierId || ''}
                onChange={e => setSupplierId(parseInt(e.target.value) || null)}
                className="w-full px-3 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#F59E0B]"
              >
                <option value="">-- Seleccionar Caseta / Proveedor --</option>
                {suppliersData?.suppliers?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.boothNumber ? `(Caseta ${s.boothNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#94A3B8] font-semibold">Descripción de la Pieza o Servicio *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Pantalla OLED Original, Pin de Carga, M/O"
              className="w-full px-3.5 py-2.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Costo vs Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[#94A3B8] font-semibold">Costo Real Caja Chica (Bs.)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={cost}
                onChange={e => setCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[#94A3B8] font-semibold">Precio al Cliente (Bs.)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={price}
                onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-[#00E5FF] font-bold outline-none focus:border-[#00E5FF]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Botón Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Imputar a la Orden de Servicio
            </button>
          </div>

        </form>

        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSaved={(newSup) => {
            refetchSuppliers();
            if (newSup?.id) setSupplierId(newSup.id);
          }}
        />

      </div>
    </div>
  );
};
