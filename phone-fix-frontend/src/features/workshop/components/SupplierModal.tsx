import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { X, Store, MapPin, Phone, User, FileText, CheckCircle2 } from 'lucide-react';

const CREATE_SUPPLIER_MUTATION = gql`
  mutation CreateSupplier($input: SupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      isInternal
      marketPlace
      boothNumber
      address
      contactName
      phoneReference
      notes
    }
  }
`;

const UPDATE_SUPPLIER_MUTATION = gql`
  mutation UpdateSupplier($id: Int!, $input: SupplierInput!) {
    updateSupplier(id: $id, input: $input) {
      id
      name
      isInternal
      marketPlace
      boothNumber
      address
      contactName
      phoneReference
      notes
    }
  }
`;

export interface SupplierData {
  id?: number;
  name: string;
  isInternal: boolean;
  marketPlace: string;
  boothNumber: string;
  address: string;
  contactName: string;
  phoneReference: string;
  notes: string;
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (supplier: any) => void;
  supplierToEdit?: SupplierData | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  supplierToEdit
}) => {
  const [formData, setFormData] = useState<SupplierData>({
    name: '',
    isInternal: false,
    marketPlace: '',
    boothNumber: '',
    address: '',
    contactName: '',
    phoneReference: '',
    notes: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [createSupplier, { loading: creating }] = useMutation<any>(CREATE_SUPPLIER_MUTATION);
  const [updateSupplier, { loading: updating }] = useMutation<any>(UPDATE_SUPPLIER_MUTATION);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || '',
        isInternal: !!supplierToEdit.isInternal,
        marketPlace: supplierToEdit.marketPlace || '',
        boothNumber: supplierToEdit.boothNumber || '',
        address: supplierToEdit.address || '',
        contactName: supplierToEdit.contactName || '',
        phoneReference: supplierToEdit.phoneReference || '',
        notes: supplierToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        isInternal: false,
        marketPlace: '',
        boothNumber: '',
        address: '',
        contactName: '',
        phoneReference: '',
        notes: '',
      });
    }
    setErrorMsg('');
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre de la tienda o proveedor es obligatorio.');
      return;
    }

    try {
      setErrorMsg('');
      const input = {
        name: formData.name.trim(),
        isInternal: formData.isInternal,
        marketPlace: formData.marketPlace.trim() || null,
        boothNumber: formData.boothNumber.trim() || null,
        address: formData.address.trim() || null,
        contactName: formData.contactName.trim() || null,
        phoneReference: formData.phoneReference.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (supplierToEdit && supplierToEdit.id) {
        const { data } = await updateSupplier({
          variables: { id: supplierToEdit.id, input }
        });
        if (onSaved && data?.updateSupplier) {
          onSaved(data.updateSupplier);
        }
      } else {
        const { data } = await createSupplier({
          variables: { input }
        });
        if (onSaved && data?.createSupplier) {
          onSaved(data.createSupplier);
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el proveedor');
    }
  };

  const isSaving = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1420] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {supplierToEdit ? 'Editar Proveedor / Caseta' : 'Registrar Nuevo Proveedor'}
              </h2>
              <p className="text-xs text-slate-400">
                Directorio comercial de Montero y mercados de Santa Cruz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Tienda / Proveedor <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ej: Importadora Celular Montero / Caseta Don Mario"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lugar / Mercado Comercial
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ej: Chiriguano, Central"
                  value={formData.marketPlace}
                  onChange={(e) => setFormData({ ...formData, marketPlace: e.target.value })}
                  className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nº de Caseta / Pasillo
              </label>
              <input
                type="text"
                placeholder="Ej: Caseta 42, Pasillo 3"
                value={formData.boothNumber}
                onChange={(e) => setFormData({ ...formData, boothNumber: e.target.value })}
                className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de Contacto / Técnico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ej: Téc. Roberto"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Celular / WhatsApp (+591)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ej: 71602592"
                  value={formData.phoneReference}
                  onChange={(e) => setFormData({ ...formData, phoneReference: e.target.value })}
                  className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Especialidad o Notas
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Ej: Pantallas OLED originales, Flex de carga, Baterías"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#161D2C] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isInternal}
                onChange={(e) => setFormData({ ...formData, isInternal: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
              />
              <span className="text-xs text-slate-300 font-medium">
                ¿Es stock propio de PhoneFix?
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Guardando...' : supplierToEdit ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
