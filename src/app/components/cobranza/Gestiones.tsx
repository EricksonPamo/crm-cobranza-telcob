import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Eye, User, FileText } from 'lucide-react';

// Tipos de datos
interface Gestion {
  id: string;
  producto: string;
  identificacion: string;
  cuenta: string;
  nombre: string;
  telefono: string;
  tipoContacto: string;
  tipificacion: string;
  montoAcuerdo: number;
  cuotas: number;
  observacion: string;
  fechaGestion: string;
  agente: string;
}

interface FiltrosColumna {
  producto: string[];
  identificacion: string;
  nombre: string;
  telefono: string;
  tipoContacto: string[];
  tipificacion: string[];
  fechaGestion: string[];
  agente: string[];
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

// Datos simulados de gestiones
const gestionesSimuladas: Gestion[] = [
  {
    id: '1',
    producto: 'BCP Castigo',
    identificacion: '1234567890',
    cuenta: '001-001-001-001',
    nombre: 'Juan Carlos Pérez García',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Promesa de Pago',
    montoAcuerdo: 1000000,
    cuotas: 3,
    observacion: 'Cliente acepta pago en 3 cuotas mensuales',
    fechaGestion: '2026-03-10',
    agente: 'María González',
  },
  {
    id: '2',
    producto: 'Scotiabank Mora',
    identificacion: '1234567890',
    cuenta: '002-002-002-002',
    nombre: 'Juan Carlos Pérez García',
    telefono: '3101234567',
    tipoContacto: 'Correo',
    tipificacion: 'Convenio de Pago',
    montoAcuerdo: 3000000,
    cuotas: 6,
    observacion: 'Convenio firmado con descuento del 15%',
    fechaGestion: '2026-03-11',
    agente: 'Carlos Méndez',
  },
  {
    id: '3',
    producto: 'BBVA Vehicular Premium',
    identificacion: '0987654321',
    cuenta: '003-003-003-003',
    nombre: 'María Fernanda López Rodríguez',
    telefono: '3101234567',
    tipoContacto: 'Presencial',
    tipificacion: 'Solicitud Prórroga',
    montoAcuerdo: 0,
    cuotas: 0,
    observacion: 'Cliente solicita ampliación de plazo 30 días',
    fechaGestion: '2026-03-08',
    agente: 'Ana Martínez',
  },
  {
    id: '4',
    producto: 'Interbank Tarjetas',
    identificacion: '5555666677',
    cuenta: '004-004-004-004',
    nombre: 'Carlos Alberto Ramírez Santos',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Promesa de Pago',
    montoAcuerdo: 600000,
    cuotas: 2,
    observacion: 'Pago inicial 40% y saldo en 2 cuotas',
    fechaGestion: '2026-03-12',
    agente: 'María González',
  },
  {
    id: '5',
    producto: 'BCP Castigo',
    identificacion: '4567891230',
    cuenta: '005-005-005-005',
    nombre: 'Ana Patricia Silva Morales',
    telefono: '3101234567',
    tipoContacto: 'WhatsApp',
    tipificacion: 'No Contacto',
    montoAcuerdo: 0,
    cuotas: 0,
    observacion: 'Número no contesta, buzón de voz lleno',
    fechaGestion: '2026-03-09',
    agente: 'Pedro Sánchez',
  },
  {
    id: '6',
    producto: 'Banco Pichincha',
    identificacion: '7788990011',
    cuenta: '006-006-006-006',
    nombre: 'Roberto Andrés Vega Núñez',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Negociación Exitosa',
    montoAcuerdo: 2500000,
    cuotas: 5,
    observacion: 'Descuento por pronto pago aplicado',
    fechaGestion: '2026-03-10',
    agente: 'Ana Martínez',
  },
  {
    id: '7',
    producto: 'Crediscotia Premium',
    identificacion: '3344556677',
    cuenta: '007-007-007-007',
    nombre: 'Laura Beatriz Castro Díaz',
    telefono: '3101234567',
    tipoContacto: 'Correo',
    tipificacion: 'Cliente Reclama',
    montoAcuerdo: 0,
    cuotas: 0,
    observacion: 'Solicita revisión de intereses y cargos',
    fechaGestion: '2026-03-11',
    agente: 'Carlos Méndez',
  },
  {
    id: '8',
    producto: 'Scotiabank Mora',
    identificacion: '9988776655',
    cuenta: '008-008-008-008',
    nombre: 'Diego Fernando Rojas Paredes',
    telefono: '3101234567',
    tipoContacto: 'Teléfono',
    tipificacion: 'Promesa de Pago',
    montoAcuerdo: 800000,
    cuotas: 4,
    observacion: 'Comprometido a pagar antes de fin de mes',
    fechaGestion: '2026-03-12',
    agente: 'María González',
  },
  {
    id: '9',
    producto: 'BBVA Vehicular Premium',
    identificacion: '1122334455',
    cuenta: '009-009-009-009',
    nombre: 'Patricia Elena Gutiérrez Herrera',
    telefono: '3101234567',
    tipoContacto: 'Presencial',
    tipificacion: 'Convenio de Pago',
    montoAcuerdo: 4500000,
    cuotas: 8,
    observacion: 'Firma de convenio con garantía vehicular',
    fechaGestion: '2026-03-09',
    agente: 'Pedro Sánchez',
  },
  {
    id: '10',
    producto: 'Interbank Tarjetas',
    identificacion: '6677889900',
    cuenta: '010-010-010-010',
    nombre: 'Jorge Luis Fernández Salazar',
    telefono: '3101234567',
    tipoContacto: 'WhatsApp',
    tipificacion: 'Solicitud Descuento',
    montoAcuerdo: 1200000,
    cuotas: 1,
    observacion: 'Pago único con descuento del 20%',
    fechaGestion: '2026-03-10',
    agente: 'Ana Martínez',
  },
];

export function Gestiones() {
  // Estados de búsqueda
  const [buscarPor, setBuscarPor] = useState('identificacion');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(true);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Estados de filtros de columnas
  const [filtrosColumna, setFiltrosColumna] = useState<FiltrosColumna>({
    producto: [],
    identificacion: '',
    nombre: '',
    telefono: '',
    tipoContacto: [],
    tipificacion: [],
    fechaGestion: [],
    agente: [],
  });

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Estado para el modal de detalle
  const [gestionSeleccionada, setGestionSeleccionada] = useState<Gestion | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Obtener valores únicos para filtros (función auxiliar)
  const obtenerValoresUnicos = (campo: keyof Gestion): string[] => {
    const valores = gestionesSimuladas.map(g => String(g[campo]));
    return [...new Set(valores)].sort();
  };

  // CRÍTICO: Memoizar valores únicos para evitar recalcularlos en cada render
  const valoresUnicosProducto = useMemo(() => obtenerValoresUnicos('producto'), []);
  const valoresUnicosTipoContacto = useMemo(() => obtenerValoresUnicos('tipoContacto'), []);
  const valoresUnicosTipificacion = useMemo(() => obtenerValoresUnicos('tipificacion'), []);
  const valoresUnicosFechaGestion = useMemo(() => obtenerValoresUnicos('fechaGestion'), []);
  const valoresUnicosAgente = useMemo(() => obtenerValoresUnicos('agente'), []);

  // Manejar selección de productos (simular multi-select básico)
  const toggleProducto = (producto: string) => {
    setProductosSeleccionados(prev =>
      prev.includes(producto)
        ? prev.filter(p => p !== producto)
        : [...prev, producto]
    );
  };

  // Función de búsqueda
  const handleBuscar = () => {
    setMostrarResultados(true);
    setBusquedaRealizada(true);
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
  const handleFiltroTexto = (columna: 'identificacion' | 'nombre' | 'telefono', valor: string) => {
    setFiltrosColumna(prev => ({
      ...prev,
      [columna]: valor,
    }));
    setPaginaActual(1);
  };

  // Filtrar gestiones
  const gestionesFiltradas = useMemo(() => {
    // Si no se ha realizado búsqueda, retornar array vacío
    if (!busquedaRealizada) {
      return [];
    }

    let resultados = gestionesSimuladas;

    // Aplicar búsqueda principal
    if (mostrarResultados) {
      if (buscarPor === 'fechaCreacion') {
        if (fechaDesde) {
          resultados = resultados.filter(g => g.fechaGestion >= fechaDesde);
        }
        if (fechaHasta) {
          resultados = resultados.filter(g => g.fechaGestion <= fechaHasta);
        }
      } else if (valorBusqueda) {
        const valorLower = valorBusqueda.toLowerCase();
        resultados = resultados.filter(g => {
          const campo = g[buscarPor as keyof Gestion];
          return String(campo).toLowerCase().includes(valorLower);
        });
      }

      // Filtrar por productos seleccionados
      if (productosSeleccionados.length > 0) {
        resultados = resultados.filter(g => productosSeleccionados.includes(g.producto));
      }
    }

    // Aplicar filtros de columna (Select con arrays)
    if (filtrosColumna.producto.length > 0) {
      resultados = resultados.filter(g => filtrosColumna.producto.includes(g.producto));
    }
    if (filtrosColumna.tipoContacto.length > 0) {
      resultados = resultados.filter(g => filtrosColumna.tipoContacto.includes(g.tipoContacto));
    }
    if (filtrosColumna.tipificacion.length > 0) {
      resultados = resultados.filter(g => filtrosColumna.tipificacion.includes(g.tipificacion));
    }
    if (filtrosColumna.fechaGestion.length > 0) {
      resultados = resultados.filter(g => filtrosColumna.fechaGestion.includes(g.fechaGestion));
    }
    if (filtrosColumna.agente.length > 0) {
      resultados = resultados.filter(g => filtrosColumna.agente.includes(g.agente));
    }

    // Aplicar filtros de columna (Textbox con strings)
    if (filtrosColumna.identificacion) {
      const filtro = filtrosColumna.identificacion.toLowerCase();
      resultados = resultados.filter(g => g.identificacion.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.nombre) {
      const filtro = filtrosColumna.nombre.toLowerCase();
      resultados = resultados.filter(g => g.nombre.toLowerCase().includes(filtro));
    }
    if (filtrosColumna.telefono) {
      const filtro = filtrosColumna.telefono.toLowerCase();
      resultados = resultados.filter(g => g.telefono.toLowerCase().includes(filtro));
    }

    return resultados;
  }, [busquedaRealizada, mostrarResultados, buscarPor, valorBusqueda, fechaDesde, fechaHasta, productosSeleccionados, filtrosColumna]);

  // Calcular paginación
  const totalPaginas = Math.ceil(gestionesFiltradas.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const gestionesPaginadas = gestionesFiltradas.slice(indiceInicio, indiceFin);

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

  // Función para abrir el modal de detalle
  const abrirDetalleGestion = (gestion: Gestion) => {
    setGestionSeleccionada(gestion);
    setModalDetalleAbierto(true);
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

            {/* Valor */}
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
                {gestionesFiltradas.length} registro(s) encontrado(s)
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
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-[100px]">
                      Observación
                    </th>
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-28">
                      <div className="space-y-1">
                        <div>Fecha Gestión</div>
                        <Select
                          value={filtrosColumna.fechaGestion[0] || '__todos__'}
                          onValueChange={(valor) => toggleFiltroColumna('fechaGestion', valor)}
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs bg-white">
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__todos__">Todos</SelectItem>
                            {valoresUnicosFechaGestion.map(valor => (
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
                    <th className="border border-sky-500 px-2 py-1.5 text-center text-sm font-bold text-slate-700 w-20">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gestionesPaginadas.map((gestion, index) => (
                    <tr
                      key={gestion.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors`}
                    >
                      <td className="border border-slate-300 px-2 py-1 text-xs">
                        <div className="truncate">
                          {gestion.producto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {gestion.identificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs" title={gestion.nombre}>
                        <div className="truncate cursor-help">
                          {gestion.nombre}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {gestion.telefono}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {gestion.tipoContacto}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {gestion.tipificacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs text-right">
                        <div className="truncate">
                          {gestion.montoAcuerdo > 0 ? formatearMoneda(gestion.montoAcuerdo) : '-'}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs text-center">
                        <div className="truncate">
                          {gestion.cuotas > 0 ? gestion.cuotas : '-'}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs" title={gestion.observacion}>
                        <div className="truncate cursor-help">
                          {gestion.observacion}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {formatearFecha(gestion.fechaGestion)}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs">
                        <div className="truncate">
                          {gestion.agente}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-0.5 text-xs text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirDetalleGestion(gestion)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {gestionesPaginadas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {!busquedaRealizada
                    ? 'Realice una búsqueda para ver resultados'
                    : 'No se encontraron gestiones con los criterios especificados'}
                </div>
              )}
            </div>

            {/* Paginación - Siempre visible */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <div className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas || 1} | Total: {gestionesFiltradas.length} registro(s)
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

      {/* Modal de detalle */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent
          className="text-xs max-w-lg w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
            <DialogTitle className="text-lg font-bold text-slate-700">Detalle de Gestión</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Información completa de la gestión realizada
            </DialogDescription>
          </DialogHeader>
          <div>
            {gestionSeleccionada && (
              <div className="space-y-2 px-1">
                {/* Información del Cliente */}
                <div className="bg-sky-50 rounded-lg p-2 border-2 border-sky-500">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-600">Información del Cliente</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Producto</Label>
                      <Input value={gestionSeleccionada.producto} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Identificación</Label>
                      <Input value={gestionSeleccionada.identificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Cuenta</Label>
                      <Input value={gestionSeleccionada.cuenta} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Nombre</Label>
                      <Input value={gestionSeleccionada.nombre} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Teléfono</Label>
                      <Input value={gestionSeleccionada.telefono} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Tipo Contacto</Label>
                      <Input value={gestionSeleccionada.tipoContacto} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Tipificación</Label>
                      <Input value={gestionSeleccionada.tipificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Monto Acuerdo</Label>
                      <Input value={gestionSeleccionada.montoAcuerdo > 0 ? formatearMoneda(gestionSeleccionada.montoAcuerdo) : '-'} readOnly className="bg-emerald-50 border-emerald-200 text-xs h-7 flex-1 font-semibold text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Cuotas</Label>
                      <Input value={gestionSeleccionada.cuotas > 0 ? gestionSeleccionada.cuotas.toString() : '-'} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Fecha Gestión</Label>
                      <Input value={formatearFecha(gestionSeleccionada.fechaGestion)} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-36 text-xs font-medium text-slate-500 shrink-0">Agente</Label>
                      <Input value={gestionSeleccionada.agente} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
                    </div>
                  </div>
                </div>

                {/* Observación */}
                <div className="bg-white rounded-lg p-2 border-2 border-slate-300 space-y-1">
                  <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Observación
                  </Label>
                  <Textarea
                    value={gestionSeleccionada.observacion}
                    readOnly
                    className="min-h-[80px] text-xs border-slate-200 focus:border-sky-500 bg-slate-50"
                  />
                </div>

                {/* Botón cerrar */}
                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <Button onClick={() => setModalDetalleAbierto(false)} className="px-6 h-7 bg-black text-white hover:bg-gray-800">
                    CERRAR
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}