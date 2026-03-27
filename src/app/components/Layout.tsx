import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { modulesPermissions, roleLabels } from '../data/modules';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  FileText,
  Calculator,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  FileText,
  Calculator,
  Settings,
};

export function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Comprimido por defecto

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const availableModules = modulesPermissions.filter((module) =>
    currentUser?.rol ? module.rolesPermitidos.includes(currentUser.rol) : false
  );

  return (
    <div className="h-7 text-xs flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-[207px]' : 'w-[65px]'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className={`${sidebarOpen ? 'p-3' : 'p-2'} border-b border-gray-200 transition-all duration-300`}>
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-base font-semibold text-indigo-600 whitespace-nowrap">CRM Cobranza</h1>
            )}
            {!sidebarOpen && (
              <div className="w-full flex justify-center">
                <Menu className="w-5 h-5 text-indigo-600" />
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto ${sidebarOpen ? 'p-3' : 'p-2'} space-y-2 transition-all duration-300`}>
          {availableModules.map((module) => {
            const Icon = iconMap[module.icono];
            const isActive = location.pathname === module.ruta;

            return (
              <button
                key={module.id}
                onClick={() => navigate(module.ruta)}
                className={`w-full flex items-center ${sidebarOpen ? 'gap-2 px-3 py-2.5' : 'justify-center px-2 py-2.5'} rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? module.nombre : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">{module.nombre}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`${sidebarOpen ? 'p-3' : 'p-2'} border-t border-gray-200 transition-all duration-300`}>
          {sidebarOpen && currentUser && (
            <div className="mb-3 px-1">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabels[currentUser.rol]}</p>
            </div>
          )}
          <Button
            variant="outline"
            className={`w-full ${!sidebarOpen ? 'px-2' : ''}`}
            onClick={handleLogout}
            title={!sidebarOpen ? 'Cerrar Sesión' : ''}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}