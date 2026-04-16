import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, roleMapBDtoApp } from '../types/user';
import { sql } from '../lib/db';

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
      if (!sql) {
        throw new Error('No hay conexión a la base de datos. Verifique VITE_DATABASE_URL');
      }

      const users = await sql`
        SELECT id, username, nombre_completo, email, tipo_usuario, estado
        FROM perfiles_usuario
        WHERE (username = ${username} OR email = ${username})
          AND estado = 'activo'
      `;

      if (users.length === 0) {
        setAuthError('Usuario no encontrado. Verifique que el usuario exista y esté activo.');
        return false;
      }

      const dbUser = users[0];
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