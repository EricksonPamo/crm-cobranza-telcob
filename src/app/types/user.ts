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

export interface ModulePermission {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
  rolesPermitidos: UserRole[];
}
