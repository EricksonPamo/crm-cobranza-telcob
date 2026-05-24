import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '../ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Plus, Pencil, FileText, Search, Power, PowerOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProductoHomologacion, TablaColumna, FichaTipoDato, FichaSegmento } from '../../lib/db';

interface TablaColumnaRow extends TablaColumna {
  obligatorio: boolean;
  filtro: boolean;
  nombreCampoOrigen: string;
  nombreAliasOrigen: string;
  idtipodatoficha: string | null;
  idsegmentoficha: string | null;
  esvisible: boolean;
  ordenvisualizacion: number;
}

const CampoRow = memo(({
  campo,
  onUpdate,
  showFicha,
  showVisibleOrden,
  fichaTipoDatoList,
  fichaSegmentoList,
}: {
  campo: TablaColumnaRow;
  onUpdate: (idhomologacion: string, field: string, value: any) => void;
  showFicha?: boolean;
  showVisibleOrden?: boolean;
  fichaTipoDatoList?: FichaTipoDato[];
  fichaSegmentoList?: FichaSegmento[];
}) => {
  const [localCampoOrigen, setLocalCampoOrigen] = useState(campo.nombreCampoOrigen);
  const [localAlias, setLocalAlias] = useState(campo.nombreAliasOrigen);

  useEffect(() => {
    setLocalCampoOrigen(campo.nombreCampoOrigen);
    setLocalAlias(campo.nombreAliasOrigen);
  }, [campo.idhomologacion]);

  const handleObligatorioChange = useCallback((checked: boolean) => {
    onUpdate(campo.idhomologacion, 'obligatorio', checked);
  }, [campo.idhomologacion, onUpdate]);

  const handleFiltroChange = useCallback((checked: boolean) => {
    onUpdate(campo.idhomologacion, 'filtro', checked);
  }, [campo.idhomologacion, onUpdate]);

  const handleCampoOrigenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCampoOrigen(e.target.value);
  }, []);

  const handleAliasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAlias(e.target.value);
  }, []);

  const handleCampoOrigenBlur = useCallback(() => {
    if (localCampoOrigen !== campo.nombreCampoOrigen) {
      onUpdate(campo.idhomologacion, 'nombreCampoOrigen', localCampoOrigen);
    }
  }, [campo.idhomologacion, campo.nombreCampoOrigen, localCampoOrigen, onUpdate]);

  const handleAliasBlur = useCallback(() => {
    if (localAlias !== campo.nombreAliasOrigen) {
      onUpdate(campo.idhomologacion, 'nombreAliasOrigen', localAlias);
    }
  }, [campo.idhomologacion, campo.nombreAliasOrigen, localAlias, onUpdate]);

  const handleTipoDatoFichaChange = useCallback((val: string) => {
    onUpdate(campo.idhomologacion, 'idtipodatoficha', val || null);
    onUpdate(campo.idhomologacion, 'idsegmentoficha', null);
  }, [campo.idhomologacion, onUpdate]);

  const handleSegmentoFichaChange = useCallback((val: string) => {
    onUpdate(campo.idhomologacion, 'idsegmentoficha', val || null);
  }, [campo.idhomologacion, onUpdate]);

  const handleEsVisibleChange = useCallback((checked: boolean) => {
    onUpdate(campo.idhomologacion, 'esvisible', checked);
  }, [campo.idhomologacion, onUpdate]);

  const handleOrdenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(campo.idhomologacion, 'ordenvisualizacion', parseInt(e.target.value) || 0);
  }, [campo.idhomologacion, onUpdate]);

  const filteredSegmentos = fichaSegmentoList?.filter(s => s.idtipodatoficha === campo.idtipodatoficha) || [];

  return (
    <tr className="border-b border-gray-300">
      <td className="h-7 text-xs bg-gray-50 text-gray-600 px-4 py-3 border-r border-gray-300">
        {campo.tipoCargueNombre}
      </td>
      <td className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300">
        {campo.tablaNombre}
      </td>
      <td className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300">
        {campo.nombreColumna}
      </td>
      <td className="h-7 text-xs bg-gray-50 text-gray-600 px-2 py-2 border-r border-gray-300">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${campo.tipoDatoNombre === 'varchar' ? 'bg-blue-100 text-blue-700' :
          campo.tipoDatoNombre === 'numerico' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
          {campo.tipoDatoNombre}
        </span>
      </td>
      <td className="px-2 py-2 border-r border-gray-300 w-16">
        <div className="flex items-center justify-center">
          <Checkbox checked={campo.obligatorio} onCheckedChange={handleObligatorioChange} />
        </div>
      </td>
      <td className="px-2 py-2 border-r border-gray-300 w-16">
        <div className="flex items-center justify-center">
          <Checkbox checked={campo.filtro} onCheckedChange={handleFiltroChange} />
        </div>
      </td>
      <td className="px-2 py-2 border-r border-gray-300 w-48">
        <Input
          value={localCampoOrigen}
          onChange={handleCampoOrigenChange}
          onBlur={handleCampoOrigenBlur}
          placeholder="Campo origen"
          className="h-7 text-xs border-sky-500"
        />
      </td>
      <td className="px-2 py-2 w-48">
        <Input
          value={localAlias}
          onChange={handleAliasChange}
          onBlur={handleAliasBlur}
          placeholder="Alias"
          className="h-7 text-xs border-sky-500"
        />
      </td>
      {showFicha && (
        <>
          <td className="px-2 py-2 border-r border-gray-300 w-36">
            <Select value={campo.idtipodatoficha || ''} onValueChange={handleTipoDatoFichaChange}>
              <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500">
                <SelectValue placeholder="Tipo Dato" />
              </SelectTrigger>
              <SelectContent>
                {fichaTipoDatoList?.map(td => (
                  <SelectItem key={td.idtipodatoficha} value={td.idtipodatoficha}>{td.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
          <td className="px-2 py-2 border-r border-gray-300 w-36">
            <Select value={campo.idsegmentoficha || ''} onValueChange={handleSegmentoFichaChange} disabled={!campo.idtipodatoficha}>
              <SelectTrigger className="!h-7 !py-1 text-xs border-sky-500">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                {filteredSegmentos.map(s => (
                  <SelectItem key={s.idsegmentoficha} value={s.idsegmentoficha}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
        </>
      )}
      {showVisibleOrden && (
        <>
          <td className="px-2 py-2 border-r border-gray-300 w-16">
            <div className="flex items-center justify-center">
              <Checkbox checked={campo.esvisible} onCheckedChange={handleEsVisibleChange} />
            </div>
          </td>
          <td className="px-2 py-2 w-20">
            <Input
              type="number"
              value={campo.ordenvisualizacion}
              onChange={handleOrdenChange}
              className="h-7 text-xs border-sky-500 text-center"
              min={0}
            />
          </td>
        </>
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.campo.idhomologacion === nextProps.campo.idhomologacion &&
    prevProps.campo.obligatorio === nextProps.campo.obligatorio &&
    prevProps.campo.filtro === nextProps.campo.filtro &&
    prevProps.campo.nombreCampoOrigen === nextProps.campo.nombreCampoOrigen &&
    prevProps.campo.nombreAliasOrigen === nextProps.campo.nombreAliasOrigen &&
    prevProps.campo.idtipodatoficha === nextProps.campo.idtipodatoficha &&
    prevProps.campo.idsegmentoficha === nextProps.campo.idsegmentoficha &&
    prevProps.campo.esvisible === nextProps.campo.esvisible &&
    prevProps.campo.ordenvisualizacion === nextProps.campo.ordenvisualizacion &&
    prevProps.showFicha === nextProps.showFicha &&
    prevProps.showVisibleOrden === nextProps.showVisibleOrden &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});
CampoRow.displayName = 'CampoRow';

export function Plantilla() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const requireUser = (): string => {
    if (!currentUser?.id) { toast.error('Debe iniciar sesión para realizar esta acción'); throw new Error('Usuario no autenticado'); }
    return currentUser.id;
  };

  // Estado principal
  const [homologaciones, setHomologaciones] = useState<ProductoHomologacion[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [cargueTipos, setCargueTipos] = useState<any[]>([]);
  const [fichaTipoDatoList, setFichaTipoDatoList] = useState<FichaTipoDato[]>([]);
  const [fichaSegmentoList, setFichaSegmentoList] = useState<FichaSegmento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros vista principal
  const [filterProducto, setFilterProducto] = useState('');
  const [filterTipoCargue, setFilterTipoCargue] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('activo');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Dialog Nueva Plantilla
  const [isNewPlantillaOpen, setIsNewPlantillaOpen] = useState(false);
  const [newProductoId, setNewProductoId] = useState('');
  const [newTipoCargueId, setNewTipoCargueId] = useState('');
  const [newPlantillaCampos, setNewPlantillaCampos] = useState<TablaColumnaRow[]>([]);
  const [generatingCampos, setGeneratingCampos] = useState(false);
  const [savingPlantilla, setSavingPlantilla] = useState(false);

  // Dialog Editar
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductoHomologacion | null>(null);
  const [editObligatorio, setEditObligatorio] = useState(false);
  const [editFiltro, setEditFiltro] = useState(false);
  const [editCampoOrigen, setEditCampoOrigen] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [editIdtipodatoficha, setEditIdtipodatoficha] = useState<string | null>(null);
  const [editIdsegmentoficha, setEditIdsegmentoficha] = useState<string | null>(null);
  const [editEsvisible, setEditEsvisible] = useState(true);
  const [editOrdenvisualizacion, setEditOrdenvisualizacion] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [homData, prodData, ctData, ftdData, fsData] = await Promise.all([
        db.getProductoHomologaciones(),
        db.getProductos(),
        db.getCargueTipos(),
        db.getFichaTipoDato(),
        db.getFichaSegmento(),
      ]);
      setHomologaciones(homData);
      setProductos(prodData.filter((p: any) => p.estado === 'activo'));
      setCargueTipos(ctData);
      setFichaTipoDatoList(ftdData);
      setFichaSegmentoList(fsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado
  const isPersona = useCallback((idtipocargue: string) => {
    const ct = cargueTipos.find((c: any) => c.idtipocargue === idtipocargue);
    return ct?.nombre?.toLowerCase() === 'personas';
  }, [cargueTipos]);

  const showVisibleOrden = useCallback((idtipocargue: string) => {
    const ct = cargueTipos.find((c: any) => c.idtipocargue === idtipocargue);
    const nombre = ct?.nombre?.toLowerCase() || '';
    return nombre === 'personas' || nombre === 'campañas';
  }, [cargueTipos]);

  const filteredHomologaciones = useMemo(() => {
    let filtered = [...homologaciones];
    if (filterProducto) filtered = filtered.filter(h => h.idproducto === filterProducto);
    if (filterTipoCargue) filtered = filtered.filter(h => h.idtipocargue === filterTipoCargue);
    if (filterEstado && filterEstado !== 'todos') filtered = filtered.filter(h => h.estado === filterEstado);
    return filtered;
  }, [homologaciones, filterProducto, filterTipoCargue, filterEstado]);

  // Paginación
  const totalPaginas = Math.ceil(filteredHomologaciones.length / registrosPorPagina);
  const homologacionesPagina = filteredHomologaciones.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // === Nueva Plantilla ===
  const handleOpenNewPlantilla = () => {
    setNewProductoId('');
    setNewTipoCargueId('');
    setNewPlantillaCampos([]);
    setIsNewPlantillaOpen(true);
  };

  const handleGenerarCampos = async () => {
    if (!newProductoId || !newTipoCargueId) {
      toast.error('Debe seleccionar Producto y Tipo Cargue');
      return;
    }
    try {
      setGeneratingCampos(true);
      const columnas = await db.getTablaColumnaByTipoCargue(newTipoCargueId);

      const existente = homologaciones.find(h =>
        h.idproducto === newProductoId &&
        h.idtipocargue === newTipoCargueId &&
        h.estado === 'activo'
      );
      if (existente) {
        toast.error('Ya existe una plantilla activa para este Producto y Tipo Cargue');
        return;
      }

      const campos: TablaColumnaRow[] = columnas.map(col => ({
        ...col,
        obligatorio: col.esobligatorio,
        filtro: col.esfiltro,
        nombreCampoOrigen: '',
        nombreAliasOrigen: '',
        idtipodatoficha: null,
        idsegmentoficha: null,
        esvisible: false,
        ordenvisualizacion: 0,
      }));
      setNewPlantillaCampos(campos);
    } catch (error) {
      console.error('Error generando campos:', error);
      toast.error('Error al generar campos');
    } finally {
      setGeneratingCampos(false);
    }
  };

  const handleUpdateCampoInNew = useCallback((idhomologacion: string, field: string, value: any) => {
    setNewPlantillaCampos(prev =>
      prev.map(campo =>
        campo.idhomologacion === idhomologacion ? { ...campo, [field]: value } : campo
      )
    );
  }, []);

  const handleSaveNewPlantilla = async () => {
    if (newPlantillaCampos.length === 0) {
      toast.error('Debe generar los campos primero');
      return;
    }
    try {
      setSavingPlantilla(true);
      const userId = requireUser();
      const records = newPlantillaCampos.map(campo => ({
        idproducto: newProductoId,
        idhomologacion: campo.idhomologacion,
        idtipocargue: campo.idtipocargue,
        idtabla: campo.idtabla,
        nombreColumna: campo.nombreColumna,
        tipoDato: campo.idtipoDato,
        obligatorio: campo.obligatorio,
        filtro: campo.filtro,
        nombreCampoOrigen: campo.nombreCampoOrigen || null,
        nombreAliasOrigen: campo.nombreAliasOrigen || null,
        idtipodatoficha: campo.idtipodatoficha || null,
        idsegmentoficha: campo.idsegmentoficha || null,
        esvisible: campo.esvisible,
        ordenvisualizacion: campo.ordenvisualizacion,
        idusuariocrea: userId,
        idusuariomod: userId,
        estado: 'activo',
      }));
      await db.createProductoHomologacionBatch(records);
      toast.success('Plantilla creada correctamente');
      setIsNewPlantillaOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error guardando plantilla:', error);
      toast.error(error?.message || 'Error al guardar la plantilla');
    } finally {
      setSavingPlantilla(false);
    }
  };

  // === Editar ===
  const handleEdit = (record: ProductoHomologacion) => {
    setEditingRecord(record);
    setEditObligatorio(record.obligatorio);
    setEditFiltro(record.filtro);
    setEditCampoOrigen(record.nombreCampoOrigen || '');
    setEditAlias(record.nombreAliasOrigen || '');
    setEditIdtipodatoficha(record.idtipodatoficha);
    setEditIdsegmentoficha(record.idsegmentoficha);
    setEditEsvisible(record.esvisible);
    setEditOrdenvisualizacion(record.ordenvisualizacion);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      setSavingEdit(true);
      const userId = requireUser();
      await db.updateProductoHomologacion(
        editingRecord.idproducto,
        editingRecord.idhomologacion,
        {
          obligatorio: editObligatorio,
          filtro: editFiltro,
          nombreCampoOrigen: editCampoOrigen || null,
          nombreAliasOrigen: editAlias || null,
          idtipodatoficha: editIdtipodatoficha || null,
          idsegmentoficha: editIdsegmentoficha || null,
          esvisible: editEsvisible,
          ordenvisualizacion: editOrdenvisualizacion,
        },
        userId
      );
      toast.success('Campo actualizado correctamente');
      setIsEditOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error actualizando:', error);
      toast.error(error?.message || 'Error al actualizar');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleEstado = async (record: ProductoHomologacion) => {
    try {
      const userId = requireUser();
      const nuevoEstado = record.estado === 'activo' ? 'inactivo' : 'activo';
      await db.updateProductoHomologacion(
        record.idproducto,
        record.idhomologacion,
        { estado: nuevoEstado },
        userId
      );
      toast.success('Estado actualizado');
      await loadData();
    } catch (error: any) {
      console.error('Error toggle estado:', error);
      toast.error(error?.message || 'Error al actualizar estado');
    }
  };

  return (
    <Card className="border-2 border-sky-400 bg-gray-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Plantillas de Cargue</CardTitle>
            <CardDescription>
              Configure los campos para la carga de datos desde archivos Excel o CSV
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            <span className="ml-2 text-sm text-gray-500">Cargando...</span>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="mb-2 flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Producto:</Label>
                <Select value={filterProducto} onValueChange={(v) => { setFilterProducto(v); setBusquedaRealizada(false); }}>
                  <SelectTrigger className="!h-7 !py-1 text-xs w-44 border-sky-500">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((p: any) => (
                      <SelectItem key={p.idproducto} value={p.idproducto}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Tipo Cargue:</Label>
                <Select value={filterTipoCargue} onValueChange={(v) => { setFilterTipoCargue(v); setBusquedaRealizada(false); }}>
                  <SelectTrigger className="!h-7 !py-1 text-xs w-36 border-sky-500">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargueTipos.map((ct: any) => (
                      <SelectItem key={ct.idtipocargue} value={ct.idtipocargue}>{ct.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Estado:</Label>
                <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setBusquedaRealizada(false); }}>
                  <SelectTrigger className="!h-7 !py-1 text-xs w-28 border-sky-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => { setBusquedaRealizada(true); setPaginaActual(1); }} className="h-7 text-xs px-3">
                <Search className="w-3 h-3 mr-1" />
                Buscar
              </Button>
              <div className="ml-auto">
                <Button size="sm" onClick={handleOpenNewPlantilla} className="h-7 text-xs px-3">
                  <Plus className="w-3 h-3 mr-1" />
                  Nueva Plantilla
                </Button>
              </div>
            </div>

            {/* Tabla principal */}
            {!busquedaRealizada ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Seleccione los filtros y haga clic en <strong>Buscar</strong></p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-200">
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Producto</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Cargue</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tabla</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre Columna</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Dato</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Obligatorio</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Filtro</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Campo Origen</TableHead>
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Alias</TableHead>
                          {filterTipoCargue && isPersona(filterTipoCargue) && (
                            <>
                              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo Dato Ficha</TableHead>
                              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Segmento Ficha</TableHead>
                            </>
                          )}
                          {filterTipoCargue && showVisibleOrden(filterTipoCargue) && (
                            <>
                              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Visible</TableHead>
                              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Orden</TableHead>
                            </>
                          )}
                          <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
                          <TableHead className="font-semibold text-right py-0.5 text-xs">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {homologacionesPagina.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={filterTipoCargue && showVisibleOrden(filterTipoCargue) ? (isPersona(filterTipoCargue) ? 15 : 13) : 11} className="text-center py-8 text-gray-500">
                              No se encontraron registros
                            </TableCell>
                          </TableRow>
                        ) : (
                          homologacionesPagina.map((h, idx) => (
                            <TableRow key={`${h.idproducto}-${h.idhomologacion}`} className="border-b border-gray-300">
                              <TableCell className="border-r border-gray-300 text-xs">{h.productoNombre}</TableCell>
                              <TableCell className="border-r border-gray-300 text-xs">{h.tipoCargueNombre}</TableCell>
                              <TableCell className="border-r border-gray-300 text-xs">{h.tablaNombre}</TableCell>
                              <TableCell className="border-r border-gray-300 text-xs">{h.nombreColumna}</TableCell>
                              <TableCell className="border-r border-gray-300 text-xs">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${h.tipoDatoNombre === 'varchar' ? 'bg-blue-100 text-blue-700' :
                                  h.tipoDatoNombre === 'numerico' ? 'bg-green-100 text-green-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                  {h.tipoDatoNombre}
                                </span>
                              </TableCell>
                              <TableCell className="border-r border-gray-300 text-xs text-center">
                                {h.obligatorio ? (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">SI</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">NO</span>
                                )}
                              </TableCell>
                              <TableCell className="border-r border-gray-300 text-xs text-center">
                                {h.filtro ? <span className="text-green-600 font-medium">✓</span> : <span className="text-gray-400">-</span>}
                              </TableCell>
                              <TableCell className="border-r border-gray-300 text-xs max-w-[120px] truncate">{h.nombreCampoOrigen || '-'}</TableCell>
                              <TableCell className="border-r border-gray-300 text-xs max-w-[120px] truncate">{h.nombreAliasOrigen || '-'}</TableCell>
                              {filterTipoCargue && isPersona(filterTipoCargue) && (
                                <>
                                  <TableCell className="border-r border-gray-300 text-xs">{h.tipoDatoFichaNombre || '-'}</TableCell>
                                  <TableCell className="border-r border-gray-300 text-xs">{h.segmentoFichaNombre || '-'}</TableCell>
                                </>
                              )}
                              {filterTipoCargue && showVisibleOrden(filterTipoCargue) && (
                                <>
                                  <TableCell className="border-r border-gray-300 text-xs text-center">
                                    {h.esvisible ? <span className="text-green-600 font-medium">SI</span> : <span className="text-gray-400">NO</span>}
                                  </TableCell>
                                  <TableCell className="border-r border-gray-300 text-xs text-center">{h.ordenvisualizacion}</TableCell>
                                </>
                              )}
                              <TableCell className="border-r border-gray-300 text-xs">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${h.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {h.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(h)} title="Editar">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleToggleEstado(h)} title={h.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                                    {h.estado === 'activo' ? <Power className="w-4 h-4 text-green-600" /> : <PowerOff className="w-4 h-4 text-red-600" />}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {filteredHomologaciones.length} registro(s) - Página {paginaActual} de {totalPaginas}
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
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Dialog Nueva Plantilla */}
      <Dialog open={isNewPlantillaOpen} onOpenChange={setIsNewPlantillaOpen}>
        <DialogContent className="text-xs !max-w-[1024px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
          <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
            <DialogTitle>Nueva Plantilla de Cargue</DialogTitle>
            <DialogDescription>
              Configure la estructura de la plantilla para carga de datos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {/* Selectores */}
            <div className="flex gap-4 pb-2 border-b border-slate-200">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Producto *</Label>
                <Select value={newProductoId} onValueChange={setNewProductoId}>
                  <SelectTrigger className="!h-7 !py-1 text-xs w-48 border-sky-500">
                    <SelectValue placeholder="Seleccione producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((p: any) => (
                      <SelectItem key={p.idproducto} value={p.idproducto}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Tipo Cargue *</Label>
                <Select value={newTipoCargueId} onValueChange={setNewTipoCargueId}>
                  <SelectTrigger className="!h-7 !py-1 text-xs w-48 border-sky-500">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargueTipos.map((ct: any) => (
                      <SelectItem key={ct.idtipocargue} value={ct.idtipocargue}>{ct.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generar campos o tabla */}
            {newPlantillaCampos.length === 0 ? (
              <div className="text-center py-6">
                <Button
                  onClick={handleGenerarCampos}
                  disabled={!newProductoId || !newTipoCargueId || generatingCampos}
                  className="!h-7"
                >
                  {generatingCampos ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generando...</>
                  ) : (
                    'Generar Campos de Plantilla'
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-2 mb-2">
                  <strong className="text-xs text-slate-700">Nota:</strong>
                  <span className="text-xs text-slate-600"> Los campos en gris son de solo lectura. Puede editar Filtro, Campo Origen y Alias.</span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <table className="border-collapse w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-200">
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Tipo Cargue</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Tabla</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Nombre Columna</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Tipo Dato</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-center text-xs">Obligatorio</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-center text-xs">Filtro</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Nombre Campo Origen</th>
                          <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Nombre Alias</th>
                          {newTipoCargueId && isPersona(newTipoCargueId) && (
                            <>
                              <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Tipo Dato Ficha</th>
                              <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-left text-xs">Segmento Ficha</th>
                            </>
                          )}
                          {newTipoCargueId && showVisibleOrden(newTipoCargueId) && (
                            <>
                              <th className="font-semibold border-r border-gray-300 bg-gray-200 px-3 py-2 text-center text-xs">Visible</th>
                              <th className="font-semibold bg-gray-200 px-3 py-2 text-center text-xs">Orden</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {newPlantillaCampos.map((campo) => (
                          <CampoRow
                            key={campo.idhomologacion}
                            campo={campo}
                            onUpdate={handleUpdateCampoInNew}
                            showFicha={newTipoCargueId ? isPersona(newTipoCargueId) : false}
                            showVisibleOrden={newTipoCargueId ? showVisibleOrden(newTipoCargueId) : false}
                            fichaTipoDatoList={fichaTipoDatoList}
                            fichaSegmentoList={fichaSegmentoList}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <Button
              onClick={handleSaveNewPlantilla}
              disabled={newPlantillaCampos.length === 0 || savingPlantilla}
              className="!h-7"
            >
              {savingPlantilla ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Guardando...</>
              ) : (
                'Guardar Plantilla'
              )}
            </Button>
            <Button
              onClick={() => setIsNewPlantillaOpen(false)}
              className="!h-7 bg-black hover:bg-gray-800 text-white"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="text-xs max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
          <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
            <DialogTitle>Editar Campo</DialogTitle>
            <DialogDescription>
              Modifique los valores editables del campo
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-2">
              <div className="p-2 bg-sky-50 border-2 border-sky-200 rounded-lg space-y-1">
                <div><strong className="text-slate-700">Producto:</strong> <span className="text-slate-600">{editingRecord.productoNombre}</span></div>
                <div><strong className="text-slate-700">Tipo Cargue:</strong> <span className="text-slate-600">{editingRecord.tipoCargueNombre}</span></div>
                <div><strong className="text-slate-700">Tabla:</strong> <span className="text-slate-600">{editingRecord.tablaNombre}</span></div>
                <div><strong className="text-slate-700">Columna:</strong> <span className="text-slate-600">{editingRecord.nombreColumna}</span></div>
                <div><strong className="text-slate-700">Tipo Dato:</strong> <span className="text-slate-600">{editingRecord.tipoDatoNombre}</span></div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Obligatorio</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={editObligatorio} onCheckedChange={(checked) => setEditObligatorio(!!checked)} />
                  <span className="text-xs text-slate-600">Campo obligatorio</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Filtro</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={editFiltro} onCheckedChange={(checked) => setEditFiltro(!!checked)} />
                  <span className="text-xs text-slate-600">Usar este campo como filtro</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Campo Origen</Label>
                <Input
                  value={editCampoOrigen}
                  onChange={(e) => setEditCampoOrigen(e.target.value)}
                  placeholder="Nombre del campo en el archivo de origen"
                  className="h-7 text-xs border-slate-200 focus:border-sky-300"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Alias</Label>
                <Input
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value)}
                  placeholder="Nombre a mostrar en el formulario"
                  className="h-7 text-xs border-slate-200 focus:border-sky-300"
                />
              </div>

              {editingRecord && isPersona(editingRecord.idtipocargue) && (
                <>
                  <div className="p-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
                    <span className="text-xs font-semibold text-indigo-700">Configuración de Ficha</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">Tipo Dato Ficha</Label>
                    <Select
                      value={editIdtipodatoficha || ''}
                      onValueChange={(val) => {
                        setEditIdtipodatoficha(val || null);
                        setEditIdsegmentoficha(null);
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-slate-200">
                        <SelectValue placeholder="Seleccione tipo dato ficha" />
                      </SelectTrigger>
                      <SelectContent>
                        {fichaTipoDatoList.map(td => (
                          <SelectItem key={td.idtipodatoficha} value={td.idtipodatoficha}>{td.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">Segmento Ficha</Label>
                    <Select
                      value={editIdsegmentoficha || ''}
                      onValueChange={(val) => setEditIdsegmentoficha(val || null)}
                      disabled={!editIdtipodatoficha}
                    >
                      <SelectTrigger className="h-7 text-xs border-slate-200">
                        <SelectValue placeholder="Seleccione segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {fichaSegmentoList.filter(s => s.idtipodatoficha === editIdtipodatoficha).map(s => (
                          <SelectItem key={s.idsegmentoficha} value={s.idsegmentoficha}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {editingRecord && showVisibleOrden(editingRecord.idtipocargue) && (
                <>
                  <div className="p-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
                    <span className="text-xs font-semibold text-indigo-700">Visualización</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">Visible</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={editEsvisible} onCheckedChange={(checked) => setEditEsvisible(!!checked)} />
                      <span className="text-xs text-slate-600">Mostrar campo</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">Orden de Visualización</Label>
                    <Input
                      type="number"
                      value={editOrdenvisualizacion}
                      onChange={(e) => setEditOrdenvisualizacion(parseInt(e.target.value) || 0)}
                      min={0}
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <Button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 !h-7">
                  {savingEdit ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                </Button>
                <Button onClick={() => setIsEditOpen(false)} className="flex-1 !h-7 bg-black hover:bg-gray-800 text-white">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}