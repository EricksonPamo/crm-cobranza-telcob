import { ModulePermission } from '../types/user';

export const modulesPermissions: ModulePermission[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard',
    descripcion: 'Vista general del sistema',
    icono: 'LayoutDashboard',
    ruta: '/dashboard',
    rolesPermitidos: ['admin', 'supervisor', 'cobrador', 'analista', 'contador'],
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Gestión de usuarios del sistema',
    icono: 'Users',
    ruta: '/usuarios',
    rolesPermitidos: ['admin', 'supervisor'],
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    descripcion: 'Gestión de clientes y deudores',
    icono: 'UserCircle',
    ruta: '/clientes',
    rolesPermitidos: ['admin', 'supervisor', 'cobrador', 'analista'],
  },
  {
    id: 'cobranza',
    nombre: 'Cobranza',
    descripcion: 'Gestión de cobranzas y pagos',
    icono: 'DollarSign',
    ruta: '/cobranza',
    rolesPermitidos: ['admin', 'supervisor', 'cobrador'],
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    descripcion: 'Reportes y estadísticas',
    icono: 'FileText',
    ruta: '/reportes',
    rolesPermitidos: ['admin', 'supervisor', 'analista', 'contador'],
  },
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    descripcion: 'Módulo contable y financiero',
    icono: 'Calculator',
    ruta: '/contabilidad',
    rolesPermitidos: ['admin', 'contador'],
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    descripcion: 'Configuración del sistema',
    icono: 'Settings',
    ruta: '/configuracion',
    rolesPermitidos: ['admin'],
  },
];

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  cobrador: 'Cobrador',
  analista: 'Analista',
  contador: 'Contador',
};

export const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  supervisor: 'bg-blue-100 text-blue-800',
  cobrador: 'bg-green-100 text-green-800',
  analista: 'bg-purple-100 text-purple-800',
  contador: 'bg-yellow-100 text-yellow-800',
};
