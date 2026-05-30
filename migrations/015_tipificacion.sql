CREATE TABLE tipificacion (
    idtipificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idcanalcomunicacion UUID NOT NULL REFERENCES canal_comunicacion(idcanalcomunicacion),
    idtipotipificacion UUID NOT NULL REFERENCES tipificacion_tipo(idtipotipificacion),
    codaccion VARCHAR(50),
    accion VARCHAR(200),
    codresultado VARCHAR(50),
    resultado VARCHAR(200),
    resultado1 VARCHAR(200),
    resultado2 VARCHAR(200),
    resultado3 VARCHAR(200),
    resultado4 VARCHAR(200),
    resultado5 VARCHAR(200),
    destacado VARCHAR(10) DEFAULT 'no' CHECK (destacado IN ('si', 'no')),
    mostrarweb VARCHAR(10) DEFAULT 'si' CHECK (mostrarweb IN ('si', 'no')),
    peso INTEGER NOT NULL DEFAULT 0,
    disponeregla VARCHAR(10) DEFAULT 'no' CHECK (disponeregla IN ('si', 'no')),
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_tipificacion_idcanalcomunicacion ON tipificacion(idcanalcomunicacion);
CREATE INDEX idx_tipificacion_idtipotipificacion ON tipificacion(idtipotipificacion);
CREATE INDEX idx_tipificacion_codaccion ON tipificacion(codaccion);
CREATE INDEX idx_tipificacion_codresultado ON tipificacion(codresultado);
CREATE INDEX idx_tipificacion_estado ON tipificacion(estado);
CREATE INDEX idx_tipificacion_destacado ON tipificacion(destacado);