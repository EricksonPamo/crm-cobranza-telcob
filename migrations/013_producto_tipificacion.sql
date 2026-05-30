CREATE TABLE producto_tipificacion (
    idproducto UUID NOT NULL REFERENCES productos(idproducto),
    idtipificacion UUID NOT NULL REFERENCES tipificacion_tipo(idtipotipificacion),
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID NOT NULL REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    PRIMARY KEY (idproducto, idtipificacion)
);

CREATE INDEX idx_producto_tipificacion_idproducto ON producto_tipificacion(idproducto);
CREATE INDEX idx_producto_tipificacion_idtipificacion ON producto_tipificacion(idtipificacion);
CREATE INDEX idx_producto_tipificacion_estado ON producto_tipificacion(estado);