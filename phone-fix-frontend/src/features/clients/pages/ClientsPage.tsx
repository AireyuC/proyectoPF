import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  Search, 
  UserPlus, 
  Star, 
  MessageCircle, 
  User, 
  RefreshCw,
  Phone
} from 'lucide-react';
import { GET_CLIENTS, CREATE_CLIENT } from '../../../api/graphql';
import { createWhatsAppLink } from '../../../utils/format';
import { Modal } from '../../../components/common/Modal';

export const ClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [ci, setCi] = useState('');
  const [phoneReference, setPhoneReference] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, loading, refetch } = useQuery<any>(GET_CLIENTS, {
    variables: { search: searchTerm.trim() || null },
    fetchPolicy: 'network-only'
  });

  const [createClientMutation, { loading: creating }] = useMutation<any>(CREATE_CLIENT, {
    onCompleted: () => {
      setIsModalOpen(false);
      setFullName('');
      setPhonePrimary('');
      setCi('');
      setPhoneReference('');
      setIsVip(false);
      setNotes('');
      setErrorMsg('');
      refetch();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Error al guardar cliente.');
    }
  });

  const clients = data?.clients || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !phonePrimary.trim()) {
      setErrorMsg('Nombre y Celular WhatsApp son obligatorios.');
      return;
    }

    createClientMutation({
      variables: {
        input: {
          fullName: fullName.trim(),
          phonePrimary: phonePrimary.trim(),
          ci: ci.trim() || null,
          phoneReference: phoneReference.trim() || null,
          isVip,
          notes: notes.trim() || null
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Directorio de Clientes
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Historial de fidelización, clientes VIP y contactos de referencia
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
        >
          <UserPlus size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3.5 text-[#64748B]" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, celular o CI..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0D121F] border border-[#1E293B] rounded-xl text-white text-xs placeholder-[#64748B] outline-none focus:border-[#00E5FF]"
        />
      </div>

      {/* Grid de Clientes */}
      {loading && (
        <div className="py-20 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#00E5FF]" />
          <span>Cargando clientes...</span>
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="py-20 text-center bg-[#0D121F] rounded-3xl border border-[#1E293B] p-8 space-y-3">
          <User className="mx-auto text-[#64748B]" size={36} />
          <h3 className="font-bold text-white text-sm">No se encontraron clientes</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c: any) => (
          <div
            key={c.id}
            className="bg-[#0D121F] border border-[#1E293B] hover:border-[#00E5FF]/40 rounded-2xl p-5 space-y-3 transition-all hover:glow-cyan-subtle"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#3B82F6]/20 border border-[#00E5FF]/30 flex items-center justify-center font-bold text-[#00E5FF]">
                  {c.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {c.fullName}
                    {c.isVip && (
                      <span className="p-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]" title="Cliente VIP">
                        <Star size={12} fill="#F59E0B" />
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">CI: {c.ci || 'Sin registrar'}</p>
                </div>
              </div>

              <a
                href={createWhatsAppLink(c.phonePrimary, `Hola ${c.fullName}, te saludamos de PhoneFix.`)}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors cursor-pointer"
                title="Mensaje WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-[#00E5FF]" /> {c.phonePrimary}
              </span>
              {c.phoneReference && (
                <span className="text-[11px] text-[#64748B]">Ref: {c.phoneReference}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Cliente */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Cliente" maxWidth="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Nombres y Apellidos *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ej. Ronald Justiniano"
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">WhatsApp Principal *</label>
              <input
                type="text"
                required
                value={phonePrimary}
                onChange={e => setPhonePrimary(e.target.value)}
                placeholder="77012345"
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">C.I. / NIT</label>
              <input
                type="text"
                value={ci}
                onChange={e => setCi(e.target.value)}
                placeholder="8923412 SC"
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Teléfono de Referencia</label>
            <input
              type="text"
              value={phoneReference}
              onChange={e => setPhoneReference(e.target.value)}
              placeholder="Telf. de casa o familiar"
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <label className="flex items-center gap-2 p-3 bg-[#131926] border border-[#1E293B] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isVip}
              onChange={e => setIsVip(e.target.checked)}
              className="accent-[#00E5FF]"
            />
            <span className="text-[#94A3B8]">Marcar como Cliente VIP / Revendedor</span>
          </label>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
          >
            {creating ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </form>
      </Modal>

    </div>
  );
};
