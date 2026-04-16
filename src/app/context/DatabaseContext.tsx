import { createContext, useContext, ReactNode } from 'react';
import {
  testConnection,
  PerfilUsuario,
  Empresa,
  Producto,
  Base,
  getUsuarios,
  getUsuarioById,
  getUsuarioByUsername,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEmpresas,
  getEmpresaById,
  getEmpresaByRuc,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getBases,
  getBaseById,
  createBase,
  updateBase,
  deleteBase,
} from '../lib/db';

interface DatabaseContextType {
  testConnection: () => Promise<boolean>;
  getUsuarios: () => Promise<PerfilUsuario[]>;
  getUsuarioById: (id: string) => Promise<PerfilUsuario | undefined>;
  getUsuarioByUsername: (username: string) => Promise<PerfilUsuario | undefined>;
  createUsuario: (data: Omit<PerfilUsuario, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'ultimo_acceso'>) => Promise<PerfilUsuario>;
  updateUsuario: (id: string, data: Partial<PerfilUsuario>) => Promise<PerfilUsuario>;
  deleteUsuario: (id: string) => Promise<void>;
  getEmpresas: () => Promise<Empresa[]>;
  getEmpresaById: (idempresa: string) => Promise<Empresa | undefined>;
  getEmpresaByRuc: (ruc: string) => Promise<Empresa | undefined>;
  createEmpresa: (data: Omit<Empresa, 'idempresa' | 'fechacreacion' | 'fechamodificacion'>) => Promise<Empresa>;
  updateEmpresa: (idempresa: string, data: Partial<Empresa>, idusuariomod: string) => Promise<Empresa>;
  deleteEmpresa: (idempresa: string, idusuariomod: string) => Promise<void>;
  getProductos: () => Promise<Producto[]>;
  getProductoById: (idproducto: string) => Promise<Producto | undefined>;
  createProducto: (data: Omit<Producto, 'idproducto' | 'fechacreacion' | 'fechamodificacion'>) => Promise<Producto>;
  updateProducto: (idproducto: string, data: Partial<Producto>, idusuariomod: string) => Promise<Producto>;
  deleteProducto: (idproducto: string, idusuariomod: string) => Promise<void>;
  getBases: () => Promise<Base[]>;
  getBaseById: (idbase: string) => Promise<Base | undefined>;
  createBase: (data: Omit<Base, 'idbase' | 'fechacreacion' | 'fechamodificacion'>) => Promise<Base>;
  updateBase: (idbase: string, data: Partial<Base>, idusuariomod: string) => Promise<Base>;
  deleteBase: (idbase: string, idusuariomod: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const value: DatabaseContextType = {
    testConnection,
    getUsuarios, getUsuarioById, getUsuarioByUsername, createUsuario, updateUsuario, deleteUsuario,
    getEmpresas, getEmpresaById, getEmpresaByRuc, createEmpresa, updateEmpresa, deleteEmpresa,
    getProductos, getProductoById, createProducto, updateProducto, deleteProducto,
    getBases, getBaseById, createBase, updateBase, deleteBase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}