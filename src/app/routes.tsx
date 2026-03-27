import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Users } from './components/Users';
import { Clientes } from './components/Clientes';
import { Cobranza } from './components/Cobranza';
import { Configuracion } from './components/Configuracion';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { UserCircle, DollarSign, FileText, Calculator } from 'lucide-react';
import React from 'react';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'usuarios',
        element: <Users />,
      },
      {
        path: 'clientes',
        element: <Clientes />,
      },
      {
        path: 'cobranza',
        element: <Cobranza />,
      },
      {
        path: 'reportes',
        element: (
          <ModulePlaceholder
            title="Reportes"
            description="Reportes y estadísticas"
            icon={FileText}
          />
        ),
      },
      {
        path: 'contabilidad',
        element: (
          <ModulePlaceholder
            title="Contabilidad"
            description="Módulo contable y financiero"
            icon={Calculator}
          />
        ),
      },
      {
        path: 'configuracion',
        element: <Configuracion />,
      },
    ],
  },
]);