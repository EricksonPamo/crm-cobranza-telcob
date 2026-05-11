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
  idcarguegestionar: number | null;
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

// =====================================================
// TIPOS: CargueTipo, TablaDef, DatoTipo, TablaColumna, ProductoHomologacion
// =====================================================

export interface CargueTipo {
  idtipocargue: string;
  nombre: string;
  estado: string;
}

export interface Cargue {
  idcargue: number;
  idtipocargue: string;
  idbase: string;
  nombrearchivo: string;
  cantidadregistros: number;
  fechacreacion: string;
  idusuario: string;
  fechamodificacion: string | null;
  idusuariomod: string | null;
  estado: string;
  productoNombre: string;
  baseNombre: string;
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
  fecha_creacion: string;
  idusuariocrea: string;
  fechamodificacion: string | null;
  idusuariomod: string | null;
  estado: string;
  productoNombre: string;
  tipoCargueNombre: string;
  tablaNombre: string;
  tipoDatoNombre: string;
}

export type ProductoHomologacionInput = Omit<ProductoHomologacion,
  'fecha_creacion' | 'fechamodificacion' | 'productoNombre' | 'tipoCargueNombre' | 'tablaNombre' | 'tipoDatoNombre'
>;

// =====================================================
// CARGUE TIPO
// =====================================================

export async function getCargueTipos() {
  const db = ensureConnection();
  return await db<CargueTipo[]>`SELECT * FROM cargue_tipo WHERE estado = 'activo' ORDER BY nombre`;
}

// =====================================================
// TABLA
// =====================================================

export async function getTablas() {
  const db = ensureConnection();
  return await db<TablaDef[]>`SELECT * FROM tabla WHERE estado = 'activo' ORDER BY nombre`;
}

// =====================================================
// DATO TIPO
// =====================================================

export async function getDatoTipos() {
  const db = ensureConnection();
  return await db<DatoTipo[]>`SELECT * FROM dato_tipo WHERE estado = 'activo' ORDER BY nombre`;
}

// =====================================================
// TABLA COLUMNA
// =====================================================

export async function getTablaColumnaByTipoCargue(idtipocargue: string) {
  const db = ensureConnection();
  return await db<TablaColumna[]>`
    SELECT tc.idhomologacion, tc.idtipocargue, tc.idtabla,
           tc.nombrecolumna as "nombreColumna",
           tc.idtipodato as "idtipoDato",
           tc.esobligatorio, tc.esfiltro,
           ct.nombre as "tipoCargueNombre",
           t.nombre as "tablaNombre",
           dt.nombre as "tipoDatoNombre"
    FROM tabla_columna tc
    JOIN cargue_tipo ct ON tc.idtipocargue = ct.idtipocargue
    JOIN tabla t ON tc.idtabla = t.idtabla
    JOIN dato_tipo dt ON tc.idtipodato = dt.idtipodato
    WHERE tc.idtipocargue = ${idtipocargue}
    ORDER BY t.nombre, tc.nombrecolumna
  `;
}

// =====================================================
// PRODUCTO HOMOLOGACION
// =====================================================

export async function getProductoHomologaciones() {
  const db = ensureConnection();
  return await db<ProductoHomologacion[]>`
    SELECT ph.idproducto, ph.idhomologacion, ph.idtipocargue, ph.idtabla,
           ph.nombrecolumna as "nombreColumna",
           ph.tipodato as "tipoDato",
           ph.obligatorio, ph.filtro,
           ph.nombrecampoorigen as "nombreCampoOrigen",
           ph.nombrealiasorigen as "nombreAliasOrigen",
           ph.fecha_creacion, ph.idusuariocrea,
           ph.fechamodificacion, ph.idusuariomod, ph.estado,
           p.nombre as "productoNombre",
           ct.nombre as "tipoCargueNombre",
           t.nombre as "tablaNombre",
           dt.nombre as "tipoDatoNombre"
    FROM producto_homologacion ph
    JOIN productos p ON ph.idproducto = p.idproducto
    JOIN cargue_tipo ct ON ph.idtipocargue = ct.idtipocargue
    JOIN tabla t ON ph.idtabla = t.idtabla
    JOIN dato_tipo dt ON ph.tipodato = dt.idtipodato
    ORDER BY p.nombre, ct.nombre, t.nombre, ph.nombrecolumna
  `;
}

export async function createProductoHomologacionBatch(records: ProductoHomologacionInput[]) {
  const db = ensureConnection();
  const results = await Promise.all(
    records.map(record =>
      db<ProductoHomologacion[]>`
        INSERT INTO producto_homologacion
          (idproducto, idhomologacion, idtipocargue, idtabla, nombrecolumna,
           tipodato, obligatorio, filtro, nombrecampoorigen, nombrealiasorigen,
           idusuariocrea, idusuariomod, estado)
        VALUES (${record.idproducto}, ${record.idhomologacion}, ${record.idtipocargue},
                ${record.idtabla}, ${record.nombreColumna}, ${record.tipoDato},
                ${record.obligatorio}, ${record.filtro}, ${record.nombreCampoOrigen},
                ${record.nombreAliasOrigen}, ${record.idusuariocrea}, ${record.idusuariomod},
                ${record.estado})
        RETURNING *
      `.then(r => r[0])
    )
  );
  return results;
}

export async function updateProductoHomologacion(
  idproducto: string,
  idhomologacion: string,
  data: Partial<Pick<ProductoHomologacion, 'obligatorio' | 'filtro' | 'nombreCampoOrigen' | 'nombreAliasOrigen' | 'estado'>>,
  idusuariomod: string
) {
  const db = ensureConnection();
  const result = await db<ProductoHomologacion[]>`
    UPDATE producto_homologacion SET
      obligatorio = COALESCE(${data.obligatorio}, obligatorio),
      filtro = COALESCE(${data.filtro}, filtro),
      nombrecampoorigen = COALESCE(${data.nombreCampoOrigen}, nombrecampoorigen),
      nombrealiasorigen = COALESCE(${data.nombreAliasOrigen}, nombrealiasorigen),
      estado = COALESCE(${data.estado}, estado),
      fechamodificacion = NOW(),
      idusuariomod = ${idusuariomod}
    WHERE idproducto = ${idproducto} AND idhomologacion = ${idhomologacion}
    RETURNING *
  `;
  return result[0];
}

export async function deleteProductoHomologacion(idproducto: string, idhomologacion: string, idusuariomod: string) {
  const db = ensureConnection();
  await db`UPDATE producto_homologacion SET estado = 'inactivo', fechamodificacion = NOW(), idusuariomod = ${idusuariomod} WHERE idproducto = ${idproducto} AND idhomologacion = ${idhomologacion}`;
}

// =====================================================
// CARGUES
// =====================================================

export async function getCarguesByProducto(idproducto: string) {
  const db = ensureConnection();
  return await db<Cargue[]>`
    SELECT c.idcargue, c.idtipocargue, c.idbase,
           c.nombrearchivo, c.cantidadregistros,
           c.fechacreacion, c.idusuario, c.fechamodificacion, c.idusuariomod, c.estado,
           p.nombre as "productoNombre",
           b.nombre as "baseNombre",
           ct.nombre as "tipoCargueNombre",
           pu.nombre_completo as "usuarioNombre"
    FROM cargues c
    JOIN bases b ON c.idbase = b.idbase
    JOIN productos p ON b.idproducto = p.idproducto
    JOIN cargue_tipo ct ON c.idtipocargue = ct.idtipocargue
    JOIN perfiles_usuario pu ON c.idusuario = pu.id
    WHERE b.idproducto = ${idproducto}
    ORDER BY c.fechacreacion DESC
  `;
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
  const db = ensureConnection();
  const result = await db<{ idcargue: number }[]>`
    INSERT INTO cargues (idtipocargue, idbase, nombre, nombrearchivo, cantidadregistros, idusuario, idusuariomod, estado)
    VALUES (${data.idtipocargue}, ${data.idbase}, ${data.nombrearchivo}, ${data.nombrearchivo}, ${data.cantidadregistros}, ${data.idusuario}, ${data.idusuariomod}, ${data.estado})
    RETURNING idcargue
  `;
  return result[0];
}

export async function inactivateCarguesByTipoCargue(idbase: string, idtipocargue: string, excludeIdcargue: number, idusuariomod: string) {
  const db = ensureConnection();
  await db`
    UPDATE cargues SET estado = 'inactivo', fechamodificacion = NOW(), idusuariomod = ${idusuariomod}
    WHERE idbase = ${idbase} AND idtipocargue = ${idtipocargue} AND idcargue != ${excludeIdcargue} AND estado = 'activo'
  `;
}

export async function updateBaseCargueGestionar(idbase: string, idcarguegestionar: number | null, idusuariomod: string) {
  const db = ensureConnection();
  await db`
    UPDATE bases SET idcarguegestionar = ${idcarguegestionar}, fechamodificacion = NOW(), idusuariomod = ${idusuariomod}
    WHERE idbase = ${idbase}
  `;
}

export async function getCarguesActivosPersona(idbase: string) {
  const db = ensureConnection();
  return await db<{ idcargue: number; nombrearchivo: string; cantidadregistros: number }[]>`
    SELECT c.idcargue, c.nombrearchivo, c.cantidadregistros
    FROM cargues c
    JOIN cargue_tipo ct ON c.idtipocargue = ct.idtipocargue
    WHERE c.idbase = ${idbase} AND c.estado = 'activo' AND LOWER(ct.nombre) = 'persona'
    ORDER BY c.fechacreacion DESC
  `;
}

// =====================================================
// BATCH INSERT: Personas
// =====================================================

const PERSONAS_COLUMNS = [
  'idcargue', 'tipodocumento', 'identificacion', 'nombrecompleto', 'nombre', 'apellido',
  'correo', 'departamento', 'provincia', 'distrito', 'direccion', 'estadocivil', 'profesion',
  'sueldo', 'cuenta', 'numerotarjeta', 'producto', 'subproducto', 'moneda',
  'deudatotal', 'interes', 'cancelaciondeuda',
  'personadatotexto1', 'personadatotexto2', 'personadatotexto3', 'personadatotexto4', 'personadatotexto5',
  'personadatotexto6', 'personadatotexto7', 'personadatotexto8', 'personadatotexto9', 'personadatotexto10',
  'personadatotexto11', 'personadatotexto12', 'personadatotexto13', 'personadatotexto14', 'personadatotexto15',
  'personadatotexto16', 'personadatotexto17', 'personadatotexto18', 'personadatotexto19', 'personadatotexto20',
  'personadatotexto21', 'personadatotexto22', 'personadatotexto23', 'personadatotexto24', 'personadatotexto25',
  'personadatotexto26', 'personadatotexto27', 'personadatotexto28', 'personadatotexto29', 'personadatotexto30',
  'personadatotexto31', 'personadatotexto32', 'personadatotexto33', 'personadatotexto34', 'personadatotexto35',
  'personadatotexto36', 'personadatotexto37', 'personadatotexto38', 'personadatotexto39', 'personadatotexto40',
  'personadatotexto41', 'personadatotexto42', 'personadatotexto43', 'personadatotexto44', 'personadatotexto45',
  'personadatotexto46', 'personadatotexto47', 'personadatotexto48', 'personadatotexto49', 'personadatotexto50',
  'personadatonumerico1', 'personadatonumerico2', 'personadatonumerico3', 'personadatonumerico4', 'personadatonumerico5',
  'personadatonumerico6', 'personadatonumerico7', 'personadatonumerico8', 'personadatonumerico9', 'personadatonumerico10',
  'personadatonumerico11', 'personadatonumerico12', 'personadatonumerico13', 'personadatonumerico14', 'personadatonumerico15',
  'personadatofecha1', 'personadatofecha2', 'personadatofecha3', 'personadatofecha4', 'personadatofecha5',
  'personadatofecha6', 'personadatofecha7', 'personadatofecha8', 'personadatofecha9', 'personadatofecha10',
  'personadatofecha11', 'personadatofecha12', 'personadatofecha13', 'personadatofecha14', 'personadatofecha15',
  'idusuario', 'estado',
];

function buildMultiRowInsert(tableName: string, columns: string[], batch: Record<string, any>[]): { query: string; params: any[] } {
  const params: any[] = [];
  const valueRows: string[] = [];
  for (const row of batch) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      const paramIdx = params.length + 1;
      const val = row[col];
      params.push((val === undefined || val === null || val === '') ? null : val);
      rowPlaceholders.push(`$${paramIdx}`);
    }
    valueRows.push(`(${rowPlaceholders.join(',')})`);
  }
  return { query: `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${valueRows.join(',')}`, params };
}

export async function batchInsertPersonas(
  rows: Record<string, any>[],
  batchSize = 200,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const db = ensureConnection();
  if (rows.length === 0) return;

  const concurrency = 8;
  const batches: Record<string, any>[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  let completed = 0;
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    await Promise.all(chunk.map(batch => {
      const { query, params } = buildMultiRowInsert('personas', PERSONAS_COLUMNS, batch);
      return db.query(query, params).then(() => {
        completed += batch.length;
        onProgress?.(completed, rows.length);
      });
    }));
  }
}

export async function getPersonasIdByCargue(idcargue: number) {
  const db = ensureConnection();
  return await db<{ idpersona: string; identificacion: string }[]>`
    SELECT idpersona, identificacion FROM personas WHERE idcargue = ${idcargue}
  `;
}

export async function getProductoHomologacionByProductoTipo(idproducto: string, idtipocargue: string) {
  const db = ensureConnection();
  return await db<ProductoHomologacion[]>`
    SELECT ph.idproducto, ph.idhomologacion, ph.idtipocargue, ph.idtabla,
           ph.nombrecolumna as "nombreColumna",
           ph.tipodato as "tipoDato",
           ph.obligatorio, ph.filtro,
           ph.nombrecampoorigen as "nombreCampoOrigen",
           ph.nombrealiasorigen as "nombreAliasOrigen",
           ph.fecha_creacion, ph.idusuariocrea,
           ph.fechamodificacion, ph.idusuariomod, ph.estado,
           p.nombre as "productoNombre",
           ct.nombre as "tipoCargueNombre",
           t.nombre as "tablaNombre",
           dt.nombre as "tipoDatoNombre"
    FROM producto_homologacion ph
    JOIN productos p ON ph.idproducto = p.idproducto
    JOIN cargue_tipo ct ON ph.idtipocargue = ct.idtipocargue
    JOIN tabla t ON ph.idtabla = t.idtabla
    JOIN dato_tipo dt ON ph.tipodato = dt.idtipodato
    WHERE ph.idproducto = ${idproducto} AND ph.idtipocargue = ${idtipocargue} AND ph.estado = 'activo'
    ORDER BY t.nombre, ph.nombrecolumna
  `;
}

export async function getBasesByProducto(idproducto: string) {
  const db = ensureConnection();
  return await db<Base[]>`
    SELECT b.*, p.nombre as productonombre
    FROM bases b
    LEFT JOIN productos p ON b.idproducto = p.idproducto
    WHERE b.idproducto = ${idproducto} AND b.estado = 'activo'
    ORDER BY b.fechacreacion DESC
  `;
}