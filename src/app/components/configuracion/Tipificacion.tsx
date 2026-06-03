import { useState, useEffect, useMemo, useRef, SyntheticEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Plus, Pencil, Trash2, Settings, GitBranch, Eye, EyeOff, Power, PowerOff, Search, Tags, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { TipificacionImportRow, Producto as ProductoDB, CanalComunicacion, TipificacionTipo, RazonNoPago } from '../../lib/db';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
}

interface CampoPlantilla {
  id: string;
  productoId: string;
  productoNombre: string;
  tipoCargue: 'Obligación' | 'Pago' | 'Campaña';
  tabla: string;
  nombreColumna: string;
  tipoDato: 'Caracter' | 'Numerico' | 'Fecha';
  obligatorio: boolean;
  filtro: boolean;
  campoOrigen: string;
  alias: string;
  estado: 'activo' | 'inactivo';
}

interface Tipificacion {
  id: string;
  productoId: string;
  canalComunicacion: string;
  tipoTipificacion: string;
  codigoAccion: string;
  codigoResultado: string;
  accion: string;
  resultado: string;
  resultado1: string;
  resultado2: string;
  resultado3: string;
  resultado4: string;
  resultado5: string;
  tieneRazonNoPago: boolean;
  destacado: boolean;
  peso: number;
  mostrar: boolean;
  estado: 'activo' | 'inactivo';
  // Configuración para Promesa/Convenio/Preacuerdo
  maxCuotas?: number;
  montoMinimo?: {
    enabled: boolean;
    comparador: string;
    campo: string;
    porcentaje: number;
  };
  montoMaximo?: {
    enabled: boolean;
    comparador: string;
    campo: string;
    porcentaje: number;
  };
}

interface CicloEstado {
  id: string;
  tipificacionId: string;
  estadoActual: string;
  estadoSiguiente: string;
  tipoUsuario: string;
  estado: 'activo' | 'inactivo';
}

const CANALES_COMUNICACION = [
  'LLAMADA ENTRADA',
  'LLAMADA DE SALIDA',
  'VISITA',
  'SMS',
  'EMAIL'
];

const TIPOS_TIPIFICACION = [
  'No Contacto',
  'Contacto con Titular',
  'Contacto con tercero',
  'Promesa de Pago',
  'Convenio de Pago',
  'Preacuerdo de Pago',
  'Pago'
];

const ESTADOS_CICLO = [
  'Creado',
  'Aprobado',
  'No Aprobado',
  'Cumplido',
  'Incumplido',
  'Eliminado'
];

const COMPARADORES = [
  { value: 'mayor_que', label: 'Mayor que' },
  { value: 'menor_que', label: 'Menor que' },
  { value: 'mayor_igual', label: 'Mayor igual que' },
  { value: 'menor_igual', label: 'Menor igual que' }
];

const TIPOS_USUARIO = [
  'Administrador',
  'Supervisor',
  'Cobrador',
  'Analista',
  'Contador'
];

export function Tipificacion() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [dbProductos, setDbProductos] = useState<ProductoDB[]>([]);
  const [dbCanales, setDbCanales] = useState<CanalComunicacion[]>([]);
  const [dbTipos, setDbTipos] = useState<TipificacionTipo[]>([]);
  const [razonesNoPago, setRazonesNoPago] = useState<RazonNoPago[]>([]);
  const [selectedRazones, setSelectedRazones] = useState<string[]>([]);
  const [tipificaciones, setTipificaciones] = useState<Tipificacion[]>([]);
  const [ciclosEstado, setCiclosEstado] = useState<CicloEstado[]>([]);
  const [filteredTipificaciones, setFilteredTipificaciones] = useState<Tipificacion[]>([]);
  const [camposNumericos, setCamposNumericos] = useState<string[]>([]);
  
  // Filtros
  const [filtroProducto, setFiltroProducto] = useState<string>('');
  const [filtroCanal, setFiltroCanal] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filtros de columnas
  const [filtroTipoTipificacion, setFiltroTipoTipificacion] = useState<string>('');
  const [filtroCodigoAccion, setFiltroCodigoAccion] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');
  const [filtroCodigoResultado, setFiltroCodigoResultado] = useState<string>('');
  const [filtroResultado, setFiltroResultado] = useState<string>('');

  // Filtros de la tabla Ciclo de Estado
  const [filtroEstadoActual, setFiltroEstadoActual] = useState<string>('');
  const [filtroEstadoSiguiente, setFiltroEstadoSiguiente] = useState<string>('');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState<string>('');
  
  // Paginación para Ciclo de Estado
  const [paginaCiclo, setPaginaCiclo] = useState(1);
  const registrosPorPagina = 10;

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isCicloDialogOpen, setIsCicloDialogOpen] = useState(false);
  
  const [editingTipificacion, setEditingTipificacion] = useState<Tipificacion | null>(null);
  const [configTipificacion, setConfigTipificacion] = useState<Tipificacion | null>(null);
  const [cicloTipificacion, setCicloTipificacion] = useState<Tipificacion | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Tipificacion>>({
    productoId: '',
    canalComunicacion: '',
    tipoTipificacion: '',
    codigoAccion: '',
    codigoResultado: '',
    accion: '',
    resultado: '',
    resultado1: '',
    resultado2: '',
    resultado3: '',
    resultado4: '',
    resultado5: '',
    tieneRazonNoPago: false,
    destacado: false,
    peso: 0,
    mostrar: false,
    estado: 'activo',
    maxCuotas: 3,
  });

  const [configData, setConfigData] = useState({
    maxCuotas: 3,
    montoMinimo: {
      enabled: false,
      comparador: 'mayor_que',
      campo: '',
      porcentaje: 0
    },
    montoMaximo: {
      enabled: false,
      comparador: 'menor_que',
      campo: '',
      porcentaje: 0
    }
  });

  const [cicloData, setCicloData] = useState({
    estadoActual: '',
    estadoSiguiente: '',
    tipoUsuario: ''
  });

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProducto, setImportProducto] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ rows: TipificacionImportRow[]; errors: string[]; warnings: string[] } | null>(null);

  // CSV utility functions
  const stripBOM = (text: string): string => {
    if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
    return text;
  };

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  // Normalize text for case-insensitive comparison preserving ñ and tildes
  const normalizeForComparison = (s: string): string => {
    return (s || '').trim().toUpperCase();
  };

  const parseCSV = (text: string): string[][] => {
    const cleanText = stripBOM(text);
    const delimiter = detectDelimiter(cleanText);
    const lines = cleanText.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === delimiter && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      row.push(current.trim());
      return row;
    });
  };

  const TIPIFICACION_CSV_COLUMNS = [
    'CANAL_COMUNICACION', 'TIPO_TIPIFICACION', 'CODACCION', 'ACCION',
    'CODRESULTADO', 'RESULTADO', 'RESULTADO1', 'RESULTADO2', 'RESULTADO3',
    'RESULTADO4', 'RESULTADO5', 'DESTACADO', 'MOSTRAR_WEB', 'PESO', 'DISPONEREGLA'
  ];

  useEffect(() => {
    loadProductos();
    loadTipificaciones();
    loadCiclosEstado();
    loadCamposNumericos();
    initializeSampleData();
    loadDbProductos();
    loadDbCanalesTipos();
    loadRazonesNoPago();
  }, []);

  // Memoizar tipificaciones filtradas para evitar re-cálculos innecesarios
  const memoizedFilteredTipificaciones = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    let filtered = [...tipificaciones];

    if (filtroProducto && filtroProducto !== 'todos') {
      filtered = filtered.filter(t => t.productoId === filtroProducto);
    }

    if (filtroCanal && filtroCanal !== 'todos') {
      filtered = filtered.filter(t => t.canalComunicacion === filtroCanal);
    }

    if (filtroTipoTipificacion) {
      filtered = filtered.filter(t => 
        t.tipoTipificacion.toLowerCase().includes(filtroTipoTipificacion.toLowerCase())
      );
    }

    if (filtroCodigoAccion) {
      filtered = filtered.filter(t => 
        t.codigoAccion.toLowerCase().includes(filtroCodigoAccion.toLowerCase())
      );
    }

    if (filtroAccion) {
      filtered = filtered.filter(t => 
        t.accion.toLowerCase().includes(filtroAccion.toLowerCase())
      );
    }

    if (filtroCodigoResultado) {
      filtered = filtered.filter(t => 
        t.codigoResultado.toLowerCase().includes(filtroCodigoResultado.toLowerCase())
      );
    }

    if (filtroResultado) {
      filtered = filtered.filter(t => 
        t.resultado.toLowerCase().includes(filtroResultado.toLowerCase())
      );
    }

    return filtered;
  }, [tipificaciones, filtroProducto, filtroCanal, hasSearched, filtroTipoTipificacion, filtroCodigoAccion, filtroAccion, filtroCodigoResultado, filtroResultado]);

  useEffect(() => {
    setFilteredTipificaciones(memoizedFilteredTipificaciones);
  }, [memoizedFilteredTipificaciones]);

  // Resetear página cuando cambien los filtros de ciclo
  useEffect(() => {
    setPaginaCiclo(1);
  }, [filtroEstadoActual, filtroEstadoSiguiente, filtroTipoUsuario]);

  const loadProductos = () => {
    const saved = localStorage.getItem('productos');
    if (saved) {
      const allProductos = JSON.parse(saved);
      setProductos(allProductos.filter((p: Producto) => p.estado === 'activo'));
    }
  };

  const loadDbProductos = async () => {
    try {
      const productos = await db.getProductos();
      setDbProductos(productos.filter((p: ProductoDB) => p.estado === 'activo'));
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadDbCanalesTipos = async () => {
    try {
      const [canales, tipos] = await Promise.all([
        db.getCanalComunicacion(),
        db.getTipificacionTipo()
      ]);
      setDbCanales(canales);
      setDbTipos(tipos);
    } catch (error) {
      console.error('Error cargando canales/tipos:', error);
    }
  };

  const loadRazonesNoPago = async () => {
    try {
      const razones = await db.getRazonNoPago();
      setRazonesNoPago(razones);
    } catch (error) {
      console.error('Error cargando razones no pago:', error);
    }
  };

  const loadTipificaciones = () => {
    const saved = localStorage.getItem('tipificaciones');
    if (saved) {
      setTipificaciones(JSON.parse(saved));
    }
  };

  const loadCiclosEstado = () => {
    const saved = localStorage.getItem('ciclosEstado');
    if (saved) {
      setCiclosEstado(JSON.parse(saved));
    }
  };

  const saveTipificaciones = (data: Tipificacion[]) => {
    localStorage.setItem('tipificaciones', JSON.stringify(data));
    setTipificaciones(data);
  };

  const saveCiclosEstado = (data: CicloEstado[]) => {
    localStorage.setItem('ciclosEstado', JSON.stringify(data));
    setCiclosEstado(data);
  };

  const loadCamposNumericos = () => {
    const saved = localStorage.getItem('plantillas_cargue');
    if (saved) {
      const plantillas: CampoPlantilla[] = JSON.parse(saved);
      // Filtrar solo campos numéricos del tipo de cargue "Obligación" que tienen un "Campo Origen" definido
      const camposNumericosObligacion = plantillas
        .filter((campo) => 
          campo.tipoCargue === 'Obligación' && 
          campo.tipoDato === 'Numerico' && 
          campo.campoOrigen && 
          campo.campoOrigen.trim() !== '' &&
          campo.estado === 'activo'
        )
        .map((campo) => campo.campoOrigen);
      
      // Eliminar duplicados
      const camposUnicos = Array.from(new Set(camposNumericosObligacion));
      setCamposNumericos(camposUnicos);
    }
  };

  const handleBuscar = async () => {
    // Validar que se hayan seleccionado los filtros
    if (!filtroProducto) {
      toast.error('Debe seleccionar un Producto');
      return;
    }
    if (!filtroCanal) {
      toast.error('Debe seleccionar un Canal de Comunicación');
      return;
    }

    setHasSearched(true);

    try {
      // Fetch tipificaciones by product from the database
      const records = await db.getTipificacionesByProducto(filtroProducto);

      // Filter by canal (case-insensitive, preserving ñ/tildes)
      const canalNombre = filtroCanal.toUpperCase();
      const filtered = records
        .filter(r => r.canal_nombre.toUpperCase() === canalNombre)
        .map(r => ({
          id: r.idtipificacion,
          productoId: filtroProducto,
          canalComunicacion: r.canal_nombre,
          tipoTipificacion: r.tipo_nombre,
          codigoAccion: r.codaccion || '',
          codigoResultado: r.codresultado || '',
          accion: r.accion || '',
          resultado: r.resultado || '',
          resultado1: r.resultado1 || '',
          resultado2: r.resultado2 || '',
          resultado3: r.resultado3 || '',
          resultado4: r.resultado4 || '',
          resultado5: r.resultado5 || '',
          tieneRazonNoPago: r.tienerazonnopago || false,
          destacado: r.destacado === 'si',
          peso: r.peso,
          mostrar: r.mostrarweb === 'si',
          estado: r.estado as 'activo' | 'inactivo',
        }));

      setFilteredTipificaciones(filtered);
      toast.success(`Búsqueda realizada: ${filtered.length} tipificación(es) encontrada(s)`);
    } catch (error: any) {
      console.error('Error buscando tipificaciones:', error);
      toast.error('Error al buscar tipificaciones');
      setFilteredTipificaciones([]);
    }
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.productoId) { toast.error('Seleccione un producto'); return; }
    if (!formData.canalComunicacion) { toast.error('Seleccione un canal de comunicación'); return; }
    if (!formData.tipoTipificacion) { toast.error('Seleccione un tipo de tipificación'); return; }
    if (!formData.resultado) { toast.error('Ingrese un resultado'); return; }

    try {
      const userId = currentUser?.id;
      if (!userId) { toast.error('Debe iniciar sesión'); return; }

      // Find the DB ids for canal and tipo
      const canal = dbCanales.find(c => c.nombre === formData.canalComunicacion);
      const tipo = dbTipos.find(t => t.nombre === formData.tipoTipificacion);
      if (!canal) { toast.error('Canal de comunicación no encontrado'); return; }
      if (!tipo) { toast.error('Tipo de tipificación no encontrado'); return; }

      await db.createTipificacion({
        idcanalcomunicacion: canal.idcanalcomunicacion,
        idtipotipificacion: tipo.idtipotipificacion,
        codaccion: formData.codigoAccion || undefined,
        accion: formData.accion || undefined,
        codresultado: formData.codigoResultado || undefined,
        resultado: formData.resultado || undefined,
        resultado1: formData.resultado1 || undefined,
        resultado2: formData.resultado2 || undefined,
        resultado3: formData.resultado3 || undefined,
        resultado4: formData.resultado4 || undefined,
        resultado5: formData.resultado5 || undefined,
        destacado: formData.destacado ? 'si' : 'no',
        mostrarweb: formData.mostrar ? 'si' : 'no',
        peso: formData.peso || 0,
        disponeregla: 'no',
        tienerazonnopago: formData.tieneRazonNoPago || false,
        idusuario: userId,
        estado: formData.estado || 'activo',
        razonesNoPago: formData.tieneRazonNoPago ? selectedRazones : [],
      });

      toast.success('Tipificación creada correctamente');
      resetForm();

      // Refresh the list if search was already performed
      if (hasSearched && filtroProducto && filtroCanal) {
        await handleBuscar();
      }
    } catch (error: any) {
      console.error('Error guardando tipificación:', error);
      toast.error(error?.message || 'Error al guardar la tipificación');
    }
  };

  const handleEdit = (tipificacion: Tipificacion) => {
    setEditingTipificacion(tipificacion);
    setFormData(tipificacion);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta tipificación?')) {
      const updated = tipificaciones.filter((t) => t.id !== id);
      saveTipificaciones(updated);
      toast.success('Tipificación eliminada correctamente');
    }
  };

  const handleToggleEstado = (id: string) => {
    const updated = tipificaciones.map((t) =>
      t.id === id ? { ...t, estado: t.estado === 'activo' ? 'inactivo' : 'activo' } as Tipificacion : t
    );
    saveTipificaciones(updated);
    toast.success('Estado actualizado correctamente');
  };

  const handleToggleMostrar = (id: string) => {
    const updated = tipificaciones.map((t) =>
      t.id === id ? { ...t, mostrar: !t.mostrar } : t
    );
    saveTipificaciones(updated);
    toast.success('Visibilidad actualizada correctamente');
  };

  const handleOpenConfig = (tipificacion: Tipificacion) => {
    setConfigTipificacion(tipificacion);
    setConfigData({
      maxCuotas: tipificacion.maxCuotas || 3,
      montoMinimo: tipificacion.montoMinimo || {
        enabled: false,
        comparador: 'mayor_que',
        campo: 'saldoacobrar',
        porcentaje: 0
      },
      montoMaximo: tipificacion.montoMaximo || {
        enabled: false,
        comparador: 'menor_que',
        campo: 'saldoacobrar',
        porcentaje: 0
      }
    });
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!configTipificacion) return;

    const updated = tipificaciones.map((t) =>
      t.id === configTipificacion.id
        ? { ...t, ...configData }
        : t
    );
    saveTipificaciones(updated);
    toast.success('Configuración guardada correctamente');
    setIsConfigDialogOpen(false);
  };

  const handleOpenCiclo = (tipificacion: Tipificacion) => {
    setCicloTipificacion(tipificacion);
    // Resetear filtros y paginación
    setFiltroEstadoActual('');
    setFiltroEstadoSiguiente('');
    setFiltroTipoUsuario('');
    setPaginaCiclo(1);
    setIsCicloDialogOpen(true);
  };

  const handleAddCiclo = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cicloTipificacion) return;

    const newCiclo: CicloEstado = {
      id: Date.now().toString(),
      tipificacionId: cicloTipificacion.id,
      estadoActual: cicloData.estadoActual,
      estadoSiguiente: cicloData.estadoSiguiente,
      tipoUsuario: cicloData.tipoUsuario,
      estado: 'activo'
    };

    saveCiclosEstado([...ciclosEstado, newCiclo]);
    toast.success('Ciclo de estado agregado correctamente');
    
    setCicloData({
      estadoActual: '',
      estadoSiguiente: '',
      tipoUsuario: ''
    });
  };

  const handleToggleCicloEstado = (id: string) => {
    const updated = ciclosEstado.map((c) =>
      c.id === id ? { ...c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' } as CicloEstado : c
    );
    saveCiclosEstado(updated);
    toast.success('Estado del ciclo actualizado');
  };

  const handleDeleteCiclo = (id: string) => {
    if (confirm('¿Está seguro de eliminar este ciclo?')) {
      const updated = ciclosEstado.filter((c) => c.id !== id);
      saveCiclosEstado(updated);
      toast.success('Ciclo eliminado correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      productoId: '',
      canalComunicacion: '',
      tipoTipificacion: '',
      codigoAccion: '',
      codigoResultado: '',
      accion: '',
      resultado: '',
      resultado1: '',
      resultado2: '',
      resultado3: '',
      resultado4: '',
      resultado5: '',
      tieneRazonNoPago: false,
      destacado: false,
      peso: 0,
      mostrar: false,
      estado: 'activo',
      maxCuotas: 3,
    });
    setSelectedRazones([]);
    setEditingTipificacion(null);
    setIsDialogOpen(false);
  };

  const requiereConfiguracion = (tipo: string) => {
    return ['Promesa de Pago', 'Convenio de Pago', 'Preacuerdo de Pago'].includes(tipo);
  };

  const getCiclosFiltradosYPaginados = (tipificacionId: string) => {
    let filtered = ciclosEstado.filter(c => c.tipificacionId === tipificacionId);

    // Aplicar filtros de columnas
    if (filtroEstadoActual) {
      filtered = filtered.filter(c => 
        c.estadoActual.toLowerCase().includes(filtroEstadoActual.toLowerCase())
      );
    }

    if (filtroEstadoSiguiente) {
      filtered = filtered.filter(c => 
        c.estadoSiguiente.toLowerCase().includes(filtroEstadoSiguiente.toLowerCase())
      );
    }

    if (filtroTipoUsuario) {
      filtered = filtered.filter(c => 
        c.tipoUsuario.toLowerCase().includes(filtroTipoUsuario.toLowerCase())
      );
    }

    // Calcular paginación
    const totalRegistros = filtered.length;
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    const inicio = (paginaCiclo - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const registrosPaginados = filtered.slice(inicio, fin);

    return {
      registros: registrosPaginados,
      totalRegistros,
      totalPaginas,
      paginaActual: paginaCiclo
    };
  };

  const initializeSampleData = () => {
    // DESHABILITADO TEMPORALMENTE para mejorar rendimiento
    // Código comentado para evitar errores de TypeScript con código inalcanzable
  };

  // =============================================
  // IMPORT TIPIFICACION
  // =============================================
  const handleDownloadTipificacionTemplate = () => {
    const csv = `CANAL_COMUNICACION;TIPO_TIPIFICACION;CODACCION;ACCION;CODRESULTADO;RESULTADO;RESULTADO1;RESULTADO2;RESULTADO3;RESULTADO4;RESULTADO5;DESTACADO;MOSTRAR_WEB;PESO;DISPONEREGLA\nLLAMADA DE SALIDA;No Contacto;CA01;No contacto - cliente no contesta;CR01;Sin contacto;;;;;;;;;no;si;0;no\nLLAMADA DE SALIDA;Contacto con Titular;CA02;Contacto directo con titular;CR02;Compromiso de pago;;;;;;;;;si;si;1;no`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_tipificacion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Tipo de archivo no válido. Use archivos CSV.');
        return;
      }
      setImportFile(selectedFile);
      setImportPreview(null);
    }
  };

  const handleImportPreview = async () => {
    if (!importFile) { toast.error('Seleccione un archivo CSV'); return; }
    if (!importProducto) { toast.error('Seleccione un producto'); return; }

    try {
      const text = await importFile.text();
      const csvRows = parseCSV(text);

      if (csvRows.length < 2) {
        toast.error('El archivo no contiene filas de datos.');
        return;
      }

      const headers = csvRows[0].map(h => h.toUpperCase().trim());
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required columns
      const requiredCols = ['CANAL_COMUNICACION', 'TIPO_TIPIFICACION', 'RESULTADO'];
      for (const req of requiredCols) {
        if (!headers.includes(req)) {
          errors.push(`Columna requerida faltante: ${req}`);
        }
      }
      if (errors.length > 0) {
        toast.error(errors.join('. '));
        return;
      }

      // Build lookup sets for validation (case-insensitive, ñ/tildes preserved)
      const canalNames = new Set(dbCanales.map(c => normalizeForComparison(c.nombre)));
      const tipoNames = new Set(dbTipos.map(t => normalizeForComparison(t.nombre)));

      const dataRows = csvRows.slice(1);
      const parsed: TipificacionImportRow[] = [];
      const seenInFile = new Set<string>();

      dataRows.forEach((row, idx) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i]?.trim() || ''; });
        const r = obj as unknown as TipificacionImportRow;

        const canal = (r.CANAL_COMUNICACION || '').trim();
        const tipo = (r.TIPO_TIPIFICACION || '').trim();
        const resultado = (r.RESULTADO || '').trim();
        const fila = idx + 2; // 1-based + header row

        // Skip completely empty rows
        if (!canal && !tipo && !resultado) return;

        // Required field validation
        if (!canal) {
          errors.push(`Fila ${fila}: CANAL_COMUNICACION es obligatorio`);
          return;
        }
        if (!tipo) {
          errors.push(`Fila ${fila}: TIPO_TIPIFICACION es obligatorio`);
          return;
        }
        if (!resultado) {
          errors.push(`Fila ${fila}: RESULTADO es obligatorio`);
          return;
        }

        // Validate canal exists in database
        if (!canalNames.has(normalizeForComparison(canal))) {
          errors.push(`Fila ${fila}: Canal "${canal}" no existe en la tabla canal_comunicacion`);
          return;
        }

        // Validate tipo exists in database
        if (!tipoNames.has(normalizeForComparison(tipo))) {
          errors.push(`Fila ${fila}: Tipo "${tipo}" no existe en la tabla tipificacion_tipo`);
          return;
        }

        // Check for duplicates within file (CANAL + TIPO + RESULTADO)
        const dedupKey = `${normalizeForComparison(canal)}|${normalizeForComparison(tipo)}|${normalizeForComparison(resultado)}`;
        if (seenInFile.has(dedupKey)) {
          warnings.push(`Fila ${fila}: registro duplicado en el archivo (Canal: ${canal}, Tipo: ${tipo}, Resultado: ${resultado})`);
        }
        seenInFile.add(dedupKey);

        // Validate DESTACADO, MOSTRAR_WEB, DISPONEREGLA values
        if (r.DESTACADO && !['si', 'no'].includes(r.DESTACADO.toLowerCase())) {
          warnings.push(`Fila ${fila}: DESTACADO debe ser 'si' o 'no' (valor: '${r.DESTACADO}')`);
        }
        if (r.MOSTRAR_WEB && !['si', 'no'].includes(r.MOSTRAR_WEB.toLowerCase())) {
          warnings.push(`Fila ${fila}: MOSTRAR_WEB debe ser 'si' o 'no' (valor: '${r.MOSTRAR_WEB}')`);
        }
        if (r.DISPONEREGLA && !['si', 'no'].includes(r.DISPONEREGLA.toLowerCase())) {
          warnings.push(`Fila ${fila}: DISPONEREGLA debe ser 'si' o 'no' (valor: '${r.DISPONEREGLA}')`);
        }
        if (r.PESO && isNaN(parseInt(r.PESO))) {
          warnings.push(`Fila ${fila}: PESO debe ser un número (valor: '${r.PESO}')`);
        }

        parsed.push(r);
      });

      if (parsed.length === 0) {
        toast.error(errors.length > 0 ? errors.join('. ') : 'No se encontraron registros válidos en el archivo.');
        return;
      }

      setImportPreview({ rows: parsed, errors, warnings });
    } catch (error: any) {
      toast.error(error?.message || 'Error al procesar el archivo');
    }
  };

  const handleImportExecute = async () => {
    if (!importPreview || !importProducto) return;
    if (!currentUser?.id) {
      toast.error('Debe iniciar sesión para importar');
      return;
    }
    const userId = currentUser.id;

    try {
      setImporting(true);
      const result = await db.importTipificacion(
        importProducto,
        userId,
        importPreview.rows
      );

      let msg = `Importación exitosa: ${result.inserted} tipificación(es) insertada(s).`;
      if (result.skipped && result.skipped > 0) msg += ` ${result.skipped} duplicada(s) omitida(s).`;
      if (result.warnings && result.warnings.length > 0) {
        msg += ` Advertencias: ${result.warnings.length}`;
      }
      toast.success(msg);

      // Refresh data from API
      await loadTipificacionesFromDB();

      // Reset import state
      setShowImportDialog(false);
      setImportPreview(null);
      setImportFile(null);
      setImportProducto('');
      if (importFileRef.current) importFileRef.current.value = '';
    } catch (error: any) {
      toast.error(error?.message || 'Error al importar tipificaciones');
    } finally {
      setImporting(false);
    }
  };

  const loadTipificacionesFromDB = async () => {
    try {
      const records = await db.getTipificaciones();
      const mapped: Tipificacion[] = records.map(r => ({
        id: r.idtipificacion,
        productoId: '',
        canalComunicacion: r.canal_nombre,
        tipoTipificacion: r.tipo_nombre,
        codigoAccion: r.codaccion || '',
        codigoResultado: r.codresultado || '',
        accion: r.accion || '',
        resultado: r.resultado || '',
        resultado1: r.resultado1 || '',
        resultado2: r.resultado2 || '',
        resultado3: r.resultado3 || '',
        resultado4: r.resultado4 || '',
        resultado5: r.resultado5 || '',
        tieneRazonNoPago: r.tienerazonnopago || false,
          destacado: r.destacado === 'si',
          peso: r.peso,
          mostrar: r.mostrarweb === 'si',
          estado: r.estado as 'activo' | 'inactivo',
        }));
      // Merge with existing localStorage data
      const existing = tipificaciones;
      const merged = [...existing, ...mapped.filter(m => !existing.some(e => e.id === m.id))];
      setTipificaciones(merged);
      saveTipificaciones(merged);
    } catch (error: any) {
      console.error('Error loading tipificaciones from DB:', error);
    }
  };

  return (
    <Card className="border-2 border-sky-400 bg-gray-50 w-fit mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tags className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Tipificaciones</CardTitle>
              <CardDescription>
                Configure las tipificaciones para clasificar las gestiones de cobranza
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Label htmlFor="filtro-producto" className="text-xs text-gray-500 whitespace-nowrap">Producto:</Label>
            <Select
              value={filtroProducto}
              onValueChange={(value) => {
                setFiltroProducto(value);
                setHasSearched(false);
                setFilteredTipificaciones([]);
              }}
            >
              <SelectTrigger id="filtro-producto" className="!h-7 !py-1 text-xs w-44 border-sky-500">
                <SelectValue placeholder="Seleccione producto" />
              </SelectTrigger>
              <SelectContent>
                {dbProductos.map((producto) => (
                  <SelectItem key={producto.idproducto} value={producto.idproducto}>
                    {producto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Label htmlFor="filtro-canal" className="text-xs text-gray-500 whitespace-nowrap">Canal:</Label>
            <Select
              value={filtroCanal}
              onValueChange={(value) => {
                setFiltroCanal(value);
                setHasSearched(false);
                setFilteredTipificaciones([]);
              }}
            >
              <SelectTrigger id="filtro-canal" className="!h-7 !py-1 text-xs w-40 border-sky-500">
                <SelectValue placeholder="Seleccione canal" />
              </SelectTrigger>
              <SelectContent>
                {dbCanales.map((canal) => (
                  <SelectItem key={canal.idcanalcomunicacion} value={canal.nombre}>
                    {canal.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleBuscar} className="h-7 text-xs px-3">
            <Search className="w-3 h-3 mr-1" />
            Buscar
          </Button>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setImportProducto(''); setImportFile(null); setImportPreview(null); setShowImportDialog(true); }} className="h-7 text-xs px-3 border-sky-500 text-sky-600 hover:bg-sky-50">
              <Upload className="w-3 h-3 mr-1" />
              Importar
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }} className="h-7 text-xs px-3">
              <Plus className="w-3 h-3 mr-1" />
              Nueva Tipificación
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="text-xs max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                  <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                    <DialogTitle>
                      {editingTipificacion ? 'Editar Tipificación' : 'Nueva Tipificación'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure la información de la tipificación
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="space-y-1">
                        <Label htmlFor="producto" className="text-xs font-medium text-slate-600">Producto *</Label>
                        <Select
                          value={formData.productoId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, productoId: value })
                          }
                        >
                          <SelectTrigger id="producto" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue placeholder="Seleccione producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {dbProductos.map((producto) => (
                              <SelectItem key={producto.idproducto} value={producto.idproducto}>
                                {producto.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="canal" className="text-xs font-medium text-slate-600">Canal Comunicación *</Label>
                        <Select
                          value={formData.canalComunicacion}
                          onValueChange={(value) =>
                            setFormData({ ...formData, canalComunicacion: value })
                          }
                        >
                          <SelectTrigger id="canal" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue placeholder="Seleccione canal" />
                          </SelectTrigger>
                          <SelectContent>
                            {dbCanales.map((canal) => (
                              <SelectItem key={canal.idcanalcomunicacion} value={canal.nombre}>
                                {canal.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tipo" className="text-xs font-medium text-slate-600">Tipo Tipificación *</Label>
                        <Select
                          value={formData.tipoTipificacion}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tipoTipificacion: value })
                          }
                        >
                          <SelectTrigger id="tipo" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {dbTipos.map((tipo) => (
                              <SelectItem key={tipo.idtipotipificacion} value={tipo.nombre}>
                                {tipo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="codigoAccion" className="text-xs font-medium text-slate-600">Código Acción *</Label>
                        <Input
                          id="codigoAccion"
                          value={formData.codigoAccion}
                          onChange={(e) =>
                            setFormData({ ...formData, codigoAccion: e.target.value })
                          }
                          placeholder="Ej: CA01"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="codigoResultado" className="text-xs font-medium text-slate-600">Código Resultado *</Label>
                        <Input
                          id="codigoResultado"
                          value={formData.codigoResultado}
                          onChange={(e) =>
                            setFormData({ ...formData, codigoResultado: e.target.value })
                          }
                          placeholder="Ej: CR01"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="peso" className="text-xs font-medium text-slate-600">Peso *</Label>
                        <Input
                          id="peso"
                          type="number"
                          value={formData.peso}
                          onChange={(e) =>
                            setFormData({ ...formData, peso: parseInt(e.target.value) })
                          }
                          placeholder="0"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                          required
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="accion" className="text-xs font-medium text-slate-600">Acción *</Label>
                        <Input
                          id="accion"
                          value={formData.accion}
                          onChange={(e) =>
                            setFormData({ ...formData, accion: e.target.value })
                          }
                          placeholder="Descripción de la acción"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                          required
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="resultado" className="text-xs font-medium text-slate-600">Resultado *</Label>
                        <Input
                          id="resultado"
                          value={formData.resultado}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado: e.target.value })
                          }
                          placeholder="Descripción del resultado"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado1" className="text-xs font-medium text-slate-600">Resultado 1</Label>
                        <Input
                          id="resultado1"
                          value={formData.resultado1}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado1: e.target.value })
                          }
                          placeholder="Resultado adicional 1"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado2" className="text-xs font-medium text-slate-600">Resultado 2</Label>
                        <Input
                          id="resultado2"
                          value={formData.resultado2}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado2: e.target.value })
                          }
                          placeholder="Resultado adicional 2"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado3" className="text-xs font-medium text-slate-600">Resultado 3</Label>
                        <Input
                          id="resultado3"
                          value={formData.resultado3}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado3: e.target.value })
                          }
                          placeholder="Resultado adicional 3"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado4" className="text-xs font-medium text-slate-600">Resultado 4</Label>
                        <Input
                          id="resultado4"
                          value={formData.resultado4}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado4: e.target.value })
                          }
                          placeholder="Resultado adicional 4"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="resultado5" className="text-xs font-medium text-slate-600">Resultado 5</Label>
                        <Input
                          id="resultado5"
                          value={formData.resultado5}
                          onChange={(e) =>
                            setFormData({ ...formData, resultado5: e.target.value })
                          }
                          placeholder="Resultado adicional 5"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-slate-600">Razón No Pago</Label>
                        <div className="flex items-center gap-4 h-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="razonNoPago"
                              checked={formData.tieneRazonNoPago === true}
                              onChange={() => {
                                setFormData({ ...formData, tieneRazonNoPago: true });
                              }}
                              className="w-4 h-4"
                            />
                            <span>SÍ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="razonNoPago"
                              checked={formData.tieneRazonNoPago === false}
                              onChange={() => {
                                setFormData({ ...formData, tieneRazonNoPago: false });
                                setSelectedRazones([]);
                              }}
                              className="w-4 h-4"
                            />
                            <span>NO</span>
                          </label>
                        </div>
                        {formData.tieneRazonNoPago && (
                          <div className="flex flex-wrap gap-3 bg-sky-50 border border-sky-200 rounded-lg p-2 mt-1">
                            {razonesNoPago.map((razon) => (
                              <label key={razon.idrazonnopago} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedRazones.includes(razon.idrazonnopago)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRazones([...selectedRazones, razon.idrazonnopago]);
                                    } else {
                                      setSelectedRazones(selectedRazones.filter(id => id !== razon.idrazonnopago));
                                    }
                                  }}
                                />
                                <span className="text-xs text-slate-700">{razon.nombre}</span>
                              </label>
                            ))}
                            {razonesNoPago.length === 0 && (
                              <span className="text-xs text-slate-400">No hay razones de no pago configuradas</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Destacado</Label>
                        <div className="flex items-center gap-4 h-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="destacado"
                              checked={formData.destacado === true}
                              onChange={() =>
                                setFormData({ ...formData, destacado: true })
                              }
                              className="w-4 h-4"
                            />
                            <span>SÍ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="destacado"
                              checked={formData.destacado === false}
                              onChange={() =>
                                setFormData({ ...formData, destacado: false })
                              }
                              className="w-4 h-4"
                            />
                            <span>NO</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Mostrar</Label>
                        <div className="flex items-center gap-4 h-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mostrar"
                              checked={formData.mostrar === true}
                              onChange={() =>
                                setFormData({ ...formData, mostrar: true })
                              }
                              className="w-4 h-4"
                            />
                            <span>SÍ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mostrar"
                              checked={formData.mostrar === false}
                              onChange={() =>
                                setFormData({ ...formData, mostrar: false })
                              }
                              className="w-4 h-4"
                            />
                            <span>NO</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <Button type="submit" className="flex-1 !h-7">
                        {editingTipificacion ? 'Actualizar' : 'Crear Tipificación'}
                      </Button>
                      <Button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                  </div>
                </DialogContent>
              </Dialog>
        </div>

        {/* Tabla de Tipificaciones */}
        <div className="border rounded-lg overflow-x-auto max-w-full w-fit">
          <Table className="w-fit" containerClassName="w-fit">
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold whitespace-nowrap p-1 border-r border-gray-300">
                  <div className="space-y-0.5">
                    <div>Tipo Tipificación</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroTipoTipificacion}
                      onChange={(e) => setFiltroTipoTipificacion(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap p-1 border-r border-gray-300">Canal</TableHead>
                <TableHead className="font-semibold whitespace-nowrap p-1 border-r border-gray-300">
                  <div className="space-y-0.5">
                    <div>Cod. Acción</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroCodigoAccion}
                      onChange={(e) => setFiltroCodigoAccion(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold p-1 border-r border-gray-300 min-w-[120px]">
                  <div className="space-y-0.5">
                    <div>Acción</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroAccion}
                      onChange={(e) => setFiltroAccion(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap p-1 border-r border-gray-300">
                  <div className="space-y-0.5">
                    <div>Cod. Resultado</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroCodigoResultado}
                      onChange={(e) => setFiltroCodigoResultado(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold p-1 border-r border-gray-300 min-w-[140px]">
                  <div className="space-y-0.5">
                    <div>Resultado</div>
                    <Input
                      placeholder="Filtrar..."
                      value={filtroResultado}
                      onChange={(e) => setFiltroResultado(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center whitespace-nowrap p-1 border-r border-gray-300">Peso</TableHead>
                <TableHead className="font-semibold text-center whitespace-nowrap p-1 border-r border-gray-300">Mostrar</TableHead>
                <TableHead className="font-semibold text-center whitespace-nowrap p-1 border-r border-gray-300">Dest.</TableHead>
                <TableHead className="font-semibold text-right whitespace-nowrap p-1">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTipificaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-gray-500">
                    No hay tipificaciones configuradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTipificaciones.map((tipificacion) => (
                  <TableRow key={tipificacion.id} className="border-b border-gray-300">
                    <TableCell className="font-medium whitespace-nowrap p-1 border-r border-gray-300">
                      {tipificacion.tipoTipificacion}
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-1 border-r border-gray-300">{tipificacion.canalComunicacion}</TableCell>
                    <TableCell className="whitespace-nowrap p-1 border-r border-gray-300">{tipificacion.codigoAccion}</TableCell>
                    <TableCell className="p-1 border-r border-gray-300">{tipificacion.accion}</TableCell>
                    <TableCell className="whitespace-nowrap p-1 border-r border-gray-300">{tipificacion.codigoResultado}</TableCell>
                    <TableCell className="p-1 border-r border-gray-300">{tipificacion.resultado}</TableCell>
                    <TableCell className="text-center whitespace-nowrap p-1 border-r border-gray-300">
                      <span className="px-2 py-0.5 bg-gray-100 rounded font-medium">
                        {tipificacion.peso}
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap p-1 border-r border-gray-300">
                      {tipificacion.mostrar ? (
                        <span className="text-green-600 font-medium">SÍ</span>
                      ) : (
                        <span className="text-gray-400">NO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap p-1 border-r border-gray-300">
                      {tipificacion.tieneRazonNoPago ? (
                        <span className="text-green-600 font-medium">SÍ</span>
                      ) : (
                        <span className="text-gray-400">NO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right p-1">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tipificacion)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {requiereConfiguracion(tipificacion.tipoTipificacion) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenConfig(tipificacion)}
                              title="Configuración"
                            >
                              <Settings className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCiclo(tipificacion)}
                              title="Ciclo del Acuerdo"
                            >
                              <GitBranch className="w-4 h-4 text-purple-600" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleMostrar(tipificacion.id)}
                          title={tipificacion.mostrar ? 'Ocultar' : 'Mostrar'}
                        >
                          {tipificacion.mostrar ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEstado(tipificacion.id)}
                          title={tipificacion.estado === 'activo' ? 'Deshabilitar' : 'Habilitar'}
                        >
                          {tipificacion.estado === 'activo' ? (
                            <Power className="w-4 h-4 text-green-600" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-red-600" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tipificacion.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog de Configuración */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="text-xs max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
              <DialogTitle>Configuración de {configTipificacion?.tipoTipificacion}</DialogTitle>
              <DialogDescription>
                Tipificación: {configTipificacion?.resultado}
              </DialogDescription>
            </DialogHeader>

            {camposNumericos.length === 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-2">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Atención:</strong> No hay campos numéricos configurados en las plantillas de Obligación.
                  Para utilizar las validaciones de monto mínimo y máximo, debe:
                  <br />
                  1. Ir a <strong>Plantillas de Cargue</strong>
                  <br />
                  2. Crear/editar una plantilla de tipo <strong>Obligación</strong>
                  <br />
                  3. Definir un <strong>"Campo Origen"</strong> en los campos numéricos que desee utilizar
                </p>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="maxCuotas" className="text-xs font-medium text-slate-600">Cantidad máx. de cuotas</Label>
                  <Input
                    id="maxCuotas"
                    type="number"
                    value={configData.maxCuotas}
                    onChange={(e) =>
                      setConfigData({ ...configData, maxCuotas: parseInt(e.target.value) })
                    }
                    min="1"
                    className="h-7 text-xs border-sky-500 focus:border-sky-600"
                    required
                  />
                </div>

                {/* Monto Mínimo */}
                <div className="p-3 border-2 border-slate-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montoMinimoEnabled"
                      checked={configData.montoMinimo.enabled}
                      onCheckedChange={(checked) =>
                        setConfigData({
                          ...configData,
                          montoMinimo: { ...configData.montoMinimo, enabled: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="montoMinimoEnabled" className="text-xs font-semibold text-slate-700">
                      Monto mínimo cobrar
                    </Label>
                  </div>

                  {configData.montoMinimo.enabled && (
                    <div className="grid grid-cols-3 gap-3 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Comparador</Label>
                        <Select
                          value={configData.montoMinimo.comparador}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: { ...configData.montoMinimo, comparador: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPARADORES.map((comp) => (
                              <SelectItem key={comp.value} value={comp.value}>
                                {comp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Campo numérico</Label>
                        <Select
                          value={configData.montoMinimo.campo}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: { ...configData.montoMinimo, campo: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue placeholder={camposNumericos.length === 0 ? "No hay campos disponibles" : "Seleccione un campo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {camposNumericos.length === 0 ? (
                              <SelectItem value="no-disponible" disabled>
                                No hay campos numéricos configurados
                              </SelectItem>
                            ) : (
                              camposNumericos.map((campo) => (
                                <SelectItem key={campo} value={campo}>
                                  {campo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Porcentaje (%)</Label>
                        <Input
                          type="number"
                          value={configData.montoMinimo.porcentaje}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              montoMinimo: {
                                ...configData.montoMinimo,
                                porcentaje: parseInt(e.target.value) || 0
                              }
                            })
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Monto Máximo */}
                <div className="p-3 border-2 border-slate-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="montoMaximoEnabled"
                      checked={configData.montoMaximo.enabled}
                      onCheckedChange={(checked) =>
                        setConfigData({
                          ...configData,
                          montoMaximo: { ...configData.montoMaximo, enabled: !!checked }
                        })
                      }
                    />
                    <Label htmlFor="montoMaximoEnabled" className="text-xs font-semibold text-slate-700">
                      Monto Máximo cobrar
                    </Label>
                  </div>

                  {configData.montoMaximo.enabled && (
                    <div className="grid grid-cols-3 gap-3 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Comparador</Label>
                        <Select
                          value={configData.montoMaximo.comparador}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: { ...configData.montoMaximo, comparador: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPARADORES.map((comp) => (
                              <SelectItem key={comp.value} value={comp.value}>
                                {comp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Campo numérico</Label>
                        <Select
                          value={configData.montoMaximo.campo}
                          onValueChange={(value) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: { ...configData.montoMaximo, campo: value }
                            })
                          }
                        >
                          <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                            <SelectValue placeholder={camposNumericos.length === 0 ? "No hay campos disponibles" : "Seleccione un campo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {camposNumericos.length === 0 ? (
                              <SelectItem value="no-disponible" disabled>
                                No hay campos numéricos configurados
                              </SelectItem>
                            ) : (
                              camposNumericos.map((campo) => (
                                <SelectItem key={campo} value={campo}>
                                  {campo}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">Porcentaje (%)</Label>
                        <Input
                          type="number"
                          value={configData.montoMaximo.porcentaje}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              montoMaximo: {
                                ...configData.montoMaximo,
                                porcentaje: parseInt(e.target.value) || 0
                              }
                            })
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          className="h-7 text-xs border-sky-500 focus:border-sky-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="submit" className="flex-1 !h-7">
                  Guardar Configuración
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsConfigDialogOpen(false)}
                  className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ciclo del Acuerdo */}
        <Dialog open={isCicloDialogOpen} onOpenChange={setIsCicloDialogOpen}>
          <DialogContent className="text-xs !max-w-[705px] max-h-[90vh] flex flex-col overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
              <DialogTitle>Ciclo del Acuerdo</DialogTitle>
              <DialogDescription>
                Tipificación: {cicloTipificacion?.resultado}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* Formulario para agregar ciclo */}
              <div className="text-xs border-2 border-slate-300 rounded-lg p-3 bg-slate-50 flex-shrink-0">
                <h3 className="font-semibold mb-2 text-slate-700">Estados del ciclo</h3>
                <form onSubmit={handleAddCiclo} className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="estadoActual" className="text-xs font-medium text-slate-600">Estado Actual *</Label>
                      <Select
                        value={cicloData.estadoActual}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, estadoActual: value })
                        }
                      >
                        <SelectTrigger id="estadoActual" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CICLO.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="estadoSiguiente" className="text-xs font-medium text-slate-600">Estado Siguiente *</Label>
                      <Select
                        value={cicloData.estadoSiguiente}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, estadoSiguiente: value })
                        }
                      >
                        <SelectTrigger id="estadoSiguiente" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CICLO.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tipoUsuario" className="text-xs font-medium text-slate-600">Tipo Usuario *</Label>
                      <Select
                        value={cicloData.tipoUsuario}
                        onValueChange={(value) =>
                          setCicloData({ ...cicloData, tipoUsuario: value })
                        }
                      >
                        <SelectTrigger id="tipoUsuario" className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_USUARIO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="!h-7">
                    Guardar
                  </Button>
                </form>
              </div>

              {/* Tabla de Ciclos */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="font-semibold mb-2 flex-shrink-0 text-slate-700">Ciclo de Estado</h3>
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                  {/* Cabecera fija */}
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-200">
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                            <div className="space-y-1">
                              <div>Estado Actual</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroEstadoActual}
                                onChange={(e) => setFiltroEstadoActual(e.target.value)}
                                className="h-7 text-xs border-sky-500 focus:border-sky-600"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                            <div className="space-y-1">
                              <div>Estado Siguiente</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroEstadoSiguiente}
                                onChange={(e) => setFiltroEstadoSiguiente(e.target.value)}
                                className="h-7 text-xs border-sky-500 focus:border-sky-600"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                            <div className="space-y-1">
                              <div>Tipo Usuario</div>
                              <Input
                                placeholder="Filtrar..."
                                value={filtroTipoUsuario}
                                onChange={(e) => setFiltroTipoUsuario(e.target.value)}
                                className="h-7 text-xs border-sky-500 focus:border-sky-600"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold border-r-2 border-slate-300" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>Estado</TableHead>
                          <TableHead className="font-semibold text-right" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>
                  
                  {/* Cuerpo con scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <Table>
                      <TableBody>
                      {(() => {
                        const { registros, totalRegistros } = getCiclosFiltradosYPaginados(cicloTipificacion?.id || '');
                        return totalRegistros === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                              No hay ciclos configurados
                            </TableCell>
                          </TableRow>
                        ) : (
                          registros.map((ciclo) => (
                            <TableRow key={ciclo.id} className="border-b-2 border-slate-300">
                              <TableCell className="font-medium border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>{ciclo.estadoActual}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>{ciclo.estadoSiguiente}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>{ciclo.tipoUsuario}</TableCell>
                              <TableCell className="border-r-2 border-slate-300" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    ciclo.estado === 'activo'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {ciclo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleCicloEstado(ciclo.id)}
                                    title={
                                      ciclo.estado === 'activo' ? 'Desactivar' : 'Activar'
                                    }
                                  >
                                    {ciclo.estado === 'activo' ? (
                                      <Power className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <PowerOff className="w-4 h-4 text-slate-400" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteCiclo(ciclo.id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        );
                      })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginación */}
                <div className="flex-shrink-0">
                {(() => {
                  const { totalPaginas, paginaActual, totalRegistros } = getCiclosFiltradosYPaginados(cicloTipificacion?.id || '');

                  if (totalRegistros === 0) return null;

                  // Generar números de página a mostrar
                  const getPaginasVisibles = () => {
                    const paginas = [];
                    const maxVisible = 5;

                    if (totalPaginas <= maxVisible) {
                      // Mostrar todas las páginas
                      for (let i = 1; i <= totalPaginas; i++) {
                        paginas.push(i);
                      }
                    } else {
                      // Mostrar páginas con elipsis
                      if (paginaActual <= 3) {
                        paginas.push(1, 2, 3, 4, '...', totalPaginas);
                      } else if (paginaActual >= totalPaginas - 2) {
                        paginas.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
                      } else {
                        paginas.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
                      }
                    }

                    return paginas;
                  };

                  return (
                    <div className="flex items-center justify-between mt-3 px-2">
                      <div className="text-xs text-slate-600">
                        Mostrando {((paginaActual - 1) * registrosPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * registrosPorPagina, totalRegistros)} de{' '}
                        {totalRegistros} registros
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaCiclo(prev => Math.max(1, prev - 1))}
                          disabled={paginaActual === 1}
                          className="!h-7 text-xs"
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {getPaginasVisibles().map((pagina, index) =>
                            pagina === '...' ? (
                              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                                ...
                              </span>
                            ) : (
                              <Button
                                key={pagina}
                                variant={pagina === paginaActual ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPaginaCiclo(pagina as number)}
                                className="min-w-[32px] !h-7 text-xs"
                              >
                                {pagina}
                              </Button>
                            )
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaCiclo(prev => Math.min(totalPaginas, prev + 1))}
                          disabled={paginaActual === totalPaginas}
                          className="!h-7 text-xs"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportPreview(null); } }}>
          <DialogContent style={importPreview ? { width: 'fit-content', maxWidth: '95vw' } : undefined} className="text-xs max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                Importar Tipificaciones
              </DialogTitle>
              <DialogDescription>
                Importe tipificaciones desde un archivo CSV para un producto seleccionado
              </DialogDescription>
            </DialogHeader>

            {!importPreview ? (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-800 mb-1">Instrucciones:</p>
                  <ol className="list-decimal list-inside text-blue-700 space-y-0.5">
                    <li>Seleccione el producto al que se asignarán las tipificaciones</li>
                    <li>Descargue la plantilla CSV y complete los datos</li>
                    <li>Seleccione el archivo CSV completado</li>
                    <li>Haga clic en "Vista Previa" para verificar los datos</li>
                  </ol>
                  <p className="mt-1.5 text-blue-600">
                    <strong>Separadores aceptados:</strong> punto y coma (;) o coma (,)
                  </p>
                </div>

                {/* Product selector */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600">Producto *</Label>
                  <Select value={importProducto} onValueChange={setImportProducto}>
                    <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500 focus:border-sky-600">
                      <SelectValue placeholder="Seleccione producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {dbProductos.map((producto) => (
                        <SelectItem key={producto.idproducto} value={producto.idproducto}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadTipificacionTemplate} className="h-7 text-xs">
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Descargar Plantilla
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()} className="h-7 text-xs">
                    <Upload className="w-3 h-3 mr-1" />
                    Seleccionar Archivo
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportFileChange}
                />

                {/* File info */}
                {importFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-green-800">
                      <strong>Archivo seleccionado:</strong> {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}

                {/* Columns reference */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <p className="font-medium text-slate-600 mb-1">Columnas de la plantilla:</p>
                  <p className="text-slate-500 break-all">{TIPIFICACION_CSV_COLUMNS.join(', ')}</p>
                  <p className="text-slate-400 mt-1">Columnas obligatorias: <strong>CANAL_COMUNICACION, TIPO_TIPIFICACION</strong></p>
                </div>

                {/* Preview button */}
                <Button
                  onClick={handleImportPreview}
                  disabled={!importFile || !importProducto}
                  className="w-full !h-8"
                >
                  Vista Previa
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Preview header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">
                      {importPreview.rows.length} registro(s) encontrado(s)
                    </p>
                    {importPreview.warnings.length > 0 && (
                      <p className="text-amber-600 text-xs">{importPreview.warnings.length} advertencia(s)</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImportPreview(null)}
                    className="text-xs"
                  >
                    Cambiar archivo
                  </Button>
                </div>

                {/* Warnings */}
                {importPreview.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 max-h-24 overflow-y-auto">
                    {importPreview.warnings.slice(0, 10).map((w, i) => (
                      <p key={i} className="text-amber-800 text-xs">{w}</p>
                    ))}
                    {importPreview.warnings.length > 10 && (
                      <p className="text-amber-600 text-xs mt-1">
                        ... y {importPreview.warnings.length - 10} advertencia(s) más
                      </p>
                    )}
                  </div>
                )}

                {/* Preview table */}
                <div className="border-2 border-slate-300 rounded-lg overflow-auto max-h-[50vh]">
                  <Table className="w-fit" containerClassName="w-fit">
                    <TableHeader>
                      <TableRow className="bg-slate-200">
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">#</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Canal</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Tipo</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Cod. Acción</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Acción</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Cod. Resultado</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Resultado</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap px-2">Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.rows.slice(0, 50).map((r, i) => (
                        <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <TableCell className="text-xs px-2">{i + 1}</TableCell>
                          <TableCell className="text-xs px-2 whitespace-nowrap">{r.CANAL_COMUNICACION}</TableCell>
                          <TableCell className="text-xs px-2 whitespace-nowrap">{r.TIPO_TIPIFICACION}</TableCell>
                          <TableCell className="text-xs px-2 whitespace-nowrap">{r.CODACCION}</TableCell>
                          <TableCell className="text-xs px-2">{r.ACCION}</TableCell>
                          <TableCell className="text-xs px-2 whitespace-nowrap">{r.CODRESULTADO}</TableCell>
                          <TableCell className="text-xs px-2">{r.RESULTADO}</TableCell>
                          <TableCell className="text-xs px-2 text-center">{r.PESO}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importPreview.rows.length > 50 && (
                  <p className="text-xs text-slate-500 text-center">
                    Mostrando 50 de {importPreview.rows.length} registros
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setImportPreview(null); }}
                    disabled={importing}
                    className="h-8"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImportExecute}
                    disabled={importing}
                    className="h-8 bg-sky-600 hover:bg-sky-700"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Confirmar Importación
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}