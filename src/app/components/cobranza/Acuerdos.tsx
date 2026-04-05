import { useState, useMemo } from 'react';

// Obtener fecha actual en formato YYYY-MM-DD
const obtenerFechaActual = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Pencil } from 'lucide-react';
import { ModalEdicionAcuerdo } from './ModalEdicionAcuerdo';
import { useAcuerdos } from '../../context/AcuerdosContext';

// Tipos de datos
interface Acuerdo {
  id: string;
  producto: string;
  identificacion: string;
  nombre: string;
  cuenta: string;
  telefono: string;
  tipoContacto: string;
  tipificacion: string;
  montoAcuerdo: number;
  cuotas: number;
  fechaCreacion: string;
  agente: string;
  estado: string;
  moneda?: string;
  deudaTotal?: number;
}

interface FiltrosColumna {
  producto: string[];
  identificacion: string;
  nombre: string;
  cuenta: string;
  telefono: string;
  tipoContacto: string[];
  tipificacion: string[];
  fechaCreacion: string[];
  agente: string[];
  estado: string[];
}

// Productos simulados
const productosActivos = [
  'BCP Castigo',
  'Scotiabank Mora',
  'BBVA Vehicular Premium',
  'Interbank Tarjetas',
  'Banco Pichincha',
  'Crediscotia Premium'
];

// Datos simulados de acuerdos (pre-acuerdos aprobados que pasaron a este módulo)
// 5 registros con montoAcuerdo < 30,000
const acuerdosSimulados: Acuerdo[] = [
  {
    id: 'ACU-001',
    producto: 'BCP Castigo',
    identificacion: '1234567890',
    nombre: 'Juan Carlos Pérez García',
    cuenta: '001-001-001-001',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Promesa de Pago',
    montoAcuerdo: 8500,
    cuotas: 3,
    fechaCreacion: '2026-03-21',
    agente: 'María González',
    estado: 'Aprobado',
    moneda: 'COP',
    deudaTotal: 25000,
  },
  {
    id: 'ACU-002',
    producto: 'Scotiabank Mora',
    identificacion: '0987654321',
    nombre: 'María Fernanda López Rodríguez',
    cuenta: '002-002-002-002',
    telefono: '3107654321',
    tipoContacto: 'Correo',
    tipificacion: 'Convenio de Pago',
    montoAcuerdo: 14000,
    cuotas: 6,
    fechaCreacion: '2026-03-21',
    agente: 'Carlos Méndez',
    estado: 'Aprobado Excepción',
    moneda: 'COP',
    deudaTotal: 29000,
  },
  {
    id: 'ACU-003',
    producto: 'BBVA Vehicular Premium',
    identificacion: '5555666677',
    nombre: 'Carlos Alberto Ramírez Santos',
    cuenta: '003-003-003-003',
    telefono: '3109876543',
    tipoContacto: 'WhatsApp',
    tipificacion: 'Promesa de Pago',
    montoAcuerdo: 20000,
    cuotas: 5,
    fechaCreacion: '2026-03-21',
    agente: 'Ana Martínez',
    estado: 'Aprobado',
    moneda: 'COP',
    deudaTotal: 27500,
  },
  {
    id: 'ACU-004',
    producto: 'Interbank Tarjetas',
    identificacion: '4567891230',
    nombre: 'Ana Patricia Silva Morales',
    cuenta: '004-004-004-004',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Negociación Exitosa',
    montoAcuerdo: 5000,
    cuotas: 4,
    fechaCreacion: '2026-03-21',
    agente: 'Pedro Sánchez',
    estado: 'Aprobado Excepción',
    moneda: 'COP',
    deudaTotal: 18000,
  },
  {
    id: 'ACU-005',
    producto: 'Banco Pichincha',
    identificacion: '7788990011',
    nombre: 'Roberto Andrés Vega Núñez',
    cuenta: '005-005-005-005',
    telefono: '3107654321',
    tipoContacto: 'Presencial',
    tipificacion: 'Convenio de Pago',
    montoAcuerdo: 29500,
    cuotas: 8,
    fechaCreacion: '2026-03-21',
    agente: 'María González',
    estado: 'Aprobado',
    moneda: 'COP',
    deudaTotal: 29500,
  },
];

export function Acuerdos() {
  // Hook del contexto de acuerdos
  const { acuerdos: acuerdosContext } = useAcuerdos();

  // Estados del formulario de búsqueda (lo que el usuario está editando)
  const fechaActual = obtenerFechaActual();
  const [buscarPor, setBuscarPor] = useState('fechaCreacion');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState(fechaActual);
  const [fechaHasta, setFechaHasta] = useState(fechaActual);
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);

  // Estados de búsqueda aplicados (lo que se usa para filtrar la tabla)
  const [buscarPorAplicado, setBuscarPorAplicado] = useState('fechaCreacion');
  const [valorBusquedaAplicado, setValorBusquedaAplicado] = useState('');
  const [fechaDesdeAplicado, setFechaDesdeAplicado] = useState(fechaActual);
  const [fechaHastaAplicado, setFechaHastaAplicado] = useState(fechaActual);
  const [productosSeleccionadosAplicado, setProductosSeleccionadosAplicado] = useState<string[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(true); // Mostrar resultados por defecto

  // Estados de filtros de columnas
  const [filtrosColumna, setFiltrosColumna] = useState<FiltrosColumna>({
    producto: [],
    identificacion: '',
    nombre: '',
    cuenta: '',
    telefono: '',
    tipoContacto: [],
    tipificacion: [],
    fechaCreacion: [],
    agente: [],
    estado: [],
  });

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Estado para el modal de edición
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState<Acuerdo | null>(null);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

  // NOTA: Este módulo muestra acuerdos que fueron aprobados desde Pre-Acuerdos.
  // Los registros llegan aquí automáticamente cuando su estado cambia a "Aprobado" o "Aprobado Excepción".

  // Datos combinados: simulados + contexto
  const acuerdosDelContexto = acuerdosContext.map(acuerdo => ({
    id: acuerdo.id,
    producto: acuerdo.producto,
    identificacion: acuerdo.identificacion,
    nombre: acuerdo.nombre,
    cuenta: acuerdo.cuenta,
    telefono: acuerdo.telefono,
    tipoContacto: 'Teléfono',
    tipificacion: acuerdo.tipificacion,
    montoAcuerdo: acuerdo.montoNegociado,
    cuotas: acuerdo.cuotas,
    fechaCreacion: acuerdo.fechaCreacion,
    agente: acuerdo.agente,
    estado: acuerdo.estado,
    moneda: acuerdo.moneda,
    deudaTotal: acuerdo.deudaTotal,
  }));
  const todosLosAcuerdos = [...acuerdosSimulados, ...acuerdosDelContexto];

  // Obtener valores únicos para filtros (función auxiliar)
  const obtenerValoresUnicos = (campo: keyof Acuerdo): string[] => {
    const valores = todosLosAcuerdos.map(a => String(a[campo]));
    return [...new Set(valores)].sort();
  };

  // CRÍTICO: Memoizar valores únicos para evitar recalcularlos en cada render
  const valoresUnicosProducto = useMemo(() => obtenerValoresUnicos('producto'), [acuerdosContext]);
  const valoresUnicosTipoContacto = useMemo(() => obtenerValoresUnicos('tipoContacto'), [acuerdosContext]);
  const valoresUnicosTipificacion = useMemo(() => obtenerValoresUnicos('tipificacion'), [acuerdosContext]);
  const valoresUnicosFechaCreacion = useMemo(() => obtenerValoresUnicos('fechaCreacion'), [acuerdosContext]);
  const valoresUnicosAgente = useMemo(() => obtenerValoresUnicos('agente'), [acuerdosContext]);
  const valoresUnicosEstado = useMemo(() => obtenerValoresUnicos('estado'), [acuerdosContext]);

  // Manejar selección de productos (simular multi-select básico)
  const toggleProducto = (producto: string) => {
    setProductosSeleccionados(prev =>
      prev.includes(producto)
        ? prev.filter(p => p !== producto)
        : [...prev, producto]
    );
  };

  // Función de búsqueda - Aplica los filtros del formulario a la tabla
  const handleBuscar = () => {
    setBuscarPorAplicado(buscarPor);
    setValorBusquedaAplicado(valorBusqueda);
    setFechaDesdeAplicado(fechaDesde);
    setFechaHastaAplicado(fechaHasta);
    setProductosSeleccionadosAplicado([...productosSeleccionados]);
    setMostrarResultados(true);
    setPaginaActual(1);
  };

  // Aplicar filtros de columna para selects
  const toggleFiltroColumna = (columna: keyof FiltrosColumna, valor: string) => {
    setFiltrosColumna(prev => {
      if (valor === '__todos__') {
        return {
          ...prev,
          [columna]: [],
        };
      }
      return {
        ...prev,
        [columna]: [valor],
      };
    });
    setPaginaActual(1);
  };

  // Manejar cambio en filtros de texto
  const handleFiltroTexto = (columna: 'identificacion' | 'nombre' | 'cuenta' | 'telefono', valor: string) => {
    setFiltrosColumna(prev => ({
      ...prev,
      [columna]: valor,
    }));
    setPaginaActual(1);
  };

  // Filtrar acuerdos - Usa los estados APLICADOS (no los del formulario)
  const acuerdosFiltrados = useMemo(() => {
    let resultados = todosLosAcuerdos;

    // Aplicar búsqueda principal con valores aplicados
    if (mostrarResultados) {
      if (buscarPorAplicado === 'fechaCreacion') {
        if (fechaDesdeAplicado) {
          resultados = resultados.filter(a => a.fechaCreacion >= fechaDesdeAplicado);
        }
        if (fechaHastaAplicado) {
          resultados = resultados.filter(a => a.fechaCreacion <= fechaHastaAplicado);
        }
      } else if (valorBusquedaAplicado) {
        const valorLower = valorBusquedaAplicado.toLowerCase();
        resultados = resultados.filter(a => {
          const campo = a[buscarPorAplicado as keyof Acuerdo];
          return String(campo).toLowerCase().includes(valorLower);
        });
      }

      // Filtrar por productos seleccionados (valores aplicados)
      if (productosSeleccionadosAplicado.length > 0) {
        resultados = resultados.filter(a => productosSeleccionadosAplicado.includes(a.producto));
      }
    }

    // Aplicar filtros de columna (Select con arrays)
    if (filtrosColumna.producto.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.producto.includes(a.producto));
    }
    if (filtrosColumna.tipoContacto.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.tipoContacto.includes(a.tipoContacto));
    }
    if (filtrosColumna.tipificacion.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.tipificacion.includes(a.tipificacion));
    }
    if (filtrosColumna.fechaCreacion.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.fechaCreacion.includes(a.fechaCreacion));
    }
    if (filtrosColumna.agente.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.agente.includes(a.agente));
    }
    if (filtrosColumna.estado.length > 0) {
      resultados = resultados.filter(a => filtrosColumna.estado.includes(a.estado));
    }

    // Aplicar filtros de columna (Textbox con strings)
    if (filtrosColumna.identificacion) {
      const filtro = filtrosColumna.identificacion.toLowerCase();
      resultados = resultados.filter(a => a.identificacion.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.nombre) {
      const filtro = filtrosColumna.nombre.toLowerCase();
      resultados = resultados.filter(a => a.nombre.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.cuenta) {
      const filtro = filtrosColumna.cuenta.toLowerCase();
      resultados = resultados.filter(a => a.cuenta.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.telefono) {
      const filtro = filtrosColumna.telefono.toLowerCase();
      resultados = resultados.filter(a => a.telefono.toLowerCase().includes(filtro));
    }

    return resultados;
  }, [todosLosAcuerdos, mostrarResultados, buscarPorAplicado, valorBusquedaAplicado, fechaDesdeAplicado, fechaHastaAplicado, productosSeleccionadosAplicado, filtrosColumna]);

  // Calcular paginación
  const totalPaginas = Math.ceil(acuerdosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const acuerdosPaginados = acuerdosFiltrados.slice(indiceInicio, indiceFin);

  // Formatear moneda
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para abrir el modal de edición
  const abrirEdicionAcuerdo = (acuerdo: Acuerdo) => {
    setAcuerdoSeleccionado(acuerdo);
    setModalEdicionAbierto(true);
  };

  return (
    <div className="space-y-2">
      {/* Formulario de búsqueda */}
      <Card className="border-2 border-sky-400">
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Buscar por */}
            <div className="w-48">
              <Label htmlFor="buscar-por">Buscar por</Label>
              <Select value={buscarPor} onValueChange={(value) => setBuscarPor(value)}>
                <SelectTrigger id="buscar-por" className="!h-7 !py-1 text-xs border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificacion">Identificación</SelectItem>
                  <SelectItem value="cuenta">Cuenta</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="fechaCreacion">Fecha Creación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor - Solo mostrar cuando NO es fechaCreacion */}
            {buscarPor !== 'fechaCreacion' && (
              <div className="w-60">
                <Label htmlFor="valor-busqueda">Valor</Label>
                <Input
                  id="valor-busqueda"
                  placeholder="Ingrese el valor a buscar..."
                  value={valorBusqueda}
                  onChange={(e) => setValorBusqueda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBuscar();
                    }
                  }}
                  className="h-7 text-xs border-sky-500"
                />
              </div>
            )}

            {/* Fechas - Mostrar cuando es fechaCreacion */}
            {buscarPor === 'fechaCreacion' && (
              <>
                <div className="w-40">
                  <Label htmlFor="fecha-desde">Desde</Label>
                  <Input
                    id="fecha-desde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="h-7 text-xs border-sky-500"
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="fecha-hasta">Hasta</Label>
                  <Input
                    id="fecha-hasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="h-7 text-xs border-sky-500"
                  />
                </div>
              </>
            )}

            {/* Espaciador flexible */}
            <div className="flex-1"></div>

            {/* Producto (Multi-select) */}
            <div className="w-64">
              <Label>Producto</Label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal h-7 text-xs border-sky-500">
                      {productosSeleccionados.length === 0
                        ? 'Seleccione productos...'
                        : `${productosSeleccionados.length} seleccionado(s)`}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-1">
                      {productosActivos.map(producto => (
                        <div
                          key={producto}
                          className="flex items-center px-2 py-0.5.5 cursor-pointer hover:bg-gray-100 rounded-sm"
                          onClick={() => toggleProducto(producto)}
                        >
                          <input
                            type="checkbox"
                            checked={productosSeleccionados.includes(producto)}
                            onChange={() => {}}
                            className="mr-2"
                          />
                          <span className="text-sm">{producto}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Botón Buscar */}
            <div className="w-32">
              <Button size="sm" onClick={handleBuscar} className="w-full h-7 text-xs px-3">
                <Search className="w-3 h-3 mr-1" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      {mostrarResultados && (
        <Card className="border-2 border-sky-400 bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="flex justify-end items-center mb-1">
              <span className="text-sm text-gray-600">
                {acuerdosFiltrados.length} registro(s) encontrado(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-36">
                      <div className="space-y-1">
                        <div>Producto</div>
                        <Select
                          value={filtrosColumna.producto[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('producto', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosProducto.map(valor => (
                              <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Identificación</div>
                        <Input
                          value={filtrosColumna.identificacion}
                          onChange={(e) => handleFiltroTexto('identificacion', e.target.value)}
                          placeholder="Filtrar..."
                          className="h-7 text-xs bg-white px-2 py-0.5"
                        />
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-[130px]">
                      <div className="space-y-1">
                        <div>Nombre</div>
                        <Input
                          value={filtrosColumna.nombre}
                          onChange={(e) => handleFiltroTexto('nombre', e.target.value)}
                          placeholder="Filtrar..."
                          className="h-7 text-xs bg-white px-2 py-0.5"
                        />
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-32">
                      <div className="space-y-1">
                        <div>Cuenta</div>
                        <Input
                          value={filtrosColumna.cuenta}
                          onChange={(e) => handleFiltroTexto('cuenta', e.target.value)}
                          placeholder="Filtrar..."
                          className="h-7 text-xs bg-white px-2 py-0.5"
                        />
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Teléfono</div>
                        <Input
                          value={filtrosColumna.telefono}
                          onChange={(e) => handleFiltroTexto('telefono', e.target.value)}
                          placeholder="Filtrar..."
                          className="h-7 text-xs bg-white px-2 py-0.5"
                        />
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Tipo Contacto</div>
                        <Select
                          value={filtrosColumna.tipoContacto[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('tipoContacto', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosTipoContacto.map(valor => (
                              <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-36">
                      <div className="space-y-1">
                        <div>Tipificación</div>
                        <Select
                          value={filtrosColumna.tipificacion[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('tipificacion', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosTipificacion.map(valor => (
                              <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-20">
                      Monto Acuerdo
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-[60px]">
                      Cuotas
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Fecha Creación</div>
                        <Select
                          value={filtrosColumna.fechaCreacion[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('fechaCreacion', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosFechaCreacion.map(valor => (
                              <SelectItem key={valor} value={valor}>{formatearFecha(valor)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-32">
                      <div className="space-y-1">
                        <div>Agente</div>
                        <Select
                          value={filtrosColumna.agente[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('agente', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosAgente.map(valor => (
                              <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Estado</div>
                        <Select
                          value={filtrosColumna.estado[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('estado', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosEstado.map(valor => (
                              <SelectItem key={valor} value={valor}>{valor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-20">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acuerdosPaginados.map((acuerdo, index) => (
                    <tr
                      key={acuerdo.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors`}
                    >
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.producto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.identificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs" title={acuerdo.nombre}>
                        <div className="truncate cursor-help">
                          {acuerdo.nombre}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.cuenta}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.telefono}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.tipoContacto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.tipificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-right">
                        <div className="truncate">
                          {formatearMoneda(acuerdo.montoAcuerdo)}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-center">
                        <div className="truncate">
                          {acuerdo.cuotas}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {formatearFecha(acuerdo.fechaCreacion)}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.agente}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {acuerdo.estado}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicionAcuerdo(acuerdo)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {acuerdosPaginados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron acuerdos con los criterios especificados
                </div>
              )}
            </div>

            {/* Paginación - Siempre visible */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <div className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas || 1} | Total: {acuerdosFiltrados.length} registro(s)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1 || totalPaginas === 0}
                  className="!h-7"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.min(totalPaginas || 1, prev + 1))}
                  disabled={paginaActual === totalPaginas || totalPaginas === 0}
                  className="!h-7"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición */}
      <ModalEdicionAcuerdo
        open={modalEdicionAbierto}
        onOpenChange={setModalEdicionAbierto}
        acuerdo={acuerdoSeleccionado}
      />
    </div>
  );
}