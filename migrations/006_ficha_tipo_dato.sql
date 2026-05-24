-- =====================================================
-- TABLA: ficha_tipo_dato
-- =====================================================
CREATE TABLE ficha_tipo_dato (
    idtipodatoficha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_ficha_tipo_dato_estado ON ficha_tipo_dato(estado);
CREATE INDEX idx_ficha_tipo_dato_nombre ON ficha_tipo_dato(nombre);