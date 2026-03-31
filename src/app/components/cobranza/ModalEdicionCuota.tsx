import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DollarSign, FileText, User, CreditCard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CuotaData {
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

interface DetallePago {
  nro: number;
  fechaPago: string;
  monto: number;
}

interface Cuota {
  nroCuota: string;
  montoCuota: number;
  fechaCompromiso: string;
  pago: number;
  estado: string;
  historialPagos: DetallePago[];
}

interface ModalEdicionCuotaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuota: CuotaData | null;
}

export function ModalEdicionCuota({ open, onOpenChange, cuota }: ModalEdicionCuotaProps) {
  // Estados para registro de pago
  const [cuotaPagando, setCuotaPagando] = useState<string | null>(null);
  const [montoPago, setMontoPago] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>('');
  const [montoCuotaPago, setMontoCuotaPago] = useState<number>(0);

  // Estados para detalle de pagos
  const [cuotaDetallePago, setCuotaDetallePago] = useState<string | null>(null);

  // Datos de cuotas del acuerdo
  const [cuotas, setCuotas] = useState<Cuota[]>([]);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!open) {
      setCuotaPagando(null);
      setMontoPago('');
      setFechaPago('');
      setCuotaDetallePago(null);
      setCuotas([]);
    }
  }, [open]);

  // Generar cuotas basándose en los datos reales del registro seleccionado
  useEffect(() => {
    if (!cuota) {
      setCuotas([]);
      return;
    }

    const esConvenioPago = cuota.tipificacion === 'Convenio de Pago';
    const numCuotasTotal = cuota.totalCuotas || 1;
    const montoTotal = cuota.montoAcuerdo || (cuota.monto * numCuotasTotal);
    // Usar fechaCreacion si existe, si no usar fechaVencimiento como base
    const fechaBaseStr = cuota.fechaCreacion || cuota.fechaVencimiento;
    const fechaBase = new Date(fechaBaseStr);

    const cuotasGeneradas: Cuota[] = [];

    if (esConvenioPago) {
      // Convenio de Pago: CI, cuotas intermedias, CB
      const cuotasIntermedias = numCuotasTotal - 2;
      const montoPorCuota = numCuotasTotal > 0 ? montoTotal / numCuotasTotal : 0;

      // Cuota Inicial (CI)
      cuotasGeneradas.push({
        nroCuota: 'CI',
        montoCuota: montoPorCuota,
        fechaCompromiso: agregarDias(fechaBase, 0),
        pago: 0,
        estado: 'Pendiente',
        historialPagos: [],
      });

      // Cuotas numeradas intermedias
      for (let i = 1; i <= cuotasIntermedias; i++) {
        const nroCuotaStr = String(i);
        const esCuotaActual = nroCuotaStr === String(cuota.cuota);

        cuotasGeneradas.push({
          nroCuota: nroCuotaStr,
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, 34 + ((i - 1) * 30)),
          pago: esCuotaActual ? (cuota.estado === 'Pagado' ? montoPorCuota : cuota.estado === 'Parcial' ? montoPorCuota * 0.5 : 0) : 0,
          estado: esCuotaActual ? cuota.estado : 'Pendiente',
          historialPagos: esCuotaActual && cuota.estado !== 'Pendiente'
            ? [{ nro: 1, fechaPago: agregarDias(fechaBase, 34 + ((i - 1) * 30) - 5), monto: cuota.estado === 'Pagado' ? montoPorCuota : montoPorCuota * 0.5 }]
            : [],
        });
      }

      // Cuota de Cierre (CB)
      cuotasGeneradas.push({
        nroCuota: 'CB',
        montoCuota: montoPorCuota,
        fechaCompromiso: agregarDias(fechaBase, 34 + (cuotasIntermedias * 30)),
        pago: 0,
        estado: 'Pendiente',
        historialPagos: [],
      });
    } else {
      // Promesa de Pago: cuotas numeradas del 1 al N
      const montoPorCuota = numCuotasTotal > 0 ? montoTotal / numCuotasTotal : 0;

      for (let i = 1; i <= numCuotasTotal; i++) {
        const nroCuotaStr = String(i);
        const esCuotaActual = nroCuotaStr === String(cuota.cuota);

        cuotasGeneradas.push({
          nroCuota: nroCuotaStr,
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, i * 30),
          pago: esCuotaActual ? (cuota.estado === 'Pagado' ? montoPorCuota : cuota.estado === 'Parcial' ? montoPorCuota * 0.5 : 0) : 0,
          estado: esCuotaActual ? cuota.estado : 'Pendiente',
          historialPagos: esCuotaActual && cuota.estado !== 'Pendiente'
            ? [{ nro: 1, fechaPago: agregarDias(fechaBase, i * 30 - 5), monto: cuota.estado === 'Pagado' ? montoPorCuota : montoPorCuota * 0.5 }]
            : [],
        });
      }
    }

    setCuotas(cuotasGeneradas);
  }, [cuota]);

  // Función auxiliar para agregar días a una fecha
  function agregarDias(fecha: Date, dias: number): string {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    const year = nuevaFecha.getFullYear();
    const month = String(nuevaFecha.getMonth() + 1).padStart(2, '0');
    const day = String(nuevaFecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: string) => {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const obtenerFechaActual = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calcularTotal = () => {
    return cuotas.reduce((sum, cuota) => sum + cuota.montoCuota, 0);
  };

  // Obtener clase CSS para el estado
  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Parcial':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Pendiente':
      default:
        return 'bg-red-100 text-red-800 border border-red-200';
    }
  };

  // Funciones para registro de pago
  const handleRegistrarPagoCuota = (cuotaItem: Cuota) => {
    setCuotaPagando(cuotaItem.nroCuota);
    setMontoCuotaPago(cuotaItem.montoCuota - cuotaItem.pago);
    setMontoPago('');
    setFechaPago('');
  };

  const confirmarPago = () => {
    if (!cuotaPagando || !montoPago || !fechaPago) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const montoNumerico = parseFloat(montoPago);

    if (montoNumerico > montoCuotaPago) {
      toast.error(`El monto del pago (${formatearMoneda(montoNumerico)}) no puede ser superior al saldo pendiente (${formatearMoneda(montoCuotaPago)})`);
      return;
    }

    const detallePago: DetallePago = {
      nro: 1,
      fechaPago: fechaPago,
      monto: montoNumerico,
    };

    // Registrar pago en cuota
    setCuotas(prev => prev.map(c => {
      if (c.nroCuota === cuotaPagando) {
        const nuevoPago = c.pago + montoNumerico;
        let nuevoEstado = 'Pendiente';

        if (nuevoPago >= c.montoCuota) {
          nuevoEstado = 'Pagado';
        } else if (nuevoPago > 0) {
          nuevoEstado = 'Parcial';
        }

        return { ...c, pago: nuevoPago, estado: nuevoEstado, historialPagos: [...c.historialPagos, detallePago] };
      }
      return c;
    }));

    toast.success('Pago registrado exitosamente');
    setCuotaPagando(null);
    setMontoPago('');
    setFechaPago('');
  };

  const cancelarPago = () => {
    setCuotaPagando(null);
    setMontoPago('');
    setFechaPago('');
  };

  // Funciones para detalle de pagos
  const handleVerDetallePagosCuota = (cuotaItem: Cuota) => {
    setCuotaDetallePago(cuotaItem.nroCuota);
  };

  const cerrarDetallePagos = () => {
    setCuotaDetallePago(null);
  };

  const obtenerHistorialPagos = (cuotaItem: Cuota): DetallePago[] => {
    return cuotaItem.historialPagos || [];
  };

  if (!cuota) return null;

  // Calcular monto del acuerdo basándose en los datos reales del acuerdo
  // montoAcuerdo viene directamente del campo del registro (garantizado = monto * totalCuotas)
  const totalCuotasAcuerdo = cuota.totalCuotas || 1;
  const montoAcuerdo = cuota.montoAcuerdo || (cuota.monto * totalCuotasAcuerdo);
  const deudaTotal = cuota.deudaTotal || montoAcuerdo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-xs max-w-[90vw] w-[860px] max-h-[92vh] overflow-y-auto sm:max-w-[90vw] bg-gradient-to-br from-slate-50 to-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
          <DialogTitle className="text-lg font-bold text-slate-700">Editar Cuota - Acuerdo</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 px-1">
          {/* Información básica del cliente */}
          <div className="bg-sky-50 rounded-lg p-2 border-2 border-sky-300">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-600">Información del Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Identificación</Label>
                <Input value={cuota.identificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Nombre</Label>
                <Input value={cuota.nombre} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Producto</Label>
                <Input value={cuota.producto} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Moneda</Label>
                <Input value={cuota.moneda || 'COP'} readOnly className="bg-white border-slate-200 text-xs h-7 w-24 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Deuda Total</Label>
                <Input value={formatearMoneda(deudaTotal)} readOnly className="bg-emerald-50 border-emerald-200 text-xs h-7 w-32 font-semibold text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Acuerdo Vigente */}
          <div className="bg-violet-50 rounded-lg p-2 border-2 border-violet-300">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-600">Acuerdo Vigente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Cuenta</Label>
                <Input value={cuota.cuenta} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Estado</Label>
                <div className="flex-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600 border border-emerald-200">
                    {cuota.estado}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Tipificación</Label>
                <Input value={cuota.tipificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Monto Acuerdo</Label>
                <Input value={formatearMoneda(montoAcuerdo)} readOnly className="bg-white border-slate-200 text-xs h-7 w-32 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Cuotas</Label>
                <Input value={totalCuotasAcuerdo} readOnly className="bg-white border-slate-200 text-xs h-7 w-20 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Fecha Creación</Label>
                <Input value={formatearFecha(cuota.fechaCreacion || cuota.fechaVencimiento)} readOnly className="bg-white border-slate-200 text-xs h-7 w-32 font-medium text-slate-600" />
              </div>
            </div>

            {/* Tabla de cuotas */}
            <div className="mt-2">
              <div className="bg-white rounded-lg border-2 border-violet-300 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-violet-100 text-violet-700">
                      <th className="px-2 py-1 font-semibold text-center">Nro Cuota</th>
                      <th className="px-2 py-1 font-semibold text-right">Monto Cuota</th>
                      <th className="px-2 py-1 font-semibold text-center">Fecha Compromiso</th>
                      <th className="px-2 py-1 font-semibold text-right">Pago</th>
                      <th className="px-2 py-1 font-semibold text-right">Saldo</th>
                      <th className="px-2 py-1 font-semibold text-center">Estado</th>
                      <th className="px-2 py-1 font-semibold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.map((cuotaItem, index) => {
                      const saldo = cuotaItem.montoCuota - cuotaItem.pago;
                      // REGLA SECUENCIAL: solo se puede pagar si todas las cuotas anteriores están pagadas
                      const todasAnterioresPagadas = cuotas
                        .slice(0, index)
                        .every(c => c.estado === 'Pagado');
                      const puedeRegistrarPago = cuotaItem.estado !== 'Pagado' && todasAnterioresPagadas;

                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-violet-50' : 'bg-violet-50/50 hover:bg-violet-50'}>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-5 rounded-md bg-sky-100 text-sky-600 text-xs font-semibold">
                              {cuotaItem.nroCuota}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-slate-600">{formatearMoneda(cuotaItem.montoCuota)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center text-slate-500">{formatearFecha(cuotaItem.fechaCompromiso)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-emerald-500">{formatearMoneda(cuotaItem.pago)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-orange-400">{formatearMoneda(saldo)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoClasses(cuotaItem.estado)}`}>
                              {cuotaItem.estado === 'Pagado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {cuotaItem.estado === 'Parcial' && <Clock className="w-3 h-3 mr-1" />}
                              {cuotaItem.estado === 'Pendiente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {cuotaItem.estado}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {cuotaItem.estado === 'Pagado' ? (
                                // Cuota pagada: ver detalle
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerDetallePagosCuota(cuotaItem)}
                                  className="h-6 px-1.5 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                                  title="Ver detalle de pagos"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                              ) : puedeRegistrarPago ? (
                                // Primera cuota no pagada: habilitada para pago
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRegistrarPagoCuota(cuotaItem)}
                                  className="h-6 px-1.5 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50"
                                  title="Registrar pago"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                // Cuota bloqueada: hay cuotas anteriores sin pagar
                                <span
                                  title="Debe pagar la cuota anterior primero"
                                  className="inline-flex items-center justify-center h-6 px-2 text-slate-300 cursor-not-allowed"
                                >
                                  🔒
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right text-xs font-bold text-slate-600">Total</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right font-bold text-slate-700">{formatearMoneda(calcularTotal())}</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1" colSpan={5}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal inline para registro de pago */}
          {cuotaPagando && (
            <div className="p-2 bg-violet-50 border-2 border-violet-300 rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-violet-400" />
                Registrar Pago - Cuota {cuotaPagando} - Monto:
                <span className="text-violet-500">{formatearMoneda(montoCuotaPago)}</span>
              </h4>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-violet-200">
                <Label className="text-xs font-medium shrink-0 text-slate-500">Monto Pago</Label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-violet-400 font-medium text-xs">$</span>
                  <Input
                    type="number"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    className="w-28 h-7 text-xs pl-4 border-slate-200 focus:border-violet-300"
                    placeholder="0"
                    max={montoCuotaPago}
                  />
                </div>
                <Label className="text-xs font-medium shrink-0 text-slate-500">Fecha Pago</Label>
                <Input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-32 h-7 text-xs border-slate-200 focus:border-violet-300"
                  max={obtenerFechaActual()}
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-violet-200">
                <div className="flex-1"></div>
                <Button size="sm" onClick={confirmarPago} className="h-7 px-4 bg-violet-100 hover:bg-violet-200 text-violet-600">
                  Confirmar Pago
                </Button>
                <Button size="sm" variant="outline" onClick={cancelarPago} className="h-7 px-4 border-slate-200 text-slate-500">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Modal inline para detalle de pagos */}
          {cuotaDetallePago && (
            <div className="p-2 bg-sky-50 border-2 border-sky-300 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Detalle de Pagos - Cuota {cuotaDetallePago}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cerrarDetallePagos}
                  className="h-6 px-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50"
                >
                  ✕
                </Button>
              </div>

              <div className="bg-white rounded-lg border-2 border-sky-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-sky-100">
                      <th className="border-b border-sky-100 px-2 py-1 font-medium text-center text-slate-600">Nro</th>
                      <th className="border-b border-sky-100 px-2 py-1 font-medium text-center text-slate-600">Fecha Pago</th>
                      <th className="border-b border-sky-100 px-2 py-1 font-medium text-right text-slate-600">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.filter(c => c.nroCuota === cuotaDetallePago).flatMap(c => c.historialPagos).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border-b border-sky-50 px-2 py-3 text-center text-slate-400 bg-sky-50/50">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      cuotas.filter(c => c.nroCuota === cuotaDetallePago).flatMap(c => c.historialPagos).map((pago, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-sky-50' : 'bg-sky-50/50 hover:bg-sky-50'}>
                          <td className="border-b border-sky-50 px-2 py-1 text-center font-medium text-sky-500">{index + 1}</td>
                          <td className="border-b border-sky-50 px-2 py-1 text-center text-slate-500">{formatearFecha(pago.fechaPago)}</td>
                          <td className="border-b border-sky-50 px-2 py-1 text-right font-medium text-emerald-500">{formatearMoneda(pago.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button onClick={() => onOpenChange(false)} className="px-6 h-7 bg-black text-white hover:bg-gray-800">
              CERRAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}