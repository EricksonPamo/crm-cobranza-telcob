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
import { Plus, Pencil, Trash2, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';

interface FormData {
  nombre: string;
  idempresa: string;
  estado: string;
}

export function Producto() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const requireUser = (): string => {
    if (!currentUser?.id) { toast.error('Debe iniciar sesión para realizar esta acción'); throw new Error('Usuario no autenticado'); }
    return currentUser.id;
  };
  const [productos, setProductos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ nombre: '', idempresa: '', estado: 'activo' });
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosData, empresasData] = await Promise.all([db.getProductos(), db.getEmpresas()]);
      setProductos(productosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idempresa) { toast.error('Debe seleccionar una empresa'); return; }
    if (!formData.nombre.trim()) { toast.error('Debe ingresar un nombre'); return; }
    try {
      const userId = requireUser();
      if (editingId) {
        await db.updateProducto(editingId, { nombre: formData.nombre, idempresa: formData.idempresa, estado: formData.estado }, userId);
        toast.success('Producto actualizado correctamente');
      } else {
        await db.createProducto({ nombre: formData.nombre, idempresa: formData.idempresa, idusuario: userId, idusuariomod: userId, estado: formData.estado });
        toast.success('Producto creado correctamente');
      }
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      toast.error(error?.message || 'Error al guardar el producto');
    }
  };

  const handleEdit = (producto: any) => {
    setEditingId(producto.idproducto);
    setFormData({ nombre: producto.nombre || '', idempresa: producto.idempresa || '', estado: producto.estado || 'activo' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (idproducto: string) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      try {
        const userId = requireUser();
        await db.deleteProducto(idproducto, userId);
        toast.success('Producto eliminado correctamente');
        await loadData();
      } catch (error: any) {
        console.error('Error eliminando producto:', error);
        toast.error(error?.message || 'Error al eliminar el producto');
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', idempresa: '', estado: 'activo' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleBuscar = () => { setCriteriosAplicados({ fechaDesde, fechaHasta }); };

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.empresanombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fc = new Date(p.fechacreacion);
        if (criteriosAplicados.fechaDesde) matchesFecha = matchesFecha && fc >= new Date(criteriosAplicados.fechaDesde);
        if (criteriosAplicados.fechaHasta) { const h = new Date(criteriosAplicados.fechaHasta); h.setHours(23,59,59,999); matchesFecha = matchesFecha && fc <= h; }
      }
      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [productos, searchTerm, filterEstado, criteriosAplicados]);

  const totalPaginas = Math.ceil(filteredProductos.length / registrosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const productosPaginados = filteredProductos.slice(indiceInicio, indiceInicio + registrosPorPagina);
  const empresasActivas = empresas.filter((e) => e.estado === 'activo');

  if (loading) {
    return <Card className="border-2 border-sky-400 bg-gray-50"><CardContent className="py-12 text-center text-gray-500">Cargando productos...</CardContent></Card>;
  }

  return (
    <Card className="border-2 border-sky-400 bg-gray-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <CardTitle>Productos de Cobranza</CardTitle>
            <CardDescription>Gestione los productos financieros disponibles</CardDescription>
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
                <Button size="sm" className="h-7 text-xs px-3" onClick={() => { setEditingId(null); setFormData({ nombre: '', idempresa: '', estado: 'activo' }); setIsDialogOpen(true); }}><Plus className="w-3 h-3 mr-1" /> Nuevo Producto</Button>
              </DialogTrigger>
              <DialogContent className="text-xs !max-w-[770px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                  <DialogTitle className="text-sm font-bold text-slate-700">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">Complete los datos del producto</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Empresa *</Label>
                      <Select value={formData.idempresa} onValueChange={(v) => setFormData({...formData, idempresa: v})}>
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-[30ch]"><SelectValue placeholder="Seleccione una empresa" /></SelectTrigger>
                        <SelectContent>
                          {empresasActivas.length === 0 ? (
                            <div className="p-2 text-xs text-slate-400">No hay empresas activas</div>
                          ) : empresasActivas.map((e) => (
                            <SelectItem key={e.idempresa} value={e.idempresa}>{e.razonsocial}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Nombre *</Label>
                      <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: BCP Castigo" className="h-7 text-xs border-slate-200 focus:border-sky-300 w-[30ch]" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Estado *</Label>
                      <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!editingId && (
                      <div className="col-span-2 bg-sky-50 border-2 border-sky-200 rounded-lg p-2">
                        <p className="text-xs text-sky-700"><strong>Nota:</strong> El código del producto se generará automáticamente.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button type="submit" className="!h-7 bg-black hover:bg-gray-800 text-white px-8 text-xs">{editingId ? 'Actualizar' : 'Crear Producto'}</Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="!h-7 px-8 text-xs border-slate-200">Cancelar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Empresa</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha Creación</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
              <TableHead className="font-semibold text-right py-0.5 text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosPaginados.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No hay productos configurados</TableCell></TableRow>
            ) : productosPaginados.map((p) => (
              <TableRow key={p.idproducto} className="border-b border-gray-300">
                <TableCell className="font-medium border-r border-gray-300 py-0.5 text-xs">{p.nombre}</TableCell>
                <TableCell className="border-r border-gray-300 py-0.5 text-xs">{p.empresanombre}</TableCell>
                <TableCell className="text-xs border-r border-gray-300 py-0.5">{new Date(p.fechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                <TableCell className="border-r border-gray-300 py-0.5">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                </TableCell>
                <TableCell className="text-right py-0.5">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.idproducto)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-2 pt-2 border-t">
          <div className="text-sm text-gray-600">Página {paginaActual} de {totalPaginas} | Total: {filteredProductos.length} registro(s)</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="!h-7"><ChevronLeft className="w-4 h-4" /> Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="!h-7">Siguiente <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}