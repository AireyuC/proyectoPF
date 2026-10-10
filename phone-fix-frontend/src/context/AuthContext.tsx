import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: number;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  hasPermission: (permCode: string) => boolean;
  login: (token: string, userId: number, role: string, permissions?: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedRole = localStorage.getItem('user_role');
    const savedId = localStorage.getItem('user_id');
    const savedPerms = localStorage.getItem('user_perms');

    if (savedToken && savedRole && savedId) {
      let perms: string[] = [];
      try {
        perms = savedPerms ? JSON.parse(savedPerms) : [];
      } catch {
        perms = [];
      }
      setToken(savedToken);
      setUser({ id: Number(savedId), role: savedRole, permissions: perms });
    }
    
    setIsInitializing(false);
  }, []);

  const login = (newToken: string, userId: number, role: string, permissions: string[] = []) => {
    setToken(newToken);
    setUser({ id: userId, role, permissions });

    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_id', userId.toString());
    localStorage.setItem('user_perms', JSON.stringify(permissions));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_perms');
  };

  const hasPermission = (permCode: string): boolean => {
    if (!user) return false;
    const r = user.role.toUpperCase();
    if (r === 'ADMIN' || r === 'ADMINISTRADOR' || r === 'SUPERUSER') {
      return true;
    }
    return user.permissions?.includes(permCode) ?? false;
  };

  if (isInitializing) return null;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, hasPermission, login, logout }}>
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
