-- =====================================================
-- TELCOB - CRM de Cobranza
-- Script de creación de base de datos PostgreSQL
-- =====================================================

-- Eliminar tablas existentes si existen (solo para desarrollo)
DROP TABLE IF EXISTS gestiones_cobranza CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS tipificaciones CASCADE;
DROP TABLE IF EXISTS plantillas CASCADE;
DROP TABLE IF EXISTS cargues CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS perfiles_usuario CASCADE;

-- =====================================================
-- TABLA: perfiles_usuario
-- Extiende la información de usuarios de Supabase Auth
-- =====================================================
CREATE TABLE perfiles_usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('Administrador', 'Supervisor', 'Cobrador', 'Analista', 'Contador')),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para perfiles_usuario
CREATE INDEX idx_perfiles_usuario_tipo ON perfiles_usuario(tipo_usuario);
CREATE INDEX idx_perfiles_usuario_estado ON perfiles_usuario(estado);
CREATE INDEX idx_perfiles_usuario_email ON perfiles_usuario(email);

-- =====================================================
-- TABLA: empresas
-- Almacena información de empresas cliente
-- =====================================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    logo_storage_path TEXT,
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para empresas
CREATE INDEX idx_empresas_codigo ON empresas(codigo);
CREATE INDEX idx_empresas_nit ON empresas(nit);
CREATE INDEX idx_empresas_estado ON empresas(estado);
CREATE INDEX idx_empresas_razon_social ON empresas(razon_social);

-- =====================================================
-- TABLA: productos
-- Productos financieros asociados a empresas
-- =====================================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para productos
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_empresa_id ON productos(empresa_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- =====================================================
-- TABLA: bases
-- Bases de datos de cobranza
-- =====================================================
CREATE TABLE bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre_base VARCHAR(200) NOT NULL,
    alias VARCHAR(100) NOT NULL,
    cargue_gestionar VARCHAR(50) DEFAULT 'Pendiente',
    maximo_cuotas INTEGER NOT NULL DEFAULT 12,
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para bases
CREATE INDEX idx_bases_codigo ON bases(codigo);
CREATE INDEX idx_bases_producto_id ON bases(producto_id);
CREATE INDEX idx_bases_estado ON bases(estado);
CREATE INDEX idx_bases_alias ON bases(alias);
CREATE INDEX idx_bases_nombre_base ON bases(nombre_base);

-- =====================================================
-- TABLA: cargues
-- Cargues de información (obligación, pago, campaña)
-- =====================================================
CREATE TABLE cargues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    base_id UUID NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('obligacion', 'pago', 'campaña')),
    nombre_cargue VARCHAR(200) NOT NULL,
    registros_cargados INTEGER NOT NULL DEFAULT 0,
    archivo_nombre VARCHAR(255),
    archivo_storage_path TEXT,
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para cargues
CREATE INDEX idx_cargues_codigo ON cargues(codigo);
CREATE INDEX idx_cargues_base_id ON cargues(base_id);
CREATE INDEX idx_cargues_tipo ON cargues(tipo);
CREATE INDEX idx_cargues_estado ON cargues(estado);
CREATE INDEX idx_cargues_fecha_creacion ON cargues(fecha_creacion);

-- =====================================================
-- TABLA: plantillas
-- Plantillas de mensajes para comunicación
-- =====================================================
CREATE TABLE plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre_plantilla VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('SMS', 'Email', 'WhatsApp', 'IVR')),
    contenido TEXT NOT NULL,
    variables_disponibles TEXT[],
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para plantillas
CREATE INDEX idx_plantillas_codigo ON plantillas(codigo);
CREATE INDEX idx_plantillas_tipo ON plantillas(tipo);
CREATE INDEX idx_plantillas_estado ON plantillas(estado);
CREATE INDEX idx_plantillas_nombre ON plantillas(nombre_plantilla);

-- =====================================================
-- TABLA: tipificaciones
-- Tipificaciones para clasificar gestiones de cobranza
-- =====================================================
CREATE TABLE tipificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7), -- Color hex para UI: #RRGGBB
    requiere_observacion BOOLEAN DEFAULT FALSE,
    afecta_mora BOOLEAN DEFAULT FALSE,
    usuario_creador VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para tipificaciones
CREATE INDEX idx_tipificaciones_codigo ON tipificaciones(codigo);
CREATE INDEX idx_tipificaciones_categoria ON tipificaciones(categoria);
CREATE INDEX idx_tipificaciones_estado ON tipificaciones(estado);
CREATE INDEX idx_tipificaciones_nombre ON tipificaciones(nombre);

-- =====================================================
-- TABLA: clientes
-- Información de clientes deudores
-- =====================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_documento VARCHAR(50) UNIQUE NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('CC', 'CE', 'NIT', 'PAS', 'TI')),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10) CHECK (genero IN ('M', 'F', 'Otro')),
    ocupacion VARCHAR(100),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- Índices para clientes
CREATE INDEX idx_clientes_numero_documento ON clientes(numero_documento);
CREATE INDEX idx_clientes_tipo_documento ON clientes(tipo_documento);
CREATE INDEX idx_clientes_nombres ON clientes(nombres);
CREATE INDEX idx_clientes_apellidos ON clientes(apellidos);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefono_principal ON clientes(telefono_principal);
CREATE INDEX idx_clientes_estado ON clientes(estado);

-- =====================================================
-- TABLA: gestiones_cobranza
-- Registro de gestiones de cobranza realizadas
-- =====================================================
CREATE TABLE gestiones_cobranza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    base_id UUID NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES perfiles_usuario(id),
    tipificacion_id UUID REFERENCES tipificaciones(id),
    numero_obligacion VARCHAR(50) NOT NULL,
    valor_obligacion DECIMAL(15, 2) NOT NULL,
    saldo_actual DECIMAL(15, 2) NOT NULL,
    dias_mora INTEGER DEFAULT 0,
    fecha_gestion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('Telefono', 'Email', 'SMS', 'WhatsApp', 'Presencial', 'IVR')),
    tipo_contacto VARCHAR(20) CHECK (tipo_contacto IN ('Efectivo', 'No Efectivo', 'Promesa de Pago')),
    observaciones TEXT,
    promesa_pago_fecha DATE,
    promesa_pago_valor DECIMAL(15, 2),
    acuerdo_cuotas INTEGER,
    acuerdo_valor_cuota DECIMAL(15, 2),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gestiones_cobranza
CREATE INDEX idx_gestiones_cliente_id ON gestiones_cobranza(cliente_id);
CREATE INDEX idx_gestiones_base_id ON gestiones_cobranza(base_id);
CREATE INDEX idx_gestiones_usuario_id ON gestiones_cobranza(usuario_id);
CREATE INDEX idx_gestiones_tipificacion_id ON gestiones_cobranza(tipificacion_id);
CREATE INDEX idx_gestiones_numero_obligacion ON gestiones_cobranza(numero_obligacion);
CREATE INDEX idx_gestiones_fecha_gestion ON gestiones_cobranza(fecha_gestion);
CREATE INDEX idx_gestiones_canal ON gestiones_cobranza(canal);
CREATE INDEX idx_gestiones_tipo_contacto ON gestiones_cobranza(tipo_contacto);
CREATE INDEX idx_gestiones_promesa_pago_fecha ON gestiones_cobranza(promesa_pago_fecha);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para perfiles_usuario
CREATE TRIGGER trigger_actualizar_perfiles_usuario
    BEFORE UPDATE ON perfiles_usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para clientes
CREATE TRIGGER trigger_actualizar_clientes
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargues ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestiones_cobranza ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles_usuario (todos pueden leer, solo admins pueden modificar)
CREATE POLICY "Perfiles visibles para todos los autenticados" ON perfiles_usuario
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admins pueden insertar perfiles" ON perfiles_usuario
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario = 'Administrador')
    );

CREATE POLICY "Solo admins pueden actualizar perfiles" ON perfiles_usuario
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario = 'Administrador')
    );

-- Políticas para empresas
CREATE POLICY "Empresas visibles para todos los autenticados" ON empresas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins y supervisores pueden crear empresas" ON empresas
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

CREATE POLICY "Admins y supervisores pueden actualizar empresas" ON empresas
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

-- Políticas para productos
CREATE POLICY "Productos visibles para todos los autenticados" ON productos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins y supervisores pueden crear productos" ON productos
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

CREATE POLICY "Admins y supervisores pueden actualizar productos" ON productos
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

-- Políticas para bases
CREATE POLICY "Bases visibles para todos los autenticados" ON bases
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins y supervisores pueden crear bases" ON bases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

CREATE POLICY "Admins y supervisores pueden actualizar bases" ON bases
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

-- Políticas para cargues
CREATE POLICY "Cargues visibles para todos los autenticados" ON cargues
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins, supervisores y analistas pueden crear cargues" ON cargues
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor', 'Analista'))
    );

-- Políticas para plantillas
CREATE POLICY "Plantillas visibles para todos los autenticados" ON plantillas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins y supervisores pueden gestionar plantillas" ON plantillas
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

-- Políticas para tipificaciones
CREATE POLICY "Tipificaciones visibles para todos los autenticados" ON tipificaciones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins y supervisores pueden gestionar tipificaciones" ON tipificaciones
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles_usuario WHERE id = auth.uid() AND tipo_usuario IN ('Administrador', 'Supervisor'))
    );

-- Políticas para clientes
CREATE POLICY "Clientes visibles para todos los autenticados" ON clientes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes
    FOR UPDATE TO authenticated USING (true);

-- Políticas para gestiones_cobranza
CREATE POLICY "Gestiones visibles para todos los autenticados" ON gestiones_cobranza
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear gestiones" ON gestiones_cobranza
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Solo el creador puede actualizar sus gestiones" ON gestiones_cobranza
    FOR UPDATE TO authenticated USING (usuario_id = auth.uid());

-- =====================================================
-- DATOS INICIALES DE EJEMPLO
-- =====================================================

-- Nota: Los usuarios se crean a través de Supabase Auth
-- Aquí solo creamos los perfiles si los usuarios ya existen

-- COMENTARIO: Descomentar y ajustar los UUIDs después de crear usuarios en Supabase Auth
/*
INSERT INTO perfiles_usuario (id, username, nombre_completo, email, tipo_usuario, estado) VALUES
('UUID_DEL_USUARIO_1', 'admin', 'Administrador Sistema', 'admin@telcob.com', 'Administrador', 'activo'),
('UUID_DEL_USUARIO_2', 'supervisor', 'Supervisor General', 'supervisor@telcob.com', 'Supervisor', 'activo'),
('UUID_DEL_USUARIO_3', 'cobrador1', 'Cobrador Uno', 'cobrador1@telcob.com', 'Cobrador', 'activo');
*/

-- Insertar empresa de ejemplo
INSERT INTO empresas (codigo, razon_social, nit, direccion, telefono, email, usuario_creador, estado) VALUES
('1', 'Banco de Crédito y Comercio', '900123456-1', 'Calle 72 # 10-51', '6012345678', 'contacto@bcc.com', 'admin', 'activo');

-- Insertar producto de ejemplo
INSERT INTO productos (codigo, empresa_id, nombre, usuario_creador, estado) VALUES
('1', (SELECT id FROM empresas WHERE codigo = '1'), 'BCP Castigo', 'admin', 'activo');

-- Insertar base de ejemplo
INSERT INTO bases (codigo, producto_id, nombre_base, alias, cargue_gestionar, maximo_cuotas, usuario_creador, estado) VALUES
('1', (SELECT id FROM productos WHERE codigo = '1'), 'Base de Marzo 2026', 'BCPMar2026', 'Pendiente', 12, 'admin', 'activo');

-- Insertar tipificaciones de ejemplo
INSERT INTO tipificaciones (codigo, nombre, categoria, descripcion, color, requiere_observacion, afecta_mora, usuario_creador, estado) VALUES
('1', 'Contacto Efectivo', 'Contacto', 'Se logró contactar al cliente', '#22c55e', false, false, 'admin', 'activo'),
('2', 'Promesa de Pago', 'Compromiso', 'Cliente promete pagar en fecha específica', '#3b82f6', true, false, 'admin', 'activo'),
('3', 'No Contesta', 'Sin Contacto', 'No se logró contacto telefónico', '#ef4444', false, false, 'admin', 'activo'),
('4', 'Acuerdo de Pago', 'Compromiso', 'Se estableció acuerdo de pago', '#8b5cf6', true, false, 'admin', 'activo'),
('5', 'Cliente Rechaza', 'Negativo', 'Cliente se niega a pagar', '#f59e0b', true, true, 'admin', 'activo');

-- Insertar plantillas de ejemplo
INSERT INTO plantillas (codigo, nombre_plantilla, tipo, contenido, variables_disponibles, usuario_creador, estado) VALUES
('1', 'Recordatorio de Pago SMS', 'SMS', 'Estimado {{NOMBRE}}, le recordamos que tiene una obligación pendiente por {{VALOR}}. Por favor comuníquese al {{TELEFONO}}.', ARRAY['NOMBRE', 'VALOR', 'TELEFONO', 'FECHA_VENCIMIENTO'], 'admin', 'activo'),
('2', 'Confirmación de Promesa Email', 'Email', 'Hola {{NOMBRE}},\n\nConfirmamos su promesa de pago por {{VALOR}} para la fecha {{FECHA_PROMESA}}.\n\nGracias por su compromiso.', ARRAY['NOMBRE', 'VALOR', 'FECHA_PROMESA', 'NUMERO_OBLIGACION'], 'admin', 'activo'),
('3', 'Notificación WhatsApp', 'WhatsApp', 'Hola {{NOMBRE}} 👋\n\nTienes una obligación pendiente:\n💰 Valor: {{VALOR}}\n📅 Vencimiento: {{FECHA_VENCIMIENTO}}\n\n¿Podemos ayudarte?', ARRAY['NOMBRE', 'VALOR', 'FECHA_VENCIMIENTO', 'SALDO'], 'admin', 'activo');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de productos con información de empresa
CREATE OR REPLACE VIEW vista_productos_completa AS
SELECT 
    p.id,
    p.codigo,
    p.nombre AS producto_nombre,
    p.estado AS producto_estado,
    e.id AS empresa_id,
    e.codigo AS empresa_codigo,
    e.razon_social AS empresa_nombre,
    p.usuario_creador,
    p.fecha_creacion
FROM productos p
INNER JOIN empresas e ON p.empresa_id = e.id;

-- Vista de bases con información de producto y empresa
CREATE OR REPLACE VIEW vista_bases_completa AS
SELECT 
    b.id,
    b.codigo,
    b.nombre_base,
    b.alias,
    b.cargue_gestionar,
    b.maximo_cuotas,
    b.estado AS base_estado,
    p.id AS producto_id,
    p.codigo AS producto_codigo,
    p.nombre AS producto_nombre,
    e.id AS empresa_id,
    e.razon_social AS empresa_nombre,
    b.usuario_creador,
    b.fecha_creacion
FROM bases b
INNER JOIN productos p ON b.producto_id = p.id
INNER JOIN empresas e ON p.empresa_id = e.id;

-- Vista de cargues con información de base
CREATE OR REPLACE VIEW vista_cargues_completa AS
SELECT 
    c.id,
    c.codigo,
    c.tipo,
    c.nombre_cargue,
    c.registros_cargados,
    c.estado AS cargue_estado,
    b.id AS base_id,
    b.codigo AS base_codigo,
    b.nombre_base,
    c.usuario_creador,
    c.fecha_creacion
FROM cargues c
INNER JOIN bases b ON c.base_id = b.id;

-- Vista de gestiones de cobranza completa
CREATE OR REPLACE VIEW vista_gestiones_completa AS
SELECT 
    g.id,
    g.numero_obligacion,
    g.valor_obligacion,
    g.saldo_actual,
    g.dias_mora,
    g.fecha_gestion,
    g.canal,
    g.tipo_contacto,
    g.observaciones,
    g.promesa_pago_fecha,
    g.promesa_pago_valor,
    c.numero_documento AS cliente_documento,
    c.nombres || ' ' || c.apellidos AS cliente_nombre_completo,
    c.telefono_principal AS cliente_telefono,
    b.nombre_base,
    p.username AS usuario_gestor,
    t.nombre AS tipificacion_nombre,
    t.categoria AS tipificacion_categoria,
    g.fecha_creacion
FROM gestiones_cobranza g
INNER JOIN clientes c ON g.cliente_id = c.id
INNER JOIN bases b ON g.base_id = b.id
INNER JOIN perfiles_usuario p ON g.usuario_id = p.id
LEFT JOIN tipificaciones t ON g.tipificacion_id = t.id;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este script crea la estructura completa de la base de datos TELCOB
-- 
-- INSTRUCCIONES POST-INSTALACIÓN:
-- 1. Crear usuarios a través de Supabase Auth
-- 2. Insertar los perfiles de usuario en la tabla perfiles_usuario
-- 3. Configurar Storage Buckets para logos y archivos (si es necesario)
-- 4. Ajustar las políticas RLS según sus necesidades específicas
-- 5. Crear índices adicionales según los patrones de consulta
--
-- NOTAS DE SEGURIDAD:
-- - RLS está habilitado en todas las tablas
-- - Las políticas actuales son básicas, ajustar según requerimientos
-- - Considerar implementar auditoría de cambios si es necesario
-- - Los archivos deben almacenarse en Supabase Storage, no en base de datos

COMMENT ON TABLE perfiles_usuario IS 'Perfiles extendidos de usuarios del sistema';
COMMENT ON TABLE empresas IS 'Empresas cliente del CRM';
COMMENT ON TABLE productos IS 'Productos financieros de las empresas';
COMMENT ON TABLE bases IS 'Bases de datos de cobranza';
COMMENT ON TABLE cargues IS 'Cargues de información (obligaciones, pagos, campañas)';
COMMENT ON TABLE plantillas IS 'Plantillas de mensajes para comunicación';
COMMENT ON TABLE tipificaciones IS 'Tipificaciones para clasificar gestiones';
COMMENT ON TABLE clientes IS 'Información de clientes deudores';
COMMENT ON TABLE gestiones_cobranza IS 'Registro de gestiones de cobranza realizadas';
