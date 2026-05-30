import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Empresa } from './configuracion/Empresa';
import { Producto } from './configuracion/Producto';
import { Base } from './configuracion/Base';
import { CargueModule } from './configuracion/Cargue';
import { Plantilla } from './configuracion/Plantilla';
import { Tipificacion } from './configuracion/Tipificacion';
import { Building2, Package, Database, Upload, FileText, Tags } from 'lucide-react';

export function Configuracion() {
  const [activeTab, setActiveTab] = useState('empresa');

  const renderContent = () => {
    switch (activeTab) {
      case 'empresa': return <Empresa />;
      case 'producto': return <Producto />;
      case 'base': return <Base />;
      case 'cargue': return <CargueModule />;
      case 'plantilla': return <Plantilla />;
      case 'tipificacion': return <Tipificacion />;
      default: return <Empresa />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Configuración del Sistema
        </h1>
        <p className="text-gray-600">
          Configure los parámetros generales del CRM de cobranza
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto bg-gray-300 p-1">
          <TabsTrigger value="empresa" className="gap-1.5 data-[state=active]:bg-white"><Building2 className="w-4 h-4" />Empresa</TabsTrigger>
          <TabsTrigger value="producto" className="gap-1.5 data-[state=active]:bg-white"><Package className="w-4 h-4" />Producto</TabsTrigger>
          <TabsTrigger value="base" className="gap-1.5 data-[state=active]:bg-white"><Database className="w-4 h-4" />Base</TabsTrigger>
          <TabsTrigger value="cargue" className="gap-1.5 data-[state=active]:bg-white"><Upload className="w-4 h-4" />Cargue</TabsTrigger>
          <TabsTrigger value="plantilla" className="gap-1.5 data-[state=active]:bg-white"><FileText className="w-4 h-4" />Plantilla</TabsTrigger>
          <TabsTrigger value="tipificacion" className="gap-1.5 data-[state=active]:bg-white"><Tags className="w-4 h-4" />Tipificación</TabsTrigger>
        </TabsList>

        <div className="space-y-6">
          {renderContent()}
        </div>
      </Tabs>
    </div>
  );
}