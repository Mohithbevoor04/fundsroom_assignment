import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { loginApi, getMeApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (roleEmail: string) => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('erp_crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('erp_crm_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getMeApi();
          setUser(userData);
          localStorage.setItem('erp_crm_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Failed to verify token on startup', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await loginApi(email, pass);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('erp_crm_token', res.token);
    localStorage.setItem('erp_crm_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_crm_token');
    localStorage.removeItem('erp_crm_user');
  };

  const switchRoleQuick = async (roleEmail: string) => {
    await login(roleEmail, 'password123');
  };

  const hasRole = (...allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin bypass
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRoleQuick, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
