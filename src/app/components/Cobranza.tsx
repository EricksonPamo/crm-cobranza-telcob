import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Gestiones } from './cobranza/Gestiones';
import { PreAcuerdos } from './cobranza/PreAcuerdos';
import { Acuerdos } from './cobranza/Acuerdos';
import { Cuotas } from './cobranza/Cuotas';
import { Agendamiento } from './cobranza/Agendamiento';

export function Cobranza() {
  const [activeTab, setActiveTab] = useState('gestiones');

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
          Cobranza
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="gestiones">Gestiones</TabsTrigger>
          <TabsTrigger value="preacuerdos">Pre-Acuerdos</TabsTrigger>
          <TabsTrigger value="acuerdos">Acuerdos</TabsTrigger>
          <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
          <TabsTrigger value="agendamiento">Agendamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="gestiones" className="space-y-4">
          {activeTab === 'gestiones' && <Gestiones />}
        </TabsContent>

        <TabsContent value="preacuerdos" className="space-y-4">
          {activeTab === 'preacuerdos' && <PreAcuerdos />}
        </TabsContent>

        <TabsContent value="acuerdos" className="space-y-4">
          {activeTab === 'acuerdos' && <Acuerdos />}
        </TabsContent>

        <TabsContent value="cuotas" className="space-y-4">
          {activeTab === 'cuotas' && <Cuotas />}
        </TabsContent>

        <TabsContent value="agendamiento" className="space-y-4">
          {activeTab === 'agendamiento' && <Agendamiento />}
        </TabsContent>
      </Tabs>
    </div>
  );
}