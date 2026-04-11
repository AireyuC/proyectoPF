import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura de nuestro Usuario según el Backend
interface User {
  id: number;
  role: string;
}

// Estructura de nuestro Contexto
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user_id: number, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // Un flag de carga inicial para no brincar al login si ya teníamos datos
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Al cargar la app, revisamos si ya teníamos un token guardado
    const savedToken = localStorage.getItem('jwt_token');
    const savedRole = localStorage.getItem('user_role');
    const savedId = localStorage.getItem('user_id');

    if (savedToken && savedRole && savedId) {
      setToken(savedToken);
      setUser({ id: Number(savedId), role: savedRole });
    }
    
    setIsInitializing(false);
  }, []);

  const login = (newToken: string, userId: number, role: string) => {
    // Guardamos en estado
    setToken(newToken);
    setUser({ id: userId, role });

    // Persistimos en caso de que refresque el navegador
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', userId.toString());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
  };

  // Prevenir parpadeos mientras lee el localStorage
  if (isInitializing) return null;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
