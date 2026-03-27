import { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar, Plus, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Acuerdo {
  id: string;
  producto: string;
  identificacion: string;
  nombre: string;
  cuenta: string;
  tipificacion: string;
  fechaCreacion: string;
  moneda?: string;
  deudaTotal?: number;
  cuotas: number;
  montoAcuerdo: number;
  estado: string;
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

interface Reprogramacion {
  nroCuota: string;
  montoCuota: number;
  fechaCompromiso: string;
  pago: number;
  estado: string;
  numeroReprogramacion: number;
  historialPagos: DetallePago[];
}

interface ModalEdicionAcuerdoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acuerdo: Acuerdo | null;
}

export function ModalEdicionAcuerdo({ open, onOpenChange, acuerdo }: ModalEdicionAcuerdoProps) {
  const [estadoAcuerdo, setEstadoAcuerdo] = useState('');
  const [comentarioIncumplimiento, setComentarioIncumplimiento] = useState('');

  // Estados para reprogramación
  const [cuotaReprogramando, setCuotaReprogramando] = useState<string | null>(null);
  const [reprogramacionesTmp, setReprogramacionesTmp] = useState<{ fecha: string; monto: string }[]>([{ fecha: '', monto: '' }]);
  const [montoCuotaOriginal, setMontoCuotaOriginal] = useState<number>(0);
  const [fechaMinReprog, setFechaMinReprog] = useState<string>('');
  const [fechaMaxReprog, setFechaMaxReprog] = useState<string>('');
  const [comentarioReprogramacion, setComentarioReprogramacion] = useState<string>('');

  // Estados para registro de pago
  const [cuotaPagando, setCuotaPagando] = useState<string | null>(null);
  const [montoPago, setMontoPago] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>('');
  const [montoCuotaPago, setMontoCuotaPago] = useState<number>(0);
  const [tipoPagoCuota, setTipoPagoCuota] = useState<'cuota' | 'reprogramacion'>('cuota');
  const [numeroReprogramacionPago, setNumeroReprogramacionPago] = useState<number>(0);

  // Estados para detalle de pagos
  const [cuotaDetallePago, setCuotaDetallePago] = useState<string | null>(null);
  const [tipoDetallePago, setTipoDetallePago] = useState<'cuota' | 'reprogramacion'>('cuota');
  const [numeroReprogramacionDetalle, setNumeroReprogramacionDetalle] = useState<number>(0);

  // Datos de cuotas y reprogramaciones
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [reprogramaciones, setReprogramaciones] = useState<Reprogramacion[]>([]);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!open) {
      setEstadoAcuerdo('');
      setComentarioIncumplimiento('');
      setCuotaReprogramando(null);
      setReprogramacionesTmp([{ fecha: '', monto: '' }]);
      setMontoCuotaOriginal(0);
      setReprogramaciones([]);
      setCuotaPagando(null);
      setMontoPago('');
      setFechaPago('');
    }
  }, [open]);

  // Generar cuotas dinámicamente según el tipo de tipificación
  useEffect(() => {
    if (!acuerdo) {
      setCuotas([]);
      return;
    }

    const esConvenioPago = acuerdo.tipificacion === 'Convenio de Pago';
    const numCuotasTotal = acuerdo.cuotas;
    const montoTotal = acuerdo.montoAcuerdo;
    const fechaBase = new Date(acuerdo.fechaCreacion);
    
    const cuotasGeneradas: Cuota[] = [];

    if (esConvenioPago) {
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
        cuotasGeneradas.push({
          nroCuota: String(i),
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, 34 + ((i - 1) * 30)),
          pago: 0,
          estado: 'Pendiente',
          historialPagos: [],
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
      // Promesa de Pago
      const montoPorCuota = numCuotasTotal > 0 ? montoTotal / numCuotasTotal : 0;
      
      for (let i = 1; i <= numCuotasTotal; i++) {
        cuotasGeneradas.push({
          nroCuota: String(i),
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, i * 30),
          pago: 0,
          estado: 'Pendiente',
          historialPagos: [],
        });
      }
    }

    setCuotas(cuotasGeneradas);
  }, [acuerdo]);

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

  // Verificar si todas las cuotas están pagadas (incluyendo reprogramaciones)
  const todasCuotasPagadas = (): boolean => {
    if (cuotas.length === 0) return false;

    return cuotas.every(cuota => {
      // Si la cuota tiene reprogramaciones, verificar que todas estén pagadas
      const reprogramacionesCuota = reprogramaciones.filter(r => r.nroCuota === cuota.nroCuota);
      if (reprogramacionesCuota.length > 0) {
        return reprogramacionesCuota.every(r => r.estado === 'Pagado');
      }
      // Si no tiene reprogramaciones, verificar que la cuota esté pagada
      return cuota.estado === 'Pagado';
    });
  };

  // Manejar cambio de estado
  const handleEstadoChange = (value: string) => {
    setEstadoAcuerdo(value);
    if (value !== 'Incumplido') {
      setComentarioIncumplimiento('');
    }
  };

  // Funciones para reprogramación
  const handleReprogramarCuota = (cuota: Cuota) => {
    const reprogramacionesExistentes = reprogramaciones.filter(r => r.nroCuota === cuota.nroCuota);
    
    if (reprogramacionesExistentes.length >= 2) {
      toast.error('Esta cuota ya tiene 2 reprogramaciones. No se permiten más reprogramaciones.');
      return;
    }

    setCuotaReprogramando(cuota.nroCuota);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(cuota.montoCuota);

    setFechaMinReprog(cuota.fechaCompromiso);
    
    const [year, month, day] = cuota.fechaCompromiso.split('-');
    const ultimoDiaMes = new Date(parseInt(year), parseInt(month), 0).getDate();
    setFechaMaxReprog(`${year}-${month}-${String(ultimoDiaMes).padStart(2, '0')}`);
  };

  const agregarReprogramacion = () => {
    if (reprogramacionesTmp.length >= 2) {
      toast.error('Solo se permiten máximo 2 reprogramaciones por cuota');
      return;
    }
    setReprogramacionesTmp([...reprogramacionesTmp, { fecha: '', monto: '' }]);
  };

  const actualizarReprogramacionTmp = (index: number, campo: 'fecha' | 'monto', valor: string) => {
    const nuevasReprogramaciones = [...reprogramacionesTmp];
    nuevasReprogramaciones[index][campo] = valor;
    setReprogramacionesTmp(nuevasReprogramaciones);
  };

  const eliminarReprogramacionTmp = (index: number) => {
    if (reprogramacionesTmp.length === 1) {
      toast.error('Debe haber al menos una reprogramación');
      return;
    }
    const nuevasReprogramaciones = reprogramacionesTmp.filter((_, i) => i !== index);
    setReprogramacionesTmp(nuevasReprogramaciones);
  };

  const confirmarReprogramacion = () => {
    if (!cuotaReprogramando) return;

    if (!comentarioReprogramacion.trim()) {
      toast.error('El campo comentario es obligatorio para sustentar la reprogramación');
      return;
    }

    for (let i = 0; i < reprogramacionesTmp.length; i++) {
      if (!reprogramacionesTmp[i].fecha || !reprogramacionesTmp[i].monto) {
        toast.error('Todos los campos de fecha y monto son obligatorios');
        return;
      }
    }

    const sumaMontos = reprogramacionesTmp.reduce((sum, r) => sum + parseFloat(r.monto || '0'), 0);
    if (Math.abs(sumaMontos - montoCuotaOriginal) > 0.01) {
      toast.error(`La suma de los montos (${formatearMoneda(sumaMontos)}) debe coincidir con el monto de la cuota original (${formatearMoneda(montoCuotaOriginal)})`);
      return;
    }

    const nuevasReprogramaciones = reprogramacionesTmp.map((reprog, index) => ({
      nroCuota: cuotaReprogramando,
      montoCuota: parseFloat(reprog.monto),
      fechaCompromiso: reprog.fecha,
      pago: 0,
      estado: 'Pendiente',
      numeroReprogramacion: index + 1,
      historialPagos: [],
    }));

    setReprogramaciones(prev => {
      const filtradas = prev.filter(r => r.nroCuota !== cuotaReprogramando);
      return [...filtradas, ...nuevasReprogramaciones];
    });

    toast.success(`${nuevasReprogramaciones.length} reprogramación(es) registrada(s) correctamente`);
    setCuotaReprogramando(null);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(0);
    setComentarioReprogramacion('');
  };

  const cancelarReprogramacion = () => {
    setCuotaReprogramando(null);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(0);
    setComentarioReprogramacion('');
  };

  // Funciones para registro de pago
  const handleRegistrarPagoCuota = (cuota: Cuota) => {
    setCuotaPagando(cuota.nroCuota);
    setMontoCuotaPago(cuota.montoCuota);
    setMontoPago('');
    setFechaPago('');
    setTipoPagoCuota('cuota');
  };

  const handleRegistrarPagoReprogramacion = (reprog: Reprogramacion) => {
    setCuotaPagando(reprog.nroCuota);
    setMontoCuotaPago(reprog.montoCuota);
    setMontoPago('');
    setFechaPago('');
    setTipoPagoCuota('reprogramacion');
    setNumeroReprogramacionPago(reprog.numeroReprogramacion);
  };

  const confirmarPago = () => {
    if (!cuotaPagando || !montoPago || !fechaPago) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const montoNumerico = parseFloat(montoPago);
    if (montoNumerico > montoCuotaPago) {
      toast.error(`El monto del pago (${formatearMoneda(montoNumerico)}) no puede ser superior al monto de la cuota (${formatearMoneda(montoCuotaPago)})`);
      return;
    }

    const detallePago: DetallePago = {
      nro: tipoPagoCuota === 'cuota' ? parseInt(cuotaPagando) : numeroReprogramacionPago,
      fechaPago: fechaPago,
      monto: montoNumerico,
    };

    if (tipoPagoCuota === 'cuota') {
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
      toast.success('Pago registrado en cuota exitosamente');
    } else {
      // Registrar pago en reprogramación
      setReprogramaciones(prev => prev.map(r => {
        if (r.nroCuota === cuotaPagando && r.numeroReprogramacion === numeroReprogramacionPago) {
          const nuevoPago = r.pago + montoNumerico;
          let nuevoEstado = 'Pendiente';
          
          if (nuevoPago >= r.montoCuota) {
            nuevoEstado = 'Pagado';
          } else if (nuevoPago > 0) {
            nuevoEstado = 'Parcial';
          }

          return { ...r, pago: nuevoPago, estado: nuevoEstado, historialPagos: [...r.historialPagos, detallePago] };
        }
        return r;
      }));

      // Actualizar estado de la cuota si todas las reprogramaciones están pagadas
      const reprogramacionesCuota = reprogramaciones.filter(r => r.nroCuota === cuotaPagando);
      const todasPagadas = reprogramacionesCuota.every(r => {
        if (r.numeroReprogramacion === numeroReprogramacionPago) {
          return (r.pago + montoNumerico) >= r.montoCuota;
        }
        return r.estado === 'Pagado';
      });

      if (todasPagadas && reprogramacionesCuota.length > 0) {
        setCuotas(prev => prev.map(c => {
          if (c.nroCuota === cuotaPagando) {
            return { ...c, estado: 'Pagado' };
          }
          return c;
        }));
      } else {
        // Si hay pago parcial, actualizar estado a 'Parcial'
        const cuotaActual = cuotas.find(c => c.nroCuota === cuotaPagando);
        if (cuotaActual) {
          const totalPagosReprogramaciones = reprogramacionesCuota.reduce((sum, r) => {
            if (r.numeroReprogramacion === numeroReprogramacionPago) {
              return sum + r.pago + montoNumerico;
            }
            return sum + r.pago;
          }, 0);

          const totalPagos = cuotaActual.pago + totalPagosReprogramaciones;

          if (totalPagos > 0 && totalPagos < cuotaActual.montoCuota) {
            setCuotas(prev => prev.map(c => {
              if (c.nroCuota === cuotaPagando) {
                return { ...c, estado: 'Parcial' };
              }
              return c;
            }));
          }
        }
      }

      toast.success('Pago registrado en reprogramación exitosamente');
    }

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
  const handleVerDetallePagosCuota = (cuota: Cuota) => {
    setCuotaDetallePago(cuota.nroCuota);
    setTipoDetallePago('cuota');
  };

  const handleVerDetallePagosReprogramacion = (reprog: Reprogramacion) => {
    setCuotaDetallePago(reprog.nroCuota);
    setTipoDetallePago('reprogramacion');
    setNumeroReprogramacionDetalle(reprog.numeroReprogramacion);
  };

  const cerrarDetallePagos = () => {
    setCuotaDetallePago(null);
  };

  const obtenerHistorialPagos = (): DetallePago[] => {
    if (!cuotaDetallePago) return [];
    
    if (tipoDetallePago === 'cuota') {
      const cuota = cuotas.find(c => c.nroCuota === cuotaDetallePago);
      return cuota?.historialPagos || [];
    } else {
      const reprog = reprogramaciones.find(r => 
        r.nroCuota === cuotaDetallePago && 
        r.numeroReprogramacion === numeroReprogramacionDetalle
      );
      return reprog?.historialPagos || [];
    }
  };

  const handleGuardar = () => {
    toast.success('Acuerdo guardado exitosamente');
    onOpenChange(false);
  };

  if (!acuerdo) return null;

  const contarReprogramaciones = (nroCuota: string) => {
    return reprogramaciones.filter(r => r.nroCuota === nroCuota).length;
  };

  // Calcular el total de pagos de las reprogramaciones de una cuota
  const obtenerPagoReprogramaciones = (nroCuota: string) => {
    const reprogsCuota = reprogramaciones.filter(r => r.nroCuota === nroCuota);
    return reprogsCuota.reduce((sum, r) => sum + r.pago, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-xs max-w-[90vw] w-[860px] max-h-[92vh] overflow-y-auto sm:max-w-[90vw]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Editar Acuerdo</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 px-1">
          {/* Información básica del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Identificación</Label>
              <Input value={acuerdo.identificacion} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-sm font-semibold shrink-0 text-right">Nombre</Label>
              <Input value={acuerdo.nombre} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Producto</Label>
              <Input value={acuerdo.producto} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-sm font-semibold shrink-0 text-right">Moneda</Label>
              <Input value={acuerdo.moneda || 'COP'} readOnly className="bg-gray-100 text-xs h-7 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-32 text-sm font-semibold shrink-0 text-right">Deuda Total</Label>
              <Input value={formatearMoneda(acuerdo.deudaTotal || 12500)} readOnly className="bg-gray-100 text-xs h-7 w-32" />
            </div>
          </div>

          {/* Acuerdo Vigente */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Acuerdo Vigente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm font-semibold shrink-0 text-right">Cuenta</Label>
                <Input value={acuerdo.cuenta} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm font-semibold shrink-0 text-right">Estado</Label>
                <Input value={acuerdo.estado} readOnly className="bg-gray-100 text-xs h-7 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm font-semibold shrink-0 text-right">Tipificación</Label>
                <Input value={acuerdo.tipificacion} readOnly className="bg-gray-100 text-xs h-7 flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-28 text-sm font-semibold shrink-0 text-right">Fecha Creación</Label>
                <Input value={formatearFecha(acuerdo.fechaCreacion)} readOnly className="bg-gray-100 text-xs h-7 w-32" />
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
                  {cuotas.map((cuota, index) => {
                    const numReprogramaciones = contarReprogramaciones(cuota.nroCuota);
                    const tieneReprogramaciones = numReprogramaciones > 0;
                    const pagoReprogramaciones = obtenerPagoReprogramaciones(cuota.nroCuota);
                    const pagoTotal = cuota.pago + pagoReprogramaciones;
                    const saldo = pagoTotal > 0 ? cuota.montoCuota - pagoTotal : 0;
                    const estaPagada = cuota.estado === 'Pagado';

                    // REGLA SECUENCIAL: solo se puede pagar/reprogramar si todas las cuotas anteriores están pagadas
                    const todasAnterioresPagadas = cuotas
                      .slice(0, index)
                      .every(c => c.estado === 'Pagado');
                    const puedeReprogramar = cuota.estado === 'Pendiente' && numReprogramaciones < 2 && !tieneReprogramaciones && todasAnterioresPagadas;
                    const puedeRegistrarPago = cuota.estado === 'Pendiente' && todasAnterioresPagadas;

                    // Colores de estado (badge)
                    const estadoClases = cuota.estado === 'Pagado'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : cuota.estado === 'Parcial'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200';

                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-blue-600 font-semibold text-xs">{cuota.nroCuota}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(cuota.montoCuota)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{formatearFecha(cuota.fechaCompromiso)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(pagoTotal)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(saldo)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${estadoClases}`}>
                            {cuota.estado}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">
                          {tieneReprogramaciones ? (
                            <span className="text-xs font-semibold text-orange-600">Reprogramado</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {estaPagada ? (
                                // Cuota pagada: ver detalle
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerDetallePagosCuota(cuota)}
                                  className="h-7 px-2 text-blue-600 hover:text-blue-800"
                                  title="Ver detalle de pagos"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              ) : todasAnterioresPagadas ? (
                                // Puede actuar: reprogramar y/o pagar
                                <>
                                  {puedeReprogramar && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReprogramarCuota(cuota)}
                                      className="h-7 px-2 text-blue-600 hover:text-blue-800"
                                      title="Reprogramar cuota"
                                    >
                                      <Calendar className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {puedeRegistrarPago && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRegistrarPagoCuota(cuota)}
                                      className="h-7 px-2 text-green-600 hover:text-green-800"
                                      title="Registrar pago"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                // Bloqueada: hay cuotas anteriores sin pagar
                                <span
                                  title="Debe pagar la cuota anterior primero"
                                  className="inline-flex items-center justify-center h-7 px-2 text-gray-400 cursor-not-allowed"
                                >
                                  🔒
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-400 px-1.5 py-1 text-right text-xs font-bold">Total</td>
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

          {/* Modal inline para reprogramación */}
          {cuotaReprogramando && (
            <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-900">
                  Reprogramar Cuota {cuotaReprogramando} - Monto Original: {formatearMoneda(montoCuotaOriginal)}
                </h4>
                {reprogramacionesTmp.length < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={agregarReprogramacion}
                    className="h-7 gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Reprogramación
                  </Button>
                )}
              </div>

              {reprogramacionesTmp.map((reprog, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                  <span className="text-xs font-semibold text-blue-900 w-24">Reprog. {index + 1}:</span>
                  <Label className="text-xs font-semibold shrink-0">Fecha</Label>
                  <Input
                    type="date"
                    value={reprog.fecha}
                    onChange={(e) => actualizarReprogramacionTmp(index, 'fecha', e.target.value)}
                    className="w-40 h-7 text-xs"
                    min={fechaMinReprog}
                    max={fechaMaxReprog}
                  />
                  <Label className="text-xs font-semibold shrink-0">Monto</Label>
                  <Input
                    type="number"
                    value={reprog.monto}
                    onChange={(e) => actualizarReprogramacionTmp(index, 'monto', e.target.value)}
                    className="w-32 h-7 text-xs"
                    placeholder="0"
                  />
                  {reprogramacionesTmp.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarReprogramacionTmp(index)}
                      className="h-7 px-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}

              {/* Campo Comentario para sustentar la reprogramación */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-blue-900">Comentario (Obligatorio)</Label>
                <Textarea
                  value={comentarioReprogramacion}
                  onChange={(e) => setComentarioReprogramacion(e.target.value)}
                  placeholder="Ingrese un comentario para sustentar la reprogramación..."
                  className="min-h-[60px] text-xs bg-white border-blue-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                <span className="text-xs font-semibold text-blue-900">
                  Total Reprogramaciones: {formatearMoneda(reprogramacionesTmp.reduce((sum, r) => sum + parseFloat(r.monto || '0'), 0))}
                </span>
                <div className="flex-1"></div>
                <Button size="sm" onClick={confirmarReprogramacion} className="h-7 px-4 bg-blue-600 hover:bg-blue-700">
                  Confirmar
                </Button>
                <Button size="sm" variant="outline" onClick={cancelarReprogramacion} className="h-7 px-4">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Modal inline para registro de pago */}
          {cuotaPagando && (
            <div className="p-3 bg-green-50 border-2 border-green-300 rounded space-y-3">
              <h4 className="text-sm font-bold text-green-900">
                Registrar Pago - Cuota {cuotaPagando} {tipoPagoCuota === 'reprogramacion' && `(Reprog. ${numeroReprogramacionPago})`} - Monto: {formatearMoneda(montoCuotaPago)}
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
                  Detalle de Pagos - Cuota {cuotaDetallePago} {tipoDetallePago === 'reprogramacion' && `(Reprog. ${numeroReprogramacionDetalle})`}
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
                    {obtenerHistorialPagos().length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-2 py-2 text-center text-gray-500">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      obtenerHistorialPagos().map((pago, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{index + 1}</td>
                          <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{formatearFecha(pago.fechaPago)}</td>
                          <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(pago.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reprogramación Cuota(s) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Reprogramación Cuota(s)</h3>
            <div>
              <table className="w-full border-2 border-gray-400 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Nro Cuota</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Nro Reprog</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Monto Cuota</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Fecha Compromiso</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Pago</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Estado</th>
                    <th className="border border-gray-400 px-2 py-1.5 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {reprogramaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-7 text-xs border border-gray-300 px-2 py-3 text-center text-gray-500 bg-gray-50">
                        No hay reprogramaciones
                      </td>
                    </tr>
                  ) : (
                    reprogramaciones.map((reprog, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-blue-600 font-semibold text-xs">{reprog.nroCuota}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center font-semibold">{reprog.numeroReprogramacion}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(reprog.montoCuota)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{formatearFecha(reprog.fechaCompromiso)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-right text-xs">{formatearMoneda(reprog.pago)}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">{reprog.estado}</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 text-center text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegistrarPagoReprogramacion(reprog)}
                            className="h-7 px-2 text-green-600 hover:text-green-800"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <Label className="text-sm font-semibold shrink-0 mr-1">Estado</Label>
            <Select value={estadoAcuerdo} onValueChange={handleEstadoChange}>
              <SelectTrigger className="w-[30ch] !h-7 !py-1 text-xs bg-gray-50">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incumplido">Incumplido</SelectItem>
                {todasCuotasPagadas() && (
                  <SelectItem value="Cumplido">Cumplido</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Comentario */}
          {(estadoAcuerdo === 'Incumplido' || estadoAcuerdo === 'Cumplido') && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {estadoAcuerdo === 'Incumplido' ? 'Comentario de Incumplimiento' : 'Comentario'}
              </Label>
              <Textarea
                value={comentarioIncumplimiento}
                onChange={(e) => setComentarioIncumplimiento(e.target.value)}
                placeholder={estadoAcuerdo === 'Incumplido' ? 'Ingrese las razones del incumplimiento...' : 'Ingrese un comentario...'}
                className="min-h-[80px] text-sm"
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-300">
            {(estadoAcuerdo === 'Incumplido' || estadoAcuerdo === 'Cumplido') ? (
              <>
                <Button variant="outline" onClick={() => { setEstadoAcuerdo(''); setComentarioIncumplimiento(''); }} className="px-8 !h-7">
                  CANCELAR
                </Button>
                <Button onClick={handleGuardar} className="px-8 bg-blue-600 hover:bg-blue-700 !h-7">
                  GUARDAR
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 !h-7">
                CERRAR
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}