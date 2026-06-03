import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  Upload, FileSpreadsheet, AlertCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Cargue, ProductoHomologacion } from '../../lib/db';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '../ui/dialog';

export function CargueModule() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const requireUser = (): string => {
    if (!currentUser?.id) { toast.error('Debe iniciar sesión'); throw new Error('No autenticado'); }
    return currentUser.id;
  };

  // Data
  const [productos, setProductos] = useState<any[]>([]);
  const [bases, setBases] = useState<any[]>([]);
  const [cargueTipos, setCargueTipos] = useState<any[]>([]);
  const [origenes, setOrigenes] = useState<any[]>([]);
  const [retiroTipos, setRetiroTipos] = useState<any[]>([]);
  const [cargues, setCargues] = useState<Cargue[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTipoCargue, setSelectedTipoCargue] = useState('');
  const [selectedOrigen, setSelectedOrigen] = useState('');
  const [selectedRetiroTipo, setSelectedRetiroTipo] = useState('');

  // File
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ phase: '', done: 0, total: 0 });

  // Validation dialog state
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [validationCanProceed, setValidationCanProceed] = useState(false);
  const [validationSummary, setValidationSummary] = useState({ matched: 0, total: 0, totalRows: 0, emptyRows: 0 });
  const [pendingUploadData, setPendingUploadData] = useState<{
    csvRows: string[][];
    homologacion: ProductoHomologacion[];
  } | null>(null);

  // Telefonos preview state
  const [showTelefonosDialog, setShowTelefonosDialog] = useState(false);
  const [telefonosPreview, setTelefonosPreview] = useState<{
    totalFilas: number;
    telefonosExistentes: number;
    telefonosNuevos: number;
    relacionesExistentes: number;
    relacionesNuevas: number;
  } | null>(null);
  const [pendingTelefonosData, setPendingTelefonosData] = useState<{
    telefonos: { identificacion: string; telefono: string }[];
  } | null>(null);

  // Retiro preview state
  const [showRetiroDialog, setShowRetiroDialog] = useState(false);
  const [retiroPreview, setRetiroPreview] = useState<{
    totalFilas: number;
    retirosValidos: number;
    retirosInvalidos: number;
  } | null>(null);
  const [pendingRetiroData, setPendingRetiroData] = useState<{
    retiros: { valor: string; motivo: string }[];
  } | null>(null);

  // Pagination
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;
  const isTelefonos = cargueTipos.some((ct: any) => ct.idtipocargue === selectedTipoCargue && ct.nombre?.toLowerCase() === 'telefonos');
  const isRetiro = cargueTipos.some((ct: any) => ct.idtipocargue === selectedTipoCargue && ct.nombre?.toLowerCase() === 'retiro');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, ctData] = await Promise.all([db.getProductos(), db.getCargueTipos()]);
      const origData = await db.getOrigenes();
      const rtData = await db.getRetiroTipos();
      setProductos(prodData.filter((p: any) => p.estado === 'activo'));
      setCargueTipos(ctData);
      setOrigenes(origData);
      setRetiroTipos(rtData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Filter bases by product
  useEffect(() => {
    if (selectedProducto) {
      db.getBasesByProducto(selectedProducto).then(setBases).catch(() => setBases([]));
    } else {
      setBases([]);
    }
    setSelectedBase('');
  }, [selectedProducto]);

  // Load cargues when product changes
  useEffect(() => {
    if (selectedProducto) {
      db.getCarguesByProducto(selectedProducto).then(setCargues).catch(() => setCargues([]));
    } else {
      setCargues([]);
    }
    setPaginaActual(1);
  }, [selectedProducto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        toast.error('Tipo de archivo no válido. Use CSV o Excel.');
      }
    }
  };

  // ===================== CSV PARSING =====================
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const stripBOM = (text: string): string => {
    if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
    return text;
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

  // ===================== VALIDATION =====================
  interface ValidationResult {
    errors: string[];
    warnings: string[];
    canProceed: boolean;
    summary: { matched: number; total: number; totalRows: number; emptyRows: number };
  }

  const normalize = (s: string) =>
    s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const validateCsvAgainstPlantilla = (
    csvRows: string[][],
    homologacion: ProductoHomologacion[],
  ): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (csvRows.length < 2) {
      errors.push('El archivo no contiene filas de datos (solo encabezados o vacío).');
      return { errors, warnings, canProceed: false, summary: { matched: 0, total: 0, totalRows: 0, emptyRows: 0 } };
    }

    const csvHeaders = csvRows[0];
    const headerMap = new Map<string, number>();
    csvHeaders.forEach((h, i) => headerMap.set(normalize(h), i));
    const dataRows = csvRows.slice(1);

    const fieldsWithOrigen = homologacion.filter(c => c.nombreCampoOrigen);
    let matched = 0;

    // 1. Campos obligatorios sin columna en CSV
    for (const campo of fieldsWithOrigen) {
      const found = headerMap.has(normalize(campo.nombreCampoOrigen!));
      if (found) {
        matched++;
      } else if (campo.obligatorio) {
        errors.push(`Campo obligatorio "${campo.nombreCampoOrigen}" → ${campo.nombreColumna} no encontrado en el archivo.`);
      } else {
        warnings.push(`Campo "${campo.nombreCampoOrigen}" → ${campo.nombreColumna} no encontrado en el archivo.`);
      }
    }

    // 2. Columnas del CSV no mapeadas en la plantilla
    const plantillaHeaders = new Set(fieldsWithOrigen.map(c => normalize(c.nombreCampoOrigen!)));
    for (const header of csvHeaders) {
      if (!plantillaHeaders.has(normalize(header))) {
        warnings.push(`Columna "${header}" del archivo no está en la plantilla.`);
      }
    }

    // 3. Validar tipos de datos en muestra de filas
    const dateFields = homologacion.filter(c => c.tipoDatoNombre === 'fecha' && c.nombreCampoOrigen && headerMap.has(normalize(c.nombreCampoOrigen)));
    const numericFields = homologacion.filter(c => c.tipoDatoNombre === 'numerico' && c.nombreCampoOrigen && headerMap.has(normalize(c.nombreCampoOrigen)));
    const sampleSize = Math.min(dataRows.length, 100);
    const dateFormats = new Map<string, number>();

    for (const field of dateFields) {
      const idx = headerMap.get(normalize(field.nombreCampoOrigen!))!;
      let invalidCount = 0;
      let sampleCount = 0;
      for (let r = 0; r < sampleSize; r++) {
        const val = dataRows[r]?.[idx];
        if (!val || !val.trim()) continue;
        sampleCount++;
        const ddmmyyyy = /^\d{1,2}\/\d{1,2}\/\d{4}/;
        const yyyymmdd = /^\d{4}-\d{1,2}-\d{1,2}/;
        if (!ddmmyyyy.test(val) && !yyyymmdd.test(val)) {
          invalidCount++;
        }
      }
      if (invalidCount > 0 && sampleCount > 0) {
        warnings.push(`Campo fecha "${field.nombreCampoOrigen}" tiene ${invalidCount} de ${sampleCount} valores con formato no reconocido (se esperan DD/MM/AAAA o AAAA-MM-DD).`);
      }
    }

    for (const field of numericFields) {
      const idx = headerMap.get(normalize(field.nombreCampoOrigen!))!;
      let invalidCount = 0;
      let sampleCount = 0;
      for (let r = 0; r < sampleSize; r++) {
        const val = dataRows[r]?.[idx];
        if (!val || !val.trim()) continue;
        sampleCount++;
        const lastDot = val.lastIndexOf('.');
        const lastComma = val.lastIndexOf(',');
        let clean: string;
        if (lastDot > -1 && lastComma > -1) {
          clean = lastDot > lastComma ? val.replace(/,/g, '') : val.replace(/\./g, '').replace(',', '.');
        } else if (lastComma > -1) {
          clean = val.replace(',', '.');
        } else {
          clean = val;
        }
        if (isNaN(Number(clean))) {
          invalidCount++;
        }
      }
      if (invalidCount > 0 && sampleCount > 0) {
        warnings.push(`Campo numérico "${field.nombreCampoOrigen}" tiene ${invalidCount} de ${sampleCount} valores no numéricos.`);
      }
    }

    // 4. Filas sin identificación
    const identField = homologacion.find(c => c.nombreColumna.toLowerCase() === 'identificacion');
    let emptyRows = 0;
    if (identField?.nombreCampoOrigen) {
      const idx = headerMap.get(normalize(identField.nombreCampoOrigen));
      if (idx !== undefined) {
        emptyRows = dataRows.filter(row => !row[idx] || !row[idx].trim()).length;
        if (emptyRows > 0) {
          warnings.push(`${emptyRows} fila(s) sin identificación serán omitidas.`);
        }
      }
    }

    return {
      errors,
      warnings,
      canProceed: errors.length === 0,
      summary: { matched, total: fieldsWithOrigen.length, totalRows: dataRows.length, emptyRows },
    };
  };

  // ===================== MAPPING WITH PLANTILLA =====================
  const mapCsvToRecords = (
    csvRows: string[][],
    homologacion: ProductoHomologacion[],
  ): { tableRows: Record<string, Record<string, any>[]>; totalRows: number } => {
    if (csvRows.length < 2) throw new Error('El archivo CSV no tiene datos');

    const headers = csvRows[0];
    const dataRows = csvRows.slice(1);

    // Build header index map (lowercase, no accents for matching)
    const normalize = (s: string) =>
      s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const headerMap = new Map<string, number>();
    headers.forEach((h, i) => headerMap.set(normalize(h), i));

    // Group homologacion fields by target table
    const fieldsByTable = new Map<string, ProductoHomologacion[]>();
    for (const field of homologacion) {
      const tableName = field.tablaNombre?.toLowerCase() || 'personas';
      if (!fieldsByTable.has(tableName)) fieldsByTable.set(tableName, []);
      fieldsByTable.get(tableName)!.push(field);
    }

    // Map: nombrecampoorigen -> header index (normalized)
    const mapField = (field: ProductoHomologacion): number | null => {
      if (!field.nombreCampoOrigen) return null;
      const idx = headerMap.get(normalize(field.nombreCampoOrigen));
      return idx !== undefined ? idx : null;
    };

    // Log unmatched fields for diagnostics
    const unmatchedFields = homologacion
      .filter(f => f.nombreCampoOrigen && mapField(f) === null)
      .map(f => `"${f.nombreCampoOrigen}" (${f.tablaNombre}.${f.nombreColumna})`);
    if (unmatchedFields.length > 0) {
      console.warn('Campos de plantilla no encontrados en CSV:', unmatchedFields);
    }

    // Pre-compute field type maps per table
    const dateFieldsByTable = new Map<string, Set<string>>();
    const numericFieldsByTable = new Map<string, Set<string>>();
    for (const [tableName, fields] of fieldsByTable) {
      dateFieldsByTable.set(tableName, new Set(
        fields.filter(f => f.tipoDatoNombre === 'fecha').map(f => f.nombreColumna.toLowerCase())
      ));
      numericFieldsByTable.set(tableName, new Set(
        fields.filter(f => f.tipoDatoNombre === 'numerico').map(f => f.nombreColumna.toLowerCase())
      ));
    }

    const convertDate = (val: string): string | null => {
      if (!val || !val.trim()) return null;
      const m = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(val.trim())) return val.trim().split(' ')[0];
      return null;
    };

    const convertNumeric = (val: string): string | null => {
      if (!val || !val.trim()) return null;
      const v = val.trim();
      const lastDot = v.lastIndexOf('.');
      const lastComma = v.lastIndexOf(',');
      let clean: string;
      if (lastDot > -1 && lastComma > -1) {
        // Ambos separadores: el último es el decimal
        if (lastDot > lastComma) {
          clean = v.replace(/,/g, ''); // punto decimal, coma miles
        } else {
          clean = v.replace(/\./g, '').replace(',', '.'); // coma decimal, punto miles
        }
      } else if (lastComma > -1) {
        clean = v.replace(',', '.'); // solo coma: decimal europeo
      } else {
        clean = v; // solo punto o sin separadores: formato estándar
      }
      const num = Number(clean);
      return isNaN(num) ? null : String(num);
    };

    // Build records grouped by table
    const tableRows = new Map<string, Record<string, any>[]>();
    for (const tableName of fieldsByTable.keys()) {
      tableRows.set(tableName, []);
    }

    let skippedRows = 0;

    for (const row of dataRows) {
      if (row.length === 0 || row.every(c => !c)) continue;

      for (const [tableName, fields] of fieldsByTable) {
        const record: Record<string, any> = {};
        let identificacion = '';
        const dateFields = dateFieldsByTable.get(tableName) || new Set();
        const numericFields = numericFieldsByTable.get(tableName) || new Set();

        for (const field of fields) {
          const csvIdx = mapField(field);
          const rawValue = csvIdx !== null && csvIdx < row.length ? row[csvIdx] : '';
          const colName = field.nombreColumna.toLowerCase();

          let value: string | null = rawValue || null;

          if (value && dateFields.has(colName)) {
            value = convertDate(value);
          } else if (value && numericFields.has(colName)) {
            value = convertNumeric(value);
          }

          record[colName] = value;
          if (colName === 'identificacion') identificacion = rawValue;
        }

        if (!identificacion) { skippedRows++; continue; }

        tableRows.get(tableName)!.push(record);
      }
    }

    if (skippedRows > 0) {
      console.warn(`${skippedRows} filas sin identificación fueron omitidas`);
    }

    const result: Record<string, Record<string, any>[]> = {};
    let totalRows = 0;
    for (const [tableName, rows] of tableRows) {
      result[tableName] = rows;
      totalRows += rows.length;
    }

    return { tableRows: result, totalRows };
  };

  // ===================== CONTINUE UPLOAD AFTER VALIDATION =====================
  const handleContinueUpload = async () => {
    if (!pendingUploadData || !file) return;
    setShowValidationDialog(false);

    const { csvRows, homologacion } = pendingUploadData;
    const userId = requireUser();

    try {
      setUploading(true);

      setProgress({ phase: 'Mapeando datos...', done: 2, total: 5 });
      const { tableRows, totalRows } = mapCsvToRecords(csvRows, homologacion);

      if (totalRows === 0) {
        toast.error('No se encontraron registros válidos después de la validación.');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      setProgress({ phase: 'Creando registro de cargue...', done: 3, total: 5 });
      const cargueRecord = await db.createCargue({
        idtipocargue: selectedTipoCargue,
        idbase: selectedBase,
        nombrearchivo: file.name,
        cantidadregistros: totalRows,
        idusuario: userId,
        idusuariomod: userId,
        estado: 'activo',
      });
      const idcargue = cargueRecord.idcargue;

      // Insert into each target table
      const tableLabels: Record<string, string> = { personas: 'personas', pagos: 'pagos', campanas: 'campañas' };

      for (const [tableName, rows] of Object.entries(tableRows)) {
        if (rows.length === 0) continue;

        const rowsWithCargue = rows.map(r => ({
          ...r,
          idcargue,
          idusuario: userId,
          estado: 'activo',
        }));

        if (tableName === 'personas') {
          await db.batchInsertPersonas(rowsWithCargue, 200, (done, total) => {
            setProgress({ phase: `Insertando ${done} de ${total} registros en personas...`, done, total });
          });
        } else if (tableName === 'pagos') {
          await db.batchInsertPagos(rowsWithCargue, 200, (done, total) => {
            setProgress({ phase: `Insertando ${done} de ${total} registros en pagos...`, done, total });
          });
        } else if (tableName === 'campanas') {
          await db.batchInsertCampanas(rowsWithCargue, 200, (done, total) => {
            setProgress({ phase: `Insertando ${done} de ${total} registros en campañas...`, done, total });
          });
        }
      }

      setProgress({ phase: 'Actualizando estado de cargues...', done: 4, total: 5 });
      await db.inactivateCarguesByTipoCargue(selectedBase, selectedTipoCargue, idcargue, userId);

      const tipoCargueNombre = cargueTipos.find(ct => ct.idtipocargue === selectedTipoCargue)?.nombre?.toLowerCase();
      if (tipoCargueNombre === 'persona') {
        await db.updateBaseCargueGestionar(selectedBase, idcargue, userId);
      }

      setProgress({ phase: 'Completado', done: 5, total: 5 });

      // Build table-specific success message
      const parts = Object.entries(tableRows)
        .filter(([, rows]) => rows.length > 0)
        .map(([table, rows]) => `${rows.length} registros en ${tableLabels[table] || table}`);
      toast.success(`Cargue completado: ${parts.join(', ')}`);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const updatedCargues = await db.getCarguesByProducto(selectedProducto);
      setCargues(updatedCargues);
    } catch (error: any) {
      console.error('Error en cargue:', error);
      toast.error(error?.message || 'Error al procesar el cargue');
    } finally {
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
      setPendingUploadData(null);
    }
  };

  // ===================== DOWNLOAD TELEFONOS TEMPLATE =====================
  const handleDownloadTemplate = () => {
    const csv = 'identificacion,telefono\n12345678,987654321\n87654321,912345678';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_telefonos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===================== TELEFONOS PREVIEW =====================
  const handleTelefonosPreview = async () => {
    try {
      setUploading(true);
      setProgress({ phase: 'Leyendo archivo...', done: 1, total: 3 });

      const text = await file!.text();
      const csvRows = parseCSV(text);

      if (csvRows.length < 2) {
        toast.error('El archivo no contiene filas de datos.');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      const headers = csvRows[0].map(h => normalize(h));
      const identIdx = headers.findIndex(h => h === 'identificacion');
      const telIdx = headers.findIndex(h => h === 'telefono');

      if (identIdx === -1 || telIdx === -1) {
        toast.error('El archivo debe tener las columnas "identificacion" y "telefono".');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      const telefonos: { identificacion: string; telefono: string }[] = [];
      const dataRows = csvRows.slice(1);
      let emptyRows = 0;
      for (const row of dataRows) {
        const ident = row[identIdx]?.trim();
        const tel = row[telIdx]?.trim();
        if (!ident || !tel) { emptyRows++; continue; }
        telefonos.push({ identificacion: ident, telefono: tel });
      }

      if (telefonos.length === 0) {
        toast.error('No se encontraron registros válidos en el archivo.');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      setProgress({ phase: 'Consultando teléfonos existentes...', done: 2, total: 3 });
      const preview = await db.previewTelefonos(selectedOrigen, telefonos);
      setTelefonosPreview(preview);
      setPendingTelefonosData({ telefonos });

      if (emptyRows > 0) {
        setValidationWarnings([`${emptyRows} fila(s) sin identificación o teléfono fueron omitidas.`]);
      } else {
        setValidationWarnings([]);
      }

      setShowTelefonosDialog(true);
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
    } catch (error: any) {
      console.error('Error en preview teléfonos:', error);
      toast.error(error?.message || 'Error al procesar el archivo de teléfonos');
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
    }
  };

  // ===================== TELEFONOS UPLOAD =====================
  const handleTelefonosUpload = async () => {
    if (!pendingTelefonosData) return;
    setShowTelefonosDialog(false);

    const userId = requireUser();
    try {
      setUploading(true);

      setProgress({ phase: 'Creando registro de cargue...', done: 1, total: 4 });
      const cargueRecord = await db.createCargue({
        idtipocargue: selectedTipoCargue,
        idbase: selectedBase,
        nombrearchivo: file!.name,
        cantidadregistros: pendingTelefonosData.telefonos.length,
        idusuario: userId,
        idusuariomod: userId,
        estado: 'activo',
      });

      setProgress({ phase: 'Insertando teléfonos...', done: 2, total: 4 });
      const result = await db.uploadTelefonos({
        idcargue: cargueRecord.idcargue,
        idorigen: selectedOrigen,
        idusuario: userId,
        telefonos: pendingTelefonosData.telefonos,
      });

      setProgress({ phase: 'Actualizando estado de cargues...', done: 3, total: 4 });
      await db.inactivateCarguesByTipoCargue(selectedBase, selectedTipoCargue, cargueRecord.idcargue, userId);

      setProgress({ phase: 'Completado', done: 4, total: 4 });
      toast.success(`Cargue completado: ${result.telefonosInsertados} teléfonos nuevos, ${result.relacionesInsertadas} relaciones creadas`);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const updatedCargues = await db.getCarguesByProducto(selectedProducto);
      setCargues(updatedCargues);
    } catch (error: any) {
      console.error('Error en cargue de teléfonos:', error);
      toast.error(error?.message || 'Error al procesar el cargue de teléfonos');
    } finally {
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
      setPendingTelefonosData(null);
      setTelefonosPreview(null);
    }
  };

  // ===================== DOWNLOAD RETIRO TEMPLATE =====================
  const handleDownloadRetiroTemplate = () => {
    const csv = 'valor,motivo\n100.00,Motivo de ejemplo\n250.50,Otro motivo';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_retiro.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===================== RETIRO PREVIEW =====================
  const handleRetiroPreview = async () => {
    try {
      setUploading(true);
      setProgress({ phase: 'Leyendo archivo...', done: 1, total: 3 });

      const text = await file!.text();
      const csvRows = parseCSV(text);

      if (csvRows.length < 2) {
        toast.error('El archivo no contiene filas de datos.');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      const headers = csvRows[0].map(h => normalize(h));
      const valorIdx = headers.findIndex(h => h === 'valor');
      const motivoIdx = headers.findIndex(h => h === 'motivo');

      if (valorIdx === -1) {
        toast.error('El archivo debe tener la columna "valor".');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      const retiros: { valor: string; motivo: string }[] = [];
      const dataRows = csvRows.slice(1);
      let emptyRows = 0;
      for (const row of dataRows) {
        const valor = row[valorIdx]?.trim();
        const motivo = motivoIdx !== -1 ? row[motivoIdx]?.trim() : '';
        if (!valor) { emptyRows++; continue; }
        retiros.push({ valor, motivo: motivo || '' });
      }

      if (retiros.length === 0) {
        toast.error('No se encontraron registros válidos en el archivo.');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      setProgress({ phase: 'Consultando vista previa...', done: 2, total: 3 });
      const preview = await db.previewRetiro(selectedRetiroTipo, retiros);
      setRetiroPreview(preview);
      setPendingRetiroData({ retiros });

      if (emptyRows > 0) {
        setValidationWarnings([`${emptyRows} fila(s) sin valor fueron omitidas.`]);
      } else {
        setValidationWarnings([]);
      }

      setShowRetiroDialog(true);
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
    } catch (error: any) {
      console.error('Error en preview retiro:', error);
      toast.error(error?.message || 'Error al procesar el archivo de retiros');
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
    }
  };

  // ===================== RETIRO UPLOAD =====================
  const handleRetiroUpload = async () => {
    if (!pendingRetiroData) return;
    setShowRetiroDialog(false);

    const userId = requireUser();
    try {
      setUploading(true);

      setProgress({ phase: 'Creando registro de cargue...', done: 1, total: 4 });
      const cargueRecord = await db.createCargue({
        idtipocargue: selectedTipoCargue,
        idbase: selectedBase,
        nombrearchivo: file!.name,
        cantidadregistros: pendingRetiroData.retiros.length,
        idusuario: userId,
        idusuariomod: userId,
        estado: 'activo',
      });

      setProgress({ phase: 'Insertando retiros...', done: 2, total: 4 });
      const result = await db.uploadRetiro({
        idcargue: cargueRecord.idcargue,
        idretirotipo: selectedRetiroTipo,
        idusuario: userId,
        retiros: pendingRetiroData.retiros,
      });

      setProgress({ phase: 'Actualizando estado de cargues...', done: 3, total: 4 });
      await db.inactivateCarguesByTipoCargue(selectedBase, selectedTipoCargue, cargueRecord.idcargue, userId);

      setProgress({ phase: 'Completado', done: 4, total: 4 });
      toast.success(`Cargue completado: ${result.retirosInsertados} retiros insertados`);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const updatedCargues = await db.getCarguesByProducto(selectedProducto);
      setCargues(updatedCargues);
    } catch (error: any) {
      console.error('Error en cargue de retiros:', error);
      toast.error(error?.message || 'Error al procesar el cargue de retiros');
    } finally {
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
      setPendingRetiroData(null);
      setRetiroPreview(null);
    }
  };

  // ===================== UPLOAD PROCESS =====================
  const handleUpload = async () => {
    if (!selectedProducto) { toast.error('Seleccione un producto'); return; }
    if (!selectedBase) { toast.error('Seleccione una base'); return; }
    if (!selectedTipoCargue) { toast.error('Seleccione un tipo de cargue'); return; }
    if (!file) { toast.error('Seleccione un archivo'); return; }
    if (isTelefonos && !selectedOrigen) { toast.error('Seleccione un origen'); return; }
    if (isRetiro && !selectedRetiroTipo) { toast.error('Seleccione un tipo de retiro'); return; }

    // Telefonos flow: no homologation needed
    if (isTelefonos) {
      return handleTelefonosPreview();
    }

    // Retiro flow: no homologation needed
    if (isRetiro) {
      return handleRetiroPreview();
    }

    const userId = requireUser();

    try {
      setUploading(true);

      // 1. Get plantilla (homologacion) for this product + tipo cargue
      setProgress({ phase: 'Cargando plantilla...', done: 0, total: 5 });
      const homologacion = await db.getProductoHomologacionByProductoTipo(selectedProducto, selectedTipoCargue);
      if (homologacion.length === 0) {
        toast.error('No existe plantilla configurada para este Producto y Tipo de Cargue');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      // 2. Read and parse CSV
      setProgress({ phase: 'Leyendo archivo...', done: 1, total: 5 });
      const text = await file.text();
      const csvRows = parseCSV(text);

      // 3. Validate CSV against plantilla (always show results)
      setProgress({ phase: 'Validando archivo...', done: 2, total: 5 });
      const validation = validateCsvAgainstPlantilla(csvRows, homologacion);

      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      setValidationCanProceed(validation.canProceed);
      setValidationSummary(validation.summary);
      setPendingUploadData({ csvRows, homologacion });
      setShowValidationDialog(true);
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
      return; // User will confirm or cancel via dialog
    } catch (error: any) {
      console.error('Error en cargue:', error);
      toast.error(error?.message || 'Error al procesar el cargue');
    } finally {
      setUploading(false);
      setProgress({ phase: '', done: 0, total: 0 });
    }
  };

  // Pagination
  const totalPaginas = Math.ceil(cargues.length / registrosPorPagina) || 1;
  const carguesPagina = cargues.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina,
  );

  if (loading) {
    return (
      <Card className="border-2 border-sky-400 bg-gray-50 max-w-[60%] mx-auto">
        <CardContent className="py-12 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
          Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-sky-400 bg-gray-50 max-w-[60%] mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>Cargue de Cartera</CardTitle>
            <CardDescription>
              Importe archivos CSV a las bases de datos usando las plantillas configuradas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Instrucciones:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Seleccione Producto, Base y Tipo de Cargue</li>
                <li>Los archivos deben estar en formato CSV (separado por comas)</li>
                <li>La primera fila debe contener los encabezados según la plantilla</li>
                <li>Por tipo de cargue solo permanecerá activo el último cargue</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Producto:</Label>
            <Select value={selectedProducto} onValueChange={setSelectedProducto}>
              <SelectTrigger className="!h-7 !py-1 text-xs w-44 border-sky-500">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p: any) => (
                  <SelectItem key={p.idproducto} value={p.idproducto}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Base:</Label>
            <Select value={selectedBase} onValueChange={setSelectedBase} disabled={!selectedProducto}>
              <SelectTrigger className="!h-7 !py-1 text-xs w-44 border-sky-500">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((b: any) => (
                  <SelectItem key={b.idbase} value={b.idbase}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Tipo Cargue:</Label>
            <Select value={selectedTipoCargue} onValueChange={(v) => { setSelectedTipoCargue(v); setSelectedOrigen(''); setSelectedRetiroTipo(''); }} disabled={!selectedBase}>
              <SelectTrigger className="!h-7 !py-1 text-xs w-36 border-sky-500">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {cargueTipos.filter((ct: any) => ct.estado === 'activo').map((ct: any) => (
                  <SelectItem key={ct.idtipocargue} value={ct.idtipocargue}>{ct.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {cargueTipos.find((ct: any) => ct.idtipocargue === selectedTipoCargue && ct.nombre?.toLowerCase() === 'telefonos') && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-gray-500 whitespace-nowrap">Origen:</Label>
              <Select value={selectedOrigen} onValueChange={setSelectedOrigen}>
                <SelectTrigger className="!h-7 !py-1 text-xs w-36 border-sky-500">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {origenes.filter((o: any) => o.estado === 'activo').map((o: any) => (
                    <SelectItem key={o.idorigen} value={o.idorigen}>{o.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="!h-7 text-xs" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                Plantilla
              </Button>
            </div>
          )}
          {cargueTipos.find((ct: any) => ct.idtipocargue === selectedTipoCargue && ct.nombre?.toLowerCase() === 'retiro') && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-gray-500 whitespace-nowrap">Tipo Retiro:</Label>
              <Select value={selectedRetiroTipo} onValueChange={setSelectedRetiroTipo}>
                <SelectTrigger className="!h-7 !py-1 text-xs w-36 border-sky-500">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {retiroTipos.filter((rt: any) => rt.estado === 'activo').map((rt: any) => (
                    <SelectItem key={rt.idretirotipo} value={rt.idretirotipo}>{rt.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="!h-7 text-xs" onClick={handleDownloadRetiroTemplate}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                Plantilla
              </Button>
            </div>
          )}
        </div>

        {/* File upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
          {file ? (
            <div className="space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto" />
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                disabled={uploading}
              >
                Cambiar archivo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Arrastre su archivo CSV aquí o</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                Seleccionar archivo
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
        </div>

        {/* Upload button + progress */}
        <div className="space-y-2 flex justify-center">
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedProducto || !selectedBase || !selectedTipoCargue || (isTelefonos && !selectedOrigen) || (isRetiro && !selectedRetiroTipo) || uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Cargando...' : 'Cargar Archivo'}
          </Button>

          {uploading && progress.phase && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{progress.phase}</span>
                <span>{progress.total > 0 ? `${Math.round((progress.done / progress.total) * 100)}%` : ''}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabla de cargues */}
        {selectedProducto && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Cargues realizados</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-200">
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">ID Cargue</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Producto</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Base</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Cargue</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Archivo</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Registros</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha Creación</TableHead>
                      <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Usuario</TableHead>
                      <TableHead className="font-semibold py-0.5 text-xs">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carguesPagina.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500 text-xs">
                          No se encontraron cargues para este producto
                        </TableCell>
                      </TableRow>
                    ) : carguesPagina.map((c) => (
                      <TableRow key={c.idcargue} className="border-b border-gray-300">
                        <TableCell className="border-r border-gray-300 text-xs font-mono">{c.idcargue}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs">{c.productoNombre}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs">{c.baseNombre}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs">{c.tipoCargueNombre}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs max-w-[200px] truncate">{c.nombrearchivo}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs text-right">{c.cantidadregistros.toLocaleString()}</TableCell>
                        <TableCell className="border-r border-gray-300 text-xs">
                          {new Date(c.fechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="border-r border-gray-300 text-xs">{c.usuarioNombre}</TableCell>
                        <TableCell className="text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {cargues.length} registro(s) - Página {paginaActual} de {totalPaginas}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline" size="icon" className="h-6 w-6"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => p - 1)}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline" size="icon" className="h-6 w-6"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => p + 1)}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="text-xs !max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className={validationErrors.length > 0
            ? 'bg-red-50 -mx-6 -mt-6 px-4 py-2 rounded-t-lg border-b border-red-200'
            : validationWarnings.length > 0
            ? 'bg-yellow-50 -mx-6 -mt-6 px-4 py-2 rounded-t-lg border-b border-yellow-200'
            : 'bg-green-50 -mx-6 -mt-6 px-4 py-2 rounded-t-lg border-b border-green-200'
          }>
            <DialogTitle className="flex items-center gap-2">
              {validationErrors.length > 0 ? (
                <><XCircle className="w-5 h-5 text-red-600" /> Errores de validación</>
              ) : validationWarnings.length > 0 ? (
                <><AlertTriangle className="w-5 h-5 text-yellow-600" /> Advertencias de validación</>
              ) : (
                <><CheckCircle2 className="w-5 h-5 text-green-600" /> Validación exitosa</>
              )}
            </DialogTitle>
            <DialogDescription>
              {validationErrors.length > 0
                ? 'Se encontraron errores que impiden continuar con el cargue.'
                : validationWarnings.length > 0
                ? 'Se encontraron advertencias. Revise antes de continuar.'
                : 'El archivo cumple con la plantilla. Puede proceder con el cargue.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Summary */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Campos coincidentes:</span>{' '}
                  <span className="font-semibold text-sky-700">{validationSummary.matched} de {validationSummary.total}</span>
                </div>
                <div>
                  <span className="text-slate-500">Registros a procesar:</span>{' '}
                  <span className="font-semibold text-sky-700">{validationSummary.totalRows.toLocaleString()}</span>
                </div>
                {validationSummary.emptyRows > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Filas sin identificación:</span>{' '}
                    <span className="font-semibold text-yellow-700">{validationSummary.emptyRows.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-1">Errores ({validationErrors.length}):</h4>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-600">
                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-yellow-700 mb-1">Advertencias ({validationWarnings.length}):</h4>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {validationWarnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-2 text-yellow-700">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-200">
            {validationCanProceed ? (
              <>
                <Button onClick={handleContinueUpload} className="flex-1 !h-7">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {validationWarnings.length > 0 ? 'Continuar de todas formas' : 'Confirmar cargue'}
                </Button>
                <Button
                  onClick={() => {
                    setShowValidationDialog(false);
                    setPendingUploadData(null);
                  }}
                  className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowValidationDialog(false)}
                className="flex-1 !h-7"
              >
                Cerrar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Telefonos Preview Dialog */}
      <Dialog open={showTelefonosDialog} onOpenChange={setShowTelefonosDialog}>
        <DialogContent className="text-xs !max-w-[500px]">
          <DialogHeader className="bg-sky-50 -mx-6 -mt-6 px-4 py-2 rounded-t-lg border-b border-sky-200">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Resumen de Cargue de Teléfonos
            </DialogTitle>
            <DialogDescription>
              Revise los datos antes de confirmar el cargue.
            </DialogDescription>
          </DialogHeader>

          {telefonosPreview && (
            <div className="space-y-3 pt-2">
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Total filas en archivo:</span>{' '}
                    <span className="font-semibold text-sky-700">{telefonosPreview.totalFilas.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Origen seleccionado:</span>{' '}
                    <span className="font-semibold text-sky-700">{origenes.find((o: any) => o.idorigen === selectedOrigen)?.nombre || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-1.5 border-b">Concepto</th>
                      <th className="text-right px-3 py-1.5 border-b">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5">Teléfonos nuevos</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-green-700">{telefonosPreview.telefonosNuevos.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5">Teléfonos ya existentes</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-blue-700">{telefonosPreview.telefonosExistentes.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5">Relaciones nuevas (persona-teléfono)</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-green-700">{telefonosPreview.relacionesNuevas.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5">Relaciones ya existentes</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-gray-600">{telefonosPreview.relacionesExistentes.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {validationWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  {validationWarnings.map((w, i) => (
                    <p key={i} className="text-yellow-700 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <Button onClick={handleTelefonosUpload} className="flex-1 !h-7">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirmar cargue
            </Button>
            <Button
              onClick={() => { setShowTelefonosDialog(false); setPendingTelefonosData(null); setTelefonosPreview(null); }}
              className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Retiro Preview Dialog */}
      <Dialog open={showRetiroDialog} onOpenChange={setShowRetiroDialog}>
        <DialogContent className="text-xs !max-w-[500px]">
          <DialogHeader className="bg-sky-50 -mx-6 -mt-6 px-4 py-2 rounded-t-lg border-b border-sky-200">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Resumen de Cargue de Retiros
            </DialogTitle>
            <DialogDescription>
              Revise los datos antes de confirmar el cargue.
            </DialogDescription>
          </DialogHeader>

          {retiroPreview && (
            <div className="space-y-3 pt-2">
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Total filas en archivo:</span>{' '}
                    <span className="font-semibold text-sky-700">{retiroPreview.totalFilas.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tipo de retiro:</span>{' '}
                    <span className="font-semibold text-sky-700">{retiroTipos.find((rt: any) => rt.idretirotipo === selectedRetiroTipo)?.nombre || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-1.5 border-b">Concepto</th>
                      <th className="text-right px-3 py-1.5 border-b">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5">Retiros válidos</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-green-700">{retiroPreview.retirosValidos.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5">Retiros inválidos (sin valor)</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-red-700">{retiroPreview.retirosInvalidos.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {validationWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  {validationWarnings.map((w, i) => (
                    <p key={i} className="text-yellow-700 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <Button onClick={handleRetiroUpload} className="flex-1 !h-7">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirmar cargue
            </Button>
            <Button
              onClick={() => { setShowRetiroDialog(false); setPendingRetiroData(null); setRetiroPreview(null); }}
              className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}