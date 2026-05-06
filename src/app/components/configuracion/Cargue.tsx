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
  Upload, FileSpreadsheet, AlertCircle, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Cargue, ProductoHomologacion } from '../../lib/db';

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
  const [cargues, setCargues] = useState<Cargue[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTipoCargue, setSelectedTipoCargue] = useState('');

  // File
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ phase: '', done: 0, total: 0 });

  // Pagination
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, ctData] = await Promise.all([db.getProductos(), db.getCargueTipos()]);
      setProductos(prodData.filter((p: any) => p.estado === 'activo'));
      setCargueTipos(ctData);
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
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
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
        } else if (ch === ',' && !inQuotes) {
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

  // ===================== MAPPING WITH PLANTILLA =====================
  const mapCsvToRecords = (
    csvRows: string[][],
    homologacion: ProductoHomologacion[],
  ): { personaRows: Record<string, any>[]; obligacionRows: Record<string, any>[]; uniquePersonCount: number } => {
    if (csvRows.length < 2) throw new Error('El archivo CSV no tiene datos');

    const headers = csvRows[0];
    const dataRows = csvRows.slice(1);

    // Build header index map (lowercase for matching)
    const headerMap = new Map<string, number>();
    headers.forEach((h, i) => headerMap.set(h.toLowerCase().trim(), i));

    // Group homologacion by table
    const personaFields = homologacion.filter(h => h.tablaNombre.toLowerCase() === 'personas');
    const obligacionFields = homologacion.filter(h => h.tablaNombre.toLowerCase() === 'obligaciones');

    // Map: nombrecampoorigen -> header index
    const mapField = (field: ProductoHomologacion): number | null => {
      if (!field.nombreCampoOrigen) return null;
      const idx = headerMap.get(field.nombreCampoOrigen.toLowerCase().trim());
      return idx !== undefined ? idx : null;
    };

    // Deduplicate persons by identificacion
    const personaMap = new Map<string, Record<string, any>>();
    const obligacionRecords: Record<string, any>[] = [];

    for (const row of dataRows) {
      if (row.length === 0 || row.every(c => !c)) continue;

      // Build persona record
      const personaRecord: Record<string, any> = {};
      let identificacion = '';

      for (const field of personaFields) {
        const csvIdx = mapField(field);
        const value = csvIdx !== null && csvIdx < row.length ? row[csvIdx] : '';
        const colName = field.nombreColumna.toLowerCase();
        personaRecord[colName] = value || null;
        if (colName === 'identificacion') identificacion = value;
      }

      if (!identificacion) continue;

      // Deduplicate person
      if (!personaMap.has(identificacion)) {
        personaMap.set(identificacion, personaRecord);
      }

      // Build obligacion record
      const obligacionRecord: Record<string, any> = {};
      obligacionRecord._identificacion = identificacion;

      for (const field of obligacionFields) {
        const csvIdx = mapField(field);
        const value = csvIdx !== null && csvIdx < row.length ? row[csvIdx] : '';
        const colName = field.nombreColumna.toLowerCase();
        obligacionRecord[colName] = value || null;
      }

      obligacionRecords.push(obligacionRecord);
    }

    return {
      personaRows: Array.from(personaMap.values()),
      obligacionRows: obligacionRecords,
      uniquePersonCount: personaMap.size,
    };
  };

  // ===================== UPLOAD PROCESS =====================
  const handleUpload = async () => {
    if (!selectedProducto) { toast.error('Seleccione un producto'); return; }
    if (!selectedBase) { toast.error('Seleccione una base'); return; }
    if (!selectedTipoCargue) { toast.error('Seleccione un tipo de cargue'); return; }
    if (!file) { toast.error('Seleccione un archivo'); return; }

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

      // 3. Map CSV to records using plantilla
      setProgress({ phase: 'Mapeando datos...', done: 2, total: 5 });
      const { personaRows, obligacionRows, uniquePersonCount } = mapCsvToRecords(csvRows, homologacion);

      if (personaRows.length === 0) {
        toast.error('No se encontraron registros válidos en el archivo');
        setUploading(false);
        setProgress({ phase: '', done: 0, total: 0 });
        return;
      }

      // 4. Create cargue record
      setProgress({ phase: 'Creando registro de cargue...', done: 3, total: 5 });
      const cargueRecord = await db.createCargue({
        idtipocargue: selectedTipoCargue,
        idbase: selectedBase,
        nombrearchivo: file.name,
        cantidadregistros: obligacionRows.length,
        idusuario: userId,
        idusuariomod: userId,
        estado: 'activo',
      });
      const idcargue = cargueRecord.idcargue;

      // 5. Insert personas in batches
      setProgress({ phase: `Insertando ${uniquePersonCount} personas...`, done: 0, total: 1 });
      const personaRowsWithCargue = personaRows.map(p => ({
        ...p,
        idcargue,
        idusuario: userId,
        estado: 'activo',
      }));

      await db.batchInsertPersonas(personaRowsWithCargue, 500, (done, total) => {
        setProgress(prev => ({ ...prev, done, total }));
      });

      // 6. Get persona id mapping
      setProgress({ phase: 'Obteniendo IDs de personas...', done: 0, total: 1 });
      const personaIds = await db.getPersonasIdByCargue(idcargue);
      const idMap = new Map(personaIds.map(p => [p.identificacion, p.idpersona]));

      // 7. Insert obligaciones in batches
      setProgress({ phase: `Insertando ${obligacionRows.length} obligaciones...`, done: 0, total: 1 });
      const obligacionRowsWithIds = obligacionRows.map(o => {
        const { _identificacion, ...fields } = o;
        return {
          ...fields,
          idpersona: idMap.get(_identificacion) || null,
          idcargue,
          idusuario: userId,
          estado: 'activo',
        };
      }).filter(o => o.idpersona !== null);

      await db.batchInsertObligaciones(obligacionRowsWithIds, 500, (done, total) => {
        setProgress(prev => ({ ...prev, done, total }));
      });

      // 8. Inactivate previous cargues of same tipo
      setProgress({ phase: 'Actualizando estado de cargues...', done: 4, total: 5 });
      await db.inactivateCarguesByTipoCargue(selectedBase, selectedTipoCargue, idcargue, userId);

      // 9. Update idcarguegestionar if tipo is "obligacion"
      const tipoCargueNombre = cargueTipos.find(ct => ct.idtipocargue === selectedTipoCargue)?.nombre?.toLowerCase();
      if (tipoCargueNombre === 'obligacion') {
        await db.updateBaseCargueGestionar(selectedBase, idcargue, userId);
      }

      // 10. Done
      setProgress({ phase: 'Completado', done: 5, total: 5 });
      toast.success(`Cargue completado: ${obligacionRows.length} obligaciones, ${uniquePersonCount} personas`);

      // Reset
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh cargues table
      const updatedCargues = await db.getCarguesByProducto(selectedProducto);
      setCargues(updatedCargues);
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
      <Card className="border-2 border-sky-400 bg-gray-50">
        <CardContent className="py-12 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
          Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-sky-400 bg-gray-50">
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
            <Select value={selectedTipoCargue} onValueChange={setSelectedTipoCargue}>
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
            disabled={!file || !selectedProducto || !selectedBase || !selectedTipoCargue || uploading}
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
    </Card>
  );
}