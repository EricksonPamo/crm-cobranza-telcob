import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Database, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Cargue } from '../../lib/db';

interface FormData {
  nombre: string;
  alias: string;
  idproducto: string;
  idcarguegestionar: string;
  maximocuotas: number;
  estado: string;
}

export function Base() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const requireUser = (): string => {
    if (!currentUser?.id) { toast.error('Debe iniciar sesión para realizar esta acción'); throw new Error('Usuario no autenticado'); }
    return currentUser.id;
  };
  const [bases, setBases] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [carguesPersona, setCarguesPersona] = useState<{ idcargue: number; nombrearchivo: string; cantidadregistros: number }[]>([]);
  const [carguesBase, setCarguesBase] = useState<Cargue[]>([]);
  const [loadingCargues, setLoadingCargues] = useState(false);
  const [togglingCargue, setTogglingCargue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ nombre: '', alias: '', idproducto: '', idcarguegestionar: '', maximocuotas: 1, estado: 'activo' });
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [basesData, productosData] = await Promise.all([db.getBases(), db.getProductos()]);
      setBases(basesData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idproducto) { toast.error('Debe seleccionar un producto'); return; }
    if (!formData.nombre.trim()) { toast.error('Debe ingresar un nombre'); return; }
    try {
      const userId = requireUser();
      if (editingId) {
        await db.updateBase(editingId, {
          nombre: formData.nombre, alias: formData.alias || null, idproducto: formData.idproducto,
          idcarguegestionar: formData.idcarguegestionar || null, maximocuotas: formData.maximocuotas || null, estado: formData.estado,
        }, userId);
        toast.success('Base actualizada correctamente');
      } else {
        await db.createBase({
          nombre: formData.nombre, alias: formData.alias || null, idproducto: formData.idproducto,
          idcarguegestionar: formData.idcarguegestionar || null, maximocuotas: formData.maximocuotas || null, idusuario: userId, idusuariomod: userId, estado: formData.estado,
        });
        toast.success('Base creada correctamente');
      }
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error guardando base:', error);
      toast.error(error?.message || 'Error al guardar la base');
    }
  };

  const handleEdit = async (base: any) => {
    setEditingId(base.idbase);
    setFormData({
      nombre: base.nombre || '', alias: base.alias || '', idproducto: base.idproducto || '',
      idcarguegestionar: base.idcarguegestionar || '', maximocuotas: base.maximocuotas || 1, estado: base.estado || 'activo',
    });
    // Load active persona cargues for this base
    try {
      const cargues = await db.getCarguesActivosPersona(base.idbase);
      setCarguesPersona(cargues);
    } catch {
      setCarguesPersona([]);
    }
    // Load ALL cargues for the management table
    try {
      setLoadingCargues(true);
      const allCargues = await db.getCarguesByBase(base.idbase);
      setCarguesBase(allCargues);
    } catch {
      setCarguesBase([]);
    } finally {
      setLoadingCargues(false);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (idbase: string) => {
    if (confirm('¿Está seguro de eliminar esta base?')) {
      try {
        const userId = requireUser();
        await db.deleteBase(idbase, userId);
        toast.success('Base eliminada correctamente');
        await loadData();
      } catch (error: any) {
        console.error('Error eliminando base:', error);
        toast.error(error?.message || 'Error al eliminar la base');
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', alias: '', idproducto: '', idcarguegestionar: '', maximocuotas: 1, estado: 'activo' });
    setEditingId(null);
    setCarguesBase([]);
    setIsDialogOpen(false);
  };

  const handleToggleCargueEstado = async (idcargue: number, currentEstado: string) => {
    const userId = requireUser();
    const newEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';
    setTogglingCargue(idcargue);
    try {
      await db.toggleCargueEstado(idcargue, newEstado, userId);
      setCarguesBase(prev => prev.map(c => c.idcargue === idcargue ? { ...c, estado: newEstado } : c));
      if (editingId) {
        try {
          const cargues = await db.getCarguesActivosPersona(editingId);
          setCarguesPersona(cargues);
        } catch { setCarguesPersona([]); }
      }
      toast.success(`Cargue ${newEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error: any) {
      console.error('Error toggling cargue estado:', error);
      toast.error(error?.message || 'Error al cambiar estado del cargue');
    } finally {
      setTogglingCargue(null);
    }
  };

  const handleBuscar = () => { setCriteriosAplicados({ fechaDesde, fechaHasta }); };

  const filteredBases = useMemo(() => {
    return bases.filter((b) => {
      const matchesSearch = b.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productonombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || b.estado === filterEstado;
      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fc = new Date(b.fechacreacion);
        if (criteriosAplicados.fechaDesde) matchesFecha = matchesFecha && fc >= new Date(criteriosAplicados.fechaDesde);
        if (criteriosAplicados.fechaHasta) { const h = new Date(criteriosAplicados.fechaHasta); h.setHours(23,59,59,999); matchesFecha = matchesFecha && fc <= h; }
      }
      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [bases, searchTerm, filterEstado, criteriosAplicados]);

  const totalPaginas = Math.ceil(filteredBases.length / registrosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const basesPaginadas = filteredBases.slice(indiceInicio, indiceInicio + registrosPorPagina);
  const productosActivos = productos.filter((p) => p.estado === 'activo');

  if (loading) {
    return <Card className="border-2 border-sky-400 bg-gray-50"><CardContent className="py-12 text-center text-gray-500">Cargando bases...</CardContent></Card>;
  }

  return (
    <Card className="border-2 border-sky-400 bg-gray-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Database className="w-5 h-5 text-purple-600" /></div>
          <div>
            <CardTitle>Bases de Cobranza</CardTitle>
            <CardDescription>Gestione las bases de datos de cobranza</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">Desde:</span>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-7 text-xs w-36 border-sky-500" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">Hasta:</span>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-7 text-xs w-36 border-sky-500" />
          </div>
          <Button size="sm" className="h-7 text-xs px-3" onClick={handleBuscar}><Search className="w-3 h-3 mr-1" /> Buscar</Button>
          <div className="ml-auto flex items-center gap-2">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-28 !h-7 !py-1 text-xs border-sky-500"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs px-3" onClick={() => { setEditingId(null); setFormData({ nombre: '', alias: '', idproducto: '', idcarguegestionar: '', maximocuotas: 1, estado: 'activo' }); setIsDialogOpen(true); }}><Plus className="w-3 h-3 mr-1" /> Nueva Base</Button>
              </DialogTrigger>
              <DialogContent className="text-xs !max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                  <DialogTitle className="text-sm font-bold text-slate-700">{editingId ? 'Editar Base' : 'Nueva Base'}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">Complete los datos de la base</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs font-medium text-slate-600">Producto *</Label>
                      <Select value={formData.idproducto} onValueChange={(v) => setFormData({...formData, idproducto: v})}>
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-sky-500 focus:border-sky-600 w-[35ch]"><SelectValue placeholder="Seleccione un producto" /></SelectTrigger>
                        <SelectContent>
                          {productosActivos.length === 0 ? (
                            <div className="p-2 text-xs text-slate-400">No hay productos activos</div>
                          ) : productosActivos.map((p) => (
                            <SelectItem key={p.idproducto} value={p.idproducto}>{p.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Nombre de la Base *</Label>
                      <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Base de Marzo 2026" className="h-7 text-xs border-slate-200 focus:border-sky-300" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Alias *</Label>
                      <Input value={formData.alias} onChange={(e) => setFormData({...formData, alias: e.target.value})} placeholder="Ej: BCPMar2026" className="h-7 text-xs border-slate-200 focus:border-sky-300" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Máximo de Cuotas *</Label>
                      <Input type="number" min="1" value={formData.maximocuotas} onChange={(e) => setFormData({...formData, maximocuotas: parseInt(e.target.value)})} className="h-7 text-xs border-slate-200 focus:border-sky-300 w-[10ch]" required />
                    </div>
                    {editingId && (
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-slate-600">Cargue a Gestionar (Obligación)</Label>
                        <Select value={formData.idcarguegestionar ? String(formData.idcarguegestionar) : ''} onValueChange={(v) => setFormData({...formData, idcarguegestionar: v === '' ? '' : v})}>
                          <SelectTrigger className="!h-7 !py-0.5 text-xs border-sky-500 focus:border-sky-600 w-[45ch]">
                            <SelectValue placeholder="Seleccione cargue de obligación activo" />
                          </SelectTrigger>
                          <SelectContent>
                            {carguesPersona.length === 0 ? (
                              <div className="p-2 text-xs text-slate-400">No hay cargues de obligación activos</div>
                            ) : carguesPersona.map((c) => (
                              <SelectItem key={c.idcargue} value={String(c.idcargue)}>
                                #{c.idcargue} - {c.nombrearchivo} ({c.cantidadregistros.toLocaleString()} reg.)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {editingId && (
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-slate-600">Cargues del Base</Label>
                        {loadingCargues ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="text-xs text-slate-500">Cargando cargues...</span>
                          </div>
                        ) : carguesBase.length === 0 ? (
                          <div className="text-xs text-slate-400 py-3 text-center border rounded-md">
                            No hay cargues registrados para esta base
                          </div>
                        ) : (
                          <div className="border rounded-md overflow-hidden max-h-[240px] overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-200">
                                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Tipo</TableHead>
                                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Archivo</TableHead>
                                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs text-right">Registros</TableHead>
                                  <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha</TableHead>
                                  <TableHead className="font-semibold py-0.5 text-xs text-center">Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {carguesBase.map((c) => (
                                  <TableRow key={c.idcargue} className="border-b border-gray-200">
                                    <TableCell className="text-xs border-r border-gray-300 py-1">{c.tipoCargueNombre}</TableCell>
                                    <TableCell className="text-xs border-r border-gray-300 py-1 max-w-[180px] truncate" title={c.nombrearchivo}>{c.nombrearchivo}</TableCell>
                                    <TableCell className="text-xs border-r border-gray-300 py-1 text-right">{c.cantidadregistros.toLocaleString()}</TableCell>
                                    <TableCell className="text-xs border-r border-gray-300 py-1">
                                      {new Date(c.fechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="py-1 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Switch
                                          checked={c.estado === 'activo'}
                                          onCheckedChange={() => handleToggleCargueEstado(c.idcargue, c.estado)}
                                          disabled={togglingCargue === c.idcargue}
                                        />
                                        <span className={`text-xs font-medium ${c.estado === 'activo' ? 'text-green-700' : 'text-gray-500'}`}>
                                          {togglingCargue === c.idcargue ? '...' : c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Estado *</Label>
                      <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-sky-500 focus:border-sky-600 w-[15ch]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!editingId && (
                      <div className="col-span-2 bg-sky-50 border-2 border-sky-200 rounded-lg p-2">
                        <p className="text-xs text-sky-700"><strong>Nota:</strong> El código de la base se generará automáticamente.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button type="submit" className="!h-7 bg-black hover:bg-gray-800 text-white px-8 text-xs">{editingId ? 'Actualizar' : 'Crear Base'}</Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="!h-7 px-8 text-xs border-slate-200">Cancelar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Producto</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre Base</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Alias</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Máximo Cuotas</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha Creación</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
                <TableHead className="font-semibold text-right py-0.5 text-xs">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {basesPaginadas.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No hay bases configuradas</TableCell></TableRow>
              ) : basesPaginadas.map((b) => (
                <TableRow key={b.idbase} className="border-b border-gray-300">
                  <TableCell className="text-sm border-r border-gray-300">{b.productonombre}</TableCell>
                  <TableCell className="font-medium border-r border-gray-300">{b.nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600 border-r border-gray-300">{b.alias}</TableCell>
                  <TableCell className="text-center border-r border-gray-300">{b.maximocuotas}</TableCell>
                  <TableCell className="text-sm border-r border-gray-300">{new Date(b.fechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                  <TableCell className="border-r border-gray-300">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{b.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.idbase)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBases.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-600">Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + registrosPorPagina, filteredBases.length)} de {filteredBases.length} registros</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPaginaActual(p => p - 1)} disabled={paginaActual === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs">Página {paginaActual} de {totalPaginas || 1}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPaginaActual(p => p + 1)} disabled={paginaActual === totalPaginas || totalPaginas === 0}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}