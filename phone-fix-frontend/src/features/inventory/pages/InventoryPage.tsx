import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  DollarSign, 
  Archive,
  ArrowUpDown
} from 'lucide-react';
import { GET_PRODUCTS, CREATE_PRODUCT, ADJUST_STOCK } from '../../../api/graphql';
import { formatMoney } from '../../../utils/format';
import { Modal } from '../../../components/common/Modal';
import { Can } from '../../../components/auth/Can';

export const InventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  
  // Modal de Ajuste de Stock
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [stockDelta, setStockDelta] = useState<number | ''>(0);

  // Formulario Nuevo Producto
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('ACCESORIO');
  const [prodCost, setProdCost] = useState<number | ''>(0);
  const [prodPrice, setProdPrice] = useState<number | ''>(0);
  const [prodStock, setProdStock] = useState<number | ''>(0);
  const [prodMinStock, setProdMinStock] = useState<number | ''>(2);
  const [prodManaged, setProdManaged] = useState(false);
  const [prodLocation, setProdLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // GraphQL
  const { data, refetch } = useQuery<any>(GET_PRODUCTS, {
    variables: {
      search: searchTerm.trim() || null,
      category: categoryFilter === 'ALL' ? null : categoryFilter,
      lowStockOnly: lowStockFilter
    },
    fetchPolicy: 'network-only'
  });

  const [createProductMutation, { loading: creating }] = useMutation<any>(CREATE_PRODUCT, {
    onCompleted: () => {
      setIsNewModalOpen(false);
      setProdName('');
      setProdCost(0);
      setProdPrice(0);
      setProdStock(0);
      setProdLocation('');
      refetch();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Error al guardar producto.');
    }
  });

  const [adjustStockMutation] = useMutation<any>(ADJUST_STOCK, {
    onCompleted: () => {
      setAdjustingProduct(null);
      setStockDelta(0);
      refetch();
    }
  });

  const products = data?.products || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    createProductMutation({
      variables: {
        input: {
          name: prodName.trim(),
          category: prodCategory,
          costPrice: Number(prodCost || 0),
          salePrice: Number(prodPrice || 0),
          isStockManaged: prodManaged,
          stock: Number(prodStock || 0),
          minStock: Number(prodMinStock || 2),
          location: prodLocation.trim() || null
        }
      }
    });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || stockDelta === '') return;

    adjustStockMutation({
      variables: {
        id: adjustingProduct.id,
        quantityDelta: Number(stockDelta)
      }
    });
  };

  // KPIs
  const totalItems = products.length;
  const criticalStockCount = products.filter((p: any) => p.isLowStock).length;
  const totalInvestment = products.reduce((acc: number, p: any) => acc + (p.costPrice * p.stock), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Inventario & Almacén
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Catálogo progresivo de repuestos, accesorios y herramientas de laboratorio
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
        >
          <Plus size={16} />
          Nuevo Producto / Repuesto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-[#00E5FF]/10 text-[#00E5FF] rounded-xl">
            <Archive size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Productos</p>
            <p className="text-2xl font-extrabold text-white">{totalItems}</p>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Stock Crítico</p>
            <p className="text-2xl font-extrabold text-red-400">{criticalStockCount}</p>
          </div>
        </div>

        <Can permission="inventario.costos.ver">
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-[#10B981]/10 text-[#10B981] rounded-xl">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Capital en Mercadería</p>
              <p className="text-2xl font-extrabold text-[#10B981]">{formatMoney(totalInvestment)}</p>
            </div>
          </div>
        </Can>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o estante..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white text-xs placeholder-[#64748B] outline-none focus:border-[#00E5FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D121F] border border-[#1E293B] rounded-xl text-xs text-white outline-none"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="ACCESORIO">Accesorios</option>
            <option value="REPUESTO">Repuestos</option>
            <option value="SERVICIO">Servicios</option>
            <option value="HERRAMIENTA">Herramientas</option>
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              lowStockFilter 
                ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                : 'bg-[#0D121F] text-[#94A3B8] border-[#1E293B] hover:text-white'
            }`}
          >
            Alerta de Stock
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131926] text-[#94A3B8] border-b border-[#1E293B] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Producto / Repuesto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Precio Público</th>
                <Can permission="inventario.costos.ver">
                  <th className="p-4">Costo Privado</th>
                </Can>
                <th className="p-4">Stock</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4 text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#131926]/50">
                  <td className="p-4 font-bold text-white">{p.name}</td>
                  <td className="p-4 text-[#94A3B8]">{p.category}</td>
                  <td className="p-4 font-extrabold text-[#00E5FF]">{formatMoney(p.salePrice)}</td>
                  <Can permission="inventario.costos.ver">
                    <td className="p-4 text-[#94A3B8]">{formatMoney(p.costPrice)}</td>
                  </Can>
                  <td className="p-4">
                    {p.isStockManaged ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.isLowStock ? 'bg-red-500/15 text-red-400' : 'bg-[#10B981]/15 text-[#10B981]'
                      }`}>
                        {p.stock} un.
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#64748B]">Bypass Stock</span>
                    )}
                  </td>
                  <td className="p-4 text-[#94A3B8]">{p.location || '—'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setAdjustingProduct(p);
                        setStockDelta(0);
                      }}
                      className="p-1.5 rounded-lg bg-[#131926] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#00E5FF] transition-colors cursor-pointer"
                      title="Ajustar stock"
                    >
                      <ArrowUpDown size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748B]">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nuevo Producto o Repuesto" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Nombre del Producto / Repuesto *</label>
            <input
              type="text"
              required
              value={prodName}
              onChange={e => setProdName(e.target.value)}
              placeholder="Ej. Batería iPhone 12, Vidrio Cerámico..."
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Categoría</label>
              <select
                value={prodCategory}
                onChange={e => setProdCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              >
                <option value="ACCESORIO">Accesorio</option>
                <option value="REPUESTO">Repuesto</option>
                <option value="SERVICIO">Servicio</option>
                <option value="HERRAMIENTA">Herramienta</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Ubicación (Estante)</label>
              <input
                type="text"
                value={prodLocation}
                onChange={e => setProdLocation(e.target.value)}
                placeholder="Ej. Estante A-2"
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Precio Venta (Bs.) *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={prodPrice}
                onChange={e => setProdPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Costo Caja Chica (Bs.)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={prodCost}
                onChange={e => setProdCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 bg-[#131926] border border-[#1E293B] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={prodManaged}
              onChange={e => setProdManaged(e.target.checked)}
              className="accent-[#00E5FF]"
            />
            <span className="text-[#94A3B8]">Activar control estricto de existencias (Stock)</span>
          </label>

          {prodManaged && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1">Existencias Iniciales</label>
                <input
                  type="number"
                  min="0"
                  value={prodStock}
                  onChange={e => setProdStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] font-semibold mb-1">Alerta Mínima</label>
                <input
                  type="number"
                  min="1"
                  value={prodMinStock}
                  onChange={e => setProdMinStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
          >
            {creating ? 'Guardando...' : 'Crear Producto'}
          </button>
        </form>
      </Modal>

      {/* Modal Ajuste de Stock */}
      {adjustingProduct && (
        <Modal isOpen={!!adjustingProduct} onClose={() => setAdjustingProduct(null)} title={`Ajustar Stock: ${adjustingProduct.name}`} maxWidth="max-w-xs">
          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <p className="text-[#94A3B8]">Stock actual: <strong className="text-white">{adjustingProduct.stock}</strong></p>
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">
                Cantidad a agregar (+/- delta)
              </label>
              <input
                type="number"
                required
                value={stockDelta}
                onChange={e => setStockDelta(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white text-base font-bold outline-none focus:border-[#00E5FF]"
                placeholder="+5 o -2"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl text-xs hover:brightness-110 cursor-pointer"
            >
              Aplicar Ajuste
            </button>
          </form>
        </Modal>
      )}

    </div>
  );
};
