-- =====================================================
-- MIGRACIÓN 003: Unificar obligaciones en personas
-- Elimina tabla obligaciones y agrega campos de obligación a personas
-- Expande campos datotexto (10->50), datonumerico (5->15), datofecha (5->15)
-- =====================================================

-- 1. Agregar campos de obligaciones a personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS cuenta VARCHAR(50);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS numerotarjeta VARCHAR(50);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS producto VARCHAR(200);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS subproducto VARCHAR(200);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS moneda VARCHAR(10);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS deudatotal NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS interes NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS cancelaciondeuda NUMERIC(18,4);

-- 2. Expandir personadatotexto (11-50)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto11 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto12 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto13 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto14 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto15 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto16 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto17 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto18 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto19 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto20 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto21 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto22 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto23 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto24 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto25 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto26 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto27 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto28 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto29 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto30 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto31 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto32 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto33 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto34 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto35 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto36 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto37 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto38 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto39 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto40 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto41 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto42 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto43 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto44 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto45 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto46 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto47 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto48 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto49 TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatotexto50 TEXT;

-- 3. Expandir personadatonumerico (6-15)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico6 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico7 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico8 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico9 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico10 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico11 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico12 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico13 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico14 NUMERIC(18,4);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatonumerico15 NUMERIC(18,4);

-- 4. Expandir personadatofecha (6-15)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha6 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha7 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha8 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha9 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha10 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha11 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha12 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha13 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha14 TIMESTAMP WITH TIME ZONE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS personadatofecha15 TIMESTAMP WITH TIME ZONE;

-- 5. Crear índices para nuevos campos
CREATE INDEX IF NOT EXISTS idx_personas_cuenta ON personas(cuenta);
CREATE INDEX IF NOT EXISTS idx_personas_producto ON personas(producto);
CREATE INDEX IF NOT EXISTS idx_personas_moneda ON personas(moneda);

-- 6. Eliminar tabla obligaciones
DROP TABLE IF EXISTS obligaciones CASCADE;