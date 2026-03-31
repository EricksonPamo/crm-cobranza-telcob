import { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar, Upload, Plus, User, CreditCard, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PreAcuerdo {
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

interface Cuota {
  nroCuota: string;
  montoCuota: number;
  fechaCompromiso: string;
  pago: number;
  estado: string;
}

interface Reprogramacion {
  nroCuota: string;
  montoCuota: number;
  fechaCompromiso: string;
  pago: number;
  estado: string;
  numeroReprogramacion: number; // 1 o 2
}

interface ModalEdicionPreAcuerdoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preAcuerdo: PreAcuerdo | null;
}

export function ModalEdicionPreAcuerdo({ open, onOpenChange, preAcuerdo }: ModalEdicionPreAcuerdoProps) {
  const [tipoDocumento, setTipoDocumento] = useState('Correo');
  const [estadoAcuerdo, setEstadoAcuerdo] = useState('');
  const [comentario, setComentario] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para reprogramación
  const [cuotaReprogramando, setCuotaReprogramando] = useState<string | null>(null);
  const [reprogramacionesTmp, setReprogramacionesTmp] = useState<{ fecha: string; monto: string }[]>([{ fecha: '', monto: '' }]);
  const [montoCuotaOriginal, setMontoCuotaOriginal] = useState<number>(0);
  const [fechaMinReprog, setFechaMinReprog] = useState<string>('');
  const [fechaMaxReprog, setFechaMaxReprog] = useState<string>('');

  // Datos de reprogramaciones
  const [reprogramaciones, setReprogramaciones] = useState<Reprogramacion[]>([]);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!open) {
      // Resetear todos los estados del formulario
      setTipoDocumento('Correo');
      setEstadoAcuerdo('');
      setComentario('');
      setArchivoAdjunto(null);
      setCuotaReprogramando(null);
      setReprogramacionesTmp([{ fecha: '', monto: '' }]);
      setMontoCuotaOriginal(0);
      setReprogramaciones([]);
    }
  }, [open]);

  // Generar cuotas dinámicamente según el tipo de tipificación
  const cuotas = useMemo<Cuota[]>(() => {
    if (!preAcuerdo) return [];

    const esConvenioPago = preAcuerdo.tipificacion === 'Convenio de Pago';
    const numCuotasTotal = preAcuerdo.cuotas;
    const montoTotal = preAcuerdo.montoAcuerdo;
    const fechaBase = new Date(preAcuerdo.fechaCreacion);
    
    const cuotasGeneradas: Cuota[] = [];

    if (esConvenioPago) {
      // Para Convenio de Pago: CI y CB están incluidas en el total de cuotas
      // Si cuotas = 5, entonces: CI, 1, 2, 3, CB
      // Cuotas intermedias = total - 2 (restando CI y CB)
      const cuotasIntermedias = numCuotasTotal - 2;
      
      // Distribuir el monto total equitativamente entre todas las cuotas
      const montoPorCuota = numCuotasTotal > 0 ? montoTotal / numCuotasTotal : 0;
      
      // Cuota Inicial (CI)
      cuotasGeneradas.push({
        nroCuota: 'CI',
        montoCuota: montoPorCuota,
        fechaCompromiso: agregarDias(fechaBase, 0), // Misma fecha de creación
        pago: 0,
        estado: 'Pendiente'
      });

      // Cuotas numeradas intermedias (1, 2, 3, ...)
      for (let i = 1; i <= cuotasIntermedias; i++) {
        cuotasGeneradas.push({
          nroCuota: String(i),
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, 34 + ((i - 1) * 30)), // 34 días después de creación, luego cada 30 días
          pago: 0,
          estado: 'Pendiente'
        });
      }

      // Cuota de Cierre (CB)
      cuotasGeneradas.push({
        nroCuota: 'CB',
        montoCuota: montoPorCuota,
        fechaCompromiso: agregarDias(fechaBase, 34 + (cuotasIntermedias * 30)), // Un mes después de la última cuota regular
        pago: 0,
        estado: 'Pendiente'
      });
    } else {
      // Para Promesa de Pago: solo cuotas numeradas (1, 2, 3, ...)
      const montoPorCuota = numCuotasTotal > 0 ? montoTotal / numCuotasTotal : 0;
      
      for (let i = 1; i <= numCuotasTotal; i++) {
        cuotasGeneradas.push({
          nroCuota: String(i),
          montoCuota: montoPorCuota,
          fechaCompromiso: agregarDias(fechaBase, i * 30), // Cada 30 días
          pago: 0,
          estado: 'Pendiente'
        });
      }
    }

    return cuotasGeneradas;
  }, [preAcuerdo]);

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

  const calcularTotal = () => {
    return cuotas.reduce((sum, cuota) => sum + cuota.montoCuota, 0);
  };

  const handleAdjuntarArchivo = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoAdjunto(file);
      toast.success(`Archivo "${file.name}" adjuntado correctamente`);
    }
  };

  const handleReprogramarCuota = (cuota: Cuota) => {
    // Verificar cuántas reprogramaciones ya existen para esta cuota
    const reprogramacionesExistentes = reprogramaciones.filter(r => r.nroCuota === cuota.nroCuota);
    
    if (reprogramacionesExistentes.length >= 2) {
      toast.error('Esta cuota ya tiene 2 reprogramaciones. No se permiten más reprogramaciones.');
      return;
    }

    setCuotaReprogramando(cuota.nroCuota);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(cuota.montoCuota);

    // Establecer fechas mínima y máxima para reprogramación
    // Fecha mínima: la fecha de la cuota original
    setFechaMinReprog(cuota.fechaCompromiso);
    
    // Fecha máxima: último día del mes de la cuota original
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

    // Validar que todos los campos estén llenos
    for (let i = 0; i < reprogramacionesTmp.length; i++) {
      if (!reprogramacionesTmp[i].fecha || !reprogramacionesTmp[i].monto) {
        toast.error('Todos los campos de fecha y monto son obligatorios');
        return;
      }
    }

    // Validar que la suma de montos coincida con el monto original
    const sumaMontos = reprogramacionesTmp.reduce((sum, r) => sum + parseFloat(r.monto || '0'), 0);
    if (Math.abs(sumaMontos - montoCuotaOriginal) > 0.01) {
      toast.error(`La suma de los montos (${formatearMoneda(sumaMontos)}) debe coincidir con el monto de la cuota original (${formatearMoneda(montoCuotaOriginal)})`);
      return;
    }

    // Obtener la cuota actual
    const cuotaActual = cuotas.find(c => c.nroCuota === cuotaReprogramando);
    if (!cuotaActual) return;

    // Buscar la siguiente cuota para validar fechas
    const indiceActual = cuotas.findIndex(c => c.nroCuota === cuotaReprogramando);
    const siguienteCuota = cuotas[indiceActual + 1];

    // Validar que ninguna fecha supere la fecha de la siguiente cuota
    for (const reprog of reprogramacionesTmp) {
      if (siguienteCuota && reprog.fecha > siguienteCuota.fechaCompromiso) {
        toast.error('La fecha de reprogramación no debe superar la fecha de la siguiente cuota');
        return;
      }
    }

    // Crear las nuevas reprogramaciones
    const nuevasReprogramaciones = reprogramacionesTmp.map((reprog, index) => ({
      nroCuota: cuotaReprogramando,
      montoCuota: parseFloat(reprog.monto),
      fechaCompromiso: reprog.fecha,
      pago: 0,
      estado: 'Pendiente',
      numeroReprogramacion: index + 1,
    }));

    // Eliminar reprogramaciones anteriores de esta cuota y agregar las nuevas
    setReprogramaciones(prev => {
      const filtradas = prev.filter(r => r.nroCuota !== cuotaReprogramando);
      return [...filtradas, ...nuevasReprogramaciones];
    });

    toast.success(`${nuevasReprogramaciones.length} reprogramación(es) registrada(s) correctamente`);
    setCuotaReprogramando(null);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(0);
  };

  const cancelarReprogramacion = () => {
    setCuotaReprogramando(null);
    setReprogramacionesTmp([{ fecha: '', monto: '' }]);
    setMontoCuotaOriginal(0);
  };

  const handleGuardar = () => {
    // Validar comentario obligatorio
    if (!comentario.trim()) {
      toast.error('El campo comentario es obligatorio');
      return;
    }

    // Validar documento para "Aprobado por Excepción"
    if (estadoAcuerdo === 'Aprobado por Excepción' && !archivoAdjunto) {
      toast.error('Debe adjuntar un documento para el estado "Aprobado por Excepción"');
      return;
    }

    // Si el estado cambia a "Aprobado" o "Aprobado por Excepción",
    // el registro se mueve al módulo de Acuerdos
    if (estadoAcuerdo === 'Aprobado' || estadoAcuerdo === 'Aprobado por Excepción') {
      toast.success(
        `Pre-acuerdo ${estadoAcuerdo.toLowerCase()}. El registro se ha transferido al módulo de Acuerdos y desaparecerá de Pre-acuerdos.`,
        { duration: 5000 }
      );
    } else {
      toast.success('Pre-acuerdo guardado exitosamente');
    }

    // Cerrar modal
    onOpenChange(false);
  };

  if (!preAcuerdo) return null;

  // Calcular cuántas reprogramaciones ya tiene cada cuota
  const contarReprogramaciones = (nroCuota: string) => {
    return reprogramaciones.filter(r => r.nroCuota === nroCuota).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-xs max-w-[85vw] w-[910px] max-h-[90vh] overflow-y-auto sm:max-w-[85vw] bg-gradient-to-br from-slate-50 to-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
          <DialogTitle className="text-lg font-bold text-slate-700">Editar Pre-Acuerdo</DialogTitle>
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
                <Input value={preAcuerdo.identificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Nombre</Label>
                <Input value={preAcuerdo.nombre} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Producto</Label>
                <Input value={preAcuerdo.producto} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Moneda</Label>
                <Input value={preAcuerdo.moneda || 'COP'} readOnly className="bg-white border-slate-200 text-xs h-7 w-24 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Deuda Total</Label>
                <Input value={formatearMoneda(preAcuerdo.deudaTotal || 12500)} readOnly className="bg-emerald-50 border-emerald-200 text-xs h-7 w-32 font-semibold text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Acuerdo(s) Vigente(s) */}
          <div className="bg-violet-50 rounded-lg p-2 border-2 border-violet-300">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-600">Acuerdo Vigente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Cuenta</Label>
                <Input value={preAcuerdo.cuenta} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs font-medium text-slate-500 shrink-0">Estado</Label>
                <Input value={preAcuerdo.estado} readOnly className="bg-white border-slate-200 text-xs h-7 w-32 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Tipificación</Label>
                <Input value={preAcuerdo.tipificacion} readOnly className="bg-white border-slate-200 text-xs h-7 flex-1 font-medium text-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-24 text-xs font-medium text-slate-500 shrink-0">Fecha Creación</Label>
                <Input value={formatearFecha(preAcuerdo.fechaCreacion)} readOnly className="bg-white border-slate-200 text-xs h-7 w-32 font-medium text-slate-600" />
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
                      <th className="px-2 py-1 font-semibold text-center">Estado</th>
                      <th className="px-2 py-1 font-semibold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.map((cuota, index) => {
                      const numReprogramaciones = contarReprogramaciones(cuota.nroCuota);
                      const puedeReprogramar = cuota.estado === 'Pendiente' && numReprogramaciones < 2;

                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-violet-50' : 'bg-violet-50/50 hover:bg-violet-50'}>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-5 rounded-md bg-sky-100 text-sky-600 text-xs font-semibold">
                              {cuota.nroCuota}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-slate-600">{formatearMoneda(cuota.montoCuota)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center text-slate-500">{formatearFecha(cuota.fechaCompromiso)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-right font-medium text-emerald-500">{formatearMoneda(cuota.pago)}</td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cuota.estado === 'Pagado'
                                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                : cuota.estado === 'Parcial'
                                  ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                  : 'bg-rose-100 text-rose-500 border border-rose-200'
                            }`}>
                              {cuota.estado}
                            </span>
                          </td>
                          <td className="border-t border-violet-100 px-2 py-1 text-center">
                            {puedeReprogramar ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprogramarCuota(cuota)}
                                className="h-6 px-1.5 text-violet-400 hover:text-violet-500 hover:bg-violet-50"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </Button>
                            ) : numReprogramaciones === 2 ? (
                              <span className="text-xs text-slate-400">Límite</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right text-xs font-bold text-slate-600">Total</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1 text-right font-bold text-slate-700">{formatearMoneda(calcularTotal())}</td>
                      <td className="border-t-2 border-violet-200 px-2 py-1" colSpan={4}></td>
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
                  </tr>
                </thead>
                <tbody>
                  {reprogramaciones.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-8 text-xs border border-slate-200 px-2 py-2 text-center text-slate-500 bg-slate-100/30">
                        No hay reprogramaciones
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjuntar Documento(s) */}
          <div className="bg-white rounded-lg p-2 border-2 border-slate-300 space-y-1">
            <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Adjuntar Documento(s)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-28 text-xs font-medium text-slate-500 shrink-0">Tipo Documento</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger className="!h-7 !py-0.5 text-xs w-44 bg-white border-slate-200 focus:border-sky-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Correo">Correo</SelectItem>
                    <SelectItem value="Documento">Documento</SelectItem>
                    <SelectItem value="Chat-WhatsApp">Chat-WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs font-medium text-slate-500 shrink-0">Adjunto</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="h-7 text-xs hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdjuntarArchivo}
                  className="h-7 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" />
                  {archivoAdjunto ? archivoAdjunto.name : 'Adjuntar Archivo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Comentario */}
          <div className="bg-white rounded-lg p-2 border-2 border-slate-300 space-y-1">
            <Label className="text-xs font-medium text-slate-600">Comentario</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ingrese un comentario (obligatorio)..."
              className="min-h-[60px] text-xs border-slate-200 focus:border-sky-300"
            />
          </div>

          {/* Estado */}
          <div className="bg-slate-50 rounded-lg p-2 border-2 border-slate-300">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium shrink-0 text-slate-600">Estado</Label>
              <Select value={estadoAcuerdo} onValueChange={setEstadoAcuerdo}>
                <SelectTrigger className="w-56 !h-7 !py-0.5 text-xs bg-white border-slate-200 focus:border-sky-300">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprobado">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Aprobado
                    </span>
                  </SelectItem>
                  <SelectItem value="No Aprobado">No Aprobado</SelectItem>
                  <SelectItem value="Aprobado por Excepción">Aprobado por Excepción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-7 border-slate-200 text-slate-500 hover:bg-slate-50">
              CANCELAR
            </Button>
            <Button onClick={handleGuardar} className="px-6 h-7 bg-sky-100 hover:bg-sky-200 text-sky-600">
              GUARDAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}