const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// =====================================================
// TIPOS
// =====================================================

export interface PerfilUsuario {
  id: string;
  username: string;
  password_hash: string;
  nombre_completo: string;
  email: string;
  tipo_usuario: string;
  estado: string;
  ultimo_acceso: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Empresa {
  idempresa: string;
  razonsocial: string;
  ruc: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  descripcion: string | null;
  logo: string | null;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string;
  estado: string;
}

export interface Producto {
  idproducto: string;
  nombre: string;
  idempresa: string;
  empresanombre: string;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string;
  estado: string;
}

export interface Base {
  idbase: string;
  nombre: string;
  alias: string | null;
  idproducto: string;
  productonombre: string;
  idcarguegestionar: number | null;
  maximocuotas: number | null;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string;
  estado: string;
}

export interface CargueTipo {
  idtipocargue: string;
  nombre: string;
  estado: string;
}

export interface Origen {
  idorigen: string;
  nombre: string;
  estado: string;
}

export interface TelefonoPreview {
  totalFilas: number;
  telefonosExistentes: number;
  telefonosNuevos: number;
  relacionesExistentes: number;
  relacionesNuevas: number;
}

export interface TelefonoUploadResult {
  success: boolean;
  telefonosInsertados: number;
  relacionesInsertadas: number;
  relacionesDuplicadas: number;
}

export interface RetiroTipo {
  idretirotipo: string;
  nombre: string;
  estado: string;
}

export interface RetiroPreview {
  totalFilas: number;
  retirosValidos: number;
  retirosInvalidos: number;
}

export interface RetiroUploadResult {
  success: boolean;
  retirosInsertados: number;
}

export interface Cargue {
  idcargue: number;
  idtipocargue: string;
  idbase: string;
  nombre?: string;
  nombrearchivo: string;
  cantidadregistros: number;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string | null;
  estado: string;
  productoNombre?: string;
  baseNombre?: string;
  tipoCargueNombre: string;
  usuarioNombre: string;
}

export interface TablaDef {
  idtabla: string;
  nombre: string;
  estado: string;
}

export interface DatoTipo {
  idtipodato: string;
  nombre: string;
  estado: string;
}

export interface TablaColumna {
  idhomologacion: string;
  idtipocargue: string;
  idtabla: string;
  nombreColumna: string;
  idtipoDato: string;
  esobligatorio: boolean;
  esfiltro: boolean;
  tipoCargueNombre: string;
  tablaNombre: string;
  tipoDatoNombre: string;
}

export interface ProductoHomologacion {
  idproducto: string;
  idhomologacion: string;
  idtipocargue: string;
  idtabla: string;
  nombreColumna: string;
  tipoDato: string;
  obligatorio: boolean;
  filtro: boolean;
  nombreCampoOrigen: string | null;
  nombreAliasOrigen: string | null;
  idtipodatoficha: string | null;
  idsegmentoficha: string | null;
  esvisible: boolean;
  ordenvisualizacion: number;
  fecha_creacion: string;
  idusuariocrea: string;
  fechamodificacion: string | null;
  idusuariomod: string | null;
  estado: string;
  productoNombre: string;
  tipoCargueNombre: string;
  tablaNombre: string;
  tipoDatoNombre: string;
  tipoDatoFichaNombre: string | null;
  segmentoFichaNombre: string | null;
}

export interface FichaTipoDato {
  idtipodatoficha: string;
  nombre: string;
  estado: string;
}

export interface FichaSegmento {
  idsegmentoficha: string;
  idtipodatoficha: string;
  nombre: string;
  ordenvisualizacion: number;
  estado: string;
}

export type ProductoHomologacionInput = Omit<ProductoHomologacion,
  'fecha_creacion' | 'fechamodificacion' | 'productoNombre' | 'tipoCargueNombre' | 'tablaNombre' | 'tipoDatoNombre' | 'tipoDatoFichaNombre' | 'segmentoFichaNombre'
>;

// =====================================================
// TEST CONNECTION
// =====================================================

export async function testConnection() {
  try {
    const result = await apiFetch<{ success: boolean; time: string }>('/test-connection');
    console.log('Conexión exitosa:', result.time);
    return true;
  } catch (error) {
    console.error('Error conectando:', error);
    return false;
  }
}

// =====================================================
// USUARIOS
// =====================================================

export async function getUsuarios() {
  return apiFetch<PerfilUsuario[]>('/usuarios');
}

export async function getUsuarioById(id: string) {
  return apiFetch<PerfilUsuario>(`/usuarios/id/${id}`);
}

export async function getUsuarioByUsername(username: string) {
  return apiFetch<PerfilUsuario>(`/usuarios/username/${encodeURIComponent(username)}`);
}

export async function createUsuario(data: Omit<PerfilUsuario, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'ultimo_acceso'>) {
  return apiPost<PerfilUsuario>('/usuarios', data);
}

export async function updateUsuario(id: string, data: Partial<PerfilUsuario>) {
  return apiPut<PerfilUsuario>(`/usuarios/${id}`, data);
}

export async function deleteUsuario(id: string) {
  return apiDelete<void>(`/usuarios/${id}`);
}

// =====================================================
// EMPRESAS
// =====================================================

export async function getEmpresas() {
  return apiFetch<Empresa[]>('/empresas');
}

export async function getEmpresaById(idempresa: string) {
  return apiFetch<Empresa>(`/empresas/${idempresa}`);
}

export async function getEmpresaByRuc(ruc: string) {
  return apiFetch<Empresa>(`/empresas/ruc/${encodeURIComponent(ruc)}`);
}

export async function createEmpresa(data: Omit<Empresa, 'idempresa' | 'fechacreacion' | 'fechamodificacion'>) {
  return apiPost<Empresa>('/empresas', data);
}

export async function updateEmpresa(idempresa: string, data: Partial<Empresa>, idusuariomod: string) {
  return apiPut<Empresa>(`/empresas/${idempresa}`, { ...data, idusuariomod });
}

export async function deleteEmpresa(idempresa: string, idusuariomod: string) {
  return apiDelete<void>(`/empresas/${idempresa}`, { idusuariomod });
}

// =====================================================
// PRODUCTOS
// =====================================================

export async function getProductos() {
  return apiFetch<Producto[]>('/productos');
}

export async function getProductoById(idproducto: string) {
  return apiFetch<Producto>(`/productos/${idproducto}`);
}

export async function createProducto(data: Omit<Producto, 'idproducto' | 'fechacreacion' | 'fechamodificacion'>) {
  return apiPost<Producto>('/productos', data);
}

export async function updateProducto(idproducto: string, data: Partial<Producto>, idusuariomod: string) {
  return apiPut<Producto>(`/productos/${idproducto}`, { ...data, idusuariomod });
}

export async function deleteProducto(idproducto: string, idusuariomod: string) {
  return apiDelete<void>(`/productos/${idproducto}`, { idusuariomod });
}

// =====================================================
// BASES
// =====================================================

export async function getBases() {
  return apiFetch<Base[]>('/bases');
}

export async function getBaseById(idbase: string) {
  return apiFetch<Base>(`/bases/${idbase}`);
}

export async function createBase(data: Omit<Base, 'idbase' | 'fechacreacion' | 'fechamodificacion'>) {
  return apiPost<Base>('/bases', data);
}

export async function updateBase(idbase: string, data: Partial<Base>, idusuariomod: string) {
  return apiPut<Base>(`/bases/${idbase}`, { ...data, idusuariomod });
}

export async function deleteBase(idbase: string, idusuariomod: string) {
  return apiDelete<void>(`/bases/${idbase}`, { idusuariomod });
}

// =====================================================
// CARGUE TIPO
// =====================================================

export async function getCargueTipos() {
  return apiFetch<CargueTipo[]>('/cargue-tipos');
}

// =====================================================
// ORIGEN
// =====================================================

export async function getOrigenes() {
  return apiFetch<Origen[]>('/origenes');
}

// =====================================================
// TELEFONOS
// =====================================================

export async function previewTelefonos(idorigen: string, telefonos: { identificacion: string; telefono: string }[]) {
  return apiPost<TelefonoPreview>('/telefonos/preview', { idorigen, telefonos });
}

export async function uploadTelefonos(data: {
  idcargue: number;
  idorigen: string;
  idusuario: string;
  telefonos: { identificacion: string; telefono: string }[];
}) {
  return apiPost<TelefonoUploadResult>('/telefonos/upload', data);
}

// =====================================================
// RETIRO TIPO
// =====================================================

export async function getRetiroTipos() {
  return apiFetch<RetiroTipo[]>('/retiro-tipos');
}

// =====================================================
// RETIROS
// =====================================================

export async function previewRetiro(idretirotipo: string, retiros: { valor: string; motivo: string }[]) {
  return apiPost<RetiroPreview>('/retiros/preview', { idretirotipo, retiros });
}

export async function uploadRetiro(data: {
  idcargue: number;
  idretirotipo: string;
  idusuario: string;
  retiros: { valor: string; motivo: string }[];
}) {
  return apiPost<RetiroUploadResult>('/retiros/upload', data);
}

// =====================================================
// TABLA
// =====================================================

export async function getTablas() {
  return apiFetch<TablaDef[]>('/tablas');
}

// =====================================================
// DATO TIPO
// =====================================================

export async function getDatoTipos() {
  return apiFetch<DatoTipo[]>('/dato-tipos');
}

// =====================================================
// FICHA TIPO DATO
// =====================================================

export async function getFichaTipoDato() {
  return apiFetch<FichaTipoDato[]>('/ficha-tipo-dato');
}

// =====================================================
// FICHA SEGMENTO
// =====================================================

export async function getFichaSegmento(idtipodatoficha?: string) {
  const path = idtipodatoficha
    ? `/ficha-segmento?idtipodatoficha=${idtipodatoficha}`
    : '/ficha-segmento';
  return apiFetch<FichaSegmento[]>(path);
}

// =====================================================
// TABLA COLUMNA
// =====================================================

export async function getTablaColumnaByTipoCargue(idtipocargue: string) {
  return apiFetch<TablaColumna[]>(`/tabla-columna/${idtipocargue}`);
}

// =====================================================
// PRODUCTO HOMOLOGACION
// =====================================================

export async function getProductoHomologaciones() {
  return apiFetch<ProductoHomologacion[]>('/producto-homologacion');
}

export async function createProductoHomologacionBatch(records: ProductoHomologacionInput[]) {
  return apiPost<ProductoHomologacion[]>('/producto-homologacion/batch', records);
}

export async function updateProductoHomologacion(
  idproducto: string,
  idhomologacion: string,
  data: Partial<Pick<ProductoHomologacion, 'obligatorio' | 'filtro' | 'nombreCampoOrigen' | 'nombreAliasOrigen' | 'idtipodatoficha' | 'idsegmentoficha' | 'esvisible' | 'ordenvisualizacion' | 'estado'>>,
  idusuariomod: string
) {
  return apiPut<ProductoHomologacion>(`/producto-homologacion/${idproducto}/${idhomologacion}`, { ...data, idusuariomod });
}

export async function deleteProductoHomologacion(idproducto: string, idhomologacion: string, idusuariomod: string) {
  return apiDelete<void>(`/producto-homologacion/${idproducto}/${idhomologacion}`, { idusuariomod });
}

export async function getProductoHomologacionByProductoTipo(idproducto: string, idtipocargue: string) {
  return apiFetch<ProductoHomologacion[]>(`/producto-homologacion/${idproducto}/${idtipocargue}`);
}

// =====================================================
// CARGUES
// =====================================================

export async function getCarguesByProducto(idproducto: string) {
  return apiFetch<Cargue[]>(`/cargues/${idproducto}`);
}

export async function createCargue(data: {
  idtipocargue: string;
  idbase: string;
  nombrearchivo: string;
  cantidadregistros: number;
  idusuario: string;
  idusuariomod: string;
  estado: string;
}) {
  return apiPost<{ idcargue: number }>('/cargues', data);
}

export async function inactivateCarguesByTipoCargue(idbase: string, idtipocargue: string, excludeIdcargue: number, idusuariomod: string) {
  return apiPut<void>('/cargues/inactivate', { idbase, idtipocargue, excludeIdcargue, idusuariomod });
}

export async function updateBaseCargueGestionar(idbase: string, idcarguegestionar: number | null, idusuariomod: string) {
  return apiPut<void>(`/bases/${idbase}/cargue-gestionar`, { idcarguegestionar, idusuariomod });
}

export async function getCarguesActivosPersona(idbase: string) {
  return apiFetch<{ idcargue: number; nombrearchivo: string; cantidadregistros: number }[]>(`/cargues-activos-persona/${idbase}`);
}

export async function getCarguesByBase(idbase: string) {
  return apiFetch<Cargue[]>(`/cargues/by-base/${idbase}`);
}

export async function toggleCargueEstado(idcargue: number, estado: string, idusuariomod: string) {
  return apiPut<Cargue>(`/cargues/${idcargue}/estado`, { estado, idusuariomod });
}

// =====================================================
// BATCH INSERT: Personas
// =====================================================

export async function batchInsertPersonas(
  rows: Record<string, any>[],
  batchSize = 200,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (rows.length === 0) return;

  const chunkSize = 5000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await apiPost<{ success: boolean; inserted: number }>('/personas/batch', {
      rows: chunk,
      batchSize,
    });
    const inserted = Math.min(i + chunkSize, rows.length);
    onProgress?.(inserted, rows.length);
  }
}

export async function getPersonasIdByCargue(idcargue: number) {
  return apiFetch<{ idpersona: string; identificacion: string }[]>(`/personas/by-cargue/${idcargue}`);
}

export async function batchInsertPagos(
  rows: Record<string, any>[],
  batchSize = 200,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (rows.length === 0) return;

  const chunkSize = 5000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await apiPost<{ success: boolean; inserted: number }>('/pagos/batch', {
      rows: chunk,
      batchSize,
    });
    const inserted = Math.min(i + chunkSize, rows.length);
    onProgress?.(inserted, rows.length);
  }
}

export async function batchInsertCampanas(
  rows: Record<string, any>[],
  batchSize = 200,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (rows.length === 0) return;

  const chunkSize = 5000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await apiPost<{ success: boolean; inserted: number }>('/campanas/batch', {
      rows: chunk,
      batchSize,
    });
    const inserted = Math.min(i + chunkSize, rows.length);
    onProgress?.(inserted, rows.length);
  }
}

export async function getPagosIdByCargue(idcargue: number) {
  return apiFetch<{ idpago: string; identificacion: string }[]>(`/pagos/by-cargue/${idcargue}`);
}

export async function getCampanasIdByCargue(idcargue: number) {
  return apiFetch<{ idcampana: string; identificacion: string }[]>(`/campanas/by-cargue/${idcargue}`);
}

export async function getBasesByProducto(idproducto: string) {
  return apiFetch<Base[]>(`/bases/producto/${idproducto}`);
}