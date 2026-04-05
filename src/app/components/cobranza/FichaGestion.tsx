import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
import { ModalNuevoAcuerdo } from './ModalNuevoAcuerdo';

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

interface HistorialAcuerdo {
  id: string;
  cuenta: string;
  tipo: 'Promesa de Pago' | 'Convenio de Pago';
  tipificacion: string;
  telefono: string;
  montoAcuerdo: number;
  cantidadCuotas: number;
  fechaCreacion: string;
  agente: string;
  estado: 'Cumplido' | 'Incumplido';
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
  const [tabInferiorIzquierdo, setTabInferiorIzquierdo] = useState('gestiones-destacadas');
  const [paginaGestiones, setPaginaGestiones] = useState(1);
  const registrosPorPagina = 10;

  // Estados para filtros de la tabla de gestiones
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTipificacion, setFiltroTipificacion] = useState('');
  const [filtroTelefono, setFiltroTelefono] = useState('');
  const [filtroFechaGestion, setFiltroFechaGestion] = useState('');
  const [filtroAgente, setFiltroAgente] = useState('');

  // Estados para filtros de la tabla de historial acuerdos
  const [filtroHaTipo, setFiltroHaTipo] = useState('');
  const [filtroHaTipificacion, setFiltroHaTipificacion] = useState('');
  const [filtroHaFecha, setFiltroHaFecha] = useState('');
  const [filtroHaAgente, setFiltroHaAgente] = useState('');
  const [filtroHaEstado, setFiltroHaEstado] = useState('');
  const [paginaHistorialAcuerdos, setPaginaHistorialAcuerdos] = useState(1);

  // Estados para el formulario de contacto directo
  const [cdTelefono, setCdTelefono] = useState('');
  const [cdTipificacion, setCdTipificacion] = useState('');
  const [cdRazonNoPago, setCdRazonNoPago] = useState('');
  const [cdComentario, setCdComentario] = useState('');
  const [modalAgendamientoAbierto, setModalAgendamientoAbierto] = useState(false);

  // Estados para el formulario de contacto indirecto
  const [ciTelefono, setCiTelefono] = useState('');
  const [ciTipificacion, setCiTipificacion] = useState('');
  const [ciVinculoCliente, setCiVinculoCliente] = useState('');
  const [ciComentario, setCiComentario] = useState('');
  const [modalAgendamientoIndirectoAbierto, setModalAgendamientoIndirectoAbierto] = useState(false);

  // Estados para el formulario de no contacto
  const [ncTelefono, setNcTelefono] = useState('');
  const [ncTipificacion, setNcTipificacion] = useState('');
  const [ncComentario, setNcComentario] = useState('');

  // Estados para el formulario de agendamiento
  const [agFecha, setAgFecha] = useState('');
  const [agHora, setAgHora] = useState('');
  const [agMotivo, setAgMotivo] = useState<'seguimiento' | 'recordatorio_pago' | 'negociacion'>('seguimiento');
  const [agObservacion, setAgObservacion] = useState('');

  // Tipificaciones para contacto directo
  const tipificacionesContactoDirecto = [
    { id: '1', nombre: 'Cliente confirma pago', muestraRazones: false },
    { id: '2', nombre: 'Promesa de pago', muestraRazones: false },
    { id: '3', nombre: 'Cliente no puede pagar', muestraRazones: true },
    { id: '4', nombre: 'Negativa de pago', muestraRazones: true },
    { id: '5', nombre: 'Solicitud de convenio', muestraRazones: false },
  ];

  // Razones de no pago
  const razonesNoPago = [
    { id: '1', nombre: 'Problemas económicos' },
    { id: '2', nombre: 'Desempleo' },
    { id: '3', nombre: 'Enfermedad familiar' },
    { id: '4', nombre: 'Gastos imprevistos' },
    { id: '5', nombre: 'Olvido de fecha de pago' },
  ];

  // Tipificaciones para contacto indirecto
  const tipificacionesContactoIndirecto = [
    { id: '1', nombre: 'Contacto con familia', muestraVinculos: true },
    { id: '2', nombre: 'Contacto con tercero', muestraVinculos: true },
    { id: '3', nombre: 'Mensaje dejado', muestraVinculos: false },
    { id: '4', nombre: 'Referencia actualizada', muestraVinculos: false },
    { id: '5', nombre: 'Datos de ubicación', muestraVinculos: false },
  ];

  // Vínculos con el cliente - Para familia
  const vinculosFamilia = [
    { id: '1', nombre: 'Padre' },
    { id: '2', nombre: 'Madre' },
    { id: '3', nombre: 'Esposo/a' },
    { id: '4', nombre: 'Hijo/a' },
    { id: '5', nombre: 'Hermano/a' },
    { id: '6', nombre: 'Abuelo/a' },
    { id: '7', nombre: 'Tío/a' },
    { id: '8', nombre: 'Primo/a' },
  ];

  // Vínculos con el cliente - Para tercero
  const vinculosTercero = [
    { id: '1', nombre: 'Compañero de trabajo' },
    { id: '2', nombre: 'Vecino' },
    { id: '3', nombre: 'Amigo' },
    { id: '4', nombre: 'Conocido' },
    { id: '5', nombre: 'Empleador' },
    { id: '6', nombre: 'Representante legal' },
    { id: '7', nombre: 'Otro' },
  ];

  // Tipificaciones para no contacto
  const tipificacionesNoContacto = [
    { id: '1', nombre: 'Número no existe' },
    { id: '2', nombre: 'Número equivocado' },
    { id: '3', nombre: 'Sin respuesta' },
    { id: '4', nombre: 'Buzón de voz' },
    { id: '5', nombre: 'Teléfono apagado' },
    { id: '6', nombre: 'Fuera de servicio' },
    { id: '7', nombre: 'Línea ocupada' },
  ];

  // Datos simulados de gestiones destacadas
  const gestionesDestacadas = [
    {
      id: '1',
      tipo: 'Contacto Directo',
      tipificacion: 'Cliente confirmó pago',
      telefono: '3101234567',
      observacion: 'El cliente confirmó que realizará el pago el día viernes',
      fechaGestion: '2026-03-15 10:30',
      agente: 'Carlos Mendoza',
    },
    {
      id: '2',
      tipo: 'Promesa de Pago',
      tipificacion: 'Promesa registrada',
      telefono: '3209876543',
      observacion: 'Promesa de pago por $500.000 para el 20/03/2026',
      fechaGestion: '2026-03-14 14:45',
      agente: 'Ana García',
    },
    {
      id: '3',
      tipo: 'Contacto Indirecto',
      tipificacion: 'Mensaje con familiar',
      telefono: '3154567890',
      observacion: 'Se dejó mensaje con el esposo del cliente',
      fechaGestion: '2026-03-13 09:15',
      agente: 'Luis Rodríguez',
    },
    {
      id: '4',
      tipo: 'Convenio de Pago',
      tipificacion: 'Acuerdo firmado',
      telefono: '3101234567',
      observacion: 'Se firmó convenio de 6 cuotas de $200.000 cada una',
      fechaGestion: '2026-03-12 16:00',
      agente: 'María López',
    },
    {
      id: '5',
      tipo: 'No Contacto',
      tipificacion: 'Número no existe',
      telefono: '3001112222',
      observacion: 'El número proporcionado no existe o está cancelado',
      fechaGestion: '2026-03-11 11:20',
      agente: 'Pedro Sánchez',
    },
  ];

  // Datos simulados de historial de acuerdos
  const historialAcuerdos = [
    {
      id: '1',
      cuenta: 'TC-001-2024',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-001',
      telefono: '3101234567',
      montoAcuerdo: 1500000,
      cantidadCuotas: 3,
      fechaCreacion: '2026-03-15 10:30',
      agente: 'Carlos Mendoza',
      estado: 'Cumplido',
    },
    {
      id: '2',
      cuenta: 'CP-045-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-002',
      telefono: '3209876543',
      montoAcuerdo: 3000000,
      cantidadCuotas: 6,
      fechaCreacion: '2026-03-12 14:45',
      agente: 'Ana García',
      estado: 'Incumplido',
    },
    {
      id: '3',
      cuenta: 'TC-789-2023',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-003',
      telefono: '3154567890',
      montoAcuerdo: 800000,
      cantidadCuotas: 2,
      fechaCreacion: '2026-03-10 09:15',
      agente: 'Luis Rodríguez',
      estado: 'Cumplido',
    },
    {
      id: '4',
      cuenta: 'CV-123-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-004',
      telefono: '3101234567',
      montoAcuerdo: 5000000,
      cantidadCuotas: 10,
      fechaCreacion: '2026-03-08 16:00',
      agente: 'María López',
      estado: 'Cumplido',
    },
    {
      id: '5',
      cuenta: 'TC-001-2024',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-005',
      telefono: '3001112222',
      montoAcuerdo: 600000,
      cantidadCuotas: 1,
      fechaCreacion: '2026-03-05 11:20',
      agente: 'Pedro Sánchez',
      estado: 'Incumplido',
    },
    {
      id: '6',
      cuenta: 'CP-045-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-006',
      telefono: '3101234567',
      montoAcuerdo: 2500000,
      cantidadCuotas: 5,
      fechaCreacion: '2026-02-28 10:30',
      agente: 'Carlos Mendoza',
      estado: 'Cumplido',
    },
    {
      id: '7',
      cuenta: 'TC-789-2023',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-007',
      telefono: '3209876543',
      montoAcuerdo: 1200000,
      cantidadCuotas: 4,
      fechaCreacion: '2026-02-25 14:15',
      agente: 'Ana García',
      estado: 'Cumplido',
    },
    {
      id: '8',
      cuenta: 'CV-123-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-008',
      telefono: '3154567890',
      montoAcuerdo: 4500000,
      cantidadCuotas: 9,
      fechaCreacion: '2026-02-20 09:00',
      agente: 'Luis Rodríguez',
      estado: 'Incumplido',
    },
    {
      id: '9',
      cuenta: 'TC-001-2024',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-009',
      telefono: '3101234567',
      montoAcuerdo: 900000,
      cantidadCuotas: 3,
      fechaCreacion: '2026-02-15 15:30',
      agente: 'María López',
      estado: 'Cumplido',
    },
    {
      id: '10',
      cuenta: 'CP-045-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-010',
      telefono: '3001112222',
      montoAcuerdo: 3800000,
      cantidadCuotas: 8,
      fechaCreacion: '2026-02-10 11:45',
      agente: 'Pedro Sánchez',
      estado: 'Cumplido',
    },
    {
      id: '11',
      cuenta: 'TC-789-2023',
      tipo: 'Promesa de Pago',
      tipificacion: 'PP-011',
      telefono: '3209876543',
      montoAcuerdo: 700000,
      cantidadCuotas: 2,
      fechaCreacion: '2026-02-05 10:00',
      agente: 'Carlos Mendoza',
      estado: 'Incumplido',
    },
    {
      id: '12',
      cuenta: 'CV-123-2024',
      tipo: 'Convenio de Pago',
      tipificacion: 'CV-012',
      telefono: '3154567890',
      montoAcuerdo: 6000000,
      cantidadCuotas: 12,
      fechaCreacion: '2026-01-30 14:30',
      agente: 'Ana García',
      estado: 'Cumplido',
    },
  ];

  // Función para obtener el color del tipo de gestión
  const getTipoGestionColor = (tipo: string) => {
    switch (tipo) {
      case 'Contacto Directo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Contacto Indirecto':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'No Contacto':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Promesa de Pago':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Convenio de Pago':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Función para obtener el color del estado de acuerdo
  const getEstadoAcuerdoColor = (estado: string) => {
    switch (estado) {
      case 'Cumplido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Incumplido':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Filtrar gestiones
  const gestionesFiltradas = gestionesDestacadas.filter((gestion) => {
    if (filtroTipo && gestion.tipo !== filtroTipo) return false;
    if (filtroTipificacion && !gestion.tipificacion.toLowerCase().includes(filtroTipificacion.toLowerCase())) return false;
    if (filtroTelefono && !gestion.telefono.includes(filtroTelefono)) return false;
    if (filtroFechaGestion && !gestion.fechaGestion.includes(filtroFechaGestion)) return false;
    if (filtroAgente && !gestion.agente.toLowerCase().includes(filtroAgente.toLowerCase())) return false;
    return true;
  });

  // Filtrar historial de acuerdos
  const historialAcuerdosFiltrados = historialAcuerdos.filter((acuerdo) => {
    if (filtroHaTipo && acuerdo.tipo !== filtroHaTipo) return false;
    if (filtroHaTipificacion && !acuerdo.tipificacion.toLowerCase().includes(filtroHaTipificacion.toLowerCase())) return false;
    if (filtroHaFecha && !acuerdo.fechaCreacion.includes(filtroHaFecha)) return false;
    if (filtroHaAgente && !acuerdo.agente.toLowerCase().includes(filtroHaAgente.toLowerCase())) return false;
    if (filtroHaEstado && acuerdo.estado !== filtroHaEstado) return false;
    return true;
  });

  // Paginación gestiones
  const totalPaginas = Math.ceil(gestionesFiltradas.length / registrosPorPagina);
  const gestionesPaginadas = gestionesFiltradas.slice(
    (paginaGestiones - 1) * registrosPorPagina,
    paginaGestiones * registrosPorPagina
  );

  // Paginación historial acuerdos
  const totalPaginasHa = Math.ceil(historialAcuerdosFiltrados.length / registrosPorPagina);
  const historialAcuerdosPaginados = historialAcuerdosFiltrados.slice(
    (paginaHistorialAcuerdos - 1) * registrosPorPagina,
    paginaHistorialAcuerdos * registrosPorPagina
  );

  // Reiniciar página cuando cambian los filtros
  useEffect(() => {
    setPaginaGestiones(1);
  }, [filtroTipo, filtroTipificacion, filtroTelefono, filtroFechaGestion, filtroAgente]);

  useEffect(() => {
    setPaginaHistorialAcuerdos(1);
  }, [filtroHaTipo, filtroHaTipificacion, filtroHaFecha, filtroHaAgente, filtroHaEstado]);
  const [accordionIzquierdo, setAccordionIzquierdo] = useState('contacto');
  const [tieneCliente, setTieneCliente] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [tiempoExcedido, setTiempoExcedido] = useState(false);
  const [asesor, setAsesor] = useState<{ nombre: string; rol: string; dni: string } | null>(null);
  const [modalEdicionAcuerdoOpen, setModalEdicionAcuerdoOpen] = useState(false);
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState<AcuerdoVigente | null>(null);
  const [modalNuevoAcuerdoOpen, setModalNuevoAcuerdoOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Cuenta | null>(null);

  // Función para abrir el modal de nuevo acuerdo
  const handleNuevoAcuerdo = (cuenta: Cuenta) => {
    setCuentaSeleccionada(cuenta);
    setModalNuevoAcuerdoOpen(true);
  };

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
                              onClick={() => handleNuevoAcuerdo(cuenta)}
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

            {/* Panel Inferior - Pestañas de Gestión */}
            <Card className="shadow-md border-slate-200">
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Fila de pestañas superior */}
                  <div className="flex items-center gap-4 px-3 py-2 bg-slate-50 border-b">
                    {/* Pestañas izquierdas - Gestión */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTabInferiorIzquierdo('gestiones-destacadas')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                          tabInferiorIzquierdo === 'gestiones-destacadas'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        Gestiones Destacadas
                      </button>
                      <button
                        onClick={() => setTabInferiorIzquierdo('historial-acuerdos')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                          tabInferiorIzquierdo === 'historial-acuerdos'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        Historial Acuerdos
                      </button>
                    </div>

                    {/* Separador */}
                    <div className="flex-1" />

                    {/* Pestañas derechas - Contacto */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTabInferiorIzquierdo('contacto-directo')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                          tabInferiorIzquierdo === 'contacto-directo'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-green-400 hover:text-green-600'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Contacto Directo
                      </button>
                      <button
                        onClick={() => setTabInferiorIzquierdo('contacto-indirecto')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                          tabInferiorIzquierdo === 'contacto-indirecto'
                            ? 'bg-yellow-400 text-slate-900 border-yellow-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-yellow-400 hover:text-yellow-600'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Contacto Indirecto
                      </button>
                      <button
                        onClick={() => setTabInferiorIzquierdo('no-contacto')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                          tabInferiorIzquierdo === 'no-contacto'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-red-400 hover:text-red-600'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        No Contacto
                      </button>
                    </div>
                  </div>

                  {/* Contenido de las pestañas */}
                  <div className="h-[528px] overflow-y-auto">
                    {/* Contenido pestañas izquierdas */}
                    {tabInferiorIzquierdo === 'gestiones-destacadas' && (
                      <div className="p-2">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-100 hover:bg-slate-100">
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center w-12 py-1">Nro.</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[140px] py-1">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[150px] py-1">Tipificación</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[120px] py-1">Teléfono</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center py-1">Observación</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[130px] py-1">Fecha Gestión</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[130px] py-1">Agente</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm text-center w-12 py-1">Acción</TableHead>
                              </TableRow>
                              {/* Fila de filtros */}
                              <TableRow className="bg-slate-50">
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="w-full h-6 text-xs border border-slate-300 rounded px-1 bg-white"
                                  >
                                    <option value="">Todos</option>
                                    <option value="Contacto Directo">Contacto Directo</option>
                                    <option value="Contacto Indirecto">Contacto Indirecto</option>
                                    <option value="No Contacto">No Contacto</option>
                                    <option value="Promesa de Pago">Promesa de Pago</option>
                                    <option value="Convenio de Pago">Convenio de Pago</option>
                                  </select>
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroTipificacion}
                                    onChange={(e) => setFiltroTipificacion(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroTelefono}
                                    onChange={(e) => setFiltroTelefono(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroFechaGestion}
                                    onChange={(e) => setFiltroFechaGestion(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroAgente}
                                    onChange={(e) => setFiltroAgente(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="p-0.5"></TableCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gestionesPaginadas.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-4 text-slate-500 text-xs">
                                    No hay gestiones destacadas
                                  </TableCell>
                                </TableRow>
                              ) : (
                                gestionesPaginadas.map((gestion, index) => (
                                  <TableRow key={gestion.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="text-xs font-medium border-r border-slate-200 text-center py-1">
                                      {(paginaGestiones - 1) * registrosPorPagina + index + 1}
                                    </TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getTipoGestionColor(gestion.tipo)}`}>
                                        {gestion.tipo}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{gestion.tipificacion}</TableCell>
                                    <TableCell className="text-xs font-mono border-r border-slate-200 text-center py-1">{gestion.telefono}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 py-1">{gestion.observacion}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{gestion.fechaGestion}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{gestion.agente}</TableCell>
                                    <TableCell className="text-center py-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                        title="Ver detalle"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Paginación */}
                        {gestionesFiltradas.length > 0 && (
                          <div className="flex items-center justify-between mt-2 px-1">
                            <p className="text-xs text-slate-500">
                              Mostrando {(paginaGestiones - 1) * registrosPorPagina + 1} - {Math.min(paginaGestiones * registrosPorPagina, gestionesFiltradas.length)} de {gestionesFiltradas.length} registros
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={paginaGestiones === 1}
                                onClick={() => setPaginaGestiones(paginaGestiones - 1)}
                              >
                                Anterior
                              </Button>
                              <span className="text-xs text-slate-600 px-1">
                                Página {paginaGestiones} de {totalPaginas || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={paginaGestiones === totalPaginas || totalPaginas === 0}
                                onClick={() => setPaginaGestiones(paginaGestiones + 1)}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {tabInferiorIzquierdo === 'historial-acuerdos' && (
                      <div className="p-2">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-100 hover:bg-slate-100">
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center w-12 py-1">Nro.</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[120px] py-1">Cuenta</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[140px] py-1">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[100px] py-1">Tipificación</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[110px] py-1">Teléfono</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[120px] py-1">Monto Acuerdo</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center w-20 py-1">Cuotas</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[130px] py-1">Fecha Creación</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[120px] py-1">Agente</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm whitespace-nowrap border-r border-slate-300 text-center min-w-[100px] py-1">Estado</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-sm text-center w-12 py-1">Acción</TableHead>
                              </TableRow>
                              {/* Fila de filtros */}
                              <TableRow className="bg-slate-50">
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <select
                                    value={filtroHaTipo}
                                    onChange={(e) => setFiltroHaTipo(e.target.value)}
                                    className="w-full h-6 text-xs border border-slate-300 rounded px-1 bg-white"
                                  >
                                    <option value="">Todos</option>
                                    <option value="Promesa de Pago">Promesa de Pago</option>
                                    <option value="Convenio de Pago">Convenio de Pago</option>
                                  </select>
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroHaTipificacion}
                                    onChange={(e) => setFiltroHaTipificacion(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5"></TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroHaFecha}
                                    onChange={(e) => setFiltroHaFecha(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <Input
                                    value={filtroHaAgente}
                                    onChange={(e) => setFiltroHaAgente(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-6 text-xs"
                                  />
                                </TableCell>
                                <TableCell className="border-r border-slate-200 p-0.5">
                                  <select
                                    value={filtroHaEstado}
                                    onChange={(e) => setFiltroHaEstado(e.target.value)}
                                    className="w-full h-6 text-xs border border-slate-300 rounded px-1 bg-white"
                                  >
                                    <option value="">Todos</option>
                                    <option value="Cumplido">Cumplido</option>
                                    <option value="Incumplido">Incumplido</option>
                                  </select>
                                </TableCell>
                                <TableCell className="p-0.5"></TableCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {historialAcuerdosPaginados.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={11} className="text-center py-4 text-slate-500 text-xs">
                                    No hay acuerdos en el historial
                                  </TableCell>
                                </TableRow>
                              ) : (
                                historialAcuerdosPaginados.map((acuerdo, index) => (
                                  <TableRow key={acuerdo.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="text-xs font-medium border-r border-slate-200 text-center py-1">
                                      {(paginaHistorialAcuerdos - 1) * registrosPorPagina + index + 1}
                                    </TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{acuerdo.cuenta}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getTipoGestionColor(acuerdo.tipo)}`}>
                                        {acuerdo.tipo}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{acuerdo.tipificacion}</TableCell>
                                    <TableCell className="text-xs font-mono border-r border-slate-200 text-center py-1">{acuerdo.telefono}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center font-semibold py-1">{formatearMoneda(acuerdo.montoAcuerdo)}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{acuerdo.cantidadCuotas}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{acuerdo.fechaCreacion}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">{acuerdo.agente}</TableCell>
                                    <TableCell className="text-xs border-r border-slate-200 text-center py-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getEstadoAcuerdoColor(acuerdo.estado)}`}>
                                        {acuerdo.estado}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center py-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                        title="Ver detalle"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Paginación */}
                        {historialAcuerdosFiltrados.length > 0 && (
                          <div className="flex items-center justify-between mt-2 px-1">
                            <p className="text-xs text-slate-500">
                              Mostrando {(paginaHistorialAcuerdos - 1) * registrosPorPagina + 1} - {Math.min(paginaHistorialAcuerdos * registrosPorPagina, historialAcuerdosFiltrados.length)} de {historialAcuerdosFiltrados.length} registros
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={paginaHistorialAcuerdos === 1}
                                onClick={() => setPaginaHistorialAcuerdos(paginaHistorialAcuerdos - 1)}
                              >
                                Anterior
                              </Button>
                              <span className="text-xs text-slate-600 px-1">
                                Página {paginaHistorialAcuerdos} de {totalPaginasHa || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={paginaHistorialAcuerdos === totalPaginasHa || totalPaginasHa === 0}
                                onClick={() => setPaginaHistorialAcuerdos(paginaHistorialAcuerdos + 1)}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contenido pestañas de contacto */}
                    {tabInferiorIzquierdo === 'contacto-directo' && (
                      <div className="p-4">
                        <div className="space-y-4">
                          {/* Campo Teléfono */}
                          <div className="w-48">
                            <Label className="text-xs font-semibold text-slate-700">Teléfono</Label>
                            <Input
                              value={cdTelefono}
                              onChange={(e) => setCdTelefono(e.target.value)}
                              placeholder="Ingrese teléfono"
                              className="h-8 text-xs mt-1"
                            />
                          </div>

                          {/* Contenedor de Tipificaciones y Razones de No Pago */}
                          <div className="flex justify-between">
                            {/* Tipificaciones */}
                            <div className="w-[500px] border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
                              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Tipificación</Label>
                              <div className="space-y-1">
                                {tipificacionesContactoDirecto.map((tip) => (
                                  <label
                                    key={tip.id}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                      cdTipificacion === tip.nombre
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="tipificacion"
                                      value={tip.nombre}
                                      checked={cdTipificacion === tip.nombre}
                                      onChange={() => {
                                        setCdTipificacion(tip.nombre);
                                        if (!tip.muestraRazones) {
                                          setCdRazonNoPago('');
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-xs font-medium">{tip.nombre}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Razones de No Pago */}
                            <div className={`w-80 border-2 rounded-lg p-3 transition-all flex flex-col h-[240px] ${
                              tipificacionesContactoDirecto.find(t => t.nombre === cdTipificacion)?.muestraRazones
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}>
                              <Label className="text-xs font-semibold text-slate-700 mb-2 block shrink-0">
                                Razón No Pago
                              </Label>
                              {tipificacionesContactoDirecto.find(t => t.nombre === cdTipificacion)?.muestraRazones ? (
                                <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                                  {razonesNoPago.map((razon) => (
                                    <label
                                      key={razon.id}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                        cdRazonNoPago === razon.nombre
                                          ? 'border-red-400 bg-red-100 text-red-800'
                                          : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="razonNoPago"
                                        value={razon.nombre}
                                        checked={cdRazonNoPago === razon.nombre}
                                        onChange={() => setCdRazonNoPago(razon.nombre)}
                                        className="w-3.5 h-3.5 text-red-500 focus:ring-red-500"
                                      />
                                      <span className="text-xs font-medium">{razon.nombre}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center flex-1 text-slate-400">
                                  <span className="text-xs italic">Sin Razon de No Pago</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comentario y Botón Agendamiento */}
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-10">
                              <Label className="text-xs font-semibold text-slate-700">Comentario</Label>
                              <Textarea
                                value={cdComentario}
                                onChange={(e) => setCdComentario(e.target.value)}
                                placeholder="Ingrese el comentario de la gestión realizada..."
                                className="text-xs mt-1 min-h-[80px] resize-none"
                              />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalAgendamientoAbierto(true)}
                                title="Agendamiento"
                                className="h-9 w-9 p-0 flex items-center justify-center border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                              >
                                <Calendar className="w-4 h-4 text-purple-600" />
                              </Button>
                            </div>
                          </div>

                          {/* Botones Guardar y Cancelar */}
                          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCdTelefono('');
                                setCdTipificacion('');
                                setCdRazonNoPago('');
                                setCdComentario('');
                              }}
                              className="h-8 px-4 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                // Validación básica
                                if (!cdTelefono.trim()) {
                                  // toast.error('Ingrese el teléfono');
                                  return;
                                }
                                if (!cdTipificacion) {
                                  // toast.error('Seleccione una tipificación');
                                  return;
                                }
                                if (!cdComentario.trim()) {
                                  // toast.error('Ingrese un comentario');
                                  return;
                                }
                                // Guardar gestión
                                // toast.success('Gestión registrada correctamente');
                                // Limpiar formulario
                                setCdTelefono('');
                                setCdTipificacion('');
                                setCdRazonNoPago('');
                                setCdComentario('');
                              }}
                              className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Guardar Gestión
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal de Agendamiento */}
                    <Dialog open={modalAgendamientoAbierto} onOpenChange={setModalAgendamientoAbierto}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            Nuevo Agendamiento
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            Programe una nueva cita o recordatorio para el cliente
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-3">
                          {/* Fecha */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-700">Fecha</Label>
                              <Input
                                type="date"
                                value={agFecha}
                                onChange={(e) => setAgFecha(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-700">Hora</Label>
                              <Input
                                type="time"
                                value={agHora}
                                onChange={(e) => setAgHora(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          {/* Motivo */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Motivo</Label>
                            <Select value={agMotivo} onValueChange={(value: any) => setAgMotivo(value)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seguimiento">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Seguimiento
                                  </div>
                                </SelectItem>
                                <SelectItem value="recordatorio_pago">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    Recordatorio Pago
                                  </div>
                                </SelectItem>
                                <SelectItem value="negociacion">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Negociación
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Observación */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Observación</Label>
                            <Textarea
                              value={agObservacion}
                              onChange={(e) => setAgObservacion(e.target.value)}
                              placeholder="Ingrese detalles del agendamiento..."
                              className="text-xs min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModalAgendamientoAbierto(false);
                              setAgFecha('');
                              setAgHora('');
                              setAgMotivo('seguimiento');
                              setAgObservacion('');
                            }}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (!agFecha || !agHora) {
                                // toast.error('Complete fecha y hora');
                                return;
                              }
                              // toast.success('Agendamiento registrado');
                              setModalAgendamientoAbierto(false);
                              setAgFecha('');
                              setAgHora('');
                              setAgMotivo('seguimiento');
                              setAgObservacion('');
                            }}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Guardar Agendamiento
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Modal de Agendamiento para Contacto Indirecto */}
                    <Dialog open={modalAgendamientoIndirectoAbierto} onOpenChange={setModalAgendamientoIndirectoAbierto}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            Nuevo Agendamiento - Contacto Indirecto
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            Programe una nueva cita o recordatorio para el contacto
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-3">
                          {/* Fecha */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-700">Fecha</Label>
                              <Input
                                type="date"
                                value={agFecha}
                                onChange={(e) => setAgFecha(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-slate-700">Hora</Label>
                              <Input
                                type="time"
                                value={agHora}
                                onChange={(e) => setAgHora(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          {/* Motivo */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Motivo</Label>
                            <Select value={agMotivo} onValueChange={(value: any) => setAgMotivo(value)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seguimiento">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Seguimiento
                                  </div>
                                </SelectItem>
                                <SelectItem value="recordatorio_pago">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    Recordatorio Pago
                                  </div>
                                </SelectItem>
                                <SelectItem value="negociacion">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Negociación
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Observación */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Observación</Label>
                            <Textarea
                              value={agObservacion}
                              onChange={(e) => setAgObservacion(e.target.value)}
                              placeholder="Ingrese detalles del agendamiento..."
                              className="text-xs min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModalAgendamientoIndirectoAbierto(false);
                              setAgFecha('');
                              setAgHora('');
                              setAgMotivo('seguimiento');
                              setAgObservacion('');
                            }}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (!agFecha || !agHora) {
                                // toast.error('Complete fecha y hora');
                                return;
                              }
                              // toast.success('Agendamiento registrado');
                              setModalAgendamientoIndirectoAbierto(false);
                              setAgFecha('');
                              setAgHora('');
                              setAgMotivo('seguimiento');
                              setAgObservacion('');
                            }}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Guardar Agendamiento
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {tabInferiorIzquierdo === 'contacto-indirecto' && (
                      <div className="p-4">
                        <div className="space-y-4">
                          {/* Campo Teléfono */}
                          <div className="w-48">
                            <Label className="text-xs font-semibold text-slate-700">Teléfono</Label>
                            <Input
                              value={ciTelefono}
                              onChange={(e) => setCiTelefono(e.target.value)}
                              placeholder="Ingrese teléfono"
                              className="h-8 text-xs mt-1"
                            />
                          </div>

                          {/* Contenedor de Tipificaciones y Vínculo con Cliente */}
                          <div className="flex justify-between">
                            {/* Tipificaciones */}
                            <div className="w-[500px] border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
                              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Tipificación</Label>
                              <div className="space-y-1">
                                {tipificacionesContactoIndirecto.map((tip) => (
                                  <label
                                    key={tip.id}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                      ciTipificacion === tip.nombre
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="tipificacionIndirecto"
                                      value={tip.nombre}
                                      checked={ciTipificacion === tip.nombre}
                                      onChange={() => {
                                        setCiTipificacion(tip.nombre);
                                        if (!tip.muestraVinculos) {
                                          setCiVinculoCliente('');
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-yellow-600 focus:ring-yellow-500"
                                    />
                                    <span className="text-xs font-medium">{tip.nombre}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Vínculo con Cliente */}
                            <div className={`w-80 border-2 rounded-lg p-3 transition-all flex flex-col h-[240px] ${
                              tipificacionesContactoIndirecto.find(t => t.nombre === ciTipificacion)?.muestraVinculos
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}>
                              <Label className="text-xs font-semibold text-slate-700 mb-2 block shrink-0">
                                Vínculo con Cliente
                              </Label>
                              {tipificacionesContactoIndirecto.find(t => t.nombre === ciTipificacion)?.muestraVinculos ? (
                                <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                                  {/* Mostrar opciones según la tipificación */}
                                  {ciTipificacion === 'Contacto con familia' && (
                                    <>
                                      {vinculosFamilia.map((vinculo) => (
                                        <label
                                          key={vinculo.id}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                            ciVinculoCliente === vinculo.nombre
                                              ? 'border-amber-400 bg-amber-100 text-amber-800'
                                              : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="vinculoCliente"
                                            value={vinculo.nombre}
                                            checked={ciVinculoCliente === vinculo.nombre}
                                            onChange={() => setCiVinculoCliente(vinculo.nombre)}
                                            className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500"
                                          />
                                          <span className="text-xs font-medium">{vinculo.nombre}</span>
                                        </label>
                                      ))}
                                    </>
                                  )}
                                  {ciTipificacion === 'Contacto con tercero' && (
                                    <>
                                      {vinculosTercero.map((vinculo) => (
                                        <label
                                          key={vinculo.id}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                            ciVinculoCliente === vinculo.nombre
                                              ? 'border-amber-400 bg-amber-100 text-amber-800'
                                              : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="vinculoCliente"
                                            value={vinculo.nombre}
                                            checked={ciVinculoCliente === vinculo.nombre}
                                            onChange={() => setCiVinculoCliente(vinculo.nombre)}
                                            className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500"
                                          />
                                          <span className="text-xs font-medium">{vinculo.nombre}</span>
                                        </label>
                                      ))}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center flex-1 text-slate-400">
                                  <span className="text-xs italic">Sin Vínculo con Cliente</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comentario y Botón Agendamiento */}
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-10">
                              <Label className="text-xs font-semibold text-slate-700">Comentario</Label>
                              <Textarea
                                value={ciComentario}
                                onChange={(e) => setCiComentario(e.target.value)}
                                placeholder="Ingrese el comentario de la gestión realizada..."
                                className="text-xs mt-1 min-h-[80px] resize-none"
                              />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalAgendamientoIndirectoAbierto(true)}
                                title="Agendamiento"
                                className="h-9 w-9 p-0 flex items-center justify-center border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                              >
                                <Calendar className="w-4 h-4 text-purple-600" />
                              </Button>
                            </div>
                          </div>

                          {/* Botones Guardar y Cancelar */}
                          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCiTelefono('');
                                setCiTipificacion('');
                                setCiVinculoCliente('');
                                setCiComentario('');
                              }}
                              className="h-8 px-4 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                // Validación básica
                                if (!ciTelefono.trim()) {
                                  // toast.error('Ingrese el teléfono');
                                  return;
                                }
                                if (!ciTipificacion) {
                                  // toast.error('Seleccione una tipificación');
                                  return;
                                }
                                if (!ciComentario.trim()) {
                                  // toast.error('Ingrese un comentario');
                                  return;
                                }
                                // Guardar gestión
                                // toast.success('Gestión registrada correctamente');
                                // Limpiar formulario
                                setCiTelefono('');
                                setCiTipificacion('');
                                setCiVinculoCliente('');
                                setCiComentario('');
                              }}
                              className="h-8 px-4 text-xs bg-yellow-600 hover:bg-yellow-700"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Guardar Gestión
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {tabInferiorIzquierdo === 'no-contacto' && (
                      <div className="p-4">
                        <div className="space-y-4">
                          {/* Campo Teléfono */}
                          <div className="w-48">
                            <Label className="text-xs font-semibold text-slate-700">Teléfono</Label>
                            <Input
                              value={ncTelefono}
                              onChange={(e) => setNcTelefono(e.target.value)}
                              placeholder="Ingrese teléfono"
                              className="h-8 text-xs mt-1"
                            />
                          </div>

                          {/* Tipificaciones de No Contacto */}
                          <div className="w-[500px] border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
                            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Tipificación</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {tipificacionesNoContacto.map((tip) => (
                                <label
                                  key={tip.id}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${
                                    ncTipificacion === tip.nombre
                                      ? 'border-red-500 bg-red-50 text-red-700'
                                      : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="tipificacionNoContacto"
                                    value={tip.nombre}
                                    checked={ncTipificacion === tip.nombre}
                                    onChange={() => setNcTipificacion(tip.nombre)}
                                    className="w-3.5 h-3.5 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="text-xs font-medium">{tip.nombre}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Comentario */}
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-10">
                              <Label className="text-xs font-semibold text-slate-700">Comentario</Label>
                              <Textarea
                                value={ncComentario}
                                onChange={(e) => setNcComentario(e.target.value)}
                                placeholder="Ingrese el comentario de la gestión realizada..."
                                className="text-xs mt-1 min-h-[80px] resize-none"
                              />
                            </div>
                          </div>

                          {/* Botones Guardar y Cancelar */}
                          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNcTelefono('');
                                setNcTipificacion('');
                                setNcComentario('');
                              }}
                              className="h-8 px-4 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                // Validación básica
                                if (!ncTelefono.trim()) {
                                  // toast.error('Ingrese el teléfono');
                                  return;
                                }
                                if (!ncTipificacion) {
                                  // toast.error('Seleccione una tipificación');
                                  return;
                                }
                                if (!ncComentario.trim()) {
                                  // toast.error('Ingrese un comentario');
                                  return;
                                }
                                // Guardar gestión
                                // toast.success('Gestión registrada correctamente');
                                // Limpiar formulario
                                setNcTelefono('');
                                setNcTipificacion('');
                                setNcComentario('');
                              }}
                              className="h-8 px-4 text-xs bg-red-600 hover:bg-red-700"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Guardar Gestión
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Modal de Nuevo Acuerdo */}
      <ModalNuevoAcuerdo
        open={modalNuevoAcuerdoOpen}
        onOpenChange={setModalNuevoAcuerdoOpen}
        cliente={{
          identificacion: datosCliente.identificacion,
          nombre: datosCliente.nombre,
          cuenta: cuentaSeleccionada?.cuenta || '',
          producto: cuentaSeleccionada?.producto || '',
          moneda: cuentaSeleccionada?.moneda || 'COP',
          montoDeuda: cuentaSeleccionada?.deudaTotal || 0,
          porcentajeDescuento: 0,
          montoCampana: 0,
        }}
        onSave={(data) => {
          console.log('Acuerdo guardado:', data);
          setModalNuevoAcuerdoOpen(false);
        }}
      />
    </div>
  );
}