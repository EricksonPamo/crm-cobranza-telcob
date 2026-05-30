CREATE TABLE tipificacion_regla (
    idtipificacionregla UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idtipificacion UUID NOT NULL REFERENCES tipificacion_tipo(idtipotipificacion),
    campoasignacion VARCHAR(200) NOT NULL,
    condicionalvalormin VARCHAR(200),
    porcentajemin NUMERIC(5,2),
    condicionalvalormax VARCHAR(200),
    porcentajemax NUMERIC(5,2),
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_tipificacion_regla_idtipificacion ON tipificacion_regla(idtipificacion);
CREATE INDEX idx_tipificacion_regla_campoasignacion ON tipificacion_regla(campoasignacion);
CREATE INDEX idx_tipificacion_regla_estado ON tipificacion_regla(estado);