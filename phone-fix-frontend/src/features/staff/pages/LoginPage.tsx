import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../../../context/AuthContext';
import { Smartphone, Lock, User } from 'lucide-react';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      userId
      role
    }
  }
`;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [executeLogin, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      if (data.login) {
        login(data.login.token, data.login.userId, data.login.role);
        navigate('/'); // Redirigir al dashboard al entrar con éxito
      } else {
        setLoginError('Credenciales incorrectas');
      }
    },
    onError: (error: any) => {
      setLoginError(error.message || 'Ocurrió un error al conectar con el servidor.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
      setLoginError('Por favor completa todos los campos.');
      return;
    }
    executeLogin({ variables: { username, password } });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 text-slate-800">
      
      {/* Full Screen Background Image (Light & Clean) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-60 select-none pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop)' }}
      />
      
      {/* Light Ambient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-100/90 via-white/80 to-slate-200/90" />

      {/* Decorative Teal & Cyan Blurs behind the modal */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-300/20 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Centered Glassmorphism Card (Light Theme) */}
      <div className="relative z-10 w-full max-w-lg bg-white/70 backdrop-blur-2xl border border-white p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Header Branding */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 mb-6 shadow-sm">
             <Smartphone className="w-12 h-12 text-teal-500" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
            PHONE<span className="text-teal-500">FIX</span>
          </h1>
          <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">
            Portal de Administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Input Usuario */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1 tracking-wider uppercase">Usuario</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-teal-500 text-slate-400 transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-lg shadow-sm"
                placeholder="Ingresa tu usuario"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1 tracking-wider uppercase">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-teal-500 text-slate-400 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-lg shadow-sm font-sans tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center font-semibold shadow-sm animate-pulse">
              {loginError}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 focus:ring-4 focus:ring-teal-500/30 text-white rounded-2xl font-bold tracking-wide shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-lg"
            >
              {loading ? (
                <span className="animate-pulse">Verificando...</span>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </div>
          
        </form>
        
      </div>
    
    </div>
  );
};

