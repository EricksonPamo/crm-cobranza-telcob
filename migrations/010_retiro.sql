CREATE TABLE retiro (
    idretiro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idretirotipo UUID NOT NULL REFERENCES retiro_tipo(idretirotipo),
    idcargue BIGINT NOT NULL REFERENCES cargues(idcargue),
    valor NUMERIC(18,2) NOT NULL,
    motivo TEXT,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_retiro_idretirotipo ON retiro(idretirotipo);
CREATE INDEX idx_retiro_idcargue ON retiro(idcargue);
CREATE INDEX idx_retiro_estado ON retiro(estado);