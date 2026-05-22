-- =====================================================
-- MIGRACIÓN 005: Tablas de teléfonos, orígenes y relación personas-teléfonos
-- =====================================================

-- =====================================================
-- TABLA: origen
-- Origen de los datos (de dónde proviene un teléfono, etc.)
-- =====================================================
CREATE TABLE origen (
    idorigen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_origen_nombre ON origen(nombre);
CREATE INDEX idx_origen_estado ON origen(estado);
CREATE INDEX idx_origen_idusuario ON origen(idusuario);

-- =====================================================
-- TABLA: telefonos
-- Teléfonos asociados a un cargue y origen
-- =====================================================
CREATE TABLE telefonos (
    idtelefono UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
    idorigen UUID NOT NULL REFERENCES origen(idorigen),
    telefono VARCHAR(50) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_telefonos_idcargue ON telefonos(idcargue);
CREATE INDEX idx_telefonos_idorigen ON telefonos(idorigen);
CREATE INDEX idx_telefonos_telefono ON telefonos(telefono);
CREATE INDEX idx_telefonos_estado ON telefonos(estado);
CREATE INDEX idx_telefonos_idusuario ON telefonos(idusuario);

-- =====================================================
-- TABLA: personas_telefono
-- Relación persona-teléfono (por identificación)
-- =====================================================
CREATE TABLE personas_telefono (
    identificacion VARCHAR(50) NOT NULL,
    idtelefono UUID NOT NULL REFERENCES telefonos(idtelefono),
    idorigen UUID NOT NULL REFERENCES origen(idorigen),
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    PRIMARY KEY (identificacion, idtelefono, idorigen)
);

CREATE INDEX idx_personas_telefono_identificacion ON personas_telefono(identificacion);
CREATE INDEX idx_personas_telefono_idtelefono ON personas_telefono(idtelefono);
CREATE INDEX idx_personas_telefono_idorigen ON personas_telefono(idorigen);
CREATE INDEX idx_personas_telefono_estado ON personas_telefono(estado);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE origen IS 'Orígenes de datos del sistema';
COMMENT ON TABLE telefonos IS 'Teléfonos asociados a cargues y orígenes';
COMMENT ON TABLE personas_telefono IS 'Relación entre personas y teléfonos';