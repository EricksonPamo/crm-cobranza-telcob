CREATE TABLE tipificacion_tipo (
    idtipotipificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codtipotipificacion VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_tipificacion_tipo_cod ON tipificacion_tipo(codtipotipificacion);
CREATE INDEX idx_tipificacion_tipo_nombre ON tipificacion_tipo(nombre);
CREATE INDEX idx_tipificacion_tipo_estado ON tipificacion_tipo(estado);