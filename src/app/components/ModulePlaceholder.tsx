import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>
            Este módulo estará disponible próximamente. Aquí podrás gestionar {title.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Funcionalidades planificadas:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700 list-disc list-inside">
              <li>Crear y gestionar registros</li>
              <li>Búsqueda y filtros avanzados</li>
              <li>Reportes y exportación de datos</li>
              <li>Historial de actividades</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
