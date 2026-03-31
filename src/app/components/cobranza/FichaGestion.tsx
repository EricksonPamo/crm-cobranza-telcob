import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  History,
  MessageSquare,
  DollarSign,
  CreditCard,
  User,
  Plus,
  Handshake,
  ArrowLeft,
  AlertCircle,
  Clock,
  AlertTriangle,
  UserCircle,
  ChevronDown,
  Pencil,
} from 'lucide-react';
import { roleLabels } from '../../data/modules';
import { ModalEdicionAcuerdo } from './ModalEdicionAcuerdo';

// Tipos de datos
interface DatosPersonales {
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  fechaNacimiento: string;
  estadoCivil: string;
  telefono: string;
  telefonoAlternativo: string;
  email: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  empresa: string;
  cargo: string;
}

interface Cuenta {
  id: string;
  cuenta: string;
  producto: string;
  moneda: string;
  deudaTotal: number;
  diasMora: number;
  fechaCastigo: string;
  interesesGenerados: number;
  fechaUltimoPago: string;
  montoUltimoPago: number;
}

interface AcuerdoVigente {
  id: string;
  producto: string;
  montoTotal: number;
  cuotas: number;
  cuotasPagadas: number;
  cuotasVencidas: number;
  proximaCuota: string;
  estado: 'Aprobado' | 'Aprobado por Excepcion' | 'Aprobado Interno';
  tipificacion: string;
  fechaCreacion: string;
}

// Datos simulados por defecto
const datosClienteDefault: DatosPersonales = {
  tipoDocumento: 'DNI',
  identificacion: '12345678',
  nombre: 'JUAN PEREZ GARCIA',
  fechaNacimiento: '15/03/1985',
  estadoCivil: 'Casado',
  telefono: '3101234567',
  telefonoAlternativo: '3209876543',
  email: 'juan.perez@email.com',
  direccion: 'Calle 123 #45-67, Apt 501',
  ciudad: 'Bogota',
  departamento: 'Cundinamarca',
  empresa: 'Empresa ABC S.A.S.',
  cargo: 'Analista Financiero',
};

// Funciones auxiliares
const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

const formatearFecha = (fecha: string) => {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

const getEstadoAcuerdoColor = (estado: AcuerdoVigente['estado']) => {
  switch (estado) {
    case 'Aprobado':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Aprobado por Excepcion':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Aprobado Interno':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export function FichaGestion() {
  const navigate = useNavigate();
  const [tabDerecho, setTabDerecho] = useState('info');
  const [tabInferior, setTabInferior] = useState('historial');
  const [accordionIzquierdo, setAccordionIzquierdo] = useState('contacto');
  const [tieneCliente, setTieneCliente] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [tiempoExcedido, setTiempoExcedido] = useState(false);
  const [asesor, setAsesor] = useState<{ nombre: string; rol: string; dni: string } | null>(null);
  const [modalEdicionAcuerdoOpen, setModalEdicionAcuerdoOpen] = useState(false);
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState<AcuerdoVigente | null>(null);

  // Función para abrir el modal de edición de acuerdo
  const handleEditarAcuerdo = (acuerdo: AcuerdoVigente) => {
    setAcuerdoSeleccionado(acuerdo);
    setModalEdicionAcuerdoOpen(true);
  };

  // Obtener datos del cliente desde sessionStorage
  const [clienteData, setClienteData] = useState<any>(null);

  // Cronómetro de gestión
  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Verificar tiempo excedido
  useEffect(() => {
    if (segundos > 60 && !tiempoExcedido) {
      setTiempoExcedido(true);
    }
  }, [segundos, tiempoExcedido]);

  // Formatear tiempo
  const formatearTiempo = (totalSegundos: number) => {
    const minutos = Math.floor(totalSegundos / 60);
    const segundosRestantes = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // Determinar color del semáforo
  const getSemaforoColor = () => {
    if (segundos < 30) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-700',
        icon: 'text-green-500',
        label: 'Tiempo óptimo',
      };
    } else if (segundos < 60) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
        icon: 'text-yellow-500',
        label: 'Tiempo moderado',
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        icon: 'text-red-500',
        label: 'Tiempo excedido',
      };
    }
  };

  const semaforo = getSemaforoColor();

  useEffect(() => {
    // Leer datos del cliente desde sessionStorage
    const clienteStorage = sessionStorage.getItem('clienteGestion');
    if (clienteStorage) {
      setClienteData(JSON.parse(clienteStorage));
      setTieneCliente(true);
    }

    // Leer datos del asesor desde localStorage
    const asesorStorage = localStorage.getItem('currentUser');
    if (asesorStorage) {
      const userData = JSON.parse(asesorStorage);
      setAsesor({
        nombre: userData.nombre,
        rol: userData.rol,
        dni: userData.id, // Usamos el ID como identificación
      });
    }

    // Escuchar señal de cierre desde otra pestaña
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cerrarFichaAnterior') {
        // Limpiar sessionStorage
        sessionStorage.removeItem('fichaGestionAbierta');
        sessionStorage.removeItem('clienteGestion');
        sessionStorage.removeItem('clienteGestionId');
        localStorage.removeItem('fichaHeartbeat');
        // Cerrar esta pestaña
        window.close();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Heartbeat: actualizar timestamp cada segundo para indicar que la ficha está viva
    const heartbeatInterval = setInterval(() => {
      localStorage.setItem('fichaHeartbeat', Date.now().toString());
    }, 1000);

    // Limpiar todo cuando se cierra la pestaña/ventana
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('fichaGestionAbierta');
      sessionStorage.removeItem('clienteGestion');
      sessionStorage.removeItem('clienteGestionId');
      localStorage.removeItem('fichaHeartbeat');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Limpiar al desmontar
      localStorage.removeItem('fichaHeartbeat');
    };
  }, []);

  // Datos del cliente (usar datos de la navegación o datos por defecto)
  const datosCliente: DatosPersonales = {
    tipoDocumento: clienteData?.tipoDocumento || datosClienteDefault.tipoDocumento,
    identificacion: clienteData?.identificacion || datosClienteDefault.identificacion,
    nombre: clienteData?.nombreCliente || datosClienteDefault.nombre,
    fechaNacimiento: clienteData?.fechaNacimiento || datosClienteDefault.fechaNacimiento,
    estadoCivil: clienteData?.estadoCivil || datosClienteDefault.estadoCivil,
    telefono: clienteData?.telefono || datosClienteDefault.telefono,
    telefonoAlternativo: clienteData?.telefonoAlternativo || datosClienteDefault.telefonoAlternativo,
    email: clienteData?.email || datosClienteDefault.email,
    direccion: clienteData?.direccion || datosClienteDefault.direccion,
    ciudad: clienteData?.ciudad || datosClienteDefault.ciudad,
    departamento: clienteData?.departamento || datosClienteDefault.departamento,
    empresa: clienteData?.empresa || datosClienteDefault.empresa,
    cargo: clienteData?.cargo || datosClienteDefault.cargo,
  };

  // Convertir deudas del cliente a formato de cuentas
  const cuentasCliente: Cuenta[] = clienteData?.deudas?.map((deuda: any, index: number) => ({
    id: String(index + 1),
    cuenta: deuda.cuenta || `CTA-${String(index + 1).padStart(6, '0')}`,
    producto: deuda.producto || 'Préstamo Personal',
    moneda: deuda.moneda || 'PEN',
    deudaTotal: deuda.deuda || 0,
    diasMora: deuda.diasMora || 45,
    fechaCastigo: deuda.fechaCastigo || '2026-01-15',
    interesesGenerados: deuda.interesesGenerados || Math.floor(deuda.deuda * 0.15),
    fechaUltimoPago: deuda.fechaUltimoPago || '2025-12-01',
    montoUltimoPago: deuda.montoUltimoPago || 500,
  })) || [
    {
      id: '1',
      cuenta: 'CTA-000001',
      producto: 'Préstamo Personal',
      moneda: 'PEN',
      deudaTotal: 15000,
      diasMora: 45,
      fechaCastigo: '2026-01-15',
      interesesGenerados: 2250,
      fechaUltimoPago: '2025-12-01',
      montoUltimoPago: 500,
    },
    {
      id: '2',
      cuenta: 'CTA-000002',
      producto: 'Tarjeta de Crédito',
      moneda: 'PEN',
      deudaTotal: 8500,
      diasMora: 30,
      fechaCastigo: '2026-02-01',
      interesesGenerados: 1275,
      fechaUltimoPago: '2025-11-15',
      montoUltimoPago: 300,
    },
    {
      id: '3',
      cuenta: 'CTA-000003',
      producto: 'Préstamo Vehicular',
      moneda: 'USD',
      deudaTotal: 25000,
      diasMora: 120,
      fechaCastigo: '2025-10-01',
      interesesGenerados: 3750,
      fechaUltimoPago: '2025-09-01',
      montoUltimoPago: 1200,
    },
  ];

  // Convertir acuerdos del cliente a formato de acuerdos vigentes
  const acuerdosVigentes: AcuerdoVigente[] = clienteData?.acuerdos?.map((acuerdo: any, index: number) => ({
    id: String(index + 1),
    producto: acuerdo.cuenta,
    montoTotal: acuerdo.montoNegociado,
    cuotas: acuerdo.cuotas,
    cuotasPagadas: Math.floor(acuerdo.cuotas * 0.3),
    cuotasVencidas: Math.floor(acuerdo.cuotas * 0.1),
    proximaCuota: '2026-04-15',
    estado: 'Aprobado' as const,
    tipificacion: 'Acuerdo de Pago',
    fechaCreacion: '2026-03-15 10:30',
  })) || [
    {
      id: '1',
      producto: 'CTA-000001',
      montoTotal: 6000,
      cuotas: 4,
      cuotasPagadas: 2,
      cuotasVencidas: 1,
      proximaCuota: '2026-04-15',
      estado: 'Aprobado',
      tipificacion: 'Acuerdo de Pago',
      fechaCreacion: '2026-03-15 10:30',
    },
    {
      id: '2',
      producto: 'CTA-000002',
      montoTotal: 2400,
      cuotas: 3,
      cuotasPagadas: 1,
      cuotasVencidas: 1,
      proximaCuota: '2026-04-20',
      estado: 'Aprobado por Excepcion',
      tipificacion: 'Refinanciación',
      fechaCreacion: '2026-02-20 14:15',
    },
  ];

  const handleCerrarFicha = () => {
    // Limpiar sessionStorage para permitir abrir otra ficha
    sessionStorage.removeItem('fichaGestionAbierta');
    sessionStorage.removeItem('clienteGestion');
    sessionStorage.removeItem('clienteGestionId');
    // Intentar cerrar la pestaña
    window.close();
    // Si no se pudo cerrar (algunos navegadores lo bloquean), mostrar mensaje
    setTimeout(() => {
      alert('Ficha cerrada. Puede cerrar esta pestaña manualmente.');
    }, 100);
  };

  // Si no hay cliente, mostrar mensaje
  if (!tieneCliente && !clienteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md mx-4 shadow-lg">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No hay cliente seleccionado</h2>
            <p className="text-slate-600 mb-4">
              Debe seleccionar un cliente desde el módulo de Clientes para ver su ficha de gestión.
            </p>
            <Button onClick={() => navigate('/clientes')}>
              Ir a Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cabecera Superior */}
      <div className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-[1920px] mx-auto px-2 py-1.5">
          <div className="flex items-center justify-between">
            {/* Logo y botón cerrar */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCerrarFicha}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                title="Cerrar ficha"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-indigo-700 tracking-tight">TELCORB</h1>
                <p className="text-[10px] text-slate-500">Sistema de Gestion de Cobranza</p>
              </div>
            </div>

            {/* Cronómetro de gestión */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${semaforo.bg} ${semaforo.border} ${semaforo.text} transition-all duration-300`}>
              <div className={`flex items-center gap-1.5 ${tiempoExcedido ? 'animate-pulse' : ''}`}>
                {segundos >= 60 ? (
                  <AlertTriangle className={`w-4 h-4 ${semaforo.icon}`} />
                ) : (
                  <Clock className={`w-4 h-4 ${semaforo.icon}`} />
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium opacity-75">Tiempo de gestión</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono">{formatearTiempo(segundos)}</span>
                    <span className="text-[10px] font-medium">{semaforo.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del asesor */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px]">
                    {asesor ? roleLabels[asesor.rol as keyof typeof roleLabels] : 'Sin rol'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] text-slate-500">DNI:</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-700">{asesor?.dni || '-'}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{asesor?.nombre || 'Usuario no identificado'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-[1920px] mx-auto px-2 py-2">
        <div className="flex gap-2">
          {/* Panel Izquierdo - Datos Personales */}
          <div className="flex-none w-[250px]">
            <Card className="shadow-md border-slate-200 h-full">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50 !pb-0.5 pt-1.5 px-2 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-indigo-700 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion
                  type="single"
                  value={accordionIzquierdo}
                  onValueChange={setAccordionIzquierdo}
                  collapsible
                  className="w-full"
                >
                  {/* Contacto */}
                  <AccordionItem value="contacto" className="border-b border-slate-200">
                    <AccordionTrigger className="px-2 py-1.5 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-indigo-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                          <Phone className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Contacto</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tipo Documento</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.tipoDocumento}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Identificacion</p>
                            <p className="text-xs font-medium text-slate-800 truncate">{datosCliente.identificacion}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Nombre</p>
                            <p className="text-xs font-medium text-slate-800 truncate">{datosCliente.nombre}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Fecha Nacimiento</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.fechaNacimiento}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center">
                            <User className="w-3 h-3 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Estado Civil</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.estadoCivil}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                            <Mail className="w-3 h-3 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Correo</p>
                            <p className="text-xs font-medium text-slate-800 truncate">{datosCliente.email}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Ubicación */}
                  <AccordionItem value="ubicacion" className="border-b border-slate-200">
                    <AccordionTrigger className="px-2 py-1.5 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-amber-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Ubicacion</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-rose-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Direccion</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.direccion}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Ciudad</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.ciudad}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Departamento</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.departamento}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Laboral */}
                  <AccordionItem value="laboral" className="border-b-0">
                    <AccordionTrigger className="px-2 py-1.5 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-cyan-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-cyan-100 flex items-center justify-center">
                          <Briefcase className="w-3 h-3 text-cyan-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Laboral</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                            <Briefcase className="w-3 h-3 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Empresa</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.empresa}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Briefcase className="w-3 h-3 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Cargo</p>
                            <p className="text-xs font-medium text-slate-800">{datosCliente.cargo}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Panel Central - Cuentas y Acuerdos */}
          <div className="flex-grow min-w-0 space-y-2">
            {/* Tabla de Cuentas */}
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50 !pb-0.5 pt-2 px-3 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-indigo-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Cuentas del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 hover:bg-slate-100">
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Cuenta</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Producto</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Moneda</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Deuda Total</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Dias Mora</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">F. Castigo</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">Intereses</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">F. Ult. Pago</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center">M. Ult. Pago</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm text-center w-12">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuentasCliente.map((cuenta) => (
                        <TableRow key={cuenta.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-xs font-mono border-r border-slate-200 text-right">{cuenta.cuenta}</TableCell>
                          <TableCell className="text-xs font-medium border-r border-slate-200 text-right">{cuenta.producto}</TableCell>
                          <TableCell className="text-xs border-r border-slate-200 text-right">{cuenta.moneda}</TableCell>
                          <TableCell className="text-xs text-right font-semibold text-slate-800 border-r border-slate-200">
                            {formatearMoneda(cuenta.deudaTotal)}
                          </TableCell>
                          <TableCell className="text-xs text-right border-r border-slate-200">
                            <span className="text-red-600 font-semibold">{cuenta.diasMora}</span>
                          </TableCell>
                          <TableCell className="text-xs border-r border-slate-200 text-right">{formatearFecha(cuenta.fechaCastigo)}</TableCell>
                          <TableCell className="text-xs text-right font-semibold text-orange-600 border-r border-slate-200">
                            {formatearMoneda(cuenta.interesesGenerados)}
                          </TableCell>
                          <TableCell className="text-xs border-r border-slate-200 text-right">{formatearFecha(cuenta.fechaUltimoPago)}</TableCell>
                          <TableCell className="text-xs text-right font-semibold text-green-600 border-r border-slate-200">
                            {formatearMoneda(cuenta.montoUltimoPago)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                              title="Crear acuerdo de pago"
                            >
                              <Handshake className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Acuerdos Vigentes */}
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-slate-50 !pb-0.5 pt-2 px-3 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-green-700 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4" />
                  Acuerdos Vigentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {acuerdosVigentes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {acuerdosVigentes.map((acuerdo) => (
                      <div
                        key={acuerdo.id}
                        className="border border-slate-200 rounded-lg p-2 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-slate-500">Cuenta:</p>
                              <p className="text-xs font-bold text-slate-800">{acuerdo.producto}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-slate-500">Tipificación:</p>
                              <p className="text-xs font-medium text-slate-700">{acuerdo.tipificacion}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-slate-500">Fecha Creación:</p>
                              <p className="text-xs font-medium text-slate-700">{acuerdo.fechaCreacion}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 mb-1">
                              <p className="text-xs font-bold text-slate-700">Monto Total</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                title="Editar acuerdo"
                                onClick={() => handleEditarAcuerdo(acuerdo)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-green-600">{formatearMoneda(acuerdo.montoTotal)}</p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <p className="text-[10px] text-slate-500">Estado:</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getEstadoAcuerdoColor(acuerdo.estado)}`}
                              >
                                {acuerdo.estado}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-1.5" />
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <p className="text-sm text-slate-700 font-bold">Cuotas</p>
                            <p className="text-sm font-bold text-slate-800">{acuerdo.cuotas}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-700 font-bold">Pagadas</p>
                            <p className="text-sm font-bold text-green-600">{acuerdo.cuotasPagadas}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-700 font-bold">Vencidas</p>
                            <p className="text-sm font-bold text-red-600">{acuerdo.cuotasVencidas}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-700 font-bold">Prox. Cuota</p>
                            <p className={`text-sm font-bold ${new Date(acuerdo.proximaCuota) >= new Date() ? 'text-green-600' : 'text-red-600'}`}>
                              {formatearFecha(acuerdo.proximaCuota)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <Handshake className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No hay acuerdos vigentes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panel Inferior - Historial y Acciones */}
            <Card className="shadow-md border-slate-200">
              <CardContent className="p-0">
                <Tabs value={tabInferior} onValueChange={setTabInferior} className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-slate-50 h-auto p-0">
                    <TabsTrigger
                      value="historial"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" />
                      Historial de Gestiones
                    </TabsTrigger>
                    <TabsTrigger
                      value="promesas"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Promesas de Pago
                    </TabsTrigger>
                    <TabsTrigger
                      value="notas"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="historial" className="p-3 mt-0">
                    <div className="text-center py-6 text-slate-500">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">Historial de Gestiones</p>
                      <p className="text-[10px]">Aqui se mostrara el historial completo de gestiones realizadas al cliente</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="promesas" className="p-3 mt-0">
                    <div className="text-center py-6 text-slate-500">
                      <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">Promesas de Pago</p>
                      <p className="text-[10px]">Aqui se mostrara el listado de promesas de pago del cliente</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="notas" className="p-3 mt-0">
                    <div className="text-center py-6 text-slate-500">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">Notas y Comentarios</p>
                      <p className="text-[10px]">Aqui se mostrara el listado de notas y comentarios del cliente</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho - Tabs de Informacion */}
          <div className="flex-none w-[400px]">
            <Card className="shadow-md border-slate-200 h-full">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50 !pb-0.5 pt-2 px-3 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-indigo-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Informacion Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={tabDerecho} onValueChange={setTabDerecho} className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-slate-50 h-auto p-0">
                    <TabsTrigger
                      value="info"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      Info
                    </TabsTrigger>
                    <TabsTrigger
                      value="gestiones"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      Gestiones
                    </TabsTrigger>
                    <TabsTrigger
                      value="documentos"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      Docs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="p-2 mt-0">
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Score Crediticio</p>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold text-indigo-600">720</div>
                            <Badge className="bg-green-100 text-green-800 text-[10px]">Bueno</Badge>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Deuda Total</p>
                          <p className="text-lg font-bold text-red-600">{formatearMoneda(71800000)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Cuentas Activas</p>
                          <p className="text-lg font-bold text-slate-800">5</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="gestiones" className="p-2 mt-0">
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <div className="flex justify-between items-start mb-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {i % 2 === 0 ? 'Telefonica' : 'Email'}
                              </Badge>
                              <span className="text-[10px] text-slate-500">0{i}/03/2026</span>
                            </div>
                            <p className="text-slate-700">Gestion registrada correctamente</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="documentos" className="p-2 mt-0">
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-1.5">
                        {['Contrato', 'Cedula', 'Soporte Ingresos'].map((doc) => (
                          <div
                            key={doc}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>{doc}.pdf</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]">
                              Ver
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edición de Acuerdo */}
      <ModalEdicionAcuerdo
        open={modalEdicionAcuerdoOpen}
        onOpenChange={setModalEdicionAcuerdoOpen}
        acuerdo={acuerdoSeleccionado ? {
          id: acuerdoSeleccionado.id,
          producto: acuerdoSeleccionado.producto,
          identificacion: datosCliente.identificacion,
          nombre: datosCliente.nombre,
          cuenta: acuerdoSeleccionado.producto,
          tipificacion: acuerdoSeleccionado.tipificacion,
          fechaCreacion: acuerdoSeleccionado.fechaCreacion,
          moneda: 'COP',
          deudaTotal: acuerdoSeleccionado.montoTotal,
          cuotas: acuerdoSeleccionado.cuotas,
          montoAcuerdo: acuerdoSeleccionado.montoTotal,
          estado: acuerdoSeleccionado.estado,
        } : null}
      />
    </div>
  );
}