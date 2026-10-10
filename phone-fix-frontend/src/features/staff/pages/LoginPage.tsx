import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../../../context/AuthContext';
import { LOGIN_MUTATION } from '../../../api/graphql';
import { Lock, User, ShieldCheck, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [executeLogin, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      if (data.login) {
        login(data.login.token, data.login.userId, data.login.role, data.login.permissions || []);
        navigate('/');
      } else {
        setLoginError('Credenciales incorrectas o usuario deshabilitado.');
      }
    },
    onError: (error: any) => {
      setLoginError(error.message || 'Error de conexión con el servidor GraphQL.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
      setLoginError('Por favor completa tu usuario y contraseña.');
      return;
    }
    executeLogin({ variables: { username, password } });
  };

  return (
    <div className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-[#080B11] text-white p-4">
      
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-[#3B82F6]/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Subtle Grid overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
      />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0D121F]/90 backdrop-blur-2xl border border-[#1E293B] p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/80 glow-cyan-subtle">
        
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#00E5FF]/5 border border-[#00E5FF]/30 flex items-center justify-center mb-4 glow-cyan-subtle">
            <Zap className="w-8 h-8 text-[#00E5FF]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
            PHONE<span className="text-[#00E5FF]">FIX</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5 mt-1">
            <ShieldCheck size={14} className="text-[#00E5FF]" />
            Sistema de Taller & Punto de Venta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input Usuario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase ml-1">
              Usuario o Técnico
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#00E5FF] transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 bg-[#131926] border border-[#1E293B] rounded-xl focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none transition-all text-white placeholder-[#64748B] text-sm"
                placeholder="Ej. aireyu o usser"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase ml-1">
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#00E5FF] transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 bg-[#131926] border border-[#1E293B] rounded-xl focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none transition-all text-white placeholder-[#64748B] text-sm tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center animate-shake">
              {loginError}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:brightness-110 active:scale-[0.99] text-[#080B11] font-bold rounded-xl shadow-lg shadow-[#00E5FF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#080B11] border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </div>
          
        </form>

        <div className="mt-8 pt-4 border-t border-[#1E293B] text-center">
          <p className="text-[11px] text-[#64748B]">
            PhoneFix Montero • Soporte Técnico Especializado
          </p>
        </div>

      </div>
    
    </div>
  );
};
