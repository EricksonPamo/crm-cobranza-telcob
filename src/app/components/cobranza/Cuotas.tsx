import { useState, useMemo } from 'react';

// Obtener fecha actual en formato YYYY-MM-DD
const obtenerFechaActual = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Pencil } from 'lucide-react';
import { ModalEdicionCuota } from './ModalEdicionCuota';

// Tipos de datos
interface Cuota {
  id: string;
  producto: string;
  identificacion: string;
  nombre: string;
  cuenta: string;
  tipoContacto: string;
  tipificacion: string;
  cuota: number;
  monto: number;
  fechaVencimiento: string;
  agente: string;
  estado: string;
  // Datos adicionales del acuerdo
  moneda?: string;
  deudaTotal?: number;
  fechaCreacion?: string;
  montoAcuerdo?: number;
  totalCuotas?: number;
}

interface FiltrosColumna {
  producto: string[];
  identificacion: string;
  nombre: string;
  cuenta: string;
  tipoContacto: string[];
  tipificacion: string[];
  fechaVencimiento: string[];
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

// Datos simulados de cuotas
// REGLA: monto = montoAcuerdo / totalCuotas (cuota individual debe coincidir con la tabla del modal)
const cuotasSimuladas: Cuota[] = [
  {
    id: 'CUO-001',
    producto: 'BCP Castigo',
    identificacion: '1234567890',
    nombre: 'Juan Carlos Pérez García',
    cuenta: '001-001-001-001',
    tipoContacto: 'Teléfono',
    tipificacion: 'Promesa de Pago',
    cuota: 1,
    monto: 8500,        // montoAcuerdo(25500) / totalCuotas(3) = 8500
    fechaVencimiento: '2026-03-21',
    agente: 'María González',
    estado: 'Pagado',
    moneda: 'COP',
    deudaTotal: 25000,
    fechaCreacion: '2026-03-15',
    montoAcuerdo: 25500,
    totalCuotas: 3,
  },
  {
    id: 'CUO-002',
    producto: 'Scotiabank Mora',
    identificacion: '0987654321',
    nombre: 'María Fernanda López Rodríguez',
    cuenta: '002-002-002-002',
    tipoContacto: 'Correo',
    tipificacion: 'Convenio de Pago',
    cuota: 2,
    monto: 7000,        // montoAcuerdo(42000) / totalCuotas(6) = 7000
    fechaVencimiento: '2026-03-21',
    agente: 'Carlos Méndez',
    estado: 'Parcial',
    moneda: 'COP',
    deudaTotal: 42000,
    fechaCreacion: '2026-03-10',
    montoAcuerdo: 42000,
    totalCuotas: 6,
  },
  {
    id: 'CUO-003',
    producto: 'BBVA Vehicular Premium',
    identificacion: '5555666677',
    nombre: 'Carlos Alberto Ramírez Santos',
    cuenta: '003-003-003-003',
    tipoContacto: 'WhatsApp',
    tipificacion: 'Promesa de Pago',
    cuota: 3,
    monto: 20000,       // montoAcuerdo(100000) / totalCuotas(5) = 20000
    fechaVencimiento: '2026-03-21',
    agente: 'Ana Martínez',
    estado: 'Pendiente',
    moneda: 'COP',
    deudaTotal: 60000,
    fechaCreacion: '2026-03-05',
    montoAcuerdo: 100000,
    totalCuotas: 5,
  },
  {
    id: 'CUO-004',
    producto: 'Interbank Tarjetas',
    identificacion: '4567891230',
    nombre: 'Ana Patricia Silva Morales',
    cuenta: '004-004-004-004',
    tipoContacto: 'Teléfono',
    tipificacion: 'Negociación Exitosa',
    cuota: 1,
    monto: 5000,        // montoAcuerdo(20000) / totalCuotas(4) = 5000
    fechaVencimiento: '2026-03-21',
    agente: 'Pedro Sánchez',
    estado: 'Pagado',
    moneda: 'COP',
    deudaTotal: 18000,
    fechaCreacion: '2026-03-12',
    montoAcuerdo: 20000,
    totalCuotas: 4,
  },
  {
    id: 'CUO-005',
    producto: 'Banco Pichincha',
    identificacion: '7788990011',
    nombre: 'Roberto Andrés Vega Núñez',
    cuenta: '005-005-005-005',
    tipoContacto: 'Presencial',
    tipificacion: 'Convenio de Pago',
    cuota: 4,
    monto: 3688,        // montoAcuerdo(29500) / totalCuotas(8) ≈ 3687.5 → 3688
    fechaVencimiento: '2026-03-21',
    agente: 'María González',
    estado: 'Pendiente',
    moneda: 'COP',
    deudaTotal: 29500,
    fechaCreacion: '2026-03-01',
    montoAcuerdo: 29500,
    totalCuotas: 8,
  },
  {
    id: 'CUO-006',
    producto: 'Crediscotia Premium',
    identificacion: '3344556677',
    nombre: 'Laura Beatriz Castro Díaz',
    cuenta: '006-006-006-006',
    tipoContacto: 'Correo',
    tipificacion: 'Promesa de Pago',
    cuota: 2,
    monto: 12000,       // montoAcuerdo(36000) / totalCuotas(3) = 12000
    fechaVencimiento: '2026-03-21',
    agente: 'Carlos Méndez',
    estado: 'Pagado',
    moneda: 'COP',
    deudaTotal: 36000,
    fechaCreacion: '2026-03-08',
    montoAcuerdo: 36000,
    totalCuotas: 3,
  },
  {
    id: 'CUO-007',
    producto: 'BCP Castigo',
    identificacion: '9988776655',
    nombre: 'Diego Fernando Rojas Paredes',
    cuenta: '007-007-007-007',
    tipoContacto: 'Teléfono',
    tipificacion: 'Negociación Exitosa',
    cuota: 2,
    monto: 9800,        // montoAcuerdo(29400) / totalCuotas(3) = 9800
    fechaVencimiento: '2026-03-21',
    agente: 'Ana Martínez',
    estado: 'Pendiente',
    moneda: 'COP',
    deudaTotal: 29400,
    fechaCreacion: '2026-03-14',
    montoAcuerdo: 29400,
    totalCuotas: 3,
  },
  {
    id: 'CUO-008',
    producto: 'Scotiabank Mora',
    identificacion: '1122334455',
    nombre: 'Patricia Elena Gutiérrez Herrera',
    cuenta: '008-008-008-008',
    tipoContacto: 'WhatsApp',
    tipificacion: 'Convenio de Pago',
    cuota: 5,
    monto: 18500,       // montoAcuerdo(92500) / totalCuotas(5) = 18500
    fechaVencimiento: '2026-03-21',
    agente: 'Pedro Sánchez',
    estado: 'Pendiente',
    moneda: 'COP',
    deudaTotal: 92500,
    fechaCreacion: '2026-03-02',
    montoAcuerdo: 92500,
    totalCuotas: 5,
  },
  {
    id: 'CUO-009',
    producto: 'BBVA Vehicular Premium',
    identificacion: '6677889900',
    nombre: 'Jorge Luis Fernández Salazar',
    cuenta: '009-009-009-009',
    tipoContacto: 'Presencial',
    tipificacion: 'Promesa de Pago',
    cuota: 1,
    monto: 25000,       // montoAcuerdo(75000) / totalCuotas(3) = 25000
    fechaVencimiento: '2026-03-21',
    agente: 'María González',
    estado: 'Pagado',
    moneda: 'COP',
    deudaTotal: 75000,
    fechaCreacion: '2026-03-18',
    montoAcuerdo: 75000,
    totalCuotas: 3,
  },
  {
    id: 'CUO-010',
    producto: 'Interbank Tarjetas',
    identificacion: '2233445566',
    nombre: 'Sofía Alejandra Moreno Campos',
    cuenta: '010-010-010-010',
    tipoContacto: 'Correo',
    tipificacion: 'Negociación Exitosa',
    cuota: 3,
    monto: 7200,        // montoAcuerdo(21600) / totalCuotas(3) = 7200
    fechaVencimiento: '2026-03-21',
    agente: 'Carlos Méndez',
    estado: 'Pendiente',
    moneda: 'COP',
    deudaTotal: 21600,
    fechaCreacion: '2026-03-06',
    montoAcuerdo: 21600,
    totalCuotas: 3,
  },
];

export function Cuotas() {
  // Estados del formulario de búsqueda (lo que el usuario está editando)
  const fechaActual = obtenerFechaActual();
  const [fechaDesde, setFechaDesde] = useState(fechaActual);
  const [fechaHasta, setFechaHasta] = useState(fechaActual);
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);

  // Estados de búsqueda aplicados (lo que se usa para filtrar la tabla)
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
    tipoContacto: [],
    tipificacion: [],
    fechaVencimiento: [],
    agente: [],
    estado: [],
  });

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Estado para el modal de edición
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<Cuota | null>(null);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

  // NOTA: Este módulo muestra las cuotas de los acuerdos aprobados.
  // Los registros se generan automáticamente según el número de cuotas definido en cada acuerdo.

  // Obtener valores únicos para filtros (función auxiliar)
  const obtenerValoresUnicos = (campo: keyof Cuota): string[] => {
    const valores = cuotasSimuladas.map(c => String(c[campo]));
    return [...new Set(valores)].sort();
  };

  // CRÍTICO: Memoizar valores únicos para evitar recalcularlos en cada render
  const valoresUnicosProducto = useMemo(() => obtenerValoresUnicos('producto'), []);
  const valoresUnicosTipoContacto = useMemo(() => obtenerValoresUnicos('tipoContacto'), []);
  const valoresUnicosTipificacion = useMemo(() => obtenerValoresUnicos('tipificacion'), []);
  const valoresUnicosFechaVencimiento = useMemo(() => obtenerValoresUnicos('fechaVencimiento'), []);
  const valoresUnicosAgente = useMemo(() => obtenerValoresUnicos('agente'), []);
  const valoresUnicosEstado = useMemo(() => obtenerValoresUnicos('estado'), []);

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
  const handleFiltroTexto = (columna: 'identificacion' | 'nombre' | 'cuenta', valor: string) => {
    setFiltrosColumna(prev => ({
      ...prev,
      [columna]: valor,
    }));
    setPaginaActual(1);
  };

  // Filtrar cuotas - Usa los estados APLICADOS (no los del formulario)
  const cuotasFiltradas = useMemo(() => {
    let resultados = cuotasSimuladas;

    // Aplicar búsqueda principal por fecha de vencimiento (usando valores aplicados)
    if (mostrarResultados) {
      if (fechaDesdeAplicado) {
        resultados = resultados.filter(c => c.fechaVencimiento >= fechaDesdeAplicado);
      }
      if (fechaHastaAplicado) {
        resultados = resultados.filter(c => c.fechaVencimiento <= fechaHastaAplicado);
      }

      // Filtrar por productos seleccionados (valores aplicados)
      if (productosSeleccionadosAplicado.length > 0) {
        resultados = resultados.filter(c => productosSeleccionadosAplicado.includes(c.producto));
      }
    }

    // Aplicar filtros de columna (Select con arrays)
    if (filtrosColumna.producto.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.producto.includes(c.producto));
    }
    if (filtrosColumna.tipoContacto.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.tipoContacto.includes(c.tipoContacto));
    }
    if (filtrosColumna.tipificacion.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.tipificacion.includes(c.tipificacion));
    }
    if (filtrosColumna.fechaVencimiento.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.fechaVencimiento.includes(c.fechaVencimiento));
    }
    if (filtrosColumna.agente.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.agente.includes(c.agente));
    }
    if (filtrosColumna.estado.length > 0) {
      resultados = resultados.filter(c => filtrosColumna.estado.includes(c.estado));
    }

    // Aplicar filtros de columna (Textbox con strings)
    if (filtrosColumna.identificacion) {
      const filtro = filtrosColumna.identificacion.toLowerCase();
      resultados = resultados.filter(c => c.identificacion.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.nombre) {
      const filtro = filtrosColumna.nombre.toLowerCase();
      resultados = resultados.filter(c => c.nombre.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.cuenta) {
      const filtro = filtrosColumna.cuenta.toLowerCase();
      resultados = resultados.filter(c => c.cuenta.toLowerCase().includes(filtro));
    }

    return resultados;
  }, [mostrarResultados, fechaDesdeAplicado, fechaHastaAplicado, productosSeleccionadosAplicado, filtrosColumna]);

  // Calcular paginación
  const totalPaginas = Math.ceil(cuotasFiltradas.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const cuotasPaginadas = cuotasFiltradas.slice(indiceInicio, indiceFin);

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
  const abrirEdicionCuota = (cuota: Cuota) => {
    setCuotaSeleccionada(cuota);
    setModalEdicionAbierto(true);
  };

  return (
    <div className="space-y-2">
      {/* Formulario de búsqueda */}
      <Card className="border-2 border-sky-400">
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Buscar por (fijo en Fecha Vencimiento) */}
            <div className="w-48">
              <Label htmlFor="buscar-por">Buscar por</Label>
              <Input
                id="buscar-por"
                value="Fecha Vencimiento"
                readOnly
                className="bg-gray-50 h-7 text-xs border-sky-500"
              />
            </div>

            {/* Rango de fechas */}
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
                {cuotasFiltradas.length} registro(s) encontrado(s)
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
                      Cuota
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-20">
                      Monto
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-32">
                      <div className="space-y-1">
                        <div>Fecha Vencimiento</div>
                        <Select
                          value={filtrosColumna.fechaVencimiento[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('fechaVencimiento', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosFechaVencimiento.map(valor => (
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
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cuotasPaginadas.map((cuota, index) => (
                    <tr
                      key={cuota.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors`}
                    >
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.producto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.identificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs" title={cuota.nombre}>
                        <div className="truncate cursor-help">
                          {cuota.nombre}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.cuenta}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.tipoContacto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.tipificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-center">
                        <div className="truncate">
                          {cuota.cuota}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-right">
                        <div className="truncate">
                          {formatearMoneda(cuota.monto)}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {formatearFecha(cuota.fechaVencimiento)}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {cuota.agente}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            cuota.estado === 'Pagado'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : cuota.estado === 'Parcial'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {cuota.estado}
                          </span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-xs text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicionCuota(cuota)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cuotasPaginadas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron cuotas con los criterios especificados
                </div>
              )}
            </div>

            {/* Paginación - Siempre visible */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <div className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas || 1} | Total: {cuotasFiltradas.length} registro(s)
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
      <ModalEdicionCuota
        open={modalEdicionAbierto}
        onOpenChange={setModalEdicionAbierto}
        cuota={cuotaSeleccionada}
      />
    </div>
  );
}