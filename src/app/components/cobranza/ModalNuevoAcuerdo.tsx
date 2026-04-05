import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Calendar, DollarSign, User, CreditCard, ClipboardList, CheckCircle2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAcuerdos, Acuerdo } from '../../context/AcuerdosContext';

interface ClienteInfo {
  identificacion: string;
  nombre: string;
  cuenta: string;
  producto: string;
  moneda: string;
  montoDeuda: number;
  porcentajeDescuento: number;
  montoCampana: number;
}

interface AcuerdoVigente {
  cuenta: string;
  estado: string;
  tipificacion: string;
  fechaCreacion: string;
}

interface Cuota {
  nro: number | string; // number para cuotas normales, string para 'CI' y 'CB'
  montoCuota: number;
  fechaCuota: string;
}

interface ModalNuevoAcuerdoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: ClienteInfo | null;
  acuerdoVigente?: AcuerdoVigente | null;
  onSave?: (data: any) => void;
}

const tiposAcuerdo = [
  { id: '1', nombre: 'Convenio de Pago' },
  { id: '2', nombre: 'Promesa de Pago' },
];

export function ModalNuevoAcuerdo({ open, onOpenChange, cliente, acuerdoVigente, onSave }: ModalNuevoAcuerdoProps) {
  // Hook del contexto de acuerdos
  const { agregarAcuerdo } = useAcuerdos();

  // Estados del formulario - Generación de Acuerdo de Pago
  const [tipoAcuerdo, setTipoAcuerdo] = useState('');
  const [tipificacion, setTipificacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoNegociado, setMontoNegociado] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [cuotaInicial, setCuotaInicial] = useState('');
  const [cuotaBalon, setCuotaBalon] = useState('');

  // Estados del formulario - otros
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [cuotasGeneradas, setCuotasGeneradas] = useState(false);
  const [comentario, setComentario] = useState('');

  // Estado para diálogo de alerta
  const [alertaAbierto, setAlertaAbierto] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState('');

  // Tipificaciones según tipo de acuerdo
  const tipificacionesPorTipo = tipoAcuerdo === 'Convenio de Pago'
    ? [{ id: '1', nombre: 'Acuerdo por Excepción' }]
    : tipoAcuerdo === 'Promesa de Pago'
    ? [{ id: '1', nombre: 'Acuerdo pago parcial' }]
    : [];

  // Mostrar Cuota Inicial y Cuota Balón solo si tipificación es "Acuerdo por Excepción"
  const mostrarCuotasEspeciales = tipificacion === 'Acuerdo por Excepción';

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setTipoAcuerdo('');
      setTipificacion('');
      setTelefono('');
      setMontoNegociado('');
      setNumeroCuotas('');
      setFechaCompromiso('');
      setCuotaInicial('');
      setCuotaBalon('');
      setCuotas([]);
      setCuotasGeneradas(false);
      setComentario('');
    }
  }, [open]);

  // Resetear tipificación cuando cambia tipo de acuerdo
  useEffect(() => {
    setTipificacion('');
  }, [tipoAcuerdo]);

  // Resetear campos de cuotas cuando cambia tipo de acuerdo o tipificación
  useEffect(() => {
    setMontoNegociado('');
    setNumeroCuotas('');
    setFechaCompromiso('');
    setCuotaInicial('');
    setCuotaBalon('');
    setCuotas([]);
    setCuotasGeneradas(false);
  }, [tipoAcuerdo, tipificacion]);

  // Actualizar cuota
  const handleCuotaChange = (index: number, field: keyof Cuota, value: string | number) => {
    const nuevasCuotas = [...cuotas];
    nuevasCuotas[index] = { ...nuevasCuotas[index], [field]: value };
    setCuotas(nuevasCuotas);
  };

  // Calcular total de cuotas
  const calcularTotalCuotas = () => {
    return cuotas.reduce((total, cuota) => total + (cuota.montoCuota || 0), 0);
  };

  // Formatear moneda
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Formatear número con decimales solo si es necesario
  const formatearNumero = (valor: number) => {
    if (valor % 1 === 0) {
      return valor.toString();
    }
    return valor.toFixed(2);
  };

  // Fecha actual en formato YYYY-MM-DD para limitar inputs de fecha (usando fecha local)
  const obtenerFechaLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const fechaActual = obtenerFechaLocal();

  // Generar cuotas
  const handleGenerar = () => {
    if (!tipoAcuerdo) {
      toast.error('Seleccione un tipo de acuerdo');
      return;
    }
    if (!tipificacion) {
      toast.error('Seleccione una tipificación');
      return;
    }
    if (!montoNegociado || parseFloat(montoNegociado) <= 0) {
      toast.error('El monto negociado debe ser mayor a 0');
      return;
    }
    if (!numeroCuotas || parseInt(numeroCuotas) <= 0) {
      toast.error('El número de cuotas debe ser mayor a 0');
      return;
    }
    if (!fechaCompromiso) {
      toast.error('Ingrese la fecha compromiso');
      return;
    }

    // Validar que cuota inicial y cuota balón no sean negativos
    const cuotaIni = parseFloat(cuotaInicial) || 0;
    const cuotaBal = parseFloat(cuotaBalon) || 0;

    if (cuotaIni < 0) {
      toast.error('La cuota inicial no puede ser negativa');
      return;
    }
    if (cuotaBal < 0) {
      toast.error('La cuota balón no puede ser negativa');
      return;
    }

    const montoTotal = parseFloat(montoNegociado);
    const nCuotas = parseInt(numeroCuotas);

    // Calcular cantidad de cuotas especiales
    const tieneCI = cuotaIni > 0;
    const tieneCB = cuotaBal > 0;
    const cuotasEspeciales = (tieneCI ? 1 : 0) + (tieneCB ? 1 : 0);
    const cuotasNormales = nCuotas - cuotasEspeciales;

    // Calcular monto para cuotas normales
    const montoEspeciales = cuotaIni + cuotaBal;
    const montoRestante = montoTotal - montoEspeciales;
    const montoPorCuotaNormal = cuotasNormales > 0 ? montoRestante / cuotasNormales : 0;

    // Parsear fecha base
    const fechaBase = new Date(fechaCompromiso + 'T00:00:00');

    const nuevasCuotas: Cuota[] = [];
    let cuotaIndex = 0;

    // Agregar Cuota Inicial (CI) si existe
    if (tieneCI) {
      nuevasCuotas.push({
        nro: 'CI',
        montoCuota: cuotaIni,
        fechaCuota: fechaCompromiso
      });
      cuotaIndex++;
    }

    // Agregar cuotas normales
    for (let i = 0; i < cuotasNormales; i++) {
      const fechaCuota = new Date(fechaBase);
      // Si hay CI, las cuotas normales empiezan del siguiente mes
      const mesOffset = tieneCI ? i + 1 : i;
      fechaCuota.setMonth(fechaCuota.getMonth() + mesOffset);
      nuevasCuotas.push({
        nro: tieneCI ? i + 1 : i + 1,
        montoCuota: montoPorCuotaNormal,
        fechaCuota: fechaCuota.toISOString().split('T')[0]
      });
      cuotaIndex++;
    }

    // Agregar Cuota Balón (CB) si existe
    if (tieneCB) {
      const fechaCB = new Date(fechaBase);
      // CB va después de todas las cuotas normales (+1 si hay CI)
      const mesesOffset = tieneCI ? cuotasNormales + 1 : cuotasNormales;
      fechaCB.setMonth(fechaCB.getMonth() + mesesOffset);
      nuevasCuotas.push({
        nro: 'CB',
        montoCuota: cuotaBal,
        fechaCuota: fechaCB.toISOString().split('T')[0]
      });
    }

    setCuotas(nuevasCuotas);
    setCuotasGeneradas(true);
    toast.success('Cuotas generadas correctamente');
  };

  // Manejar envío del formulario
  const handleGuardar = () => {
    // Validaciones
    if (!telefono.trim()) {
      setMensajeAlerta('Debe ingresar un número de teléfono.');
      setAlertaAbierto(true);
      return;
    }
    if (!cuotasGeneradas) {
      setMensajeAlerta('Debe generar las cuotas antes de guardar.');
      setAlertaAbierto(true);
      return;
    }

    // Validar que el total de cuotas sea igual al monto negociado
    const totalCuotas = calcularTotalCuotas();
    const montoNegociadoNum = parseFloat(montoNegociado);
    if (Math.abs(totalCuotas - montoNegociadoNum) > 0.01) {
      setMensajeAlerta(`El total de las cuotas (${formatearMoneda(totalCuotas)}) debe ser igual al monto negociado (${formatearMoneda(montoNegociadoNum)}).`);
      setAlertaAbierto(true);
      return;
    }

    if (!comentario.trim()) {
      setMensajeAlerta('Debe ingresar un comentario.');
      setAlertaAbierto(true);
      return;
    }

    // Determinar el tipo según la tipificación
    const tipoDeterminado: 'pre-acuerdo' | 'acuerdo' = tipificacion === 'Acuerdo por Excepción' ? 'pre-acuerdo' : 'acuerdo';

    // Crear el acuerdo
    const nuevoAcuerdo: Acuerdo = {
      id: `ACU-${Date.now()}`,
      producto: cliente?.producto || '',
      identificacion: cliente?.identificacion || '',
      nombre: cliente?.nombre || '',
      cuenta: cliente?.cuenta || '',
      telefono: telefono,
      tipoAcuerdo: tipoAcuerdo,
      tipificacion: tipificacion,
      montoNegociado: parseFloat(montoNegociado),
      cuotas: parseInt(numeroCuotas),
      fechaCreacion: new Date().toISOString().split('T')[0],
      agente: 'Agente Actual', // Esto debería venir del contexto de usuario
      estado: 'Creado',
      moneda: cliente?.moneda || 'COP',
      deudaTotal: cliente?.montoDeuda || 0,
      fechaCompromiso: fechaCompromiso,
      detalleCuotas: cuotas,
      comentario: comentario,
      tipo: tipoDeterminado,
    };

    // Guardar usando el contexto
    agregarAcuerdo(nuevoAcuerdo);

    if (onSave) {
      onSave(nuevoAcuerdo);
    }

    toast.success(`${tipoDeterminado === 'pre-acuerdo' ? 'Pre-acuerdo' : 'Acuerdo'} guardado correctamente`);
    onOpenChange(false);
  };

  // Determinar el título según la tipificación seleccionada
  const tituloModal = tipificacion === 'Acuerdo por Excepción' ? 'Nuevo Pre-Acuerdo' : 'Nuevo Acuerdo';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[785px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {tipificacion === 'Acuerdo por Excepción' ? (
              <ClipboardList className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            {tituloModal}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Información de la Cuenta */}
          <Card className="border-2 border-sky-400 bg-sky-50">
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-sky-800">Información de la Cuenta</h3>
              </div>
              {/* Primera fila: Identificación y Nombre */}
              <div className="flex gap-4 mb-2">
                <div className="w-48">
                  <Label className="text-xs font-medium text-slate-600">Identificación</Label>
                  <Input
                    value={cliente?.identificacion || '12345678'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
                <div className="w-[230px]">
                  <Label className="text-xs font-medium text-slate-600">Nombre</Label>
                  <Input
                    value={cliente?.nombre || 'JUAN PEREZ GARCIA'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
              </div>
              {/* Segunda fila: Cuenta y Producto */}
              <div className="flex gap-4 mb-2">
                <div className="w-48">
                  <Label className="text-xs font-medium text-slate-600">Cuenta</Label>
                  <Input
                    value={cliente?.cuenta || 'TC-001-2024'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
                <div className="w-[276px]">
                  <Label className="text-xs font-medium text-slate-600">Producto</Label>
                  <Input
                    value={cliente?.producto || 'Tarjeta de Crédito'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
              </div>
              {/* Tercera fila: Moneda, Monto Deuda, % Descuento, Monto Campaña */}
              <div className="flex justify-between">
                <div className="w-24">
                  <Label className="text-xs font-medium text-slate-600">Moneda</Label>
                  <Input
                    value={cliente?.moneda || 'COP'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs font-medium text-slate-600">Monto Deuda</Label>
                  <Input
                    value={formatearMoneda(cliente?.montoDeuda || 2500000)}
                    readOnly
                    className="h-7 text-xs bg-slate-100 font-semibold text-red-600"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs font-medium text-slate-600">% Descuento</Label>
                  <Input
                    value={cliente?.porcentajeDescuento || '0%'}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs font-medium text-slate-600">Monto Campaña</Label>
                  <Input
                    value={formatearMoneda(cliente?.montoCampana || 0)}
                    readOnly
                    className="h-7 text-xs bg-slate-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generación de Acuerdo de Pago */}
          <Card className="border border-violet-300 bg-violet-50">
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-violet-800">Generación de Acuerdo de Pago</h3>
              </div>
              {/* Fila 1: Tipo Acuerdo, Tipificación, Teléfono */}
              <div className="flex justify-between mb-2">
                <div className="w-48">
                  <Label className="text-xs font-medium text-slate-600">Tipo Acuerdo</Label>
                  <Select value={tipoAcuerdo} onValueChange={setTipoAcuerdo}>
                    <SelectTrigger className="!h-7 text-xs">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposAcuerdo.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nombre}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[250px]">
                  <Label className="text-xs font-medium text-slate-600">Tipificación</Label>
                  <Select value={tipificacion} onValueChange={setTipificacion} disabled={!tipoAcuerdo}>
                    <SelectTrigger className="!h-7 text-xs">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipificacionesPorTipo.map((tip) => (
                        <SelectItem key={tip.id} value={tip.nombre}>
                          {tip.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label className="text-xs font-medium text-slate-600">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <Input
                      value={telefono}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setTelefono(value);
                      }}
                      placeholder="Número"
                      className="h-7 text-xs pl-7"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>
              {/* Fila 2: Monto Negociado, Número Cuotas, Fecha Compromiso, Cuota Inicial, Cuota Balón */}
              <div className="flex justify-between mb-2 items-end">
                <div className="w-32">
                  <Label className="text-xs font-medium text-slate-600">Monto Negociado</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      min="1"
                      value={montoNegociado}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setMontoNegociado(value);
                      }}
                      placeholder="0"
                      className="h-7 text-xs pl-6"
                    />
                  </div>
                </div>
                <div className="w-24">
                  <Label className="text-xs font-medium text-slate-600">Nro. Cuotas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={numeroCuotas}
                    onChange={(e) => setNumeroCuotas(e.target.value)}
                    placeholder="0"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="w-36">
                  <Label className="text-xs font-medium text-slate-600">Fecha Compromiso</Label>
                  <Input
                    type="date"
                    min={fechaActual}
                    value={fechaCompromiso}
                    onChange={(e) => setFechaCompromiso(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                {mostrarCuotasEspeciales && (
                  <>
                    <div className="w-32">
                      <Label className="text-xs font-medium text-slate-600">Cuota Inicial</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="0"
                          value={cuotaInicial}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setCuotaInicial(value);
                          }}
                          placeholder="0"
                          className="h-7 text-xs pl-6"
                        />
                      </div>
                    </div>
                    <div className="w-32">
                      <Label className="text-xs font-medium text-slate-600">Cuota Balón</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="0"
                          value={cuotaBalon}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setCuotaBalon(value);
                          }}
                          placeholder="0"
                          className="h-7 text-xs pl-6"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Fila 3: Botón Generar */}
              <div className="flex justify-start">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerar}
                  className="h-7 bg-violet-600 hover:bg-violet-700"
                >
                  Generar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Cuotas */}
          {cuotasGeneradas && (
          <Card className="border border-slate-300">
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-700">Cuotas</h3>
              </div>
              <div className="border border-slate-200 rounded overflow-hidden w-fit">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="text-xs font-semibold text-center w-20 py-1">Cuota</TableHead>
                      <TableHead className="text-xs font-semibold text-center py-1">Fecha Cuota</TableHead>
                      <TableHead className="text-xs font-semibold text-center py-1">Monto Cuota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuotas.map((cuota, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs text-center font-medium py-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            cuota.nro === 'CI' ? 'bg-blue-100 text-blue-800' :
                            cuota.nro === 'CB' ? 'bg-green-100 text-green-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {cuota.nro}
                          </span>
                        </TableCell>
                        <TableCell className="py-0.5">
                          <Input
                            type="date"
                            min={fechaActual}
                            value={cuota.fechaCuota}
                            onChange={(e) => handleCuotaChange(index, 'fechaCuota', e.target.value)}
                            className="h-7 text-xs w-[140px]"
                          />
                        </TableCell>
                        <TableCell className="py-0.5">
                          <div className="relative w-[150px]">
                            <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <Input
                              type="number"
                              step="0.01"
                              value={cuota.montoCuota ? formatearNumero(cuota.montoCuota) : ''}
                              onChange={(e) => handleCuotaChange(index, 'montoCuota', parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs pl-5"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Fila Total */}
                    <TableRow className="bg-slate-50 border-t-2 border-slate-300">
                      <TableCell colSpan={2} className="text-xs font-bold text-right py-1">
                        Total:
                      </TableCell>
                      <TableCell className="py-1">
                        <span className="text-xs font-bold text-slate-800">
                          {formatearMoneda(calcularTotalCuotas())}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}

        {/* Comentario */}
        <Card className="border border-slate-300">
          <CardContent className="pt-2 pb-2 px-3">
            <Label className="text-xs font-semibold text-slate-700 mb-1 block">Comentario</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ingrese observaciones o comentarios..."
              className="text-xs min-h-[60px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7"
          >
            CANCELAR
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleGuardar}
            className="h-7 bg-sky-500 hover:bg-sky-600"
          >
            GUARDAR
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Diálogo de alerta */}
      <Dialog open={alertaAbierto} onOpenChange={setAlertaAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Alerta</DialogTitle>
            <DialogDescription className="pt-2">
              {mensajeAlerta}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setAlertaAbierto(false)}>
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}