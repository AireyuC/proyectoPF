import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Key, 
  Check, 
  RefreshCw,
  Plus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { 
  GET_USERS, 
  GET_ROLES, 
  GET_PERMISSIONS, 
  CREATE_USER, 
  ASSIGN_USER_ROLE, 
  SYNC_ROLE_PERMISSIONS,
  CREATE_ROLE 
} from '../../../api/graphql';
import { Modal } from '../../../components/common/Modal';

export const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  
  // Formulario Nuevo Empleado
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [userError, setUserError] = useState('');

  // Formulario Nuevo Rol
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Matriz de Permisos
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<number | null>(null);
  const [selectedPermCodes, setSelectedPermCodes] = useState<string[]>([]);
  const [matrixSuccessMsg, setMatrixSuccessMsg] = useState('');

  // GraphQL
  const { data: usersData, refetch: refetchUsers } = useQuery<any>(GET_USERS, {
    fetchPolicy: 'network-only'
  });
  const { data: rolesData, refetch: refetchRoles } = useQuery<any>(GET_ROLES, {
    fetchPolicy: 'network-only'
  });
  const { data: permsData } = useQuery<any>(GET_PERMISSIONS);

  const [createUserMutation, { loading: creatingUser }] = useMutation<any>(CREATE_USER);
  const [assignRoleMutation] = useMutation<any>(ASSIGN_USER_ROLE);
  const [syncPermsMutation, { loading: syncingPerms }] = useMutation<any>(SYNC_ROLE_PERMISSIONS);
  const [createRoleMutation] = useMutation<any>(CREATE_ROLE);

  const users = usersData?.users || [];
  const roles = rolesData?.roles || [];
  const permissions = permsData?.permissions || [];

  // Agrupar permisos por módulo
  const permsByModule = permissions.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  // Cargar permisos al seleccionar un rol en la matriz
  const handleSelectRoleForMatrix = (roleId: number) => {
    setSelectedRoleForMatrix(roleId);
    setMatrixSuccessMsg('');
    const r = roles.find((item: any) => item.id === roleId);
    if (r) {
      setSelectedPermCodes(r.permissions || []);
    }
  };

  const togglePermCode = (code: string) => {
    setSelectedPermCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleModuleAll = (moduleName: string) => {
    const modulePerms = permsByModule[moduleName] || [];
    const moduleCodes = modulePerms.map((p: any) => p.code);
    const allSelected = moduleCodes.every((c: string) => selectedPermCodes.includes(c));

    if (allSelected) {
      // Desmarcar todos del módulo
      setSelectedPermCodes(prev => prev.filter(c => !moduleCodes.includes(c)));
    } else {
      // Marcar todos del módulo
      const combined = Array.from(new Set([...selectedPermCodes, ...moduleCodes]));
      setSelectedPermCodes(combined);
    }
  };

  const handleSaveMatrix = async () => {
    if (!selectedRoleForMatrix) return;
    try {
      await syncPermsMutation({
        variables: {
          roleId: selectedRoleForMatrix,
          permissionCodes: selectedPermCodes
        }
      });
      setMatrixSuccessMsg('¡Permisos actualizados y aplicados exitosamente!');
      refetchRoles();
      refetchUsers();
      setTimeout(() => setMatrixSuccessMsg(''), 4000);
    } catch (err: any) {
      setUserError(err.message || 'Error al guardar permisos.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    if (!username.trim() || !password.trim()) {
      setUserError('Usuario y contraseña son requeridos.');
      return;
    }

    try {
      await createUserMutation({
        variables: {
          username: username.trim(),
          password: password.trim(),
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          email: email.trim() || null,
          roleId: selectedRoleId
        }
      });
      setIsNewUserModalOpen(false);
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setSelectedRoleId(null);
      refetchUsers();
    } catch (err: any) {
      setUserError(err.message || 'Error al crear usuario.');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    await createRoleMutation({
      variables: {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || null,
        permissionCodes: []
      }
    });

    setIsNewRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
    refetchRoles();
  };

  const handleAssignUserRole = async (userId: number, roleIdStr: string) => {
    const roleId = parseInt(roleIdStr);
    if (!roleId) return;
    await assignRoleMutation({
      variables: { userId, roleId }
    });
    refetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-[#00E5FF]" size={26} />
            Personal, Roles & Permisos (RBAC)
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Administración de cuentas de técnicos, recepcionistas y matriz modular de accesos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'USERS' ? (
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
            >
              <UserPlus size={16} />
              Nuevo Empleado
            </button>
          ) : (
            <button
              onClick={() => setIsNewRoleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
            >
              <Plus size={16} />
              Crear Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex gap-4 border-b border-[#1E293B] text-xs font-bold">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'border-[#00E5FF] text-[#00E5FF]'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Users size={16} />
          Cuentas de Personal ({users.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('ROLES');
            if (!selectedRoleForMatrix && roles.length > 0) {
              handleSelectRoleForMatrix(roles[0].id);
            }
          }}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ROLES'
              ? 'border-[#00E5FF] text-[#00E5FF]'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Key size={16} />
          Matriz de Roles & Permisos
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: CUENTAS DE USUARIOS */}
      {/* ======================================================== */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#131926] text-[#94A3B8] border-b border-[#1E293B] text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Nombre Completo</th>
                    <th className="p-4">Correo</th>
                    <th className="p-4">Rol Asignado</th>
                    <th className="p-4">Acceso Total</th>
                    <th className="p-4 text-right">Cambiar Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-[#131926]/50">
                      <td className="p-4 font-mono font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center justify-center text-xs font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                        <span>{u.username}</span>
                      </td>
                      <td className="p-4 text-[#94A3B8]">
                        {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : '—'}
                      </td>
                      <td className="p-4 text-[#94A3B8]">{u.email || '—'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                          {u.roleDisplay}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.isAdmin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981]">
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">
                            {u.permissions?.length || 0} permisos
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={u.roleId || ''}
                          onChange={e => handleAssignUserRole(u.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-[#131926] border border-[#1E293B] rounded-xl text-white text-[11px] outline-none focus:border-[#00E5FF] cursor-pointer"
                        >
                          <option value="">Seleccionar rol</option>
                          {roles.map((r: any) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: MATRIZ DE ROLES Y PERMISOS */}
      {/* ======================================================== */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          
          {/* Barra de Selección de Rol y Guardado */}
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                Configurando Rol:
              </span>
              <div className="flex flex-wrap gap-2">
                {roles.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRoleForMatrix(r.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedRoleForMatrix === r.id
                        ? 'bg-[#00E5FF] text-[#080B11] border-[#00E5FF] shadow-md shadow-[#00E5FF]/20'
                        : 'bg-[#131926] text-[#94A3B8] border-[#1E293B] hover:text-white'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveMatrix}
              disabled={syncingPerms || !selectedRoleForMatrix}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-110 active:scale-[0.99] text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-[#10B981]/20 disabled:opacity-50 shrink-0"
            >
              {syncingPerms ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Guardar Matriz de Permisos
            </button>
          </div>

          {matrixSuccessMsg && (
            <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/30 rounded-2xl flex items-center gap-2 text-[#10B981] text-xs font-bold">
              <CheckCircle2 size={18} />
              <span>{matrixSuccessMsg}</span>
            </div>
          )}

          {/* Cuadrícula de Permisos por Módulo */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Object.keys(permsByModule).map(moduleName => {
              const modulePerms = permsByModule[moduleName];
              const moduleCodes = modulePerms.map((p: any) => p.code);
              const allChecked = moduleCodes.every((c: string) => selectedPermCodes.includes(c));

              return (
                <div key={moduleName} className="bg-[#0D121F] border border-[#1E293B] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-4 bg-[#00E5FF] rounded-full" />
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                        Módulo {moduleName}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModuleAll(moduleName)}
                      className="text-[10px] text-[#00E5FF] hover:underline cursor-pointer font-bold"
                    >
                      {allChecked ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {modulePerms.map((perm: any) => {
                      const isChecked = selectedPermCodes.includes(perm.code);
                      return (
                        <div
                          key={perm.code}
                          onClick={() => togglePermCode(perm.code)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-white glow-cyan-subtle'
                              : 'bg-[#131926] border-[#1E293B] text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked ? 'bg-[#00E5FF] border-[#00E5FF] text-black font-extrabold' : 'border-[#64748B]'
                          }`}>
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs leading-tight">
                              {perm.name}
                            </p>
                            <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">
                              {perm.description}
                            </p>
                            <span className="text-[9px] font-mono text-[#00E5FF]/70 mt-1 block">
                              {perm.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Modal Nuevo Empleado */}
      <Modal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} title="Crear Cuenta de Empleado" maxWidth="max-w-md">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {userError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {userError}
            </div>
          )}

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Nombre de Usuario *</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej. tec_carlos o recepcion1"
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Contraseña Inicial *</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Carlos"
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-semibold mb-1">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Justiniano"
                className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Rol a Asignar</label>
            <select
              value={selectedRoleId || ''}
              onChange={e => setSelectedRoleId(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            >
              <option value="">-- Sin Rol Específico --</option>
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creatingUser}
            className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/20"
          >
            {creatingUser ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </Modal>

      {/* Modal Crear Rol */}
      <Modal isOpen={isNewRoleModalOpen} onClose={() => setIsNewRoleModalOpen(false)} title="Crear Nuevo Rol Personalizado" maxWidth="max-w-sm">
        <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Nombre del Rol *</label>
            <input
              type="text"
              required
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="Ej. Técnico Especialista Microelectrónica"
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div>
            <label className="block text-[#94A3B8] font-semibold mb-1">Descripción Breve</label>
            <textarea
              rows={2}
              value={newRoleDesc}
              onChange={e => setNewRoleDesc(e.target.value)}
              placeholder="Responsable de reparaciones de nivel 3..."
              className="w-full px-3 py-2 bg-[#131926] border border-[#1E293B] rounded-xl text-white outline-none focus:border-[#00E5FF] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#00E5FF] text-[#080B11] font-bold rounded-xl text-xs hover:brightness-110 cursor-pointer"
          >
            Crear Rol y Configurar Permisos
          </button>
        </form>
      </Modal>

    </div>
  );
};
