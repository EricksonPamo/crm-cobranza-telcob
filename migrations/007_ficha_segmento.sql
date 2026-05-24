-- =====================================================
-- TABLA: ficha_segmento
-- =====================================================
CREATE TABLE ficha_segmento (
    idsegmentoficha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idtipodatoficha UUID NOT NULL REFERENCES ficha_tipo_dato(idtipodatoficha),
    nombre VARCHAR(200) NOT NULL,
    ordenvisualizacion INTEGER NOT NULL DEFAULT 0,
    fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idusuario UUID NOT NULL REFERENCES perfiles_usuario(id),
    fechamodificacion TIMESTAMP WITH TIME ZONE,
    idusuariomod UUID REFERENCES perfiles_usuario(id),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_ficha_segmento_tipodato ON ficha_segmento(idtipodatoficha);
CREATE INDEX idx_ficha_segmento_estado ON ficha_segmento(estado);
CREATE INDEX idx_ficha_segmento_orden ON ficha_segmento(ordenvisualizacion);