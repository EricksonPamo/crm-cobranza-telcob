import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import { Building2, Plus, Pencil, Trash2, Search, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';

interface FormData {
  razonsocial: string;
  ruc: string;
  telefono: string;
  direccion: string;
  email: string;
  logo: string;
  descripcion: string;
  estado: string;
}

export function Empresa() {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const requireUser = (): string => {
    if (!currentUser?.id) { toast.error('Debe iniciar sesión para realizar esta acción'); throw new Error('Usuario no autenticado'); }
    return currentUser.id;
  };
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    razonsocial: '', ruc: '', telefono: '', direccion: '', email: '', logo: '', descripcion: '', estado: 'activo',
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  useEffect(() => { loadEmpresas(); }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await db.getEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('El archivo debe ser menor a 2MB'); return; }
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) { toast.error('Solo PNG, JPG o SVG'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setFormData({ ...formData, logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razonsocial.trim()) { toast.error('Debe ingresar la razón social'); return; }
    if (!formData.ruc.trim()) { toast.error('Debe ingresar el RUC'); return; }
    try {
      const userId = requireUser();
      if (editingId) {
        await db.updateEmpresa(editingId, {
          razonsocial: formData.razonsocial,
          ruc: formData.ruc,
          direccion: formData.direccion || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          logo: formData.logo || null,
          descripcion: formData.descripcion || null,
          estado: formData.estado,
        }, userId);
        toast.success('Empresa actualizada correctamente');
      } else {
        await db.createEmpresa({
          razonsocial: formData.razonsocial,
          ruc: formData.ruc,
          telefono: formData.telefono || null,
          direccion: formData.direccion || null,
          email: formData.email || null,
          descripcion: formData.descripcion || null,
          logo: formData.logo || null,
          idusuario: userId,
          idusuariomod: userId,
          estado: formData.estado,
        });
        toast.success('Empresa creada correctamente');
      }
      resetForm();
      await loadEmpresas();
    } catch (error: any) {
      console.error('Error guardando empresa:', error);
      toast.error(error?.message || 'Error al guardar la empresa');
    }
  };

  const handleEdit = (empresa: any) => {
    setEditingId(empresa.idempresa);
    setFormData({
      razonsocial: empresa.razonsocial || '',
      ruc: empresa.ruc || '',
      telefono: empresa.telefono || '',
      direccion: empresa.direccion || '',
      email: empresa.email || '',
      logo: empresa.logo || '',
      descripcion: empresa.descripcion || '',
      estado: empresa.estado || 'activo',
    });
    setLogoPreview(empresa.logo || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (idempresa: string) => {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      try {
        const userId = requireUser();
        await db.deleteEmpresa(idempresa, userId);
        toast.success('Empresa eliminada correctamente');
        await loadEmpresas();
      } catch (error: any) {
        console.error('Error eliminando empresa:', error);
        toast.error(error?.message || 'Error al eliminar la empresa');
      }
    }
  };

  const resetForm = () => {
    setFormData({ razonsocial: '', ruc: '', telefono: '', direccion: '', email: '', logo: '', descripcion: '', estado: 'activo' });
    setEditingId(null);
    setLogoPreview(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBuscar = () => { setCriteriosAplicados({ fechaDesde, fechaHasta }); };

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((e) => {
      const matchesSearch = e.razonsocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || e.estado === filterEstado;
      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fc = new Date(e.fechacreacion);
        if (criteriosAplicados.fechaDesde) matchesFecha = matchesFecha && fc >= new Date(criteriosAplicados.fechaDesde);
        if (criteriosAplicados.fechaHasta) { const h = new Date(criteriosAplicados.fechaHasta); h.setHours(23,59,59,999); matchesFecha = matchesFecha && fc <= h; }
      }
      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [empresas, searchTerm, filterEstado, criteriosAplicados]);

  const totalPaginas = Math.ceil(filteredEmpresas.length / registrosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const empresasPaginadas = filteredEmpresas.slice(indiceInicio, indiceInicio + registrosPorPagina);

  if (loading) {
    return <Card className="border-2 border-sky-400 bg-gray-50"><CardContent className="py-12 text-center text-gray-500">Cargando empresas...</CardContent></Card>;
  }

  return (
    <Card className="border-2 border-sky-400 bg-gray-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>Gestione las empresas del sistema</CardDescription>
            </div>
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
          <Button size="sm" className="h-7 text-xs px-3" onClick={handleBuscar}>
            <Search className="w-3 h-3 mr-1" /> Buscar
          </Button>
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
                <Button size="sm" className="h-7 text-xs px-3" onClick={() => { setEditingId(null); setFormData({ razonsocial: '', ruc: '', telefono: '', direccion: '', email: '', logo: '', descripcion: '', estado: 'activo' }); setLogoPreview(null); setIsDialogOpen(true); }}>
                  <Plus className="w-3 h-3 mr-1" /> Nueva Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                  <DialogTitle className="text-sm font-bold text-slate-700">{editingId ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">Complete los datos de la empresa</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium text-slate-600">Logo de la Empresa</Label>
                      <div className="flex gap-3 items-start">
                        {logoPreview ? (
                          <div className="relative">
                            <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain border-2 border-slate-200 rounded-lg bg-white p-1" />
                            <button type="button" onClick={removeLogo} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50"><Upload className="w-6 h-6 text-slate-400" /></div>
                        )}
                        <div className="flex-1">
                          <input ref={fileInputRef} type="file" id="logo" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleFileChange} className="hidden" />
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs"><Upload className="w-3 h-3 mr-1" />Seleccionar Logo</Button>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG. Máx: 2MB</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium text-slate-600">Razón Social *</Label>
                      <Input value={formData.razonsocial} onChange={(e) => setFormData({...formData, razonsocial: e.target.value})} required className="h-7 text-xs border-slate-200 focus:border-sky-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">RUC *</Label>
                      <Input value={formData.ruc} onChange={(e) => setFormData({...formData, ruc: e.target.value})} required className="h-7 text-xs border-slate-200 focus:border-sky-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Teléfono</Label>
                      <Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="h-7 text-xs border-slate-200 focus:border-sky-300" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium text-slate-600">Dirección</Label>
                      <Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="h-7 text-xs border-slate-200 focus:border-sky-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Email</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-7 text-xs border-slate-200 focus:border-sky-300" />
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
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium text-slate-600">Descripción</Label>
                      <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} rows={2} placeholder="Descripción breve..." className="text-xs border-slate-200 focus:border-sky-300" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button type="submit" className="flex-1 h-7 bg-black hover:bg-gray-800 text-white text-xs">{editingId ? 'Actualizar' : 'Crear Empresa'}</Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-7 text-xs border-slate-200">Cancelar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Logo</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Razón Social</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">RUC</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Teléfono</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Email</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
              <TableHead className="font-semibold text-right py-0.5 text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresasPaginadas.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No se encontraron empresas</TableCell></TableRow>
            ) : (
              empresasPaginadas.map((empresa) => (
                <TableRow key={empresa.idempresa} className="border-b border-gray-300">
                  <TableCell className="border-r border-gray-300 py-0.5">
                    {empresa.logo ? <img src={empresa.logo} alt={empresa.razonsocial} className="w-12 h-12 object-contain" /> : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-400" /></div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium border-r border-gray-300 py-0.5 text-xs">{empresa.razonsocial}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.ruc}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.telefono}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.email}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${empresa.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {empresa.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-0.5">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(empresa)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(empresa.idempresa)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-2 pt-2 border-t">
          <div className="text-sm text-gray-600">Página {paginaActual} de {totalPaginas} | Total: {filteredEmpresas.length} registro(s)</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="!h-7"><ChevronLeft className="w-4 h-4" /> Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="!h-7">Siguiente <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}