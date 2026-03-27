import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Empresa } from './configuracion/Empresa';
import { Producto } from './configuracion/Producto';
import { Base } from './configuracion/Base';
import { Cargue } from './configuracion/Cargue';
import { Plantilla } from './configuracion/Plantilla';
import { Tipificacion } from './configuracion/Tipificacion';

export function Configuracion() {
  const [activeTab, setActiveTab] = useState('empresa');

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
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="producto">Producto</TabsTrigger>
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="cargue">Cargue</TabsTrigger>
          <TabsTrigger value="plantilla">Plantilla</TabsTrigger>
          <TabsTrigger value="tipificacion">Tipificación</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          {activeTab === 'empresa' && <Empresa />}
        </TabsContent>

        <TabsContent value="producto" className="space-y-6">
          {activeTab === 'producto' && <Producto />}
        </TabsContent>

        <TabsContent value="base" className="space-y-6">
          {activeTab === 'base' && <Base />}
        </TabsContent>

        <TabsContent value="cargue" className="space-y-6">
          {activeTab === 'cargue' && <Cargue />}
        </TabsContent>

        <TabsContent value="plantilla" className="space-y-6">
          {activeTab === 'plantilla' && <Plantilla />}
        </TabsContent>

        <TabsContent value="tipificacion" className="space-y-6">
          {activeTab === 'tipificacion' && <Tipificacion />}
        </TabsContent>
      </Tabs>
    </div>
  );
}