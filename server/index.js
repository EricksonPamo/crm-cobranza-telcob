import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper: query with params
async function q(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

// =====================================================
// TEST CONNECTION
// =====================================================
app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await q('SELECT NOW() as current_time');
    res.json({ success: true, time: result[0].current_time });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// AUTH / LOGIN
// =====================================================
app.post('/api/login', async (req, res) => {
  try {
    const { username } = req.body;
    const rows = await q(
      `SELECT id, username, nombre_completo, email, tipo_usuario, estado
       FROM perfiles_usuario
       WHERE (username = $1 OR email = $1) AND estado = $2`,
      [username, 'activo']
    );
    if (rows.length === 0) {
      return res.json(null);
    }
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// USUARIOS
// =====================================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM perfiles_usuario WHERE estado = $1 ORDER BY fecha_creacion DESC', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/id/:id', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM perfiles_usuario WHERE id = $1', [req.params.id]);
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/username/:username', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM perfiles_usuario WHERE username = $1 AND estado = $2', [req.params.username, 'activo']);
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `INSERT INTO perfiles_usuario (username, password_hash, nombre_completo, email, tipo_usuario, estado)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [d.username, d.password_hash, d.nombre_completo, d.email, d.tipo_usuario, d.estado]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `UPDATE perfiles_usuario SET
        nombre_completo = COALESCE($1, nombre_completo),
        email = COALESCE($2, email),
        tipo_usuario = COALESCE($3, tipo_usuario),
        estado = COALESCE($4, estado)
      WHERE id = $5 RETURNING *`,
      [d.nombre_completo, d.email, d.tipo_usuario, d.estado, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await q('UPDATE perfiles_usuario SET estado = $1 WHERE id = $2', ['inactivo', req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// EMPRESAS
// =====================================================
app.get('/api/empresas', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM empresas WHERE estado = $1 ORDER BY fechacreacion DESC', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/empresas/:id', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM empresas WHERE idempresa = $1', [req.params.id]);
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/empresas/ruc/:ruc', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM empresas WHERE ruc = $1 AND estado = $2', [req.params.ruc, 'activo']);
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/empresas', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `INSERT INTO empresas (razonsocial, ruc, telefono, direccion, email, descripcion, logo, idusuario, idusuariomod, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [d.razonsocial, d.ruc, d.telefono, d.direccion, d.email, d.descripcion, d.logo, d.idusuario, d.idusuariomod, d.estado]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/empresas/:id', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `UPDATE empresas SET
        razonsocial = COALESCE($1, razonsocial),
        ruc = COALESCE($2, ruc),
        direccion = COALESCE($3, direccion),
        telefono = COALESCE($4, telefono),
        email = COALESCE($5, email),
        descripcion = COALESCE($6, descripcion),
        logo = COALESCE($7, logo),
        estado = COALESCE($8, estado),
        fechamodificacion = NOW(),
        idusuariomod = $9
      WHERE idempresa = $10 RETURNING *`,
      [d.razonsocial, d.ruc, d.direccion, d.telefono, d.email, d.descripcion, d.logo, d.estado, d.idusuariomod, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    const { idusuariomod } = req.body;
    await q('UPDATE empresas SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2 WHERE idempresa = $3', ['inactivo', idusuariomod, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// PRODUCTOS
// =====================================================
app.get('/api/productos', async (req, res) => {
  try {
    const rows = await q(
      `SELECT p.*, e.razonsocial as empresanombre
       FROM productos p
       LEFT JOIN empresas e ON p.idempresa = e.idempresa
       WHERE p.estado = $1 ORDER BY p.fechacreacion DESC`, ['activo']
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/productos/:id', async (req, res) => {
  try {
    const rows = await q(
      `SELECT p.*, e.razonsocial as empresanombre
       FROM productos p
       LEFT JOIN empresas e ON p.idempresa = e.idempresa
       WHERE p.idproducto = $1`, [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/productos', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `INSERT INTO productos (nombre, idempresa, idusuario, idusuariomod, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [d.nombre, d.idempresa, d.idusuario, d.idusuariomod, d.estado]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/productos/:id', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `UPDATE productos SET
        nombre = COALESCE($1, nombre),
        idempresa = COALESCE($2, idempresa),
        estado = COALESCE($3, estado),
        fechamodificacion = NOW(),
        idusuariomod = $4
      WHERE idproducto = $5 RETURNING *`,
      [d.nombre, d.idempresa, d.estado, d.idusuariomod, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { idusuariomod } = req.body;
    await q('UPDATE productos SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2 WHERE idproducto = $3', ['inactivo', idusuariomod, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// BASES
// =====================================================
app.get('/api/bases', async (req, res) => {
  try {
    const rows = await q(
      `SELECT b.*, p.nombre as productonombre
       FROM bases b
       LEFT JOIN productos p ON b.idproducto = p.idproducto
       WHERE b.estado = $1 ORDER BY b.fechacreacion DESC`, ['activo']
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/bases/:id', async (req, res) => {
  try {
    const rows = await q(
      `SELECT b.*, p.nombre as productonombre
       FROM bases b
       LEFT JOIN productos p ON b.idproducto = p.idproducto
       WHERE b.idbase = $1`, [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/bases/producto/:idproducto', async (req, res) => {
  try {
    const rows = await q(
      `SELECT b.*, p.nombre as productonombre
       FROM bases b
       LEFT JOIN productos p ON b.idproducto = p.idproducto
       WHERE b.idproducto = $1 AND b.estado = $2 ORDER BY b.fechacreacion DESC`,
      [req.params.idproducto, 'activo']
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/bases', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `INSERT INTO bases (nombre, alias, idproducto, idcarguegestionar, maximocuotas, idusuario, idusuariomod, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [d.nombre, d.alias, d.idproducto, d.idcarguegestionar, d.maximocuotas, d.idusuario, d.idusuariomod, d.estado]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/bases/:id', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `UPDATE bases SET
        nombre = COALESCE($1, nombre),
        alias = COALESCE($2, alias),
        idproducto = COALESCE($3, idproducto),
        idcarguegestionar = COALESCE($4, idcarguegestionar),
        maximocuotas = COALESCE($5, maximocuotas),
        estado = COALESCE($6, estado),
        fechamodificacion = NOW(),
        idusuariomod = $7
      WHERE idbase = $8 RETURNING *`,
      [d.nombre, d.alias, d.idproducto, d.idcarguegestionar, d.maximocuotas, d.estado, d.idusuariomod, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/bases/:id', async (req, res) => {
  try {
    const { idusuariomod } = req.body;
    await q('UPDATE bases SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2 WHERE idbase = $3', ['inactivo', idusuariomod, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/bases/:id/cargue-gestionar', async (req, res) => {
  try {
    const { idcarguegestionar, idusuariomod } = req.body;
    await q(
      'UPDATE bases SET idcarguegestionar = $1, fechamodificacion = NOW(), idusuariomod = $2 WHERE idbase = $3',
      [idcarguegestionar, idusuariomod, req.params.id]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// CARGUE TIPO
// =====================================================
app.get('/api/cargue-tipos', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM cargue_tipo WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TABLA
// =====================================================
app.get('/api/tablas', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM tabla WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// DATO TIPO
// =====================================================
app.get('/api/dato-tipos', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM dato_tipo WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TABLA COLUMNA
// =====================================================
app.get('/api/tabla-columna/:idtipocargue', async (req, res) => {
  try {
    const rows = await q(
      `SELECT tc.idhomologacion, tc.idtipocargue, tc.idtabla,
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
       WHERE tc.idtipocargue = $1
       ORDER BY t.nombre, tc.nombrecolumna`,
      [req.params.idtipocargue]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// PRODUCTO HOMOLOGACION
// =====================================================
app.get('/api/producto-homologacion', async (req, res) => {
  try {
    const rows = await q(
      `SELECT ph.idproducto, ph.idhomologacion, ph.idtipocargue, ph.idtabla,
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
       ORDER BY p.nombre, ct.nombre, t.nombre, ph.nombrecolumna`
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/producto-homologacion/:idproducto/:idtipocargue', async (req, res) => {
  try {
    const rows = await q(
      `SELECT ph.idproducto, ph.idhomologacion, ph.idtipocargue, ph.idtabla,
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
       WHERE ph.idproducto = $1 AND ph.idtipocargue = $2 AND ph.estado = $3
       ORDER BY t.nombre, ph.nombrecolumna`,
      [req.params.idproducto, req.params.idtipocargue, 'activo']
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/producto-homologacion/batch', async (req, res) => {
  try {
    const records = req.body;
    const results = [];
    for (const record of records) {
      const rows = await q(
        `INSERT INTO producto_homologacion
          (idproducto, idhomologacion, idtipocargue, idtabla, nombrecolumna,
           tipodato, obligatorio, filtro, nombrecampoorigen, nombrealiasorigen,
           idusuariocrea, idusuariomod, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [record.idproducto, record.idhomologacion, record.idtipocargue,
         record.idtabla, record.nombreColumna, record.tipoDato,
         record.obligatorio, record.filtro, record.nombreCampoOrigen,
         record.nombreAliasOrigen, record.idusuariocrea, record.idusuariomod,
         record.estado]
      );
      results.push(rows[0]);
    }
    res.json(results);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/producto-homologacion/:idproducto/:idhomologacion', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `UPDATE producto_homologacion SET
        obligatorio = COALESCE($1, obligatorio),
        filtro = COALESCE($2, filtro),
        nombrecampoorigen = COALESCE($3, nombrecampoorigen),
        nombrealiasorigen = COALESCE($4, nombrealiasorigen),
        estado = COALESCE($5, estado),
        fechamodificacion = NOW(),
        idusuariomod = $6
      WHERE idproducto = $7 AND idhomologacion = $8 RETURNING *`,
      [d.obligatorio, d.filtro, d.nombreCampoOrigen, d.nombreAliasOrigen, d.estado, d.idusuariomod, req.params.idproducto, req.params.idhomologacion]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/producto-homologacion/:idproducto/:idhomologacion', async (req, res) => {
  try {
    const { idusuariomod } = req.body;
    await q(
      'UPDATE producto_homologacion SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2 WHERE idproducto = $3 AND idhomologacion = $4',
      ['inactivo', idusuariomod, req.params.idproducto, req.params.idhomologacion]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// CARGUES
// =====================================================
app.get('/api/cargues/by-base/:idbase', async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.idcargue, c.idtipocargue, c.idbase,
              c.nombre, c.nombrearchivo, c.cantidadregistros,
              c.fechacreacion, c.idusuario, c.fechamodificacion, c.idusuariomod, c.estado,
              ct.nombre as "tipoCargueNombre",
              pu.nombre_completo as "usuarioNombre"
       FROM cargues c
       JOIN cargue_tipo ct ON c.idtipocargue = ct.idtipocargue
       JOIN perfiles_usuario pu ON c.idusuario = pu.id
       WHERE c.idbase = $1
       ORDER BY c.fechacreacion DESC`,
      [req.params.idbase]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cargues/:idproducto', async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.idcargue, c.idtipocargue, c.idbase,
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
       WHERE b.idproducto = $1
       ORDER BY c.fechacreacion DESC`,
      [req.params.idproducto]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/cargues', async (req, res) => {
  try {
    const d = req.body;
    const rows = await q(
      `INSERT INTO cargues (idtipocargue, idbase, nombre, nombrearchivo, cantidadregistros, idusuario, idusuariomod, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING idcargue`,
      [d.idtipocargue, d.idbase, d.nombrearchivo, d.nombrearchivo, d.cantidadregistros, d.idusuario, d.idusuariomod, d.estado]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/cargues/inactivate', async (req, res) => {
  try {
    const { idbase, idtipocargue, excludeIdcargue, idusuariomod } = req.body;
    await q(
      `UPDATE cargues SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2
       WHERE idbase = $3 AND idtipocargue = $4 AND idcargue != $5 AND estado = $6`,
      ['inactivo', idusuariomod, idbase, idtipocargue, excludeIdcargue, 'activo']
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cargues-activos-persona/:idbase', async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.idcargue, c.nombrearchivo, c.cantidadregistros
       FROM cargues c
       JOIN cargue_tipo ct ON c.idtipocargue = ct.idtipocargue
       WHERE c.idbase = $1 AND c.estado = $2 AND LOWER(ct.nombre) = $3
       ORDER BY c.fechacreacion DESC`,
      [req.params.idbase, 'activo', 'persona']
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/cargues/:idcargue/estado', async (req, res) => {
  try {
    const { estado, idusuariomod } = req.body;
    const rows = await q(
      `UPDATE cargues SET estado = $1, fechamodificacion = NOW(), idusuariomod = $2
       WHERE idcargue = $3 RETURNING *`,
      [estado, idusuariomod, req.params.idcargue]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cargue no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// PERSONAS - BATCH INSERT
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

function buildMultiRowInsert(batch) {
  const params = [];
  const valueRows = [];
  for (const row of batch) {
    const rowPlaceholders = [];
    for (const col of PERSONAS_COLUMNS) {
      const paramIdx = params.length + 1;
      const val = row[col];
      params.push((val === undefined || val === null || val === '') ? null : val);
      rowPlaceholders.push(`$${paramIdx}`);
    }
    valueRows.push(`(${rowPlaceholders.join(',')})`);
  }
  return {
    query: `INSERT INTO personas (${PERSONAS_COLUMNS.join(',')}) VALUES ${valueRows.join(',')}`,
    params,
  };
}

app.post('/api/personas/batch', async (req, res) => {
  try {
    const { rows, batchSize = 200 } = req.body;
    if (!rows || rows.length === 0) {
      return res.json({ success: true, inserted: 0 });
    }

    const concurrency = 8;
    const batches = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }

    let inserted = 0;
    for (let i = 0; i < batches.length; i += concurrency) {
      const chunk = batches.slice(i, i + concurrency);
      await Promise.all(chunk.map(async (batch) => {
        const { query, params } = buildMultiRowInsert(batch);
        await pool.query(query, params);
        inserted += batch.length;
      }));
    }

    res.json({ success: true, inserted });
  } catch (error) {
    console.error('Batch insert error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/personas/by-cargue/:idcargue', async (req, res) => {
  try {
    const rows = await q(
      'SELECT idpersona, identificacion FROM personas WHERE idcargue = $1',
      [req.params.idcargue]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Database: PostgreSQL (local)');
});