-- Tabla: vinculo
CREATE TABLE vinculo (
  idvinculo SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  idusuario INTEGER,
  fechamodificacion TIMESTAMP,
  idusuariomod INTEGER,
  estado VARCHAR(20) DEFAULT 'activo'
);

-- Tabla: tipificacion_vinculo
CREATE TABLE tipificacion_vinculo (
  idtipificacion INTEGER NOT NULL,
  idvinculo INTEGER NOT NULL REFERENCES vinculo(idvinculo),
  fechacreacion TIMESTAMP DEFAULT NOW(),
  idusuario INTEGER,
  estado VARCHAR(20) DEFAULT 'activo',
  PRIMARY KEY (idtipificacion, idvinculo)
);