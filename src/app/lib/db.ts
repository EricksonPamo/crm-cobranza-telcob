import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL;
export const sql = connectionString ? neon(connectionString) : null;

function ensureConnection(): NonNullable<typeof sql> {
  if (!sql) {
    throw new Error('No hay conexión a la base de datos. Verifique VITE_DATABASE_URL');
  }
  return sql;
}

export async function testConnection() {
  try {
    const db = ensureConnection();
    const result = await db`SELECT NOW() as current_time`;
    console.log('Conexión exitosa:', result[0].current_time);
    return true;
  } catch (error) {
    console.error('Error conectando:', error);
    return false;
  }
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
  idcarguegestionar: string | null;
  maximocuotas: number | null;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string;
  estado: string;
}

// =====================================================
// USUARIOS
// =====================================================

export async function getUsuarios() {
  const db = ensureConnection();
  return await db<PerfilUsuario[]>`SELECT * FROM perfiles_usuario WHERE estado = 'activo' ORDER BY fecha_creacion DESC`;
}

export async function getUsuarioById(id: string) {
  const db = ensureConnection();
  const result = await db<PerfilUsuario[]>`SELECT * FROM perfiles_usuario WHERE id = ${id}`;
  return result[0];
}

export async function getUsuarioByUsername(username: string) {
  const db = ensureConnection();
  const result = await db<PerfilUsuario[]>`SELECT * FROM perfiles_usuario WHERE username = ${username} AND estado = 'activo'`;
  return result[0];
}

export async function createUsuario(data: Omit<PerfilUsuario, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'ultimo_acceso'>) {
  const db = ensureConnection();
  const result = await db<PerfilUsuario[]>`
    INSERT INTO perfiles_usuario (username, password_hash, nombre_completo, email, tipo_usuario, estado)
    VALUES (${data.username}, ${data.password_hash}, ${data.nombre_completo}, ${data.email}, ${data.tipo_usuario}, ${data.estado})
    RETURNING *
  `;
  return result[0];
}

export async function updateUsuario(id: string, data: Partial<PerfilUsuario>) {
  const db = ensureConnection();
  const result = await db<PerfilUsuario[]>`
    UPDATE perfiles_usuario SET
      nombre_completo = COALESCE(${data.nombre_completo}, nombre_completo),
      email = COALESCE(${data.email}, email),
      tipo_usuario = COALESCE(${data.tipo_usuario}, tipo_usuario),
      estado = COALESCE(${data.estado}, estado)
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export async function deleteUsuario(id: string) {
  const db = ensureConnection();
  await db`UPDATE perfiles_usuario SET estado = 'inactivo' WHERE id = ${id}`;
}

// =====================================================
// EMPRESAS
// =====================================================

export async function getEmpresas() {
  const db = ensureConnection();
  return await db<Empresa[]>`SELECT * FROM empresas WHERE estado = 'activo' ORDER BY fechacreacion DESC`;
}

export async function getEmpresaById(idempresa: string) {
  const db = ensureConnection();
  const result = await db<Empresa[]>`SELECT * FROM empresas WHERE idempresa = ${idempresa}`;
  return result[0];
}

export async function getEmpresaByRuc(ruc: string) {
  const db = ensureConnection();
  const result = await db<Empresa[]>`SELECT * FROM empresas WHERE ruc = ${ruc} AND estado = 'activo'`;
  return result[0];
}

export async function createEmpresa(data: Omit<Empresa, 'idempresa' | 'fechacreacion' | 'fechamodificacion'>) {
  const db = ensureConnection();
  const result = await db<Empresa[]>`
    INSERT INTO empresas (razonsocial, ruc, telefono, direccion, email, descripcion, logo, idusuario, idusuariomod, estado)
    VALUES (${data.razonsocial}, ${data.ruc}, ${data.telefono}, ${data.direccion}, ${data.email}, ${data.descripcion}, ${data.logo}, ${data.idusuario}, ${data.idusuariomod}, ${data.estado})
    RETURNING *
  `;
  return result[0];
}

export async function updateEmpresa(idempresa: string, data: Partial<Empresa>, idusuariomod: string) {
  const db = ensureConnection();
  const result = await db<Empresa[]>`
    UPDATE empresas SET
      razonsocial = COALESCE(${data.razonsocial}, razonsocial),
      ruc = COALESCE(${data.ruc}, ruc),
      direccion = COALESCE(${data.direccion}, direccion),
      telefono = COALESCE(${data.telefono}, telefono),
      email = COALESCE(${data.email}, email),
      descripcion = COALESCE(${data.descripcion}, descripcion),
      logo = COALESCE(${data.logo}, logo),
      estado = COALESCE(${data.estado}, estado),
      fechamodificacion = NOW(),
      idusuariomod = ${idusuariomod}
    WHERE idempresa = ${idempresa}
    RETURNING *
  `;
  return result[0];
}

export async function deleteEmpresa(idempresa: string, idusuariomod: string) {
  const db = ensureConnection();
  await db`UPDATE empresas SET estado = 'inactivo', fechamodificacion = NOW(), idusuariomod = ${idusuariomod} WHERE idempresa = ${idempresa}`;
}

// =====================================================
// PRODUCTOS
// =====================================================

export async function getProductos() {
  const db = ensureConnection();
  return await db<Producto[]>`
    SELECT p.*, e.razonsocial as empresanombre
    FROM productos p
    LEFT JOIN empresas e ON p.idempresa = e.idempresa
    WHERE p.estado = 'activo'
    ORDER BY p.fechacreacion DESC
  `;
}

export async function getProductoById(idproducto: string) {
  const db = ensureConnection();
  const result = await db<Producto[]>`
    SELECT p.*, e.razonsocial as empresanombre
    FROM productos p
    LEFT JOIN empresas e ON p.idempresa = e.idempresa
    WHERE p.idproducto = ${idproducto}
  `;
  return result[0];
}

export async function createProducto(data: Omit<Producto, 'idproducto' | 'fechacreacion' | 'fechamodificacion'>) {
  const db = ensureConnection();
  const result = await db<Producto[]>`
    INSERT INTO productos (nombre, idempresa, idusuario, idusuariomod, estado)
    VALUES (${data.nombre}, ${data.idempresa}, ${data.idusuario}, ${data.idusuariomod}, ${data.estado})
    RETURNING *
  `;
  return result[0];
}

export async function updateProducto(idproducto: string, data: Partial<Producto>, idusuariomod: string) {
  const db = ensureConnection();
  const result = await db<Producto[]>`
    UPDATE productos SET
      nombre = COALESCE(${data.nombre}, nombre),
      idempresa = COALESCE(${data.idempresa}, idempresa),
      estado = COALESCE(${data.estado}, estado),
      fechamodificacion = NOW(),
      idusuariomod = ${idusuariomod}
    WHERE idproducto = ${idproducto}
    RETURNING *
  `;
  return result[0];
}

export async function deleteProducto(idproducto: string, idusuariomod: string) {
  const db = ensureConnection();
  await db`UPDATE productos SET estado = 'inactivo', fechamodificacion = NOW(), idusuariomod = ${idusuariomod} WHERE idproducto = ${idproducto}`;
}

// =====================================================
// BASES
// =====================================================

export async function getBases() {
  const db = ensureConnection();
  return await db<Base[]>`
    SELECT b.*, p.nombre as productonombre
    FROM bases b
    LEFT JOIN productos p ON b.idproducto = p.idproducto
    WHERE b.estado = 'activo'
    ORDER BY b.fechacreacion DESC
  `;
}

export async function getBaseById(idbase: string) {
  const db = ensureConnection();
  const result = await db<Base[]>`
    SELECT b.*, p.nombre as productonombre
    FROM bases b
    LEFT JOIN productos p ON b.idproducto = p.idproducto
    WHERE b.idbase = ${idbase}
  `;
  return result[0];
}

export async function createBase(data: Omit<Base, 'idbase' | 'fechacreacion' | 'fechamodificacion'>) {
  const db = ensureConnection();
  const result = await db<Base[]>`
    INSERT INTO bases (nombre, alias, idproducto, idcarguegestionar, maximocuotas, idusuario, idusuariomod, estado)
    VALUES (${data.nombre}, ${data.alias}, ${data.idproducto}, ${data.idcarguegestionar}, ${data.maximocuotas}, ${data.idusuario}, ${data.idusuariomod}, ${data.estado})
    RETURNING *
  `;
  return result[0];
}

export async function updateBase(idbase: string, data: Partial<Base>, idusuariomod: string) {
  const db = ensureConnection();
  const result = await db<Base[]>`
    UPDATE bases SET
      nombre = COALESCE(${data.nombre}, nombre),
      alias = COALESCE(${data.alias}, alias),
      idproducto = COALESCE(${data.idproducto}, idproducto),
      idcarguegestionar = COALESCE(${data.idcarguegestionar}, idcarguegestionar),
      maximocuotas = COALESCE(${data.maximocuotas}, maximocuotas),
      estado = COALESCE(${data.estado}, estado),
      fechamodificacion = NOW(),
      idusuariomod = ${idusuariomod}
    WHERE idbase = ${idbase}
    RETURNING *
  `;
  return result[0];
}

export async function deleteBase(idbase: string, idusuariomod: string) {
  const db = ensureConnection();
  await db`UPDATE bases SET estado = 'inactivo', fechamodificacion = NOW(), idusuariomod = ${idusuariomod} WHERE idbase = ${idbase}`;
}