import { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar, Plus, DollarSign, FileText, User, CreditCard, ClipboardList, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
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
        className="text-xs max-w-[90vw] w-[900px] max-h-[92vh] overflow-y-auto sm:max-w-[90vw] bg-gradient-to-br from-slate-50 to-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
          <DialogTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            Editar Acuerdo
          </DialogTitle>
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
                <Input value={acuerdo.identificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Nombre</Label>
                <Input value={acuerdo.nombre} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Producto</Label>
                <Input value={acuerdo.producto} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Moneda</Label>
                <Input value={acuerdo.moneda || 'COP'} readOnly className="bg-white border-slate-200 text-xs h-7 w-24 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Deuda Total</Label>
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 font-medium text-xs">$</span>
                  <Input value={formatearMoneda(acuerdo.deudaTotal || 12500)} readOnly className="bg-emerald-50 border-emerald-200 text-xs h-7 pl-5 font-semibold text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Acuerdo Vigente */}
          <div className="bg-violet-50 rounded-lg p-2 border-2 border-violet-300">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-600">Acuerdo Vigente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Cuenta</Label>
                <Input value={acuerdo.cuenta} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Estado</Label>
                <div className="flex-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600 border border-emerald-200">
                    {acuerdo.estado}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Tipificación</Label>
                <Input value={acuerdo.tipificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Fecha Creación</Label>
                <Input value={formatearFecha(acuerdo.fechaCreacion)} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
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
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : cuota.estado === 'Parcial'
                          ? 'bg-amber-100 text-amber-600 border border-amber-200'
                          : 'bg-rose-100 text-rose-500 border border-rose-200';

                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-violet-50' : 'bg-violet-50/50 hover:bg-violet-50'}>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-5 rounded-md bg-sky-100 text-sky-600 text-xs font-semibold">
                              {cuota.nroCuota}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-slate-600">{formatearMoneda(cuota.montoCuota)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center text-slate-500">{formatearFecha(cuota.fechaCompromiso)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-emerald-500">{formatearMoneda(pagoTotal)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-orange-400">{formatearMoneda(saldo)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoClases}`}>
                              {cuota.estado === 'Pagado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {cuota.estado === 'Parcial' && <Clock className="w-3 h-3 mr-1" />}
                              {cuota.estado === 'Pendiente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {cuota.estado}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            {tieneReprogramaciones ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-600 border border-amber-200">
                                <Calendar className="w-3 h-3 mr-1" />
                                Reprogramado
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {estaPagada ? (
                                  // Cuota pagada: ver detalle
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerDetallePagosCuota(cuota)}
                                    className="h-6 px-1.5 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                                    title="Ver detalle de pagos"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </Button>
                                ) : todasAnterioresPagadas ? (
                                  // Puede actuar: reprogramar y/o pagar
                                  <>
                                    {puedeReprogramar && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReprogramarCuota(cuota)}
                                        className="h-6 px-1.5 text-violet-400 hover:text-violet-500 hover:bg-violet-50"
                                        title="Reprogramar cuota"
                                      >
                                        <Calendar className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    {puedeRegistrarPago && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRegistrarPagoCuota(cuota)}
                                        className="h-6 px-1.5 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50"
                                        title="Registrar pago"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  // Bloqueada: hay cuotas anteriores sin pagar
                                  <span
                                    title="Debe pagar la cuota anterior primero"
                                    className="inline-flex items-center justify-center h-6 px-2 text-slate-300 cursor-not-allowed"
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
                    <tr className="bg-slate-50 font-bold">
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right text-xs font-bold text-slate-600" colSpan={1}>Total</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right font-bold text-slate-700">{formatearMoneda(calcularTotal())}</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1" colSpan={5}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal inline para reprogramación */}
          {cuotaReprogramando && (
            <div className="p-2 bg-violet-50 border-2 border-violet-300 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  Reprogramar Cuota {cuotaReprogramando} - Monto Original:
                  <span className="text-violet-500">{formatearMoneda(montoCuotaOriginal)}</span>
                </h4>
                {reprogramacionesTmp.length < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={agregarReprogramacion}
                    className="h-6 gap-1 text-xs border-violet-200 text-violet-500 hover:bg-violet-100"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </Button>
                )}
              </div>

              {reprogramacionesTmp.map((reprog, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-violet-200">
                  <span className="text-xs font-medium text-violet-500 w-16 px-2 py-0.5 bg-violet-50 rounded">Reprog. {index + 1}</span>
                  <Label className="text-xs font-medium shrink-0 text-slate-500">Fecha</Label>
                  <Input
                    type="date"
                    value={reprog.fecha}
                    onChange={(e) => actualizarReprogramacionTmp(index, 'fecha', e.target.value)}
                    className="w-32 h-7 text-xs border-slate-200 focus:border-violet-300"
                    min={fechaMinReprog}
                    max={fechaMaxReprog}
                  />
                  <Label className="text-xs font-medium shrink-0 text-slate-500">Monto</Label>
                  <Input
                    type="number"
                    value={reprog.monto}
                    onChange={(e) => actualizarReprogramacionTmp(index, 'monto', e.target.value)}
                    className="w-24 h-7 text-xs border-slate-200 focus:border-violet-300"
                    placeholder="0"
                  />
                  {reprogramacionesTmp.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarReprogramacionTmp(index)}
                      className="h-6 px-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}

              {/* Campo Comentario para sustentar la reprogramación */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Comentario (Obligatorio)</Label>
                <Textarea
                  value={comentarioReprogramacion}
                  onChange={(e) => setComentarioReprogramacion(e.target.value)}
                  placeholder="Ingrese un comentario para sustentar la reprogramación..."
                  className="min-h-[50px] text-xs bg-white border-slate-200 focus:border-violet-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-violet-200">
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Total: {formatearMoneda(reprogramacionesTmp.reduce((sum, r) => sum + parseFloat(r.monto || '0'), 0))}
                </span>
                <div className="flex-1"></div>
                <Button size="sm" onClick={confirmarReprogramacion} className="h-7 px-4 bg-violet-100 hover:bg-violet-200 text-violet-600">
                  Confirmar
                </Button>
                <Button size="sm" variant="outline" onClick={cancelarReprogramacion} className="h-7 px-4 border-slate-200 text-slate-500">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Modal inline para registro de pago */}
          {cuotaPagando && (
            <div className="p-2 bg-violet-50 border-2 border-violet-300 rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-violet-400" />
                Registrar Pago - Cuota {cuotaPagando} {tipoPagoCuota === 'reprogramacion' && `(Reprog. ${numeroReprogramacionPago})`} - Monto:
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
                  Detalle de Pagos - Cuota {cuotaDetallePago} {tipoDetallePago === 'reprogramacion' && `(Reprog. ${numeroReprogramacionDetalle})`}
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
                    {obtenerHistorialPagos().length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border-b border-sky-50 px-2 py-3 text-center text-slate-400 bg-sky-50/50">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      obtenerHistorialPagos().map((pago, index) => (
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

          {/* Reprogramación Cuota(s) */}
          <div className="bg-slate-200 rounded-lg p-2 border-2 border-slate-400">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-700">Reprogramación Cuota(s)</h3>
            </div>
            <div className="bg-white rounded-lg border-2 border-slate-300 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-300 text-slate-800">
                    <th className="px-2 py-1 font-medium text-center">Nro Cuota</th>
                    <th className="px-2 py-1 font-medium text-center">Nro Reprog</th>
                    <th className="px-2 py-1 font-medium text-right">Monto Cuota</th>
                    <th className="px-2 py-1 font-medium text-center">Fecha Compromiso</th>
                    <th className="px-2 py-1 font-medium text-right">Pago</th>
                    <th className="px-2 py-1 font-medium text-center">Estado</th>
                    <th className="px-2 py-1 font-medium text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {reprogramaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-8 text-xs border border-slate-200 px-2 py-2 text-center text-slate-500 bg-slate-100/30">
                        No hay reprogramaciones registradas
                      </td>
                    </tr>
                  ) : (
                    reprogramaciones.map((reprog, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-100/50 hover:bg-slate-100'}>
                        <td className="border-t border-slate-200 px-2 py-1 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-5 rounded-md bg-sky-100 text-sky-600 text-xs font-medium">
                            {reprog.nroCuota}
                          </span>
                        </td>
                        <td className="border-t border-slate-200 px-2 py-1 text-center font-medium text-slate-600">{reprog.numeroReprogramacion}</td>
                        <td className="border-t border-slate-200 px-2 py-1 text-right font-medium text-slate-600">{formatearMoneda(reprog.montoCuota)}</td>
                        <td className="border-t border-slate-200 px-2 py-1 text-center text-slate-500">{formatearFecha(reprog.fechaCompromiso)}</td>
                        <td className="border-t border-slate-200 px-2 py-1 text-right font-medium text-emerald-500">{formatearMoneda(reprog.pago)}</td>
                        <td className="border-t border-slate-200 px-2 py-1 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            reprog.estado === 'Pagado'
                              ? 'bg-emerald-100 text-emerald-500 border border-emerald-200'
                              : reprog.estado === 'Parcial'
                                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                : 'bg-rose-100 text-rose-500 border border-rose-200'
                          }`}>
                            {reprog.estado}
                          </span>
                        </td>
                        <td className="border-t border-slate-200 px-2 py-1 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegistrarPagoReprogramacion(reprog)}
                            className="h-6 px-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
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
          <div className="bg-slate-50 rounded-lg p-2 border-2 border-slate-300">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium shrink-0 text-slate-600">Estado del Acuerdo</Label>
              <Select value={estadoAcuerdo} onValueChange={handleEstadoChange}>
                <SelectTrigger className="w-[30ch] !h-7 !py-0.5 text-xs bg-white border-slate-200 focus:border-sky-300">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incumplido">
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      Incumplido
                    </span>
                  </SelectItem>
                  {todasCuotasPagadas() && (
                    <SelectItem value="Cumplido">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Cumplido
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comentario */}
          {(estadoAcuerdo === 'Incumplido' || estadoAcuerdo === 'Cumplido') && (
            <div className="bg-white rounded-lg p-2 border-2 border-slate-300 space-y-1">
              <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                {estadoAcuerdo === 'Incumplido' ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Comentario de Incumplimiento
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Comentario
                  </>
                )}
              </Label>
              <Textarea
                value={comentarioIncumplimiento}
                onChange={(e) => setComentarioIncumplimiento(e.target.value)}
                placeholder={estadoAcuerdo === 'Incumplido' ? 'Ingrese las razones del incumplimiento...' : 'Ingrese un comentario...'}
                className="min-h-[60px] text-xs border-slate-200 focus:border-sky-300"
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            {(estadoAcuerdo === 'Incumplido' || estadoAcuerdo === 'Cumplido') ? (
              <>
                <Button variant="outline" onClick={() => { setEstadoAcuerdo(''); setComentarioIncumplimiento(''); }} className="px-6 h-7 border-slate-200 text-slate-500 hover:bg-slate-50">
                  CANCELAR
                </Button>
                <Button onClick={handleGuardar} className="px-6 h-7 bg-sky-100 hover:bg-sky-200 text-sky-600">
                  GUARDAR
                </Button>
              </>
            ) : (
              <Button onClick={() => onOpenChange(false)} className="px-6 h-7 bg-black text-white hover:bg-gray-800">
                CERRAR
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}