-- =====================================================
-- TELCOB - CRM de Cobranza
-- Script de creación de base de datos PostgreSQL (Neon.tech)
-- =====================================================

-- Eliminar tablas existentes si existe (orden inverso por foreign keys)
DROP TABLE IF EXISTS campanas CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS obligaciones CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS cargues CASCADE;
DROP TABLE IF EXISTS cargue_tipo CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS perfiles_usuario CASCADE;

-- =====================================================
-- TABLA: perfiles_usuario
-- Usuarios del sistema
-- =====================================================
CREATE TABLE perfiles_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('Administrador', 'Supervisor', 'Cobrador', 'Analista', 'Contador')),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para perfiles_usuario
CREATE INDEX idx_perfiles_usuario_tipo ON perfiles_usuario(tipo_usuario);
CREATE INDEX idx_perfiles_usuario_estado ON perfiles_usuario(estado);
CREATE INDEX idx_perfiles_usuario_email ON perfiles_usuario(email);
CREATE INDEX idx_perfiles_usuario_username ON perfiles_usuario(username);

-- =====================================================
-- TABLA: empresas
-- Almacena información de empresas cliente
-- =====================================================
CREATE TABLE empresas (
    idempresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razonsocial VARCHAR(200) NOT NULL,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    email VARCHAR(100),
    descripcion TEXT,
    logo TEXT,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para empresas
CREATE INDEX idx_empresas_ruc ON empresas(ruc);
CREATE INDEX idx_empresas_estado ON empresas(estado);
CREATE INDEX idx_empresas_razonsocial ON empresas(razonsocial);
CREATE INDEX idx_empresas_idusuario ON empresas(idusuario);

-- =====================================================
-- TABLA: productos
-- Productos de cobranza asociados a una empresa
-- =====================================================
CREATE TABLE productos (
    idproducto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    idempresa UUID NOT NULL REFERENCES empresas(idempresa),
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para productos
CREATE INDEX idx_productos_idempresa ON productos(idempresa);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_idusuario ON productos(idusuario);

-- =====================================================
-- TABLA: bases
-- Bases de cobranza asociadas a un producto
-- =====================================================
CREATE TABLE bases (
    idbase UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    alias VARCHAR(100),
    idproducto UUID NOT NULL REFERENCES productos(idproducto),
    idcarguegestionar VARCHAR(50),
    maximocuotas INTEGER,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para bases
CREATE INDEX idx_bases_idproducto ON bases(idproducto);
CREATE INDEX idx_bases_estado ON bases(estado);
CREATE INDEX idx_bases_nombre ON bases(nombre);
CREATE INDEX idx_bases_idusuario ON bases(idusuario);
CREATE INDEX idx_bases_alias ON bases(alias);

-- =====================================================
-- TABLA: cargue_tipo
-- Tipos de carga disponibles en el sistema
-- =====================================================
CREATE TABLE cargue_tipo (
    idtipocargue UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para cargue_tipo
CREATE INDEX idx_cargue_tipo_nombre ON cargue_tipo(nombre);
CREATE INDEX idx_cargue_tipo_estado ON cargue_tipo(estado);
CREATE INDEX idx_cargue_tipo_idusuario ON cargue_tipo(idusuario);

-- =====================================================
-- TABLA: cargues
-- Cargas de información asociadas a una base
-- =====================================================
CREATE TABLE cargues (
    idcargue UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idtipocargue UUID NOT NULL REFERENCES cargue_tipo(idtipocargue),
    idbase UUID NOT NULL REFERENCES bases(idbase),
    nombre VARCHAR(200) NOT NULL,
    cantidadregistros INTEGER NOT NULL DEFAULT 0,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para cargues
CREATE INDEX idx_cargues_idtipocargue ON cargues(idtipocargue);
CREATE INDEX idx_cargues_idbase ON cargues(idbase);
CREATE INDEX idx_cargues_estado ON cargues(estado);
CREATE INDEX idx_cargues_nombre ON cargues(nombre);
CREATE INDEX idx_cargues_idusuario ON cargues(idusuario);

-- =====================================================
-- TABLA: personas
-- Personas (deudores/clientes) del sistema de cobranza
-- =====================================================
CREATE TABLE personas (
    idpersona UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue UUID NOT NULL REFERENCES cargues(idcargue),
    tipodocumento VARCHAR(30),
    identificacion VARCHAR(50) NOT NULL,
    nombrecompleto VARCHAR(300),
    nombre VARCHAR(150),
    apellido VARCHAR(150),
    fechanacimiento DATE,
    edad INTEGER,
    correo VARCHAR(200),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    direccion TEXT,
    estadocivil VARCHAR(30),
    profesion VARCHAR(100),
    sueldo NUMERIC(15,2),
    personadatotexto1 TEXT,
    personadatotexto2 TEXT,
    personadatotexto3 TEXT,
    personadatotexto4 TEXT,
    personadatotexto5 TEXT,
    personadatotexto6 TEXT,
    personadatotexto7 TEXT,
    personadatotexto8 TEXT,
    personadatotexto9 TEXT,
    personadatotexto10 TEXT,
    personadatonumerico1 NUMERIC(18,4),
    personadatonumerico2 NUMERIC(18,4),
    personadatonumerico3 NUMERIC(18,4),
    personadatonumerico4 NUMERIC(18,4),
    personadatonumerico5 NUMERIC(18,4),
    personadatofecha1 TIMESTAMP WITH TIME ZONE,
    personadatofecha2 TIMESTAMP WITH TIME ZONE,
    personadatofecha3 TIMESTAMP WITH TIME ZONE,
    personadatofecha4 TIMESTAMP WITH TIME ZONE,
    personadatofecha5 TIMESTAMP WITH TIME ZONE,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para personas
CREATE INDEX idx_personas_idcargue ON personas(idcargue);
CREATE INDEX idx_personas_identificacion ON personas(identificacion);
CREATE INDEX idx_personas_nombrecompleto ON personas(nombrecompleto);
CREATE INDEX idx_personas_estado ON personas(estado);
CREATE INDEX idx_personas_tipodocumento ON personas(tipodocumento);
CREATE INDEX idx_personas_departamento ON personas(departamento);
CREATE INDEX idx_personas_idusuario ON personas(idusuario);

-- =====================================================
-- TABLA: obligaciones
-- Obligaciones financieras (deudas) de las personas
-- =====================================================
CREATE TABLE obligaciones (
    idobligacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idpersona UUID NOT NULL REFERENCES personas(idpersona),
    idcargue UUID NOT NULL REFERENCES cargues(idcargue),
    cuenta VARCHAR(50),
    numerotarjeta VARCHAR(50),
    producto VARCHAR(200),
    subproducto VARCHAR(200),
    moneda VARCHAR(10),
    deudatotal NUMERIC(18,4),
    interes NUMERIC(18,4),
    diamora INTEGER,
    cancelaciondeuda NUMERIC(18,4),
    obligaciondatotexto1 TEXT,
    obligaciondatotexto2 TEXT,
    obligaciondatotexto3 TEXT,
    obligaciondatotexto4 TEXT,
    obligaciondatotexto5 TEXT,
    obligaciondatotexto6 TEXT,
    obligaciondatotexto7 TEXT,
    obligaciondatotexto8 TEXT,
    obligaciondatotexto9 TEXT,
    obligaciondatotexto10 TEXT,
    obligaciondatotexto11 TEXT,
    obligaciondatotexto12 TEXT,
    obligaciondatotexto13 TEXT,
    obligaciondatotexto14 TEXT,
    obligaciondatotexto15 TEXT,
    obligaciondatotexto16 TEXT,
    obligaciondatotexto17 TEXT,
    obligaciondatotexto18 TEXT,
    obligaciondatotexto19 TEXT,
    obligaciondatotexto20 TEXT,
    obligaciondatotexto21 TEXT,
    obligaciondatotexto22 TEXT,
    obligaciondatotexto23 TEXT,
    obligaciondatotexto24 TEXT,
    obligaciondatotexto25 TEXT,
    obligaciondatotexto26 TEXT,
    obligaciondatotexto27 TEXT,
    obligaciondatotexto28 TEXT,
    obligaciondatotexto29 TEXT,
    obligaciondatotexto30 TEXT,
    obligaciondatotexto31 TEXT,
    obligaciondatotexto32 TEXT,
    obligaciondatotexto33 TEXT,
    obligaciondatotexto34 TEXT,
    obligaciondatotexto35 TEXT,
    obligaciondatotexto36 TEXT,
    obligaciondatotexto37 TEXT,
    obligaciondatotexto38 TEXT,
    obligaciondatotexto39 TEXT,
    obligaciondatotexto40 TEXT,
    obligaciondatotexto41 TEXT,
    obligaciondatotexto42 TEXT,
    obligaciondatotexto43 TEXT,
    obligaciondatotexto44 TEXT,
    obligaciondatotexto45 TEXT,
    obligaciondatotexto46 TEXT,
    obligaciondatotexto47 TEXT,
    obligaciondatotexto48 TEXT,
    obligaciondatotexto49 TEXT,
    obligaciondatotexto50 TEXT,
    obligaciondatonumerico1 NUMERIC(18,4),
    obligaciondatonumerico2 NUMERIC(18,4),
    obligaciondatonumerico3 NUMERIC(18,4),
    obligaciondatonumerico4 NUMERIC(18,4),
    obligaciondatonumerico5 NUMERIC(18,4),
    obligaciondatonumerico6 NUMERIC(18,4),
    obligaciondatonumerico7 NUMERIC(18,4),
    obligaciondatonumerico8 NUMERIC(18,4),
    obligaciondatonumerico9 NUMERIC(18,4),
    obligaciondatonumerico10 NUMERIC(18,4),
    obligaciondatofecha1 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha2 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha3 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha4 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha5 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha6 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha7 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha8 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha9 TIMESTAMP WITH TIME ZONE,
    obligaciondatofecha10 TIMESTAMP WITH TIME ZONE,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para obligaciones
CREATE INDEX idx_obligaciones_idpersona ON obligaciones(idpersona);
CREATE INDEX idx_obligaciones_idcargue ON obligaciones(idcargue);
CREATE INDEX idx_obligaciones_cuenta ON obligaciones(cuenta);
CREATE INDEX idx_obligaciones_producto ON obligaciones(producto);
CREATE INDEX idx_obligaciones_moneda ON obligaciones(moneda);
CREATE INDEX idx_obligaciones_estado ON obligaciones(estado);
CREATE INDEX idx_obligaciones_idusuario ON obligaciones(idusuario);

-- =====================================================
-- TABLA: pagos
-- Pagos realizados por las personas
-- =====================================================
CREATE TABLE pagos (
    idpago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue UUID NOT NULL REFERENCES cargues(idcargue),
    identificacion VARCHAR(50) NOT NULL,
    cuenta VARCHAR(50),
    producto VARCHAR(200),
    subproducto VARCHAR(200),
    fechapago DATE,
    moneda VARCHAR(10),
    montopago NUMERIC(18,4),
    pagodatotexto1 TEXT,
    pagodatotexto2 TEXT,
    pagodatotexto3 TEXT,
    pagodatotexto4 TEXT,
    pagodatotexto5 TEXT,
    pagodatotexto6 TEXT,
    pagodatotexto7 TEXT,
    pagodatotexto8 TEXT,
    pagodatotexto9 TEXT,
    pagodatotexto10 TEXT,
    pagodatonumerico1 NUMERIC(18,4),
    pagodatonumerico2 NUMERIC(18,4),
    pagodatonumerico3 NUMERIC(18,4),
    pagodatonumerico4 NUMERIC(18,4),
    pagodatonumerico5 NUMERIC(18,4),
    pagodatofecha1 TIMESTAMP WITH TIME ZONE,
    pagodatofecha2 TIMESTAMP WITH TIME ZONE,
    pagodatofecha3 TIMESTAMP WITH TIME ZONE,
    pagodatofecha4 TIMESTAMP WITH TIME ZONE,
    pagodatofecha5 TIMESTAMP WITH TIME ZONE,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para pagos
CREATE INDEX idx_pagos_idcargue ON pagos(idcargue);
CREATE INDEX idx_pagos_identificacion ON pagos(identificacion);
CREATE INDEX idx_pagos_cuenta ON pagos(cuenta);
CREATE INDEX idx_pagos_producto ON pagos(producto);
CREATE INDEX idx_pagos_fechapago ON pagos(fechapago);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_idusuario ON pagos(idusuario);

-- =====================================================
-- TABLA: campanas
-- Campañas de cobranza asociadas a cargues
-- =====================================================
CREATE TABLE campanas (
    idcampana UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue UUID NOT NULL REFERENCES cargues(idcargue),
    identificacion VARCHAR(50) NOT NULL,
    cuenta VARCHAR(50),
    porcentaje NUMERIC(5,2),
    montocampana NUMERIC(18,4),
    detalle TEXT,
    campanadatotexto1 TEXT,
    campanadatotexto2 TEXT,
    campanadatotexto3 TEXT,
    campanadatotexto4 TEXT,
    campanadatotexto5 TEXT,
    campanadatonumerico1 NUMERIC(18,4),
    campanadatonumerico2 NUMERIC(18,4),
    campanadatonumerico3 NUMERIC(18,4),
    campanadatonumerico4 NUMERIC(18,4),
    campanadatonumerico5 NUMERIC(18,4),
    campanadatofecha1 TIMESTAMP WITH TIME ZONE,
    campanadatofecha2 TIMESTAMP WITH TIME ZONE,
    campanadatofecha3 TIMESTAMP WITH TIME ZONE,
    campanadatofecha4 TIMESTAMP WITH TIME ZONE,
    campanadatofecha5 TIMESTAMP WITH TIME ZONE,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para campanas
CREATE INDEX idx_campanas_idcargue ON campanas(idcargue);
CREATE INDEX idx_campanas_identificacion ON campanas(identificacion);
CREATE INDEX idx_campanas_cuenta ON campanas(cuenta);
CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_campanas_idusuario ON campanas(idusuario);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para perfiles_usuario
CREATE TRIGGER trigger_actualizar_perfiles_usuario
    BEFORE UPDATE ON perfiles_usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar usuarios por defecto
-- Contraseña: admin123 (hash bcrypt simplificado para demo)
INSERT INTO perfiles_usuario (username, password_hash, nombre_completo, email, tipo_usuario, estado) VALUES
('admin', '$2a$10$YourBcryptHashHere', 'Administrador Sistema', 'admin@telcob.com', 'Administrador', 'activo'),
('supervisor', '$2a$10$YourBcryptHashHere', 'Supervisor General', 'supervisor@telcob.com', 'Supervisor', 'activo'),
('cobrador1', '$2a$10$YourBcryptHashHere', 'Cobrador Uno', 'cobrador1@telcob.com', 'Cobrador', 'activo');

-- Insertar empresa de ejemplo
INSERT INTO empresas (razonsocial, ruc, telefono, direccion, email, descripcion, logo, idusuario, idusuariomod, estado) VALUES
('Banco de Credito y Comercio', '900123456-1', '6012345678', 'Calle 72 # 10-51', 'contacto@bcc.com', 'Banco especializado en creditos comerciales', NULL, (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), 'activo');

-- Insertar producto de ejemplo
INSERT INTO productos (nombre, idempresa, idusuario, idusuariomod, estado) VALUES
('Castigo BCP', (SELECT idempresa FROM empresas WHERE ruc = '900123456-1' LIMIT 1), (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), 'activo');

-- Insertar base de ejemplo
INSERT INTO bases (nombre, alias, idproducto, maximocuotas, idusuario, idusuariomod, estado) VALUES
('Base Marzo 2026', 'BMar2026', (SELECT idproducto FROM productos WHERE nombre = 'Castigo BCP' LIMIT 1), 36, (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), (SELECT id FROM perfiles_usuario WHERE username = 'admin' LIMIT 1), 'activo');

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE perfiles_usuario IS 'Usuarios del sistema';
COMMENT ON TABLE empresas IS 'Empresas cliente del CRM';