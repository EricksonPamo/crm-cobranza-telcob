import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, roleMapBDtoApp } from '../types/user';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = useCallback(async (username: string, _password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        throw new Error('Error al conectar con el servidor');
      }

      const dbUser = await res.json();

      if (!dbUser) {
        setAuthError('Usuario no encontrado. Verifique que el usuario exista y esté activo.');
        return false;
      }

      const appRol = roleMapBDtoApp[dbUser.tipo_usuario] || 'cobrador';

      const user: User = {
        id: dbUser.id,
        nombre: dbUser.nombre_completo,
        email: dbUser.email,
        telefono: '',
        rol: appRol,
        estado: dbUser.estado === 'activo' ? 'activo' : 'inactivo',
        fechaCreacion: new Date().toISOString(),
      };

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    } catch (error: any) {
      console.error('Error en login:', error);
      setAuthError(error?.message || 'Error al conectar con el servidor. Intente nuevamente.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: !!currentUser,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}