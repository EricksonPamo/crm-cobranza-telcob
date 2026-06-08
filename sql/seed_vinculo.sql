-- Seed: Insertar vínculos por defecto
INSERT INTO vinculo (nombre, estado) VALUES
  ('Padre', 'activo'),
  ('Madre', 'activo'),
  ('Esposa(o)', 'activo'),
  ('Hija(o)', 'activo'),
  ('Hermana(o)', 'activo'),
  ('Abuela(o)', 'activo'),
  ('Tia(o)', 'activo'),
  ('Prima(o)', 'activo'),
  ('Sobrina(o)', 'activo'),
  ('Vecino', 'activo'),
  ('Amigo', 'activo'),
  ('Conocido', 'activo'),
  ('Empleador', 'activo'),
  ('Representante Legal', 'activo'),
  ('Otro', 'activo')
ON CONFLICT DO NOTHING;