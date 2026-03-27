import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Plus, Pencil, FileText, Search, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
}

interface CampoPlantilla {
  id: string;
  productoId: string;
  productoNombre: string;
  tipoCargue: 'Obligación' | 'Pago' | 'Campaña';
  tabla: string;
  nombreColumna: string;
  tipoDato: 'Caracter' | 'Numerico' | 'Fecha';
  obligatorio: boolean;
  filtro: boolean;
  campoOrigen: string;
  alias: string;
  estado: 'activo' | 'inactivo';
}

// Datos de ejemplo para Tipo Cargue "Obligación" con tablas "Persona" y "Obligacion"
const camposEjemploObligacion: Omit<CampoPlantilla, 'id' | 'productoId' | 'productoNombre' | 'campoOrigen' | 'alias' | 'filtro' | 'estado'>[] = [
  // Tabla Persona - Campos Esenciales
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'tipoDocumento', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'identificacion', tipoDato: 'Caracter', obligatorio: true },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'nombreCompleto', tipoDato: 'Caracter', obligatorio: true },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'correo', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'telefono', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'direccion', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'ciudad', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Persona', nombreColumna: 'fechaNacimiento', tipoDato: 'Fecha', obligatorio: false },
  
  // Tabla Obligacion - Campos Esenciales
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'cuenta', tipoDato: 'Caracter', obligatorio: true },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'producto', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'moneda', tipoDato: 'Caracter', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'deudaTotal', tipoDato: 'Numerico', obligatorio: true },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'deudaVencida', tipoDato: 'Numerico', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'diasMora', tipoDato: 'Numerico', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'fechaVencimiento', tipoDato: 'Fecha', obligatorio: false },
  { tipoCargue: 'Obligación', tabla: 'Obligacion', nombreColumna: 'estadoObligacion', tipoDato: 'Caracter', obligatorio: false },
];

const CampoRow = memo(({ campo, onUpdate }: { 
  campo: CampoPlantilla, 
  onUpdate: (id: string, field: 'filtro' | 'campoOrigen' | 'alias', value: any) => void 
}) => {
  // Estado local para evitar re-renders del componente padre en cada keystroke
  const [localCampoOrigen, setLocalCampoOrigen] = useState(campo.campoOrigen);
  const [localAlias, setLocalAlias] = useState(campo.alias);

  // Sincronizar estado local cuando cambia la prop (importante para reset)
  useEffect(() => {
    setLocalCampoOrigen(campo.campoOrigen);
    setLocalAlias(campo.alias);
  }, [campo.id]); // Solo sincronizar cuando cambia el ID (nuevo campo)

  // Handler para Checkbox - actualización inmediata
  const handleFiltroChange = useCallback((checked: boolean) => {
    onUpdate(campo.id, 'filtro', checked);
  }, [campo.id, onUpdate]);

  // Handlers para inputs de texto - actualización local inmediata
  const handleCampoOrigenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCampoOrigen(e.target.value);
  }, []);

  const handleAliasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAlias(e.target.value);
  }, []);

  // Handlers onBlur - actualización del estado global solo cuando termina de editar
  const handleCampoOrigenBlur = useCallback(() => {
    if (localCampoOrigen !== campo.campoOrigen) {
      onUpdate(campo.id, 'campoOrigen', localCampoOrigen);
    }
  }, [campo.id, campo.campoOrigen, localCampoOrigen, onUpdate]);

  const handleAliasBlur = useCallback(() => {
    if (localAlias !== campo.alias) {
      onUpdate(campo.id, 'alias', localAlias);
    }
  }, [campo.id, campo.alias, localAlias, onUpdate]);

  return (
    <tr className="border-b border-gray-300">
      <td style={{ width: '90px' }} className="h-7 text-xs bg-gray-50 text-gray-600 px-4 py-3 border-r border-gray-300 text-sm">
        {campo.tipoCargue}
      </td>
      <td style={{ width: '80px' }} className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300 text-xs">
        {campo.tabla}
      </td>
      <td style={{ width: '150px' }} className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300 text-xs">
        {campo.nombreColumna}
      </td>
      <td style={{ width: '80px' }} className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300 text-xs">
        {campo.tipoDato}
      </td>
      <td style={{ width: '100px' }} className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300 text-xs">
        {campo.obligatorio ? 'SI' : 'NO'}
      </td>
      <td style={{ width: '60px' }} className="px-2 py-2 border-r border-gray-300">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={campo.filtro}
            onCheckedChange={handleFiltroChange}
          />
        </div>
      </td>
      <td style={{ width: '180px' }} className="px-2 py-2 border-r border-gray-300">
        <Input
          value={localCampoOrigen}
          onChange={handleCampoOrigenChange}
          onBlur={handleCampoOrigenBlur}
          placeholder="Campo origen"
          className="h-7 text-xs h-8 text-sm"
        />
      </td>
      <td style={{ width: '180px' }} className="px-2 py-2">
        <Input
          value={localAlias}
          onChange={handleAliasChange}
          onBlur={handleAliasBlur}
          placeholder="Alias"
          className="h-7 text-xs h-8 text-sm"
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: solo re-renderizar si estos valores cambian
  return (
    prevProps.campo.id === nextProps.campo.id &&
    prevProps.campo.filtro === nextProps.campo.filtro &&
    prevProps.campo.campoOrigen === nextProps.campo.campoOrigen &&
    prevProps.campo.alias === nextProps.campo.alias &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});
CampoRow.displayName = 'CampoRow';

export function Plantilla() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [plantillas, setPlantillas] = useState<CampoPlantilla[]>([]);
  const [filteredPlantillas, setFilteredPlantillas] = useState<CampoPlantilla[]>([]);
  
  // Filtros
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedTipoCargue, setSelectedTipoCargue] = useState('');
  
  // Diálogo Nueva Plantilla
  const [isNewPlantillaOpen, setIsNewPlantillaOpen] = useState(false);
  const [newPlantillaProducto, setNewPlantillaProducto] = useState('');
  const [newPlantillaTipoCargue, setNewPlantillaTipoCargue] = useState<'Obligación' | 'Pago' | 'Campaña' | ''>('');
  const [newPlantillaCampos, setNewPlantillaCampos] = useState<CampoPlantilla[]>([]);
  
  // Diálogo Editar
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCampo, setEditingCampo] = useState<CampoPlantilla | null>(null);
  const [editFiltro, setEditFiltro] = useState(false);
  const [editCampoOrigen, setEditCampoOrigen] = useState('');
  const [editAlias, setEditAlias] = useState('');

  useEffect(() => {
    loadProductos();
    loadPlantillas();
  }, []);

  const loadProductos = () => {
    const saved = localStorage.getItem('productos');
    if (saved) {
      const allProductos: Producto[] = JSON.parse(saved);
      const activos = allProductos.filter((p) => p.estado === 'activo');
      setProductos(activos);
    }
  };

  const loadPlantillas = () => {
    const saved = localStorage.getItem('plantillas_cargue');
    if (saved) {
      setPlantillas(JSON.parse(saved));
    }
  };

  const savePlantillas = (data: CampoPlantilla[]) => {
    localStorage.setItem('plantillas_cargue', JSON.stringify(data));
    setPlantillas(data);
  };

  const filterPlantillas = () => {
    let filtered = [...plantillas];
    
    if (selectedProducto && selectedProducto !== '') {
      filtered = filtered.filter((p) => p.productoId === selectedProducto);
    }
    
    if (selectedTipoCargue && selectedTipoCargue !== '') {
      filtered = filtered.filter((p) => p.tipoCargue === selectedTipoCargue);
    }
    
    setFilteredPlantillas(filtered);
  };

  const handleBuscar = () => {
    filterPlantillas();
    toast.success('Búsqueda realizada');
  };

  const handleOpenNewPlantilla = () => {
    setNewPlantillaProducto('');
    setNewPlantillaTipoCargue('');
    setNewPlantillaCampos([]);
    setIsNewPlantillaOpen(true);
  };

  const handleGenerarCampos = () => {
    if (!newPlantillaProducto || !newPlantillaTipoCargue) {
      toast.error('Debe seleccionar Producto y Tipo Cargue');
      return;
    }

    const producto = productos.find((p) => p.id === newPlantillaProducto);
    if (!producto) return;

    // Generar campos basados en el tipo de cargue
    let campos: CampoPlantilla[] = [];
    
    if (newPlantillaTipoCargue === 'Obligación') {
      campos = camposEjemploObligacion.map((campo, index) => ({
        id: `${Date.now()}-${index}`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        tipoCargue: campo.tipoCargue,
        tabla: campo.tabla,
        nombreColumna: campo.nombreColumna,
        tipoDato: campo.tipoDato,
        obligatorio: campo.obligatorio,
        filtro: false,
        campoOrigen: '',
        alias: '',
        estado: 'activo' as const,
      }));
    } else if (newPlantillaTipoCargue === 'Pago') {
      // Aquí puedes agregar campos para Pago
      campos = [
        {
          id: `${Date.now()}-0`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Pago',
          tabla: 'Pago',
          nombreColumna: 'cuenta',
          tipoDato: 'Caracter',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
        {
          id: `${Date.now()}-1`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Pago',
          tabla: 'Pago',
          nombreColumna: 'montoPago',
          tipoDato: 'Numerico',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
        {
          id: `${Date.now()}-2`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Pago',
          tabla: 'Pago',
          nombreColumna: 'fechaPago',
          tipoDato: 'Fecha',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
      ];
    } else if (newPlantillaTipoCargue === 'Campaña') {
      // Aquí puedes agregar campos para Campaña
      campos = [
        {
          id: `${Date.now()}-0`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Campaña',
          tabla: 'Campana',
          nombreColumna: 'nombreCampana',
          tipoDato: 'Caracter',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
        {
          id: `${Date.now()}-1`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Campaña',
          tabla: 'Campana',
          nombreColumna: 'fechaInicio',
          tipoDato: 'Fecha',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
        {
          id: `${Date.now()}-2`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipoCargue: 'Campaña',
          tabla: 'Campana',
          nombreColumna: 'fechaFin',
          tipoDato: 'Fecha',
          obligatorio: true,
          filtro: false,
          campoOrigen: '',
          alias: '',
          estado: 'activo',
        },
      ];
    }

    setNewPlantillaCampos(campos);
  };

  const handleUpdateCampoInNew = useCallback((id: string, field: 'filtro' | 'campoOrigen' | 'alias', value: any) => {
    setNewPlantillaCampos((prev) =>
      prev.map((campo) =>
        campo.id === id ? { ...campo, [field]: value } : campo
      )
    );
  }, []);

  const handleSaveNewPlantilla = () => {
    if (newPlantillaCampos.length === 0) {
      toast.error('Debe generar los campos primero');
      return;
    }

    // Verificar si ya existe una plantilla para este producto y tipo de cargue
    const existente = plantillas.find(
      (p) => p.productoId === newPlantillaProducto && p.tipoCargue === newPlantillaTipoCargue
    );

    if (existente) {
      toast.error('Ya existe una plantilla para este Producto y Tipo Cargue');
      return;
    }

    savePlantillas([...plantillas, ...newPlantillaCampos]);
    toast.success('Plantilla creada correctamente');
    setIsNewPlantillaOpen(false);
  };

  const handleEdit = (campo: CampoPlantilla) => {
    setEditingCampo(campo);
    setEditFiltro(campo.filtro);
    setEditCampoOrigen(campo.campoOrigen);
    setEditAlias(campo.alias);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingCampo) return;

    const updated = plantillas.map((campo) =>
      campo.id === editingCampo.id
        ? { ...campo, filtro: editFiltro, campoOrigen: editCampoOrigen, alias: editAlias }
        : campo
    );

    savePlantillas(updated);
    toast.success('Campo actualizado correctamente');
    setIsEditOpen(false);
  };

  const handleToggleEstado = (id: string) => {
    const updated = plantillas.map((campo) =>
      campo.id === id
        ? { ...campo, estado: (campo.estado === 'activo' ? 'inactivo' : 'activo') as 'activo' | 'inactivo' }
        : campo
    );

    savePlantillas(updated);
    toast.success('Estado actualizado');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Plantillas de Cargue</CardTitle>
            <CardDescription>
              Configure los campos para la carga de datos desde archivos Excel o CSV
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Producto:</Label>
            <Select value={selectedProducto} onValueChange={setSelectedProducto}>
              <SelectTrigger className="!h-7 !py-1 text-xs w-44">
                <SelectValue placeholder="Todos los productos" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Tipo Cargue:</Label>
            <Select value={selectedTipoCargue} onValueChange={setSelectedTipoCargue}>
              <SelectTrigger className="!h-7 !py-1 text-xs w-36">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Obligación">Obligación</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Campaña">Campaña</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleBuscar} className="h-7 text-xs px-3">
            <Search className="w-3 h-3 mr-1" />
            Buscar
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={handleOpenNewPlantilla} className="h-7 text-xs px-3">
              <Plus className="w-3 h-3 mr-1" />
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {/* Tabla de plantillas */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Producto</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Cargue</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tabla</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre Columna</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Dato</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Obligatorio</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Filtro</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Campo Origen</TableHead>
                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Alias</TableHead>
                  <TableHead className="font-semibold text-right py-0.5 text-xs">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlantillas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Seleccione los filtros y haga clic en "Buscar" para mostrar las plantillas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlantillas.map((campo) => (
                    <TableRow key={campo.id} className="border-b border-gray-300">
                      <TableCell className="font-medium border-r border-gray-300">{campo.productoNombre}</TableCell>
                      <TableCell className="border-r border-gray-300">{campo.tipoCargue}</TableCell>
                      <TableCell className="border-r border-gray-300">{campo.tabla}</TableCell>
                      <TableCell className="border-r border-gray-300">{campo.nombreColumna}</TableCell>
                      <TableCell className="border-r border-gray-300">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          campo.tipoDato === 'Caracter' ? 'bg-blue-100 text-blue-700' :
                          campo.tipoDato === 'Numerico' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {campo.tipoDato}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          campo.obligatorio ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campo.obligatorio ? 'SI' : 'NO'}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        {campo.filtro ? (
                          <span className="text-green-600 font-medium">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="h-7 text-xs max-w-[150px] truncate border-r border-gray-300">
                        {campo.campoOrigen || '-'}
                      </TableCell>
                      <TableCell className="h-7 text-xs max-w-[150px] truncate border-r border-gray-300">
                        {campo.alias || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(campo)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleEstado(campo.id)}
                            title={campo.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {campo.estado === 'activo' ? (
                              <Power className="w-4 h-4 text-green-600" />
                            ) : (
                              <PowerOff className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Diálogo Nueva Plantilla */}
      <Dialog open={isNewPlantillaOpen} onOpenChange={setIsNewPlantillaOpen}>
        <DialogContent className="text-xs !max-w-[1024px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Plantilla de Cargue</DialogTitle>
            <DialogDescription>
              Configure la estructura de la plantilla Excel para carga de datos
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="space-y-4">{/* Selectores superiores */}
              <div className="flex gap-4 pb-4 border-b">
                <div className="space-y-2 w-64">
                  <Label>Producto *</Label>
                  <Select value={newPlantillaProducto} onValueChange={setNewPlantillaProducto}>
                    <SelectTrigger className="!h-7 !py-1 text-xs w-[35ch]">
                      <SelectValue placeholder="Seleccione producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-64">
                  <Label>Tipo Cargue *</Label>
                  <Select
                    value={newPlantillaTipoCargue}
                    onValueChange={(value) => setNewPlantillaTipoCargue(value as any)}
                  >
                    <SelectTrigger className="!h-7 !py-1 text-xs w-[20ch]">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Obligación">Obligación</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Campaña">Campaña</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newPlantillaCampos.length === 0 ? (
                <div className="text-center py-8">
                  <Button onClick={handleGenerarCampos} className="!h-7">
                    Generar Campos de Plantilla
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Nota:</strong> Los campos en gris son de solo lectura. Puede editar
                    Filtro, Campo Origen y Alias.
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-auto">
                      <table className="border-collapse" style={{ tableLayout: 'fixed', width: '920px' }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-200">
                            <th style={{ width: '90px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Tipo Cargue</th>
                            <th style={{ width: '80px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Tabla</th>
                            <th style={{ width: '150px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Nombre Columna</th>
                            <th style={{ width: '80px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Tipo Dato</th>
                            <th style={{ width: '100px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Es Obligatorio?</th>
                            <th style={{ width: '60px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Filtro</th>
                            <th style={{ width: '180px' }} className="font-semibold border-r border-gray-300 bg-gray-200 px-4 py-3 text-left text-sm">Nombre Campo Origen</th>
                            <th style={{ width: '180px' }} className="font-semibold bg-gray-200 px-4 py-3 text-left text-sm">Alias Campo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newPlantillaCampos.map((campo) => (
                            <CampoRow 
                              key={campo.id} 
                              campo={campo} 
                              onUpdate={handleUpdateCampoInNew} 
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveNewPlantilla}
              disabled={newPlantillaCampos.length === 0}
              className="!h-7"
            >
              Guardar Plantilla
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsNewPlantillaOpen(false)}
              className="!h-7"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Campo</DialogTitle>
            <DialogDescription>
              Modifique los valores editables del campo
            </DialogDescription>
          </DialogHeader>

          {editingCampo && (
            <div className="space-y-4">
              {/* Información de solo lectura */}
              <div className="h-7 text-xs p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div><strong>Producto:</strong> {editingCampo.productoNombre}</div>
                <div><strong>Tipo Cargue:</strong> {editingCampo.tipoCargue}</div>
                <div><strong>Tabla:</strong> {editingCampo.tabla}</div>
                <div><strong>Columna:</strong> {editingCampo.nombreColumna}</div>
                <div><strong>Tipo Dato:</strong> {editingCampo.tipoDato}</div>
              </div>

              {/* Campos editables */}
              <div className="space-y-2">
                <Label>Filtro</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editFiltro}
                    onCheckedChange={(checked) => setEditFiltro(!!checked)}
                  />
                  <span className="text-sm text-gray-600">
                    Usar este campo como filtro
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-campo-origen">Campo Origen</Label>
                <Input
                  id="edit-campo-origen"
                  value={editCampoOrigen}
                  onChange={(e) => setEditCampoOrigen(e.target.value)}
                  placeholder="Nombre del campo en el archivo de origen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alias">Alias</Label>
                <Input
                  id="edit-alias"
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value)}
                  placeholder="Nombre a mostrar en el formulario"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveEdit} className="flex-1 !h-7">
                  Guardar Cambios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 !h-7"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}