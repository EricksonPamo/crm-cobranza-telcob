import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, FileText, MessageSquare } from 'lucide-react';

// Tipos de datos
interface Agendamiento {
  id: string;
  fecha: Date;
  hora: string;
  asesor: string;
  identificacionCliente: string;
  nombreCliente: string;
  motivo: 'seguimiento' | 'recordatorio_pago' | 'negociacion';
  observacion: string;
  estado: 'pendiente' | 'completado' | 'cancelado';
}

// Configuración de colores por motivo
const motivoConfig = {
  seguimiento: {
    label: 'Seguimiento',
    color: 'bg-blue-500',
    colorLight: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
  },
  recordatorio_pago: {
    label: 'Recordatorio Pago',
    color: 'bg-amber-500',
    colorLight: 'bg-amber-100 text-amber-800',
    borderColor: 'border-amber-300',
  },
  negociacion: {
    label: 'Negociación',
    color: 'bg-green-500',
    colorLight: 'bg-green-100 text-green-800',
    borderColor: 'border-green-300',
  },
};

// Datos simulados de agendamientos
const agendamientosSimulados: Agendamiento[] = [
  {
    id: '1',
    fecha: new Date(2026, 2, 27, 10, 0),
    hora: '10:00',
    asesor: 'María González',
    identificacionCliente: '1234567890',
    nombreCliente: 'Juan Carlos Pérez García',
    motivo: 'seguimiento',
    observacion: 'Seguimiento a promesa de pago del 20/03/2026',
    estado: 'pendiente',
  },
  {
    id: '2',
    fecha: new Date(2026, 2, 27, 14, 0),
    hora: '14:00',
    asesor: 'Carlos Méndez',
    identificacionCliente: '0987654321',
    nombreCliente: 'María Fernanda López Rodríguez',
    motivo: 'negociacion',
    observacion: 'Negociación de convenio de pago - segunda llamada',
    estado: 'pendiente',
  },
  {
    id: '3',
    fecha: new Date(2026, 2, 28, 9, 0),
    hora: '09:00',
    asesor: 'Ana Martínez',
    identificacionCliente: '5555666677',
    nombreCliente: 'Carlos Alberto Ramírez Santos',
    motivo: 'recordatorio_pago',
    observacion: 'Recordatorio de vencimiento de cuota',
    estado: 'pendiente',
  },
  {
    id: '4',
    fecha: new Date(2026, 2, 28, 11, 0),
    hora: '11:00',
    asesor: 'Pedro Sánchez',
    identificacionCliente: '4567891230',
    nombreCliente: 'Ana Patricia Silva Morales',
    motivo: 'negociacion',
    observacion: 'Reunión para definir plan de pagos',
    estado: 'pendiente',
  },
  {
    id: '5',
    fecha: new Date(2026, 2, 28, 15, 0),
    hora: '15:00',
    asesor: 'María González',
    identificacionCliente: '7788990011',
    nombreCliente: 'Roberto Andrés Vega Núñez',
    motivo: 'seguimiento',
    observacion: 'Verificar estado de promesa de pago',
    estado: 'pendiente',
  },
  {
    id: '6',
    fecha: new Date(2026, 2, 30, 10, 0),
    hora: '10:00',
    asesor: 'Carlos Méndez',
    identificacionCliente: '3344556677',
    nombreCliente: 'Laura Beatriz Castro Díaz',
    motivo: 'recordatorio_pago',
    observacion: 'Recordatorio pago cuota 2 de 4',
    estado: 'pendiente',
  },
  {
    id: '7',
    fecha: new Date(2026, 2, 30, 16, 0),
    hora: '16:00',
    asesor: 'Ana Martínez',
    identificacionCliente: '9988776655',
    nombreCliente: 'Diego Fernando Rojas Paredes',
    motivo: 'negociacion',
    observacion: 'Revisión de propuesta de descuento',
    estado: 'pendiente',
  },
  {
    id: '8',
    fecha: new Date(2026, 2, 31, 9, 0),
    hora: '09:00',
    asesor: 'Pedro Sánchez',
    identificacionCliente: '1122334455',
    nombreCliente: 'Patricia Elena Gutiérrez Herrera',
    motivo: 'seguimiento',
    observacion: 'Confirmación de pago programado',
    estado: 'pendiente',
  },
  {
    id: '9',
    fecha: new Date(2026, 3, 1, 11, 0),
    hora: '11:00',
    asesor: 'María González',
    identificacionCliente: '6677889900',
    nombreCliente: 'Jorge Luis Fernández Salazar',
    motivo: 'negociacion',
    observacion: 'Negociación de convenio especial',
    estado: 'pendiente',
  },
  {
    id: '10',
    fecha: new Date(2026, 3, 2, 14, 0),
    hora: '14:00',
    asesor: 'Carlos Méndez',
    identificacionCliente: '2233445566',
    nombreCliente: 'Sofía Alejandra Moreno Campos',
    motivo: 'recordatorio_pago',
    observacion: 'Recordatorio último día de gracia',
    estado: 'pendiente',
  },
];

export function Agendamiento() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 27)); // Marzo 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAgendamiento, setSelectedAgendamiento] = useState<Agendamiento | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Obtener el mes y año actual
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Obtener días del mes
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener el día de la semana del primer día del mes (0 = domingo)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navegar al mes anterior
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Filtrar agendamientos por fecha
  const getAgendamientosPorFecha = (fecha: Date) => {
    return agendamientosSimulados.filter(a => {
      const aDate = new Date(a.fecha);
      return aDate.toDateString() === fecha.toDateString();
    });
  };

  // Obtener agendamientos del día seleccionado
  const agendamientosDelDia = selectedDate ? getAgendamientosPorFecha(selectedDate) : [];

  // Agendamientos del mes actual (para el calendario)
  const agendamientosDelMes = useMemo(() => {
    return agendamientosSimulados.filter(a => {
      const aDate = new Date(a.fecha);
      return aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear;
    });
  }, [currentMonth, currentYear]);

  // Generar días del calendario
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Verificar si un día tiene agendamientos
  const getAgendamientosForDay = (day: number) => {
    return agendamientosDelMes.filter(a => {
      const aDate = new Date(a.fecha);
      return aDate.getDate() === day;
    });
  };

  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de los días
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Formatear hora
  const formatearHora = (hora: string) => {
    return hora;
  };

  // Abrir modal de detalle
  const abrirDetalle = (agendamiento: Agendamiento) => {
    setSelectedAgendamiento(agendamiento);
    setModalDetalleAbierto(true);
  };

  // Cerrar modal
  const cerrarDetalle = () => {
    setModalDetalleAbierto(false);
    setSelectedAgendamiento(null);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-2">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Agendamiento</h2>
            <p className="text-sm text-gray-500">Gestión de citas y recordatorios</p>
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      <Card className="border-2 border-gray-300">
        <CardContent className="py-1 px-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-medium text-gray-600">Motivos:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-700">Seguimiento</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-700">Recordatorio Pago</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-700">Negociación</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        {/* Calendario */}
        <Card className="lg:col-span-3 border-2 border-gray-300">
          <CardHeader className="p-2 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousMonth}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextMonth}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            {/* Encabezados de días */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-[12px] font-semibold text-gray-600 py-0.5"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-12" />;
                }

                const agendamientos = getAgendamientosForDay(day);
                const isSelected = selectedDate?.getDate() === day &&
                                   selectedDate?.getMonth() === currentMonth &&
                                   selectedDate?.getFullYear() === currentYear;
                const isToday = new Date().getDate() === day &&
                                new Date().getMonth() === currentMonth &&
                                new Date().getFullYear() === currentYear;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    className={`h-12 p-0.5 rounded border transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : isToday
                        ? 'border-purple-300 bg-purple-50/50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-[12px] font-medium ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {agendamientos.slice(0, 3).map((a, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${motivoConfig[a.motivo].color}`}
                        />
                      ))}
                      {agendamientos.length > 3 && (
                        <span className="text-[8px] text-gray-500">+{agendamientos.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel de agendamientos del día */}
        <Card className="border-2 border-gray-300">
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-base">
              {selectedDate
                ? `Agendamientos del ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
                : 'Seleccione un día'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            {selectedDate ? (
              agendamientosDelDia.length > 0 ? (
                <div className="space-y-1">
                  {agendamientosDelDia
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((agendamiento) => (
                      <div
                        key={agendamiento.id}
                        onClick={() => abrirDetalle(agendamiento)}
                        className={`p-1.5 rounded border cursor-pointer transition-colors hover:shadow-md ${
                          motivoConfig[agendamiento.motivo].borderColor
                        } ${
                          agendamiento.estado === 'completado'
                            ? 'bg-gray-50'
                            : agendamiento.estado === 'cancelado'
                            ? 'bg-red-50'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${motivoConfig[agendamiento.motivo].color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-900">
                                {agendamiento.hora}
                              </span>
                              <Badge className={`${motivoConfig[agendamiento.motivo].colorLight} text-[10px] px-1.5 py-0`}>
                                {motivoConfig[agendamiento.motivo].label}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-700 truncate">
                              {agendamiento.nombreCliente}
                            </div>
                            <div className="text-xs text-gray-500">
                              {agendamiento.asesor}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No hay agendamientos para este día
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Seleccione un día del calendario para ver los agendamientos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalle de agendamiento */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Detalle del Agendamiento</DialogTitle>
          </DialogHeader>
          {selectedAgendamiento && (
            <div className="space-y-3">
              {/* Fecha y hora */}
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedAgendamiento.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedAgendamiento.hora}
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Motivo:</span>
                <Badge className={motivoConfig[selectedAgendamiento.motivo].colorLight}>
                  {motivoConfig[selectedAgendamiento.motivo].label}
                </Badge>
              </div>

              {/* Asesor */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-xs text-gray-500">Asesor:</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {selectedAgendamiento.asesor}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">Cliente</div>
                <div className="text-sm font-semibold text-gray-900">
                  {selectedAgendamiento.nombreCliente}
                </div>
                <div className="text-xs text-gray-600">
                  Identificación: {selectedAgendamiento.identificacionCliente}
                </div>
              </div>

              {/* Observación */}
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">Observación</span>
                </div>
                <div className="text-sm text-gray-700">
                  {selectedAgendamiento.observacion}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-7 text-xs"
                  onClick={cerrarDetalle}
                >
                  Cerrar
                </Button>
                <Button
                  className="flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    // TODO: Implementar navegación al formulario de gestión
                    cerrarDetalle();
                  }}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Gestionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}