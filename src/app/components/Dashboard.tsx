import { useAuth } from '../contexts/AuthContext';
import { modulesPermissions, roleLabels } from '../data/modules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  FileText,
  Calculator,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  FileText,
  Calculator,
  Settings,
};

export function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const availableModules = modulesPermissions.filter((module) =>
    currentUser?.rol ? module.rolesPermitidos.includes(currentUser.rol) : false
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Bienvenido, {currentUser?.nombre}
        </h1>
        <p className="text-gray-600">
          Rol: <span className="font-medium">{currentUser?.rol ? roleLabels[currentUser.rol] : ''}</span>
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Módulos Disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableModules
            .filter((module) => module.id !== 'dashboard')
            .map((module) => {
              const Icon = iconMap[module.icono];
              return (
                <Card
                  key={module.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(module.ruta)}
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <CardTitle>{module.nombre}</CardTitle>
                    <CardDescription>{module.descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">245</p>
            <p className="text-sm text-green-600 mt-1">+12% este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Cobranzas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">$125,450</p>
            <p className="text-sm text-gray-600 mt-1">68 casos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Tasa de Recuperación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">78.5%</p>
            <p className="text-sm text-green-600 mt-1">+5.2% este mes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
