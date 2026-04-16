export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'cobrador'
  | 'analista'
  | 'contador';

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

export const roleMapBDtoApp: Record<string, UserRole> = {
  'Administrador': 'admin',
  'Supervisor': 'supervisor',
  'Cobrador': 'cobrador',
  'Analista': 'analista',
  'Contador': 'contador',
};

export const roleMapAppToBD: Record<UserRole, string> = {
  'admin': 'Administrador',
  'supervisor': 'Supervisor',
  'cobrador': 'Cobrador',
  'analista': 'Analista',
  'contador': 'Contador',
};

export interface ModulePermission {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
  rolesPermitidos: UserRole[];
}