import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FileText, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAcuerdos } from '../context/AcuerdosContext';

interface Deuda {
  cuenta: string;
  producto: string;
  moneda: string;
  deuda: number;
  fechaCastigo: string;
}

interface Acuerdo {
  cuenta: string;
  tipoAcuerdo: string;
  tipificacion: string;
  montoNegociado: number;
  cuotas: number;
  fechaCreacion: string;
}

interface ClienteProducto {
  id: string;
  producto: string;
  identificacion: string;
  cuenta: string;
  nombreCliente: string;
  deudas: Deuda[];
  acuerdos: Acuerdo[];
  mejorGestion: string;
  ultimaGestion: string;
  estado: 'activo' | 'inactivo';
}

// Datos simulados para demostración
const clientesSimulados: ClienteProducto[] = [
  {
    id: '1',
    producto: 'BCP Castigo',
    identificacion: '1234567890',
    cuenta: 'TC-001-2024',
    nombreCliente: 'Juan Carlos Pérez García',
    deudas: [
      { cuenta: 'TC-001-2024', producto: 'Tarjeta Crédito', moneda: 'COP', deuda: 2500000, fechaCastigo: '2026-04-15' },
      { cuenta: 'TC-001-2024', producto: 'Intereses', moneda: 'COP', deuda: 350000, fechaCastigo: '2026-04-15' },
    ],
    acuerdos: [
      { cuenta: 'TC-001-2024', tipoAcuerdo: 'Promesa de Pago', tipificacion: 'PP-001', montoNegociado: 1000000, cuotas: 3, fechaCreacion: '10/03/2026' },
    ],
    mejorGestion: '15/02/2026 - Contacto efectivo',
    ultimaGestion: '10/03/2026 - Promesa de pago acordada',
    estado: 'activo',
  },
  {
    id: '2',
    producto: 'Scotiabank Mora',
    identificacion: '1234567890',
    cuenta: 'CP-045-2024',
    nombreCliente: 'Juan Carlos Pérez García',
    deudas: [
      { cuenta: 'CP-045-2024', producto: 'Crédito Personal', moneda: 'COP', deuda: 5800000, fechaCastigo: '2026-05-20' },
      { cuenta: 'CP-045-2024', producto: 'Mora', moneda: 'COP', deuda: 680000, fechaCastigo: '2026-05-20' },
    ],
    acuerdos: [
      { cuenta: 'CP-045-2024', tipoAcuerdo: 'Convenio de Pago', tipificacion: 'CV-002', montoNegociado: 3000000, cuotas: 6, fechaCreacion: '11/03/2026' },
      { cuenta: 'CP-045-2024', tipoAcuerdo: 'Descuento', tipificacion: 'DS-001', montoNegociado: 500000, cuotas: 1, fechaCreacion: '05/03/2026' },
    ],
    mejorGestion: '20/02/2026 - Negociación exitosa',
    ultimaGestion: '11/03/2026 - Convenio firmado',
    estado: 'activo',
  },
  {
    id: '3',
    producto: 'BBVA Vehicular Premium',
    identificacion: '0987654321',
    cuenta: 'CV-123-2024',
    nombreCliente: 'María Fernanda López Rodríguez',
    deudas: [
      { cuenta: 'CV-123-2024', producto: 'Crédito Vehicular', moneda: 'COP', deuda: 12500000, fechaCastigo: '2026-06-25' },
      { cuenta: 'CV-123-2024', producto: 'Seguros', moneda: 'COP', deuda: 450000, fechaCastigo: '2026-06-25' },
    ],
    acuerdos: [],
    mejorGestion: '01/03/2026 - Cliente comprometido',
    ultimaGestion: '08/03/2026 - Solicitud prórroga',
    estado: 'activo',
  },
  {
    id: '4',
    producto: 'Interbank Tarjetas',
    identificacion: '5555666677',
    cuenta: 'TC-789-2023',
    nombreCliente: 'Carlos Alberto Ramírez Santos',
    deudas: [
      { cuenta: 'TC-789-2023', producto: 'Tarjeta Crédito', moneda: 'COP', deuda: 1800000, fechaCastigo: '2026-07-30' },
    ],
    acuerdos: [
      { cuenta: 'TC-789-2023', tipoAcuerdo: 'Promesa de Pago', tipificacion: 'PP-003', montoNegociado: 600000, cuotas: 2, fechaCreacion: '12/03/2026' },
    ],
    mejorGestion: '25/02/2026 - Contacto directo',
    ultimaGestion: '12/03/2026 - Pago parcial realizado',
    estado: 'inactivo',
  },
];

export function Clientes() {
  const navigate = useNavigate();
  const { acuerdos, preAcuerdos } = useAcuerdos();
  const [buscarPor, setBuscarPor] = useState<'identificacion' | 'cuenta' | 'nombre'>('identificacion');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'activo' | 'inactivo'>('activo');
  const [resultados, setResultados] = useState<ClienteProducto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Estado para el diálogo de confirmación
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [dialogoMismoCliente, setDialogoMismoCliente] = useState(false);
  const [clientePendiente, setClientePendiente] = useState<ClienteProducto | null>(null);

  // Combinar clientes simulados con acuerdos del contexto
  const clientesConAcuerdos = useMemo(() => {
    const todosLosAcuerdos = [...acuerdos, ...preAcuerdos];

    // Crear una copia de los clientes simulados
    const clientesActualizados = clientesSimulados.map(cliente => {
      // Buscar acuerdos del contexto para este cliente
      const acuerdosCliente = todosLosAcuerdos
        .filter(a => a.identificacion === cliente.identificacion)
        .map(a => ({
          cuenta: a.cuenta,
          tipoAcuerdo: a.tipoAcuerdo,
          tipificacion: a.tipificacion,
          montoNegociado: a.montoNegociado,
          cuotas: a.cuotas,
          fechaCreacion: a.fechaCreacion,
        }));

      // Si hay acuerdos del contexto, agregarlos a los existentes
      if (acuerdosCliente.length > 0) {
        return {
          ...cliente,
          acuerdos: [...cliente.acuerdos, ...acuerdosCliente],
        };
      }

      return cliente;
    });

    return clientesActualizados;
  }, [acuerdos, preAcuerdos]);

  // Limpiar sessionStorage de fichas al cargar la página
  // Solo limpiar si no hay ficha abierta (para permitir volver a la ficha)
  useEffect(() => {
    // No limpiar automáticamente - el usuario puede volver a Clientes mientras tiene una ficha abierta
  }, []);

  const handleBuscar = () => {
    if (!valorBusqueda.trim()) {
      toast.error('Por favor ingrese un valor de búsqueda');
      return;
    }

    // Filtrar clientes según criterios
    const filtrados = clientesConAcuerdos.filter((cliente) => {
      // Filtrar por estado
      if (cliente.estado !== estadoFiltro) return false;

      // Filtrar por criterio de búsqueda
      const valorLower = valorBusqueda.toLowerCase().trim();

      switch (buscarPor) {
        case 'identificacion':
          return cliente.identificacion.includes(valorBusqueda);
        case 'cuenta':
          return cliente.cuenta.toLowerCase().includes(valorLower);
        case 'nombre':
          return cliente.nombreCliente.toLowerCase().includes(valorLower);
        default:
          return false;
      }
    });

    setResultados(filtrados);
    setHasSearched(true);

    if (filtrados.length === 0) {
      toast.info('No se encontraron resultados para la búsqueda');
    } else {
      toast.success(`Se encontraron ${filtrados.length} resultado(s)`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Función para verificar si la ficha realmente está abierta (usando heartbeat)
  const verificarFichaActiva = (): boolean => {
    const heartbeat = localStorage.getItem('fichaHeartbeat');
    if (!heartbeat) return false;

    const tiempoHeartbeat = parseInt(heartbeat);
    const tiempoActual = Date.now();
    // Si el heartbeat es mayor a 3 segundos, la ficha ya no está activa
    return (tiempoActual - tiempoHeartbeat) < 3000;
  };

  const handleGestionar = (cliente: ClienteProducto) => {
    // Verificar si ya existe una ficha de gestión abierta
    const fichaAbierta = sessionStorage.getItem('fichaGestionAbierta');
    const clienteAbierto = sessionStorage.getItem('clienteGestionId');

    // Verificar si la ficha realmente está activa (heartbeat)
    const fichaActiva = verificarFichaActiva();

    if (fichaAbierta && fichaActiva && clienteAbierto === cliente.id) {
      // La ficha ya está abierta para este mismo cliente - mostrar diálogo
      setDialogoMismoCliente(true);
      return;
    }

    if (fichaAbierta && fichaActiva && clienteAbierto !== cliente.id) {
      // Hay una ficha abierta para otro cliente - mostrar diálogo
      setClientePendiente(cliente);
      setDialogoAbierto(true);
      return;
    }

    // Si hay una ficha registrada pero no está activa, limpiar todo
    if (fichaAbierta && !fichaActiva) {
      sessionStorage.removeItem('fichaGestionAbierta');
      sessionStorage.removeItem('clienteGestion');
      sessionStorage.removeItem('clienteGestionId');
      localStorage.removeItem('fichaHeartbeat');
    }

    // No hay ficha abierta (o no está activa), abrir directamente
    abrirFichaGestion(cliente);
  };

  const abrirFichaGestion = (cliente: ClienteProducto) => {
    // Señalar a la ficha anterior que debe cerrarse (si existe)
    const fichaAbierta = sessionStorage.getItem('fichaGestionAbierta');
    if (fichaAbierta) {
      localStorage.setItem('cerrarFichaAnterior', Date.now().toString());
    }

    // Marcar que hay una ficha abierta
    sessionStorage.setItem('fichaGestionAbierta', 'true');
    // Guardar el ID del cliente que se está gestionando
    sessionStorage.setItem('clienteGestionId', cliente.id);

    // Guardar los datos del cliente en sessionStorage para que la nueva pestaña los pueda leer
    sessionStorage.setItem('clienteGestion', JSON.stringify(cliente));

    // Abrir la ficha de gestión en una nueva pestaña
    const newWindow = window.open('/cobranza/ficha', '_blank');

    // Si la ventana no se pudo abrir (bloqueador de popups)
    if (!newWindow) {
      sessionStorage.removeItem('fichaGestionAbierta');
      sessionStorage.removeItem('clienteGestionId');
      sessionStorage.removeItem('clienteGestion');
      toast.error('No se pudo abrir la ficha. Permita ventanas emergentes en su navegador.');
    }
  };

  const confirmarNuevaFicha = () => {
    if (clientePendiente) {
      abrirFichaGestion(clientePendiente);
    }
    setDialogoAbierto(false);
    setClientePendiente(null);
  };

  const cancelarNuevaFicha = () => {
    setDialogoAbierto(false);
    setClientePendiente(null);
    toast.info('Operación cancelada');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-600">Búsqueda y gestión de clientes</p>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <Card className="border-2 border-sky-400 bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            {/* Contenedor flex para campos izquierdos */}
            <div className="flex gap-4 items-end flex-1">
              {/* Buscar por */}
              <div className="w-48 space-y-2">
                <Label>Buscar por</Label>
                <Select value={buscarPor} onValueChange={(value: any) => setBuscarPor(value)}>
                  <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identificacion">Identificación</SelectItem>
                    <SelectItem value="cuenta">Cuenta</SelectItem>
                    <SelectItem value="nombre">Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor de búsqueda - Reducido 50% */}
              <div className="w-64 space-y-2">
                <Label>Valor</Label>
                <Input
                  value={valorBusqueda}
                  onChange={(e) => setValorBusqueda(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    buscarPor === 'identificacion' ? 'Ingrese identificación' :
                    buscarPor === 'cuenta' ? 'Ingrese número de cuenta' :
                    'Ingrese nombre del cliente'
                  }
                  className="h-7 text-xs border-sky-500"
                />
              </div>

              {/* Estado */}
              <div className="w-40 space-y-2">
                <Label>Estado</Label>
                <Select value={estadoFiltro} onValueChange={(value: any) => setEstadoFiltro(value)}>
                  <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón Buscar - Fijo a la derecha */}
            <div className="w-40 shrink-0">
              <Button onClick={handleBuscar} className="w-full h-7 text-xs">
                <Search className="w-3 h-3 mr-1" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && (
        <div className="space-y-4">
          {resultados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No se encontraron clientes con los criterios especificados
              </CardContent>
            </Card>
          ) : (
            resultados.map((cliente, index) => (
              <Card key={cliente.id} className="border-2 border-sky-400 max-w-[60%]">
                <CardContent className="p-3">
                  {/* Encabezado de tarjeta */}
                  <div className="mb-2 pb-2 border-b-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-700">tarjeta #{index + 1}</h3>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${
                        cliente.estado === 'activo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cliente.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Información básica - Columna izquierda */}
                    <div className="lg:col-span-3 space-y-1">
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Cargue - Producto</Label>
                        <div className="h-7 text-xs mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm">
                          {cliente.producto}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Identificación</Label>
                        <div className="h-7 text-xs mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm">
                          {cliente.identificacion}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Nombre</Label>
                        <div className="h-7 text-xs mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm">
                          {cliente.nombreCliente}
                        </div>
                      </div>

                      {/* Mejor y última gestión */}
                      <div className="pt-2 space-y-1">
                        <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-xs font-semibold text-blue-900">MEJOR GESTIÓN</div>
                          <div className="text-xs text-blue-800">{cliente.mejorGestion}</div>
                        </div>
                        <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded">
                          <div className="text-xs font-semibold text-amber-900">ÚLTIMA GESTIÓN</div>
                          <div className="text-xs text-amber-800">{cliente.ultimaGestion}</div>
                        </div>
                      </div>
                    </div>

                    {/* Tablas - Columna derecha */}
                    <div className="lg:col-span-9 space-y-2">
                      {/* Tabla DEUDA */}
                      <div>
                        <div className="mb-1">
                          <h4 className="text-sm font-bold text-gray-700">DEUDA</h4>
                        </div>
                        <div className="border-2 border-gray-300 rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Cuenta</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Producto</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Moneda</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Deuda</th>
                                <th className="px-2 py-1 text-left text-sm font-normal">Fecha Castigo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cliente.deudas.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-2 py-2 text-center text-gray-500">
                                    Sin deudas registradas
                                  </td>
                                </tr>
                              ) : (
                                cliente.deudas.map((deuda, idx) => (
                                  <tr key={idx} className="border-b border-gray-200 last:border-0">
                                    <td className="px-2 py-1 border-r border-gray-200">{deuda.cuenta}</td>
                                    <td className="px-2 py-1 border-r border-gray-200">{deuda.producto}</td>
                                    <td className="px-2 py-1 border-r border-gray-200">{deuda.moneda}</td>
                                    <td className="px-2 py-1 border-r border-gray-200 text-right font-semibold">{formatCurrency(deuda.deuda)}</td>
                                    <td className="px-2 py-1 text-right font-semibold">{deuda.fechaCastigo}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Tabla ACUERDOS */}
                      <div>
                        <div className="mb-1">
                          <h4 className="text-sm font-bold text-gray-700">ACUERDOS</h4>
                        </div>
                        <div className="border-2 border-gray-300 rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Cuenta</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Tipo Acuerdo</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Tipificación</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Monto Negociado</th>
                                <th className="px-2 py-1 text-left text-sm font-normal border-r border-gray-300">Cuotas</th>
                                <th className="px-2 py-1 text-left text-sm font-normal">Fecha Creación</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cliente.acuerdos.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-2 py-2 text-center text-gray-500">
                                    Sin acuerdos registrados
                                  </td>
                                </tr>
                              ) : (
                                cliente.acuerdos.map((acuerdo, idx) => (
                                  <tr key={idx} className="border-b border-gray-200 last:border-0">
                                    <td className="px-2 py-1 border-r border-gray-200">{acuerdo.cuenta}</td>
                                    <td className="px-2 py-1 border-r border-gray-200">{acuerdo.tipoAcuerdo}</td>
                                    <td className="px-2 py-1 border-r border-gray-200">{acuerdo.tipificacion}</td>
                                    <td className="px-2 py-1 border-r border-gray-200 text-right font-semibold">
                                      {formatCurrency(acuerdo.montoNegociado)}
                                    </td>
                                    <td className="px-2 py-1 border-r border-gray-200 text-center">{acuerdo.cuotas}</td>
                                    <td className="px-2 py-1 text-center">{acuerdo.fechaCreacion}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Botón GESTIONAR */}
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleGestionar(cliente)}
                          className="bg-gray-700 hover:bg-gray-800 h-7 text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Diálogo de confirmación para cerrar ficha existente */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Ficha de gestión abierta
            </DialogTitle>
            <DialogDescription className="pt-2">
              Ya tiene una ficha de gestión abierta para otro cliente. ¿Desea cerrarla y abrir la nueva ficha?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Si continúa, la ficha actual se cerrará automáticamente y se abrirá la nueva.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelarNuevaFicha}>
              Cancelar
            </Button>
            <Button onClick={confirmarNuevaFicha} className="bg-amber-600 hover:bg-amber-700">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo cuando ya tiene la ficha del mismo cliente abierta */}
      <Dialog open={dialogoMismoCliente} onOpenChange={setDialogoMismoCliente}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <FileText className="w-5 h-5" />
              Ficha ya abierta
            </DialogTitle>
            <DialogDescription className="pt-2">
              Ya tiene abierta la ficha de este cliente. Cierre la ficha actual antes de abrirla nuevamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogoMismoCliente(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}