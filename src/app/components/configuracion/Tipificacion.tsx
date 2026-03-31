import { useState, useEffect, useMemo, SyntheticEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, Settings, GitBranch, Eye, EyeOff, Power, PowerOff, Search, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
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

interface Tipificacion {
  id: string;
  productoId: string;
  canalComunicacion: string;
  tipoTipificacion: string;
  codigoAccion: string;
  codigoResultado: string;
  accion: string;
  resultado: string;
  resultado1: string;
  resultado2: string;
  resultado3: string;
  resultado4: string;
  resultado5: string;
  tieneRazonNoPago: boolean;
  peso: number;
  mostrar: boolean;
  estado: 'activo' | 'inactivo';
  // Configuración para Promesa/Convenio/Preacuerdo
  maxCuotas?: number;
  montoMinimo?: {
    enabled: boolean;
    comparador: string;
    campo: string;
    porcentaje: number;
  };
  montoMaximo?: {
    enabled: boolean;
    comparador: string;
    campo: string;
    porcentaje: number;
  };
}

interface CicloEstado {
  id: string;
  tipificacionId: string;
  estadoActual: string;
  estadoSiguiente: string;
  tipoUsuario: string;
  estado: 'activo' | 'inactivo';
}

const CANALES_COMUNICACION = [
  'LLAMADA ENTRADA',
  'LLAMADA DE SALIDA',
  'VISITA',
  'SMS',
  'EMAIL'
];

const TIPOS_TIPIFICACION = [
  'No Contacto',
  'Contacto con Titular',
  'Contacto con tercero',
  'Promesa de Pago',
  'Convenio de Pago',
  'Preacuerdo de Pago',
  'Pago'
];

const ESTADOS_CICLO = [
  'Creado',
  'Aprobado',
  'No Aprobado',
  'Cumplido',
  'Incumplido',
  'Eliminado'
];

const COMPARADORES = [
  { value: 'mayor_que', label: 'Mayor que' },
  { value: 'menor_que', label: 'Menor que' },
  { value: 'mayor_igual', label: 'Mayor igual que' },
  { value: 'menor_igual', label: 'Menor igual que' }
];

const TIPOS_USUARIO = [
  'Administrador',
  'Supervisor',
  'Cobrador',
  'Analista',
  'Contador'
];

export function Tipificacion() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tipificaciones, setTipificaciones] = useState<Tipificacion[]>([]);
  const [ciclosEstado, setCiclosEstado] = useState<CicloEstado[]>([]);
  const [filteredTipificaciones, setFilteredTipificaciones] = useState<Tipificacion[]>([]);
  const [camposNumericos, setCamposNumericos] = useState<string[]>([]);
  
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState<string>('');
  const [filtroCanal, setFiltroCanal] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filtros de columnas
  const [filtroTipoTipificacion, setFiltroTipoTipificacion] = useState<string>('');
  const [filtroCodigoAccion, setFiltroCodigoAccion] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');
  const [filtroCodigoResultado, setFiltroCodigoResultado] = useState<string>('');
  const [filtroResultado, setFiltroResultado] = useState<string>('');

  // Filtros de la tabla Ciclo de Estado
  const [filtroEstadoActual, setFiltroEstadoActual] = useState<string>('');
  const [filtroEstadoSiguiente, setFiltroEstadoSiguiente] = useState<string>('');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState<string>('');
  
  // Paginación para Ciclo de Estado
  const [paginaCiclo, setPaginaCiclo] = useState(1);
  const registrosPorPagina = 10;

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isCicloDialogOpen, setIsCicloDialogOpen] = useState(false);
  
  const [editingTipificacion, setEditingTipificacion] = useState<Tipificacion | null>(null);
  const [configTipificacion, setConfigTipificacion] = useState<Tipificacion | null>(null);
  const [cicloTipificacion, setCicloTipificacion] = useState<Tipificacion | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Tipificacion>>({
    productoId: '',
    canalComunicacion: '',
    tipoTipificacion: '',
    codigoAccion: '',
    codigoResultado: '',
    accion: '',
    resultado: '',
    resultado1: '',
    resultado2: '',
    resultado3: '',
    resultado4: '',
    resultado5: '',
    tieneRazonNoPago: false,
    peso: 0,
    mostrar: true,
    estado: 'activo',
    maxCuotas: 3,
  });

  const [configData, setConfigData] = useState({
    maxCuotas: 3,
    montoMinimo: {
      enabled: false,
      comparador: 'mayor_que',
      campo: '',
      porcentaje: 0
    },
    montoMaximo: {
      enabled: false,
      comparador: 'menor_que',
      campo: '',
      porcentaje: 0
    }
  });

  const [cicloData, setCicloData] = useState({
    estadoActual: '',
    estadoSiguiente: '',
    tipoUsuario: ''
  });

  useEffect(() => {
    loadProductos();
    loadTipificaciones();
    loadCiclosEstado();
    loadCamposNumericos();
    initializeSampleData();
  }, []);

  // Memoizar tipificaciones filtradas para evitar re-cálculos innecesarios
  const memoizedFilteredTipificaciones = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    let filtered = [...tipificaciones];

    if (filtroProducto && filtroProducto !== 'todos') {
      filtered = filtered.filter(t => t.productoId === filtroProducto);
    }

    if (filtroCanal && filtroCanal !== 'todos') {
      filtered = filtered.filter(t => t.canalComunicacion === filtroCanal);
    }

    if (filtroTipoTipificacion) {
      filtered = filtered.filter(t => 
        t.tipoTipificacion.toLowerCase().includes(filtroTipoTipificacion.toLowerCase())
      );
    }

    if (filtroCodigoAccion) {
      filtered = filtered.filter(t => 
        t.codigoAccion.toLowerCase().includes(filtroCodigoAccion.toLowerCase())
      );
    }

    if (filtroAccion) {
      filtered = filtered.filter(t => 
        t.accion.toLowerCase().includes(filtroAccion.toLowerCase())
      );
    }

    if (filtroCodigoResultado) {
      filtered = filtered.filter(t => 
        t.codigoResultado.toLowerCase().includes(filtroCodigoResultado.toLowerCase())
      );
    }

    if (filtroResultado) {
      filtered = filtered.filter(t => 
        t.resultado.toLowerCase().includes(filtroResultado.toLowerCase())
      );
    }

    return filtered;
  }, [tipificaciones, filtroProducto, filtroCanal, hasSearched, filtroTipoTipificacion, filtroCodigoAccion, filtroAccion, filtroCodigoResultado, filtroResultado]);

  useEffect(() => {
    setFilteredTipificaciones(memoizedFilteredTipificaciones);
  }, [memoizedFilteredTipificaciones]);

  // Resetear página cuando cambien los filtros de ciclo
  useEffect(() => {
    setPaginaCiclo(1);
  }, [filtroEstadoActual, filtroEstadoSiguiente, filtroTipoUsuario]);

  const loadProductos = () => {
    const saved = localStorage.getItem('productos');
    if (saved) {
      const allProductos = JSON.parse(saved);
      setProductos(allProductos.filter((p: Producto) => p.estado === 'activo'));
    }
  };

  const loadTipificaciones = () => {
    const saved = localStorage.getItem('tipificaciones');
    if (saved) {
      setTipificaciones(JSON.parse(saved));
    }
  };

  const loadCiclosEstado = () => {
    const saved = localStorage.getItem('ciclosEstado');
    if (saved) {
      setCiclosEstado(JSON.parse(saved));
    }
  };

  const saveTipificaciones = (data: Tipificacion[]) => {
    localStorage.setItem('tipificaciones', JSON.stringify(data));
    setTipificaciones(data);
  };

  const saveCiclosEstado = (data: CicloEstado[]) => {
    localStorage.setItem('ciclosEstado', JSON.stringify(data));
    setCiclosEstado(data);
  };

  const loadCamposNumericos = () => {
    const saved = localStorage.getItem('plantillas_cargue');
    if (saved) {
      const plantillas: CampoPlantilla[] = JSON.parse(saved);
      // Filtrar solo campos numéricos del tipo de cargue "Obligación" que tienen un "Campo Origen" definido
      const camposNumericosObligacion = plantillas
        .filter((campo) => 
          campo.tipoCargue === 'Obligación' && 
          campo.tipoDato === 'Numerico' && 
          campo.campoOrigen && 
          campo.campoOrigen.trim() !== '' &&
          campo.estado === 'activo'
        )
        .map((campo) => campo.campoOrigen);
      
      // Eliminar duplicados
      const camposUnicos = Array.from(new Set(camposNumericosObligacion));
      setCamposNumericos(camposUnicos);
    }
  };

  const handleBuscar = () => {
    // Validar que se hayan seleccionado los filtros
    if (!filtroProducto || !filtroCanal) {
      toast.error('Debe seleccionar Producto y Canal de Comunicación');
      return;
    }

    setHasSearched(true);
    
    // Ejecutar el filtrado inmediatamente
    let filtered = [...tipificaciones];

    filtered = filtered.filter(t => t.productoId === filtroProducto);
    filtered = filtered.filter(t => t.canalComunicacion === filtroCanal);

    setFilteredTipificaciones(filtered);
    toast.success('Búsqueda realizada');
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingTipificacion) {
      const updated = tipificaciones.map((t) =>
        t.id === editingTipificacion.id ? { ...editingTipificacion, ...formData } as Tipificacion : t
      );
      saveTipificaciones(updated);
      toast.success('Tipificación actualizada correctamente');
    } else {
      const newTipificacion: Tipificacion = {
        id: Date.now().toString(),
        ...formData as Omit<Tipificacion, 'id'>,
      };
      saveTipificaciones([...tipificaciones, newTipificacion]);
      toast.success('Tipificación creada correctamente');
    }

    resetForm();
  };

  const handleEdit = (tipificacion: Tipificacion) => {
    setEditingTipificacion(tipificacion);
    setFormData(tipificacion);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta tipificación?')) {
      const updated = tipificaciones.filter((t) => t.id !== id);
      saveTipificaciones(updated);
      toast.success('Tipificación eliminada correctamente');
    }
  };

  const handleToggleEstado = (id: string) => {
    const updated = tipificaciones.map((t) =>
      t.id === id ? { ...t, estado: t.estado === 'activo' ? 'inactivo' : 'activo' } as Tipificacion : t
    );
    saveTipificaciones(updated);
    toast.success('Estado actualizado correctamente');
  };

  const handleToggleMostrar = (id: string) => {
    const updated = tipificaciones.map((t) =>
      t.id === id ? { ...t, mostrar: !t.mostrar } : t
    );
    saveTipificaciones(updated);
    toast.success('Visibilidad actualizada correctamente');
  };

  const handleOpenConfig = (tipificacion: Tipificacion) => {
    setConfigTipificacion(tipificacion);
    setConfigData({
      maxCuotas: tipificacion.maxCuotas || 3,
      montoMinimo: tipificacion.montoMinimo || {
        enabled: false,
        comparador: 'mayor_que',
        campo: 'saldoacobrar',
        porcentaje: 0
      },
      montoMaximo: tipificacion.montoMaximo || {
        enabled: false,
        comparador: 'menor_que',
        campo: 'saldoacobrar',
        porcentaje: 0
      }
    });
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!configTipificacion) return;

    const updated = tipificaciones.map((t) =>
      t.id === configTipificacion.id
        ? { ...t, ...configData }
        : t
    );
    saveTipificaciones(updated);
    toast.success('Configuración guardada correctamente');
    setIsConfigDialogOpen(false);
  };

  const handleOpenCiclo = (tipificacion: Tipificacion) => {
    setCicloTipificacion(tipificacion);
    // Resetear filtros y paginación
    setFiltroEstadoActual('');
    setFiltroEstadoSiguiente('');
    setFiltroTipoUsuario('');
    setPaginaCiclo(1);
    setIsCicloDialogOpen(true);
  };

  const handleAddCiclo = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cicloTipificacion) return;

    const newCiclo: CicloEstado = {
      id: Date.now().toString(),
      tipificacionId: cicloTipificacion.id,
      estadoActual: cicloData.estadoActual,
      estadoSiguiente: cicloData.estadoSiguiente,
      tipoUsuario: cicloData.tipoUsuario,
      estado: 'activo'
    };

    saveCiclosEstado([...ciclosEstado, newCiclo]);
    toast.success('Ciclo de estado agregado correctamente');
    
    setCicloData({
      estadoActual: '',
      estadoSiguiente: '',
      tipoUsuario: ''
    });
  };

  const handleToggleCicloEstado = (id: string) => {
    const updated = ciclosEstado.map((c) =>
      c.id === id ? { ...c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' } as CicloEstado : c
    );
    saveCiclosEstado(updated);
    toast.success('Estado del ciclo actualizado');
  };

  const handleDeleteCiclo = (id: string) => {
    if (confirm('¿Está seguro de eliminar este ciclo?')) {
      const updated = ciclosEstado.filter((c) => c.id !== id);
      saveCiclosEstado(updated);
      toast.success('Ciclo eliminado correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      productoId: '',
      canalComunicacion: '',
      tipoTipificacion: '',
      codigoAccion: '',
      codigoResultado: '',
      accion: '',
      resultado: '',
      resultado1: '',
      resultado2: '',
      resultado3: '',
      resultado4: '',
      resultado5: '',
      tieneRazonNoPago: false,
      peso: 0,
      mostrar: true,
      estado: 'activo',
      maxCuotas: 3,
    });
    setEditingTipificacion(null);
    setIsDialogOpen(false);
  };

  const requiereConfiguracion = (tipo: string) => {
    return ['Promesa de Pago', 'Convenio de Pago', 'Preacuerdo de Pago'].includes(tipo);
  };

  const getCiclosFiltradosYPaginados = (tipificacionId: string) => {
    let filtered = ciclosEstado.filter(c => c.tipificacionId === tipificacionId);

    // Aplicar filtros de columnas
    if (filtroEstadoActual) {
      filtered = filtered.filter(c => 
        c.estadoActual.toLowerCase().includes(filtroEstadoActual.toLowerCase())
      );
    }

    if (filtroEstadoSiguiente) {
      filtered = filtered.filter(c => 
        c.estadoSiguiente.toLowerCase().includes(filtroEstadoSiguiente.toLowerCase())
      );
    }

    if (filtroTipoUsuario) {
      filtered = filtered.filter(c => 
        c.tipoUsuario.toLowerCase().includes(filtroTipoUsuario.toLowerCase())
      );
    }

    // Calcular paginación
    const totalRegistros = filtered.length;
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    const inicio = (paginaCiclo - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const registrosPaginados = filtered.slice(inicio, fin);

    return {
      registros: registrosPaginados,
      totalRegistros,
      totalPaginas,
      paginaActual: paginaCiclo
    };
  };

  const initializeSampleData = () => {
    // DESHABILITADO TEMPORALMENTE para mejorar rendimiento
    // Código comentado para evitar errores de TypeScript con código inalcanzable
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tags className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Tipificaciones</CardTitle>
              <CardDescription>
                Configure las tipificaciones para clasificar las gestiones de cobranza
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Label htmlFor="filtro-producto" className="text-xs text-gray-500 whitespace-nowrap">Producto:</Label>
            <Select
              value={filtroProducto}
              onValueChange={(value) => {
                setFiltroProducto(value);
                setHasSearched(false);
                setFilteredTipificaciones([]);
              }}
            >
              <SelectTrigger id="filtro-producto" className="!h-7 !py-1 text-xs w-44">
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

          <div className="flex items-center gap-1">
            <Label htmlFor="filtro-canal" className="text-xs text-gray-500 whitespace-nowrap">Canal:</Label>
            <Select
              value={filtroCanal}
              onValueChange={(value) => {
                setFiltroCanal(value);
                setHasSearched(false);
                setFilteredTipificaciones([]);
              }}
            >
              <SelectTrigger id="filtro-canal" className="!h-7 !py-1 text-xs w-40">
                <SelectValue placeholder="Seleccione canal" />
              </SelectTrigger>
              <SelectContent>
                {CANALES_COMUNICACION.map((canal) => (
                  <SelectItem key={canal} value={canal}>
                    {canal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleBuscar} className="h-7 text-xs px-3">
            <Search className="w-3 h-3 mr-1" />
            Buscar
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }} className="h-7 text-xs px-3">
              <Plus className="w-3 h-3 mr-1" />
              Nueva Tipificación
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="text-xs max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                  <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                    <DialogTitle>
                      {editingTipificacion ? 'Editar Tipificación' : 'Nueva Tipificación'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure la información de la tipificación
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="space-y-1">
                        <Label htmlFor="producto" className="text-xs font-medium text-slate-600">Producto *</Label>
                        <Select
                          value={formData.productoId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, productoId: value })
                          }
                        >
                          <SelectTrigger id="producto" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
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

                      <div className="space-y-1">
                        <Label htmlFor="canal" className="text-xs font-medium text-slate-600">Canal Comunicación *</Label>
                        <Select
                          value={formData.canalComunicacion}
                          onValueChange={(value) =>
                            setFormData({ ...formData, canalComunicacion: value })
                          }
                        >
                          <SelectTrigger id="canal" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue placeholder="Seleccione canal" />
                          </SelectTrigger>
                          <SelectContent>
                            {CANALES_COMUNICACION.map((canal) => (
                              <SelectItem key={canal} value={canal}>
                                {canal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tipo" className="text-xs font-medium text-slate-600">Tipo Tipificación *</Label>
                        <Select
                          value={formData.tipoTipificacion}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tipoTipificacion: value })
                          }
                        >
                          <SelectTrigger id="tipo" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_TIPIFICACION.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="codigoAccion" className="text-xs font-medium text-slate-600">Código Acción *</Label>
                        <Input
                          id="codigoAccion"
                          value={formData.codigoAccion}
                          onChange={(e) =>
                            setFormData({ ...formData, codigoAccion: e.target.value })
                          }
                          placeholder="Ej: CA01"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="codigoResultado" className="text-xs font-medium text-slate-600">Código Resultado *</Label>
                        <Input
                          id="codigoResultado"
                          value={formData.codigoResultado}
                          onChange={(e) =>
                            setFormData({ ...formData, codigoResultado: e.target.value })
                          }
                          placeholder="Ej: CR01"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="peso" className="text-xs font-medium text-slate-600">Peso *</Label>
                        <Input
                          id="peso"
                          type="number"
                          value={formData.peso}
                          onChange={(e) =>
                            setFormData({ ...formData, peso: parseInt(e.target.value) })
                          }
                          placeholder="0"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                          required
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="accion" className="text-xs font-medium text-slate-600">Acción *</Label>
                        <Input
                          id="accion"
                          value={formData.accion}
                          onChange={(e) =>
                            setFormData({ ...formData, accion: e.target.value })
                          }
                          placeholder="Descripción de la acción"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                          required
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="resultado" className="text-xs font-medium text-slate-600">Resultado *</Label>
                        <Input
                          id="resultado"
                          value={formData.resultado}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado: e.target.value })
                          }
                          placeholder="Descripción del resultado"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado1" className="text-xs font-medium text-slate-600">Resultado 1</Label>
                        <Input
                          id="resultado1"
                          value={formData.resultado1}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado1: e.target.value })
                          }
                          placeholder="Resultado adicional 1"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado2" className="text-xs font-medium text-slate-600">Resultado 2</Label>
                        <Input
                          id="resultado2"
                          value={formData.resultado2}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado2: e.target.value })
                          }
                          placeholder="Resultado adicional 2"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado3" className="text-xs font-medium text-slate-600">Resultado 3</Label>
                        <Input
                          id="resultado3"
                          value={formData.resultado3}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado3: e.target.value })
                          }
                          placeholder="Resultado adicional 3"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado4" className="text-xs font-medium text-slate-600">Resultado 4</Label>
                        <Input
                          id="resultado4"
                          value={formData.resultado4}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado4: e.target.value })
                          }
                          placeholder="Resultado adicional 4"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado5" className="text-xs font-medium text-slate-600">Resultado 5</Label>
                        <Input
                          id="resultado5"
                          value={formData.resultado5}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado5: e.target.value })
                          }
                          placeholder="Resultado adicional 5"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Tiene razón de no pago</Label>
                        <div className="flex items-center gap-4 h-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="razonNoPago"
                              checked={formData.tieneRazonNoPago === true}
                              onChange={() =>
                                setFormData({ ...formData, tieneRazonNoPago: true })
                              }
                              className="w-4 h-4"
                            />
                            <span>SÍ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="razonNoPago"
                              checked={formData.tieneRazonNoPago === false}
                              onChange={() =>
                                setFormData({ ...formData, tieneRazonNoPago: false })
                              }
                              className="w-4 h-4"
                            />
                            <span>NO</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Mostrar</Label>
                        <div className="flex items-center gap-4 h-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mostrar"
                              checked={formData.mostrar === true}
                              onChange={() =>
                                setFormData({ ...formData, mostrar: true })
                              }
                              className="w-4 h-4"
                            />
                            <span>SÍ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mostrar"
                              checked={formData.mostrar === false}
                              onChange={() =>
                                setFormData({ ...formData, mostrar: false })
                              }
                              className="w-4 h-4"
                            />
                            <span>NO</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <Button type="submit" className="flex-1 !h-7">
                        {editingTipificacion ? 'Actualizar' : 'Crear Tipificación'}
                      </Button>
                      <Button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                  </div>
                </DialogContent>
              </Dialog>
        </div>

        {/* Tabla de Tipificaciones */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold border-r border-gray-300">
                  <div className="space-y-2">
                    <div>Tipo Tipificación</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroTipoTipificacion}
                      onChange={(e) => setFiltroTipoTipificacion(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold border-r border-gray-300">
                  <div className="space-y-2">
                    <div>Código Acción</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroCodigoAccion}
                      onChange={(e) => setFiltroCodigoAccion(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold border-r border-gray-300">
                  <div className="space-y-2">
                    <div>Acción</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroAccion}
                      onChange={(e) => setFiltroAccion(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold border-r border-gray-300">
                  <div className="space-y-2">
                    <div>Código Resultado</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroCodigoResultado}
                      onChange={(e) => setFiltroCodigoResultado(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold border-r border-gray-300">
                  <div className="space-y-2">
                    <div>Resultado</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroResultado}
                      onChange={(e) => setFiltroResultado(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center border-r border-gray-300">Peso</TableHead>
                <TableHead className="font-semibold text-center border-r border-gray-300">Mostrar</TableHead>
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTipificaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay tipificaciones configuradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTipificaciones.map((tipificacion) => (
                  <TableRow key={tipificacion.id} className="border-b border-gray-300">
                    <TableCell className="font-medium border-r border-gray-300">
                      {tipificacion.tipoTipificacion}
                    </TableCell>
                    <TableCell className="border-r border-gray-300">{tipificacion.codigoAccion}</TableCell>
                    <TableCell className="border-r border-gray-300">{tipificacion.accion}</TableCell>
                    <TableCell className="border-r border-gray-300">{tipificacion.codigoResultado}</TableCell>
                    <TableCell className="border-r border-gray-300">{tipificacion.resultado}</TableCell>
                    <TableCell className="text-center border-r border-gray-300">
                      <span className="px-2 py-0.5 bg-gray-100 rounded font-medium">
                        {tipificacion.peso}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border-r border-gray-300">
                      {tipificacion.mostrar ? (
                        <span className="text-green-600 font-medium">SÍ</span>
                      ) : (
                        <span className="text-gray-400">NO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tipificacion)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {requiereConfiguracion(tipificacion.tipoTipificacion) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenConfig(tipificacion)}
                              title="Configuración"
                            >
                              <Settings className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCiclo(tipificacion)}
                              title="Ciclo del Acuerdo"
                            >
                              <GitBranch className="w-4 h-4 text-purple-600" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleMostrar(tipificacion.id)}
                          title={tipificacion.mostrar ? 'Ocultar' : 'Mostrar'}
                        >
                          {tipificacion.mostrar ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEstado(tipificacion.id)}
                          title={tipificacion.estado === 'activo' ? 'Deshabilitar' : 'Habilitar'}
                        >
                          {tipificacion.estado === 'activo' ? (
                            <Power className="w-4 h-4 text-green-600" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-red-600" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tipificacion.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog de Configuración */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="text-xs max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
              <DialogTitle>Configuración de {configTipificacion?.tipoTipificacion}</DialogTitle>
              <DialogDescription>
                Tipificación: {configTipificacion?.resultado}
              </DialogDescription>
            </DialogHeader>

            {camposNumericos.length === 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-2">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Atención:</strong> No hay campos numéricos configurados en las plantillas de Obligación.
                  Para utilizar las validaciones de monto mínimo y máximo, debe:
                  <br />
                  1. Ir a <strong>Plantillas de Cargue</strong>
                  <br />
                  2. Crear/editar una plantilla de tipo <strong>Obligación</strong>
                  <br />
                  3. Definir un <strong>"Campo Origen"</strong> en los campos numéricos que desee utilizar
                </p>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="maxCuotas" className="text-xs font-medium text-slate-600">Cantidad máx. de cuotas</Label>
                  <Input
                    id="maxCuotas"
                    type="number"
                    value={configData.maxCuotas}
                    onChange={(e) =>
                      setConfigData({ ...configData, maxCuotas: parseInt(e.target.value) })
                    }
                    min="1"
                    className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    required
                  />
                </div>

                {/* Monto Mínimo */}
                <div className="p-3 border-2 border-slate-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montoMinimoEnabled"
                      checked={configData.montoMinimo.enabled}
                      onCheckedChange={(checked) =>
                        setConfigData({
                          ...configData,
                          montoMinimo: { ...configData.montoMinimo, enabled: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="montoMinimoEnabled" className="text-xs font-semibold text-slate-700">
                      Monto mínimo cobrar
                    </Label>
                  </div>

                  {configData.montoMinimo.enabled && (
                    <div className="grid grid-cols-3 gap-3 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Comparador</Label>
                        <Select
                          value={configData.montoMinimo.comparador}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: { ...configData.montoMinimo, comparador: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPARADORES.map((comp) => (
                              <SelectItem key={comp.value} value={comp.value}>
                                {comp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Campo numérico</Label>
                        <Select
                          value={configData.montoMinimo.campo}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: { ...configData.montoMinimo, campo: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue placeholder={camposNumericos.length === 0 ? "No hay campos disponibles" : "Seleccione un campo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {camposNumericos.length === 0 ? (
                              <SelectItem value="no-disponible" disabled>
                                No hay campos numéricos configurados
                              </SelectItem>
                            ) : (
                              camposNumericos.map((campo) => (
                                <SelectItem key={campo} value={campo}>
                                  {campo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Porcentaje (%)</Label>
                        <Input
                          type="number"
                          value={configData.montoMinimo.porcentaje}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: {
                                ...configData.montoMinimo,
                                porcentaje: parseInt(e.target.value) || 0
                              }
                            })
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Monto Máximo */}
                <div className="p-3 border-2 border-slate-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montoMaximoEnabled"
                      checked={configData.montoMaximo.enabled}
                      onCheckedChange={(checked) =>
                        setConfigData({
                          ...configData,
                          montoMaximo: { ...configData.montoMaximo, enabled: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="montoMaximoEnabled" className="text-xs font-semibold text-slate-700">
                      Monto Máximo cobrar
                    </Label>
                  </div>

                  {configData.montoMaximo.enabled && (
                    <div className="grid grid-cols-3 gap-3 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Comparador</Label>
                        <Select
                          value={configData.montoMaximo.comparador}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: { ...configData.montoMaximo, comparador: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPARADORES.map((comp) => (
                              <SelectItem key={comp.value} value={comp.value}>
                                {comp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Campo numérico</Label>
                        <Select
                          value={configData.montoMaximo.campo}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: { ...configData.montoMaximo, campo: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                            <SelectValue placeholder={camposNumericos.length === 0 ? "No hay campos disponibles" : "Seleccione un campo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {camposNumericos.length === 0 ? (
                              <SelectItem value="no-disponible" disabled>
                                No hay campos numéricos configurados
                              </SelectItem>
                            ) : (
                              camposNumericos.map((campo) => (
                                <SelectItem key={campo} value={campo}>
                                  {campo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Porcentaje (%)</Label>
                        <Input
                          type="number"
                          value={configData.montoMaximo.porcentaje}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: {
                                ...configData.montoMaximo,
                                porcentaje: parseInt(e.target.value) || 0
                              }
                            })
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="submit" className="flex-1 !h-7">
                  Guardar Configuración
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsConfigDialogOpen(false)}
                  className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ciclo del Acuerdo */}
        <Dialog open={isCicloDialogOpen} onOpenChange={setIsCicloDialogOpen}>
          <DialogContent className="text-xs !max-w-[705px] max-h-[90vh] flex flex-col overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
              <DialogTitle>Ciclo del Acuerdo</DialogTitle>
              <DialogDescription>
                Tipificación: {cicloTipificacion?.resultado}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* Formulario para agregar ciclo */}
              <div className="text-xs border-2 border-slate-300 rounded-lg p-3 bg-slate-50 flex-shrink-0">
                <h3 className="font-semibold mb-2 text-slate-700">Estados del ciclo</h3>
                <form onSubmit={handleAddCiclo} className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="estadoActual" className="text-xs font-medium text-slate-600">Estado Actual *</Label>
                      <Select
                        value={cicloData.estadoActual}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, estadoActual: value })
                        }
                      >
                        <SelectTrigger id="estadoActual" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CICLO.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="estadoSiguiente" className="text-xs font-medium text-slate-600">Estado Siguiente *</Label>
                      <Select
                        value={cicloData.estadoSiguiente}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, estadoSiguiente: value })
                        }
                      >
                        <SelectTrigger id="estadoSiguiente" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CICLO.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tipoUsuario" className="text-xs font-medium text-slate-600">Tipo Usuario *</Label>
                      <Select
                        value={cicloData.tipoUsuario}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, tipoUsuario: value })
                        }
                      >
                        <SelectTrigger id="tipoUsuario" className="!h-7 !py-1 text-xs border-slate-200 focus:border-sky-300">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_USUARIO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="!h-7">
                    Guardar
                  </Button>
                </form>
              </div>

              {/* Tabla de Ciclos */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="font-semibold mb-2 flex-shrink-0 text-slate-700">Ciclo de Estado</h3>
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                  {/* Cabecera fija */}
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-200">
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                            <div className="space-y-1">
                              <div>Estado Actual</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroEstadoActual}
                                onChange={(e) => setFiltroEstadoActual(e.target.value)}
                                className="h-7 text-xs border-slate-200 focus:border-sky-300"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                            <div className="space-y-1">
                              <div>Estado Siguiente</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroEstadoSiguiente}
                                onChange={(e) => setFiltroEstadoSiguiente(e.target.value)}
                                className="h-7 text-xs border-slate-200 focus:border-sky-300"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                            <div className="space-y-1">
                              <div>Tipo Usuario</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroTipoUsuario}
                                onChange={(e) => setFiltroTipoUsuario(e.target.value)}
                                className="h-7 text-xs border-slate-200 focus:border-sky-300"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>Estado</TableHead>
                          <TableHead className="font-semibold text-right" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>
                  
                  {/* Cuerpo con scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <Table>
                      <TableBody>
                      {(() => {
                        const { registros, totalRegistros } = getCiclosFiltradosYPaginados(cicloTipificacion?.id || '');
                        return totalRegistros === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                              No hay ciclos configurados
                            </TableCell>
                          </TableRow>
                        ) : (
                          registros.map((ciclo) => (
                            <TableRow key={ciclo.id} className="border-b-2 border-slate-300">
                              <TableCell className="font-medium border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>{ciclo.estadoActual}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>{ciclo.estadoSiguiente}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>{ciclo.tipoUsuario}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    ciclo.estado === 'activo'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {ciclo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleCicloEstado(ciclo.id)}
                                    title={
                                      ciclo.estado === 'activo' ? 'Desactivar' : 'Activar'
                                    }
                                  >
                                    {ciclo.estado === 'activo' ? (
                                      <Power className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <PowerOff className="w-4 h-4 text-slate-400" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteCiclo(ciclo.id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        );
                      })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginación */}
                <div className="flex-shrink-0">
                {(() => {
                  const { totalPaginas, paginaActual, totalRegistros } = getCiclosFiltradosYPaginados(cicloTipificacion?.id || '');

                  if (totalRegistros === 0) return null;

                  // Generar números de página a mostrar
                  const getPaginasVisibles = () => {
                    const paginas = [];
                    const maxVisible = 5;

                    if (totalPaginas <= maxVisible) {
                      // Mostrar todas las páginas
                      for (let i = 1; i <= totalPaginas; i++) {
                        paginas.push(i);
                      }
                    } else {
                      // Mostrar páginas con elipsis
                      if (paginaActual <= 3) {
                        paginas.push(1, 2, 3, 4, '...', totalPaginas);
                      } else if (paginaActual >= totalPaginas - 2) {
                        paginas.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
                      } else {
                        paginas.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
                      }
                    }

                    return paginas;
                  };

                  return (
                    <div className="flex items-center justify-between mt-3 px-2">
                      <div className="text-xs text-slate-600">
                        Mostrando {((paginaActual - 1) * registrosPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * registrosPorPagina, totalRegistros)} de{' '}
                        {totalRegistros} registros
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaCiclo(prev => Math.max(1, prev - 1))}
                          disabled={paginaActual === 1}
                          className="!h-7 text-xs"
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {getPaginasVisibles().map((pagina, index) =>
                            pagina === '...' ? (
                              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                                ...
                              </span>
                            ) : (
                              <Button
                                key={pagina}
                                variant={pagina === paginaActual ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPaginaCiclo(pagina as number)}
                                className="min-w-[32px] !h-7 text-xs"
                              >
                                {pagina}
                              </Button>
                            )
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaCiclo(prev => Math.min(totalPaginas, prev + 1))}
                          disabled={paginaActual === totalPaginas}
                          className="!h-7 text-xs"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}