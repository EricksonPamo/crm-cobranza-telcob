CREATE TABLE canal_comunicacion (
    idcanalcomunicacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_canal_comunicacion_nombre ON canal_comunicacion(nombre);
CREATE INDEX idx_canal_comunicacion_estado ON canal_comunicacion(estado);