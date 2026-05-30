import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb', charset: 'utf-8' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, charset: 'utf-8' }));

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
// ORIGEN
// =====================================================
app.get('/api/origenes', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM origen WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TELEFONOS - Preview upload
// =====================================================
app.post('/api/telefonos/preview', async (req, res) => {
  try {
    const { idorigen, telefonos } = req.body; // telefonos = [{identificacion, telefono}]
    if (!idorigen || !Array.isArray(telefonos)) {
      return res.status(400).json({ error: 'idorigen y telefonos son requeridos' });
    }

    // Get existing telefonos for this origen
    const existingTels = await q('SELECT idtelefono, telefono FROM telefonos WHERE idorigen = $1 AND estado = $2', [idorigen, 'activo']);
    const existingMap = new Map(existingTels.map(t => [t.telefono, t.idtelefono]));

    let existentesTelefono = 0;
    let nuevosTelefono = 0;
    const nuevosSet = new Set();
    const existentesSet = new Set();
    const relacionesNuevas = [];

    for (const row of telefonos) {
      const tel = String(row.telefono).trim();
      const ident = String(row.identificacion).trim();
      if (!tel || !ident) continue;

      if (existingMap.has(tel)) {
        existentesTelefono++;
        existentesSet.add(tel);
        relacionesNuevas.push({ identificacion: ident, idtelefono: existingMap.get(tel), telefono: tel, existeTelefono: true });
      } else {
        if (!nuevosSet.has(tel)) {
          nuevosTelefono++;
          nuevosSet.add(tel);
        }
        relacionesNuevas.push({ identificacion: ident, telefono: tel, existeTelefono: false });
      }
    }

    // Count existing relaciones for those that already exist
    const existentesIds = [...existingMap.values()];
    let relacionesExistentes = 0;
    if (existentesIds.length > 0) {
      const ids = existentesIds.map(id => `'${id}'`).join(',');
      const identifs = [...new Set(telefonos.map(r => String(r.identificacion).trim()).filter(Boolean))];
      if (identifs.length > 0) {
        const identifList = identifs.map(i => `'${i.replace(/'/g, "''")}'`).join(',');
        const existingRels = await q(
          `SELECT COUNT(*) as count FROM personas_telefono WHERE idorigen = $1 AND idtelefono IN (${ids}) AND identificacion IN (${identifList})`,
          [idorigen]
        );
        relacionesExistentes = parseInt(existingRels[0]?.count || '0');
      }
    }

    res.json({
      totalFilas: telefonos.length,
      telefonosExistentes: existentesTelefono,
      telefonosNuevos: nuevosTelefono,
      relacionesExistentes,
      relacionesNuevas: relacionesNuevas.length - relacionesExistentes,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TELEFONOS - Batch upload
// =====================================================
app.post('/api/telefonos/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    const { idcargue, idorigen, idusuario, telefonos } = req.body;
    if (!idcargue || !idorigen || !idusuario || !Array.isArray(telefonos)) {
      return res.status(400).json({ error: 'idcargue, idorigen, idusuario y telefonos son requeridos' });
    }

    await client.query('BEGIN');

    // Get existing telefonos for this origen
    const existingTels = await client.query('SELECT idtelefono, telefono FROM telefonos WHERE idorigen = $1 AND estado = $2', [idorigen, 'activo']);
    const existingMap = new Map(existingTels.rows.map(t => [t.telefono, t.idtelefono]));

    let insertadosTelefono = 0;
    let insertadosRelacion = 0;
    let duplicadosRelacion = 0;

    // Process in batches
    const batchSize = 200;
    for (let i = 0; i < telefonos.length; i += batchSize) {
      const batch = telefonos.slice(i, i + batchSize);
      const newTelefonos = [];
      const relationsToInsert = [];

      for (const row of batch) {
        const tel = String(row.telefono).trim();
        const ident = String(row.identificacion).trim();
        if (!tel || !ident) continue;

        let idtelefono;
        if (existingMap.has(tel)) {
          idtelefono = existingMap.get(tel);
        } else {
          // Check if we already queued this new phone
          const alreadyQueued = newTelefonos.find(n => n.telefono === tel);
          if (alreadyQueued) {
            idtelefono = alreadyQueued.idtelefono;
          } else {
            const insertResult = await client.query(
              'INSERT INTO telefonos (idcargue, idorigen, telefono, idusuario, idusuariomod, estado) VALUES ($1, $2, $3, $4, $4, $5) RETURNING idtelefono',
              [idcargue, idorigen, tel, idusuario, 'activo']
            );
            idtelefono = insertResult.rows[0].idtelefono;
            existingMap.set(tel, idtelefono);
            newTelefonos.push({ telefono: tel, idtelefono });
            insertadosTelefono++;
          }
        }

        relationsToInsert.push({ identificacion: ident, idtelefono, idorigen });
      }

      // Insert relaciones (personas_telefono), skip duplicates
      for (const rel of relationsToInsert) {
        try {
          await client.query(
            'INSERT INTO personas_telefono (identificacion, idtelefono, idorigen, idusuario, estado) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (identificacion, idtelefono, idorigen) DO NOTHING',
            [rel.identificacion, rel.idtelefono, rel.idorigen, idusuario, 'activo']
          );
          insertadosRelacion++;
        } catch (e) {
          duplicadosRelacion++;
        }
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      telefonosInsertados: insertadosTelefono,
      relacionesInsertadas: insertadosRelacion,
      relacionesDuplicadas: duplicadosRelacion,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// RETIRO TIPO
// =====================================================
app.get('/api/retiro-tipos', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM retiro_tipo WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// RETIROS - Preview
// =====================================================
app.post('/api/retiros/preview', async (req, res) => {
  try {
    const { idretirotipo, retiros } = req.body;
    if (!idretirotipo || !Array.isArray(retiros)) {
      return res.status(400).json({ error: 'idretirotipo y retiros son requeridos' });
    }

    let totalValidos = 0;
    let totalInvalidos = 0;
    for (const row of retiros) {
      const valor = parseFloat(row.valor);
      if (!isNaN(valor) && valor > 0) {
        totalValidos++;
      } else {
        totalInvalidos++;
      }
    }

    res.json({
      totalFilas: retiros.length,
      retirosValidos: totalValidos,
      retirosInvalidos: totalInvalidos,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// RETIROS - Batch upload
// =====================================================
app.post('/api/retiros/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    const { idcargue, idretirotipo, idusuario, retiros } = req.body;
    if (!idcargue || !idretirotipo || !idusuario || !Array.isArray(retiros)) {
      return res.status(400).json({ error: 'idcargue, idretirotipo, idusuario y retiros son requeridos' });
    }

    await client.query('BEGIN');

    let insertados = 0;

    const batchSize = 200;
    for (let i = 0; i < retiros.length; i += batchSize) {
      const batch = retiros.slice(i, i + batchSize);

      for (const row of batch) {
        const valor = parseFloat(row.valor);
        if (isNaN(valor) || valor <= 0) continue;

        const motivo = row.motivo ? String(row.motivo).trim() : null;

        await client.query(
          'INSERT INTO retiro (idretirotipo, idcargue, valor, motivo, idusuario, idusuariomod, estado) VALUES ($1, $2, $3, $4, $5, $5, $6)',
          [idretirotipo, idcargue, valor, motivo, idusuario, 'activo']
        );
        insertados++;
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, retirosInsertados: insertados });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
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
// FICHA TIPO DATO
// =====================================================
app.get('/api/ficha-tipo-dato', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM ficha_tipo_dato WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// FICHA SEGMENTO
// =====================================================
app.get('/api/ficha-segmento', async (req, res) => {
  try {
    const { idtipodatoficha } = req.query;
    if (idtipodatoficha) {
      const rows = await q(
        'SELECT * FROM ficha_segmento WHERE idtipodatoficha = $1 AND estado = $2 ORDER BY ordenvisualizacion',
        [idtipodatoficha, 'activo']
      );
      return res.json(rows);
    }
    const rows = await q('SELECT * FROM ficha_segmento WHERE estado = $1 ORDER BY idtipodatoficha, ordenvisualizacion', ['activo']);
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
              ph.idtipodatoficha as "idtipodatoficha",
              ph.idsegmentoficha as "idsegmentoficha",
              ph.esvisible, ph.ordenvisualizacion,
              ph.fecha_creacion, ph.idusuariocrea,
              ph.fechamodificacion, ph.idusuariomod, ph.estado,
              p.nombre as "productoNombre",
              ct.nombre as "tipoCargueNombre",
              t.nombre as "tablaNombre",
              dt.nombre as "tipoDatoNombre",
              ftd.nombre as "tipoDatoFichaNombre",
              fs.nombre as "segmentoFichaNombre"
       FROM producto_homologacion ph
       JOIN productos p ON ph.idproducto = p.idproducto
       JOIN cargue_tipo ct ON ph.idtipocargue = ct.idtipocargue
       JOIN tabla t ON ph.idtabla = t.idtabla
       JOIN dato_tipo dt ON ph.tipodato = dt.idtipodato
       LEFT JOIN ficha_tipo_dato ftd ON ph.idtipodatoficha = ftd.idtipodatoficha
       LEFT JOIN ficha_segmento fs ON ph.idsegmentoficha = fs.idsegmentoficha
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
              ph.idtipodatoficha as "idtipodatoficha",
              ph.idsegmentoficha as "idsegmentoficha",
              ph.esvisible, ph.ordenvisualizacion,
              ph.fecha_creacion, ph.idusuariocrea,
              ph.fechamodificacion, ph.idusuariomod, ph.estado,
              p.nombre as "productoNombre",
              ct.nombre as "tipoCargueNombre",
              t.nombre as "tablaNombre",
              dt.nombre as "tipoDatoNombre",
              ftd.nombre as "tipoDatoFichaNombre",
              fs.nombre as "segmentoFichaNombre"
       FROM producto_homologacion ph
       JOIN productos p ON ph.idproducto = p.idproducto
       JOIN cargue_tipo ct ON ph.idtipocargue = ct.idtipocargue
       JOIN tabla t ON ph.idtabla = t.idtabla
       JOIN dato_tipo dt ON ph.tipodato = dt.idtipodato
       LEFT JOIN ficha_tipo_dato ftd ON ph.idtipodatoficha = ftd.idtipodatoficha
       LEFT JOIN ficha_segmento fs ON ph.idsegmentoficha = fs.idsegmentoficha
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
           idtipodatoficha, idsegmentoficha, esvisible, ordenvisualizacion,
           idusuariocrea, idusuariomod, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [record.idproducto, record.idhomologacion, record.idtipocargue,
         record.idtabla, record.nombreColumna, record.tipoDato,
         record.obligatorio, record.filtro, record.nombreCampoOrigen,
         record.nombreAliasOrigen,
         record.idtipodatoficha || null, record.idsegmentoficha || null,
         record.esvisible !== undefined ? record.esvisible : true,
         record.ordenvisualizacion || 0,
         record.idusuariocrea, record.idusuariomod,
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
        idtipodatoficha = COALESCE($5, idtipodatoficha),
        idsegmentoficha = COALESCE($6, idsegmentoficha),
        esvisible = COALESCE($7, esvisible),
        ordenvisualizacion = COALESCE($8, ordenvisualizacion),
        estado = COALESCE($9, estado),
        fechamodificacion = NOW(),
        idusuariomod = $10
      WHERE idproducto = $11 AND idhomologacion = $12 RETURNING *`,
      [d.obligatorio, d.filtro, d.nombreCampoOrigen, d.nombreAliasOrigen,
       d.idtipodatoficha, d.idsegmentoficha, d.esvisible, d.ordenvisualizacion,
       d.estado, d.idusuariomod, req.params.idproducto, req.params.idhomologacion]
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

const PAGOS_COLUMNS = [
  'idcargue', 'identificacion', 'cuenta', 'producto', 'subproducto',
  'fechapago', 'moneda', 'montopago',
  'pagodatotexto1', 'pagodatotexto2', 'pagodatotexto3', 'pagodatotexto4', 'pagodatotexto5',
  'pagodatotexto6', 'pagodatotexto7', 'pagodatotexto8', 'pagodatotexto9', 'pagodatotexto10',
  'pagodatonumerico1', 'pagodatonumerico2', 'pagodatonumerico3', 'pagodatonumerico4', 'pagodatonumerico5',
  'pagodatofecha1', 'pagodatofecha2', 'pagodatofecha3', 'pagodatofecha4', 'pagodatofecha5',
  'idusuario', 'estado',
];

const CAMPANAS_COLUMNS = [
  'idcargue', 'identificacion', 'cuenta', 'porcentaje', 'montocampana', 'detalle',
  'campanadatotexto1', 'campanadatotexto2', 'campanadatotexto3', 'campanadatotexto4', 'campanadatotexto5',
  'campanadatonumerico1', 'campanadatonumerico2', 'campanadatonumerico3', 'campanadatonumerico4', 'campanadatonumerico5',
  'campanadatofecha1', 'campanadatofecha2', 'campanadatofecha3', 'campanadatofecha4', 'campanadatofecha5',
  'idusuario', 'estado',
];

function buildMultiRowInsert(batch, tableName, columns) {
  const params = [];
  const valueRows = [];
  for (const row of batch) {
    const rowPlaceholders = [];
    for (const col of columns) {
      const paramIdx = params.length + 1;
      const val = row[col];
      params.push((val === undefined || val === null || val === '') ? null : val);
      rowPlaceholders.push(`$${paramIdx}`);
    }
    valueRows.push(`(${rowPlaceholders.join(',')})`);
  }
  return {
    query: `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${valueRows.join(',')}`,
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
        const { query, params } = buildMultiRowInsert(batch, 'personas', PERSONAS_COLUMNS);
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
// PAGOS - BATCH INSERT
// =====================================================
app.post('/api/pagos/batch', async (req, res) => {
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
        const { query, params } = buildMultiRowInsert(batch, 'pagos', PAGOS_COLUMNS);
        await pool.query(query, params);
        inserted += batch.length;
      }));
    }

    res.json({ success: true, inserted });
  } catch (error) {
    console.error('Pagos batch insert error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pagos/by-cargue/:idcargue', async (req, res) => {
  try {
    const rows = await q(
      'SELECT idpago, identificacion FROM pagos WHERE idcargue = $1',
      [req.params.idcargue]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// CAMPANAS - BATCH INSERT
// =====================================================
app.post('/api/campanas/batch', async (req, res) => {
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
        const { query, params } = buildMultiRowInsert(batch, 'campanas', CAMPANAS_COLUMNS);
        await pool.query(query, params);
        inserted += batch.length;
      }));
    }

    res.json({ success: true, inserted });
  } catch (error) {
    console.error('Campanas batch insert error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campanas/by-cargue/:idcargue', async (req, res) => {
  try {
    const rows = await q(
      'SELECT idcampana, identificacion FROM campanas WHERE idcargue = $1',
      [req.params.idcargue]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// CANAL COMUNICACION
// =====================================================
app.get('/api/canal-comunicacion', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM canal_comunicacion WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TIPIFICACION TIPO
// =====================================================
app.get('/api/tipificacion-tipo', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM tipificacion_tipo WHERE estado = $1 ORDER BY nombre', ['activo']);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TIPIFICACION
// =====================================================
app.get('/api/tipificacion', async (req, res) => {
  try {
    const rows = await q(
      `SELECT t.*,
        cc.nombre as canal_nombre,
        tt.nombre as tipo_nombre,
        tt.codtipotipificacion as tipo_codigo
       FROM tipificacion t
       JOIN canal_comunicacion cc ON t.idcanalcomunicacion = cc.idcanalcomunicacion
       JOIN tipificacion_tipo tt ON t.idtipotipificacion = tt.idtipotipificacion
       WHERE t.estado = 'activo'
       ORDER BY tt.nombre, cc.nombre, t.peso, t.accion`,
      []
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/tipificacion/producto/:idproducto', async (req, res) => {
  try {
    const { idproducto } = req.params;
    const rows = await q(
      `SELECT t.*,
        cc.nombre as canal_nombre,
        cc.idcanalcomunicacion,
        tt.nombre as tipo_nombre,
        tt.idtipotipificacion,
        tt.codtipotipificacion as tipo_codigo
       FROM tipificacion t
       JOIN canal_comunicacion cc ON t.idcanalcomunicacion = cc.idcanalcomunicacion
       JOIN tipificacion_tipo tt ON t.idtipotipificacion = tt.idtipotipificacion
       JOIN producto_tipificacion pt ON pt.idtipificacion = tt.idtipotipificacion
       WHERE pt.idproducto = $1 AND pt.estado = 'activo' AND t.estado = 'activo'
       ORDER BY tt.nombre, cc.nombre, t.peso, t.accion`,
      [idproducto]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// =====================================================
// TIPIFICACION IMPORT
// =====================================================
app.post('/api/tipificacion/import', async (req, res) => {
  const client = await pool.connect();
  try {
    const { idproducto, idusuario, rows } = req.body;
    if (!idproducto || !idusuario || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'idproducto, idusuario y rows son requeridos' });
    }

    // Helper: normalize string for comparison (trim, preserve ñ/tildes)
    const normalize = (s) => (s || '').trim();

    // --- VALIDATION PHASE ---
    const errors = [];
    const warnings = [];

    // Load existing canales and tipos for validation
    const existingCanales = await client.query('SELECT idcanalcomunicacion, nombre FROM canal_comunicacion WHERE estado = $1', ['activo']);
    const canalNameSet = new Set(existingCanales.rows.map(c => c.nombre.toUpperCase()));
    const canalMap = new Map();
    for (const c of existingCanales.rows) {
      canalMap.set(c.nombre.toUpperCase(), c.idcanalcomunicacion);
    }

    const existingTipos = await client.query('SELECT idtipotipificacion, nombre, codtipotipificacion FROM tipificacion_tipo WHERE estado = $1', ['activo']);
    const tipoNameSet = new Set(existingTipos.rows.map(t => t.nombre.toUpperCase()));
    const tipoMap = new Map();
    for (const t of existingTipos.rows) {
      tipoMap.set(t.nombre.toUpperCase(), { id: t.idtipotipificacion, cod: t.codtipotipificacion });
    }

    // Load existing tipificaciones for duplicate check (CANAL + TIPO + RESULTADO)
    const existingTipificaciones = await client.query(
      `SELECT UPPER(cc.nombre) as canal, UPPER(tt.nombre) as tipo, UPPER(t.resultado) as resultado
       FROM tipificacion t
       JOIN canal_comunicacion cc ON t.idcanalcomunicacion = cc.idcanalcomunicacion
       JOIN tipificacion_tipo tt ON t.idtipotipificacion = tt.idtipotipificacion
       WHERE t.estado = 'activo'`
    );
    const existingKeys = new Set(existingTipificaciones.rows.map(r => `${r.canal}|${r.tipo}|${r.resultado}`));

    // Validate each row
    const validRows = [];
    const seenInFile = new Set();

    rows.forEach((r, idx) => {
      const fila = idx + 2; // 1-based + header row
      const canal = normalize(r.CANAL_COMUNICACION);
      const tipo = normalize(r.TIPO_TIPIFICACION);
      const resultado = normalize(r.RESULTADO);

      // Required fields
      if (!canal) {
        errors.push(`Fila ${fila}: CANAL_COMUNICACION es obligatorio`);
        return;
      }
      if (!tipo) {
        errors.push(`Fila ${fila}: TIPO_TIPIFICACION es obligatorio`);
        return;
      }
      if (!resultado) {
        errors.push(`Fila ${fila}: RESULTADO es obligatorio`);
        return;
      }

      // Validate canal exists in database
      if (!canalNameSet.has(canal.toUpperCase())) {
        errors.push(`Fila ${fila}: Canal de comunicación "${canal}" no existe en la tabla canal_comunicacion`);
        return;
      }

      // Validate tipo exists in database
      if (!tipoNameSet.has(tipo.toUpperCase())) {
        errors.push(`Fila ${fila}: Tipo de tipificación "${tipo}" no existe en la tabla tipificacion_tipo`);
        return;
      }

      // Check duplicate within file (CANAL + TIPO + RESULTADO)
      const fileKey = `${canal.toUpperCase()}|${tipo.toUpperCase()}|${resultado.toUpperCase()}`;
      if (seenInFile.has(fileKey)) {
        warnings.push(`Fila ${fila}: registro duplicado en el archivo (Canal: ${canal}, Tipo: ${tipo}, Resultado: ${resultado})`);
      }
      seenInFile.add(fileKey);

      // Check duplicate against database
      if (existingKeys.has(fileKey)) {
        warnings.push(`Fila ${fila}: ya existe en la base de datos (Canal: ${canal}, Tipo: ${tipo}, Resultado: ${resultado})`);
      }

      // Validate DESTACADO, MOSTRAR_WEB, DISPONEREGLA
      const dest = normalize(r.DESTACADO || 'no').toLowerCase();
      const web = normalize(r.MOSTRAR_WEB || 'si').toLowerCase();
      const regla = normalize(r.DISPONEREGLA || 'no').toLowerCase();
      if (!['si', 'no'].includes(dest)) {
        warnings.push(`Fila ${fila}: DESTACADO debe ser 'si' o 'no' (valor: '${r.DESTACADO}')`);
      }
      if (!['si', 'no'].includes(web)) {
        warnings.push(`Fila ${fila}: MOSTRAR_WEB debe ser 'si' o 'no' (valor: '${r.MOSTRAR_WEB}')`);
      }
      if (!['si', 'no'].includes(regla)) {
        warnings.push(`Fila ${fila}: DISPONEREGLA debe ser 'si' o 'no' (valor: '${r.DISPONEREGLA}')`);
      }

      validRows.push(r);
    });

    // If there are blocking errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. '), warnings });
    }

    // Filter out rows that already exist in the database (skip duplicates)
    const rowsToInsert = validRows.filter(r => {
      const canal = normalize(r.CANAL_COMUNICACION).toUpperCase();
      const tipo = normalize(r.TIPO_TIPIFICACION).toUpperCase();
      const resultado = normalize(r.RESULTADO).toUpperCase();
      const key = `${canal}|${tipo}|${resultado}`;
      return !existingKeys.has(key);
    });

    if (rowsToInsert.length === 0) {
      return res.json({ success: true, inserted: 0, skipped: 0, warnings: ['Todos los registros ya existen en la base de datos'] });
    }

    // Also skip rows duplicated within the file itself (keep first occurrence)
    const seenKeys = new Set();
    const dedupedRows = [];
    for (const r of rowsToInsert) {
      const canal = normalize(r.CANAL_COMUNICACION).toUpperCase();
      const tipo = normalize(r.TIPO_TIPIFICACION).toUpperCase();
      const resultado = normalize(r.RESULTADO).toUpperCase();
      const key = `${canal}|${tipo}|${resultado}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dedupedRows.push(r);
      }
    }

    await client.query('BEGIN');

    // 1. Build maps for UUID resolution (canal and tipo already validated above)
    //    Maps are already populated from the validation phase

    // 2. Insert tipificacion rows
    const TIPIFICACION_COLUMNS = [
      'idcanalcomunicacion', 'idtipotipificacion', 'codaccion', 'accion',
      'codresultado', 'resultado', 'resultado1', 'resultado2', 'resultado3',
      'resultado4', 'resultado5', 'destacado', 'mostrarweb', 'peso',
      'disponeregla', 'idusuario', 'idusuariomod', 'estado'
    ];

    const batchData = dedupedRows.map(r => {
      const canalNombre = normalize(r.CANAL_COMUNICACION).toUpperCase();
      const tipoNombre = normalize(r.TIPO_TIPIFICACION).toUpperCase();
      const idcanal = canalMap.get(canalNombre);
      const tipoInfo = tipoMap.get(tipoNombre);
      return {
        idcanalcomunicacion: idcanal,
        idtipotipificacion: tipoInfo?.id,
        codaccion: normalize(r.CODACCION) || null,
        accion: normalize(r.ACCION) || null,
        codresultado: normalize(r.CODRESULTADO) || null,
        resultado: normalize(r.RESULTADO),
        resultado1: normalize(r.RESULTADO1) || null,
        resultado2: normalize(r.RESULTADO2) || null,
        resultado3: normalize(r.RESULTADO3) || null,
        resultado4: normalize(r.RESULTADO4) || null,
        resultado5: normalize(r.RESULTADO5) || null,
        destacado: (normalize(r.DESTACADO) || 'no').toLowerCase(),
        mostrarweb: (normalize(r.MOSTRAR_WEB) || 'si').toLowerCase(),
        peso: parseInt(r.PESO) || 0,
        disponeregla: (normalize(r.DISPONEREGLA) || 'no').toLowerCase(),
        idusuario,
        idusuariomod: idusuario,
        estado: 'activo'
      };
    }).filter(r => r.idcanalcomunicacion && r.idtipotipificacion);

    let insertedCount = 0;
    const batchSize = 200;
    for (let i = 0; i < batchData.length; i += batchSize) {
      const batch = batchData.slice(i, i + batchSize);
      const { query, params } = buildMultiRowInsert(batch, 'tipificacion', TIPIFICACION_COLUMNS);
      await client.query(query, params);
      insertedCount += batch.length;
    }

    // 3. Insert producto_tipificacion for each unique tipo (skip existing)
    const allTipoIds = new Set();
    for (const r of dedupedRows) {
      const tipoNombre = normalize(r.TIPO_TIPIFICACION).toUpperCase();
      const tipoInfo = tipoMap.get(tipoNombre);
      if (tipoInfo) allTipoIds.add(tipoInfo.id);
    }

    for (const idtipotipificacion of allTipoIds) {
      await client.query(
        `INSERT INTO producto_tipificacion (idproducto, idtipificacion, idusuario, idusuariomod, estado)
         VALUES ($1, $2, $3, $3, 'activo')
         ON CONFLICT (idproducto, idtipificacion) DO NOTHING`,
        [idproducto, idtipotipificacion, idusuario]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      inserted: insertedCount,
      skipped: validRows.length - insertedCount,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Tipificacion import error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Database: PostgreSQL (local)');
});