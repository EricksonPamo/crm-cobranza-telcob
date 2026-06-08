import { createContext, useContext, ReactNode } from 'react';
import {
  testConnection,
  PerfilUsuario,
  Empresa,
  Producto,
  Base,
  CargueTipo,
  Origen,
  TelefonoPreview,
  TelefonoUploadResult,
  RetiroTipo,
  RetiroPreview,
  RetiroUploadResult,
  Cargue,
  TablaDef,
  DatoTipo,
  TablaColumna,
  ProductoHomologacion,
  ProductoHomologacionInput,
  FichaTipoDato,
  FichaSegmento,
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
  getCargueTipos,
  getOrigenes,
  previewTelefonos,
  uploadTelefonos,
  getRetiroTipos,
  previewRetiro,
  uploadRetiro,
  getTablas,
  getDatoTipos,
  getTablaColumnaByTipoCargue,
  getProductoHomologaciones,
  createProductoHomologacionBatch,
  updateProductoHomologacion,
  deleteProductoHomologacion,
  getCarguesByProducto,
  createCargue,
  inactivateCarguesByTipoCargue,
  updateBaseCargueGestionar,
  getCarguesActivosPersona,
  getCarguesByBase,
  toggleCargueEstado,
  batchInsertPersonas,
  batchInsertPagos,
  batchInsertCampanas,
  getPersonasIdByCargue,
  getPagosIdByCargue,
  getCampanasIdByCargue,
  getProductoHomologacionByProductoTipo,
  getBasesByProducto,
  getFichaTipoDato,
  getFichaSegmento,
  CanalComunicacion,
  TipificacionTipo,
  TipificacionRecord,
  TipificacionImportRow,
  TipificacionImportResult,
  TipificacionRazonNoPago,
  RazonNoPago,
  Vinculo,
  TipificacionVinculo,
  getCanalComunicacion,
  getTipificacionTipo,
  getTipificaciones,
  getTipificacionesByProducto,
  importTipificacion,
  createTipificacion,
  getTipificacionRazonesNoPago,
  getRazonNoPago,
  getVinculos,
  getTipificacionVinculos,
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
  getCargueTipos: () => Promise<CargueTipo[]>;
  getOrigenes: () => Promise<Origen[]>;
  previewTelefonos: (idorigen: string, telefonos: { identificacion: string; telefono: string }[]) => Promise<TelefonoPreview>;
  uploadTelefonos: (data: { idcargue: number; idorigen: string; idusuario: string; telefonos: { identificacion: string; telefono: string }[] }) => Promise<TelefonoUploadResult>;
  getRetiroTipos: () => Promise<RetiroTipo[]>;
  previewRetiro: (idretirotipo: string, retiros: { valor: string; motivo: string }[]) => Promise<RetiroPreview>;
  uploadRetiro: (data: { idcargue: number; idretirotipo: string; idusuario: string; retiros: { valor: string; motivo: string }[] }) => Promise<RetiroUploadResult>;
  getTablas: () => Promise<TablaDef[]>;
  getDatoTipos: () => Promise<DatoTipo[]>;
  getTablaColumnaByTipoCargue: (idtipocargue: string) => Promise<TablaColumna[]>;
  getProductoHomologaciones: () => Promise<ProductoHomologacion[]>;
  createProductoHomologacionBatch: (records: ProductoHomologacionInput[]) => Promise<ProductoHomologacion[]>;
  updateProductoHomologacion: (idproducto: string, idhomologacion: string, data: Partial<Pick<ProductoHomologacion, 'obligatorio' | 'filtro' | 'nombreCampoOrigen' | 'nombreAliasOrigen' | 'idtipodatoficha' | 'idsegmentoficha' | 'esvisible' | 'ordenvisualizacion' | 'estado'>>, idusuariomod: string) => Promise<ProductoHomologacion>;
  deleteProductoHomologacion: (idproducto: string, idhomologacion: string, idusuariomod: string) => Promise<void>;
  getCarguesByProducto: (idproducto: string) => Promise<Cargue[]>;
  createCargue: (data: { idtipocargue: string; idbase: string; nombrearchivo: string; cantidadregistros: number; idusuario: string; idusuariomod: string; estado: string }) => Promise<{ idcargue: number }>;
  inactivateCarguesByTipoCargue: (idbase: string, idtipocargue: string, excludeIdcargue: number, idusuariomod: string) => Promise<void>;
  updateBaseCargueGestionar: (idbase: string, idcarguegestionar: number | null, idusuariomod: string) => Promise<void>;
  getCarguesActivosPersona: (idbase: string) => Promise<{ idcargue: number; nombrearchivo: string; cantidadregistros: number }[]>;
  getCarguesByBase: (idbase: string) => Promise<Cargue[]>;
  toggleCargueEstado: (idcargue: number, estado: string, idusuariomod: string) => Promise<Cargue>;
  batchInsertPersonas: (rows: Record<string, any>[], batchSize?: number, onProgress?: (done: number, total: number) => void) => Promise<void>;
  batchInsertPagos: (rows: Record<string, any>[], batchSize?: number, onProgress?: (done: number, total: number) => void) => Promise<void>;
  batchInsertCampanas: (rows: Record<string, any>[], batchSize?: number, onProgress?: (done: number, total: number) => void) => Promise<void>;
  getPersonasIdByCargue: (idcargue: number) => Promise<{ idpersona: string; identificacion: string }[]>;
  getPagosIdByCargue: (idcargue: number) => Promise<{ idpago: string; identificacion: string }[]>;
  getCampanasIdByCargue: (idcargue: number) => Promise<{ idcampana: string; identificacion: string }[]>;
  getProductoHomologacionByProductoTipo: (idproducto: string, idtipocargue: string) => Promise<ProductoHomologacion[]>;
  getBasesByProducto: (idproducto: string) => Promise<Base[]>;
  getFichaTipoDato: () => Promise<FichaTipoDato[]>;
  getFichaSegmento: (idtipodatoficha?: string) => Promise<FichaSegmento[]>;
  getCanalComunicacion: () => Promise<CanalComunicacion[]>;
  getTipificacionTipo: () => Promise<TipificacionTipo[]>;
  getTipificaciones: () => Promise<TipificacionRecord[]>;
  getTipificacionesByProducto: (idproducto: string) => Promise<TipificacionRecord[]>;
  importTipificacion: (idproducto: string, idusuario: string, rows: TipificacionImportRow[]) => Promise<TipificacionImportResult>;
  createTipificacion: (data: {
    idcanalcomunicacion: string;
    idtipotipificacion: string;
    codaccion?: string;
    accion?: string;
    codresultado?: string;
    resultado?: string;
    resultado1?: string;
    resultado2?: string;
    resultado3?: string;
    resultado4?: string;
    resultado5?: string;
    destacado?: string;
    mostrarweb?: string;
    peso?: number;
    disponeregla?: string;
    tienerazonnopago?: boolean;
    idusuario: string;
    estado?: string;
    razonesNoPago?: string[];
    vinculos?: string[];
  }) => Promise<TipificacionRecord>;
  getTipificacionRazonesNoPago: (idtipificacion: string) => Promise<TipificacionRazonNoPago[]>;
  getRazonNoPago: () => Promise<RazonNoPago[]>;
  getVinculos: () => Promise<Vinculo[]>;
  getTipificacionVinculos: (idtipificacion: string) => Promise<TipificacionVinculo[]>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const value: DatabaseContextType = {
    testConnection,
    getUsuarios, getUsuarioById, getUsuarioByUsername, createUsuario, updateUsuario, deleteUsuario,
    getEmpresas, getEmpresaById, getEmpresaByRuc, createEmpresa, updateEmpresa, deleteEmpresa,
    getProductos, getProductoById, createProducto, updateProducto, deleteProducto,
    getBases, getBaseById, createBase, updateBase, deleteBase,
    getCargueTipos, getOrigenes, previewTelefonos, uploadTelefonos,
    getRetiroTipos, previewRetiro, uploadRetiro, getTablas, getDatoTipos, getTablaColumnaByTipoCargue,
    getProductoHomologaciones, createProductoHomologacionBatch,
    updateProductoHomologacion, deleteProductoHomologacion,
    getCarguesByProducto, createCargue, inactivateCarguesByTipoCargue,
    updateBaseCargueGestionar, getCarguesActivosPersona, getCarguesByBase, toggleCargueEstado,
    batchInsertPersonas, batchInsertPagos, batchInsertCampanas,
    getPersonasIdByCargue, getPagosIdByCargue, getCampanasIdByCargue,
    getProductoHomologacionByProductoTipo,
    getBasesByProducto,
    getFichaTipoDato,
    getFichaSegmento,
    getCanalComunicacion,
    getTipificacionTipo,
    getTipificaciones,
    getTipificacionesByProducto,
    importTipificacion,
    createTipificacion,
    getTipificacionRazonesNoPago,
    getRazonNoPago,
    getVinculos,
    getTipificacionVinculos,
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