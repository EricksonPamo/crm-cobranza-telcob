-- =====================================================
-- Agregar columnas de ficha a producto_homologacion
-- =====================================================
ALTER TABLE producto_homologacion
    ADD COLUMN idtipodatoficha UUID REFERENCES ficha_tipo_dato(idtipodatoficha),
    ADD COLUMN idsegmentoficha UUID REFERENCES ficha_segmento(idsegmentoficha),
    ADD COLUMN esvisible BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN ordenvisualizacion INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_producto_homologacion_tipodatoficha ON producto_homologacion(idtipodatoficha);
CREATE INDEX idx_producto_homologacion_segmentoficha ON producto_homologacion(idsegmentoficha);