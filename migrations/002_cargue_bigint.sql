-- =====================================================
-- MIGRACIÓN 002: Cambiar idcargue a BIGINT + nuevas columnas
-- =====================================================

-- 1. Eliminar tablas dependientes de cargues (probablemente sin datos reales)
DROP TABLE IF EXISTS campanas CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS obligaciones CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS cargues CASCADE;

-- 2. Cambiar bases.idcarguegestionar de VARCHAR(50) a BIGINT
ALTER TABLE bases ALTER COLUMN idcarguegestionar DROP NOT NULL;
ALTER TABLE bases ALTER COLUMN idcarguegestionar TYPE BIGINT USING NULL;

-- 3. Recrear cargues con BIGINT idcargue + nombrearchivo
CREATE TABLE cargues (
    idcargue BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    idtipocargue UUID NOT NULL REFERENCES cargue_tipo(idtipocargue),
    idbase UUID NOT NULL REFERENCES bases(idbase),
    nombre VARCHAR(200) NOT NULL,
    nombrearchivo VARCHAR(500) NOT NULL,
    cantidadregistros INTEGER NOT NULL DEFAULT 0,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_cargues_idtipocargue ON cargues(idtipocargue);
CREATE INDEX idx_cargues_idbase ON cargues(idbase);
CREATE INDEX idx_cargues_estado ON cargues(estado);
CREATE INDEX idx_cargues_nombrearchivo ON cargues(nombrearchivo);
CREATE INDEX idx_cargues_idusuario ON cargues(idusuario);

-- 4. Recrear personas con BIGINT idcargue
CREATE TABLE personas (
    idpersona UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
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

CREATE INDEX idx_personas_idcargue ON personas(idcargue);
CREATE INDEX idx_personas_identificacion ON personas(identificacion);
CREATE INDEX idx_personas_nombrecompleto ON personas(nombrecompleto);
CREATE INDEX idx_personas_estado ON personas.estado;
CREATE INDEX idx_personas_tipodocumento ON personas(tipodocumento);
CREATE INDEX idx_personas_departamento ON personas(departamento);
CREATE INDEX idx_personas_idusuario ON personas(idusuario);

-- 5. Recrear obligaciones con BIGINT idcargue
CREATE TABLE obligaciones (
    idobligacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idpersona UUID NOT NULL REFERENCES personas(idpersona),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
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

CREATE INDEX idx_obligaciones_idpersona ON obligaciones(idpersona);
CREATE INDEX idx_obligaciones_idcargue ON obligaciones(idcargue);
CREATE INDEX idx_obligaciones_cuenta ON obligaciones(cuenta);
CREATE INDEX idx_obligaciones_producto ON obligaciones(producto);
CREATE INDEX idx_obligaciones_moneda ON obligaciones(moneda);
CREATE INDEX idx_obligaciones_estado ON obligaciones(estado);
CREATE INDEX idx_obligaciones_idusuario ON obligaciones(idusuario);

-- 6. Recrear pagos con BIGINT idcargue
CREATE TABLE pagos (
    idpago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
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

CREATE INDEX idx_pagos_idcargue ON pagos(idcargue);
CREATE INDEX idx_pagos_identificacion ON pagos(identificacion);
CREATE INDEX idx_pagos_cuenta ON pagos(cuenta);
CREATE INDEX idx_pagos_producto ON pagos(producto);
CREATE INDEX idx_pagos_fechapago ON pagos(fechapago);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_idusuario ON pagos(idusuario);

-- 7. Recrear campanas con BIGINT idcargue
CREATE TABLE campanas (
    idcampana UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
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

CREATE INDEX idx_campanas_idcargue ON campanas(idcargue);
CREATE INDEX idx_campanas_identificacion ON campanas(identificacion);
CREATE INDEX idx_campanas_cuenta ON campanas(cuenta);
CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_campanas_idusuario ON campanas(idusuario);