import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DollarSign, FileText } from 'lucide-react';
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
        className="text-xs max-w-[90vw] w-[860px] max-h-[92vh] overflow-y-auto sm:max-w-[90vw]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Editar Cuota - Acuerdo</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 px-1">
          {/* Información básica del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Identificación</Label>
              <Input value={cuota.identificacion} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-sm font-semibold shrink-0 text-right">Nombre</Label>
              <Input value={cuota.nombre} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Producto</Label>
              <Input value={cuota.producto} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-sm font-semibold shrink-0 text-right">Moneda</Label>
              <Input value={cuota.moneda || 'COP'} readOnly className="bg-gray-100 text-xs h-7 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Deuda Total</Label>
              <Input value={formatearMoneda(deudaTotal)} readOnly className="bg-gray-100 text-xs h-7 w-32" />
            </div>
          </div>

          {/* Acuerdo Vigente */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Acuerdo Vigente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm font-semibold shrink-0 text-right">Cuenta</Label>
                <Input value={cuota.cuenta} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm font-semibold shrink-0 text-right">Estado</Label>
                <Input value={cuota.estado} readOnly className="bg-gray-100 text-xs h-7 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm font-semibold shrink-0 text-right">Tipificación</Label>
                <Input value={cuota.tipificacion} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm font-semibold shrink-0 text-right">Monto Acuerdo</Label>
                <Input value={formatearMoneda(montoAcuerdo)} readOnly className="bg-gray-100 text-xs h-7 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm font-semibold shrink-0 text-right">Cuotas</Label>
                <Input value={totalCuotasAcuerdo} readOnly className="bg-gray-100 text-xs h-7 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm font-semibold shrink-0 text-right">Fecha Creación</Label>
                <Input value={formatearFecha(cuota.fechaCreacion || cuota.fechaVencimiento)} readOnly className="bg-gray-100 text-xs h-7 w-32" />
              </div>
            </div>

            {/* Tabla de cuotas */}
            <div className="mt-3">
              <table className="w-full border-2 border-gray-400 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Nro Cuota</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Monto Cuota</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Fecha Compromiso</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Pago</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Saldo</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Estado</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-xs font-semibold">Acción</th>
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
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-blue-600 font-semibold text-xs">{cuotaItem.nroCuota}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(cuotaItem.montoCuota)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{formatearFecha(cuotaItem.fechaCompromiso)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(cuotaItem.pago)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(saldo)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getEstadoClasses(cuotaItem.estado)}`}>
                            {cuotaItem.estado}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">
                          <div className="flex items-center justify-center gap-1">
                            {cuotaItem.estado === 'Pagado' ? (
                              // Cuota pagada: mostrar botón de detalle
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerDetallePagosCuota(cuotaItem)}
                                className="h-7 px-2 text-blue-600 hover:text-blue-800"
                                title="Ver detalle de pagos"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            ) : puedeRegistrarPago ? (
                              // Primera cuota no pagada: habilitada para pago
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRegistrarPagoCuota(cuotaItem)}
                                className="h-7 px-2 text-green-600 hover:text-green-800"
                                title="Registrar pago"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            ) : (
                              // Cuota bloqueada: hay cuotas anteriores sin pagar
                              <span
                                title="Debe pagar la cuota anterior primero"
                                className="inline-flex items-center justify-center h-7 px-2 text-gray-400 cursor-not-allowed"
                              >
                                🔒
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-400 px-2 py-1 text-right">Total</td>
                    <td className="border border-gray-400 px-2 py-1 text-right">{formatearMoneda(calcularTotal())}</td>
                    <td className="border border-gray-400 px-2 py-1"></td>
                    <td className="border border-gray-400 px-2 py-1"></td>
                    <td className="border border-gray-400 px-2 py-1"></td>
                    <td className="border border-gray-400 px-2 py-1"></td>
                    <td className="border border-gray-400 px-2 py-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal inline para registro de pago */}
          {cuotaPagando && (
            <div className="p-3 bg-green-50 border-2 border-green-300 rounded space-y-3">
              <h4 className="text-sm font-bold text-green-900">
                Registrar Pago - Cuota {cuotaPagando} - Saldo Pendiente: {formatearMoneda(montoCuotaPago)}
              </h4>

              <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                <Label className="text-sm font-semibold shrink-0">Monto Pago</Label>
                <Input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="w-40 h-8 text-sm"
                  placeholder="0"
                  max={montoCuotaPago}
                />
                <Label className="text-sm font-semibold shrink-0">Fecha Pago</Label>
                <Input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-40 h-8 text-sm"
                  max={obtenerFechaActual()}
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                <div className="flex-1"></div>
                <Button size="sm" onClick={confirmarPago} className="h-7 px-4 bg-green-600 hover:bg-green-700">
                  Confirmar Pago
                </Button>
                <Button size="sm" variant="outline" onClick={cancelarPago} className="h-7 px-4">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Modal inline para detalle de pagos */}
          {cuotaDetallePago && (
            <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-900">
                  Detalle de Pagos - Cuota {cuotaDetallePago}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cerrarDetallePagos}
                  className="h-7 px-2 text-red-600 hover:text-red-800"
                >
                  ✕
                </Button>
              </div>

              <div className="bg-white rounded border border-blue-200 p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 font-semibold text-center">Nro</th>
                      <th className="border border-gray-300 px-2 py-1 font-semibold text-center">Fecha Pago</th>
                      <th className="border border-gray-300 px-2 py-1 font-semibold text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.filter(c => c.nroCuota === cuotaDetallePago).flatMap(c => c.historialPagos).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-2 py-2 text-center text-gray-500">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      cuotas.filter(c => c.nroCuota === cuotaDetallePago).flatMap(c => c.historialPagos).map((pago, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{formatearFecha(pago.fechaPago)}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">{formatearMoneda(pago.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-2 border-t-2 border-gray-300">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 !h-7">
              CERRAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}