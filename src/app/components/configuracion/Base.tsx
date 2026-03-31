import { useState, useEffect, SyntheticEvent, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Database, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Base {
  id: string;
  codigo: string;
  productoId: string;
  productoNombre: string;
  nombreBase: string;
  alias: string;
  cargueGestionar: string;
  maximoCuotas: number;
  usuarioCreador: string;
  fechaCreacion: string;
  estado: 'activo' | 'inactivo';
}

interface Producto {
  id: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
}

interface CargueObligacion {
  id: string;
  codigo: string;
  baseId: string;
  tipo: 'obligacion' | 'pago' | 'campaña';
  nombreCargue: string;
  registrosCargados: number;
  usuarioCreador: string;
  fechaCreacion: string;
  estado: 'activo' | 'inactivo';
}

// Base simulada
const basesMock: Base[] = [
  {
    id: '1',
    codigo: '1',
    productoId: '1',
    productoNombre: 'BCP Castigo',
    nombreBase: 'Base de Marzo 2026',
    alias: 'BCPMar2026',
    cargueGestionar: 'Pendiente',
    maximoCuotas: 12,
    usuarioCreador: 'admin',
    fechaCreacion: new Date('2026-03-01').toISOString(),
    estado: 'activo',
  },
];

// Cargues simulados
const carguesMock: CargueObligacion[] = [
  {
    id: '1',
    codigo: '1',
    baseId: '1',
    tipo: 'obligacion',
    nombreCargue: 'Cargue Obligaciones Marzo',
    registrosCargados: 1500,
    usuarioCreador: 'admin',
    fechaCreacion: new Date('2026-03-02').toISOString(),
    estado: 'activo',
  },
  {
    id: '2',
    codigo: '2',
    baseId: '1',
    tipo: 'pago',
    nombreCargue: 'Cargue Pagos Marzo',
    registrosCargados: 850,
    usuarioCreador: 'admin',
    fechaCreacion: new Date('2026-03-03').toISOString(),
    estado: 'activo',
  },
  {
    id: '3',
    codigo: '3',
    baseId: '1',
    tipo: 'campaña',
    nombreCargue: 'Cargue Campaña Especial',
    registrosCargados: 320,
    usuarioCreador: 'supervisor',
    fechaCreacion: new Date('2026-03-04').toISOString(),
    estado: 'inactivo',
  },
];

export function Base() {
  const [bases, setBases] = useState<Base[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carguesObligacion, setCarguesObligacion] = useState<CargueObligacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [carguesPage, setCarguesPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState<Partial<Base>>({
    productoId: '',
    nombreBase: '',
    alias: '',
    cargueGestionar: 'Pendiente',
    maximoCuotas: 1,
    estado: 'activo',
  });

  useEffect(() => {
    loadBases();
    loadProductos();
    loadCargues();
  }, []);

  const loadBases = () => {
    const saved = localStorage.getItem('bases');
    if (saved) {
      setBases(JSON.parse(saved));
    } else {
      // Cargar base simulada por defecto
      setBases(basesMock);
      localStorage.setItem('bases', JSON.stringify(basesMock));
    }
  };

  const loadProductos = () => {
    const saved = localStorage.getItem('productos');
    if (saved) {
      const allProductos = JSON.parse(saved);
      setProductos(allProductos);
    }
  };

  const loadCargues = () => {
    const saved = localStorage.getItem('cargues');
    if (saved) {
      const allCargues = JSON.parse(saved);
      setCarguesObligacion(allCargues);
    } else {
      // Cargar cargues simulados por defecto
      setCarguesObligacion(carguesMock);
      localStorage.setItem('cargues', JSON.stringify(carguesMock));
    }
  };

  const saveBases = (data: Base[]) => {
    localStorage.setItem('bases', JSON.stringify(data));
    setBases(data);
  };

  const generateCodigo = () => {
    const maxCodigo = bases.reduce((max, b) => {
      const num = parseInt(b.codigo);
      return num > max ? num : max;
    }, 0);
    return String(maxCodigo + 1);
  };

  const getCurrentUser = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.username || user.email || 'Usuario';
    }
    return 'Admin';
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.productoId) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    const productoSeleccionado = productos.find((p) => p.id === formData.productoId);
    
    if (editingBase) {
      const updated = bases.map((b) =>
        b.id === editingBase.id 
          ? { 
              ...editingBase, 
              ...formData,
              productoNombre: productoSeleccionado?.nombre || editingBase.productoNombre
            } 
          : b
      );
      saveBases(updated);
      toast.success('Base actualizada correctamente');
    } else {
      const newBase: Base = {
        id: Date.now().toString(),
        codigo: generateCodigo(),
        productoId: formData.productoId!,
        productoNombre: productoSeleccionado?.nombre || '',
        nombreBase: formData.nombreBase!,
        alias: formData.alias!,
        cargueGestionar: formData.cargueGestionar!,
        maximoCuotas: formData.maximoCuotas!,
        usuarioCreador: getCurrentUser(),
        fechaCreacion: new Date().toISOString(),
        estado: formData.estado as 'activo' | 'inactivo',
      };
      saveBases([...bases, newBase]);
      toast.success('Base creada correctamente');
    }

    resetForm();
  };

  const handleEdit = (base: Base) => {
    setEditingBase(base);
    setFormData({
      productoId: base.productoId,
      nombreBase: base.nombreBase,
      alias: base.alias,
      cargueGestionar: base.cargueGestionar,
      maximoCuotas: base.maximoCuotas,
      estado: base.estado,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta base?')) {
      const updated = bases.filter((b) => b.id !== id);
      saveBases(updated);
      toast.success('Base eliminada correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      productoId: '',
      nombreBase: '',
      alias: '',
      cargueGestionar: 'Pendiente',
      maximoCuotas: 1,
      estado: 'activo',
    });
    setEditingBase(null);
    setIsDialogOpen(false);
    setCarguesPage(1);
  };

  const handleToggleCargueEstado = (cargueId: string) => {
    const updatedCargues = carguesObligacion.map((c) =>
      c.id === cargueId
        ? { ...c, estado: c.estado === 'activo' ? ('inactivo' as const) : ('activo' as const) }
        : c
    );
    saveCargues(updatedCargues);
    toast.success('Estado del cargue actualizado correctamente');
  };

  const saveCargues = (data: CargueObligacion[]) => {
    localStorage.setItem('cargues', JSON.stringify(data));
    setCarguesObligacion(data);
  };

  const carguesAsociados = useMemo(() => {
    return editingBase
      ? carguesObligacion.filter((c) => c.baseId === editingBase.id)
      : [];
  }, [editingBase, carguesObligacion]);

  // Filtrar solo cargues activos de tipo obligación para el selector
  const carguesObligacionActivos = useMemo(() => {
    return carguesObligacion.filter(
      (c) => c.tipo === 'obligacion' && c.estado === 'activo'
    );
  }, [carguesObligacion]);

  const handleBuscar = () => {
    setCriteriosAplicados({ fechaDesde, fechaHasta });
  };

  const filteredBases = useMemo(() => {
    return bases.filter((base) => {
      const matchesSearch =
        base.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.nombreBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.usuarioCreador.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === 'todos' || base.estado === filterEstado;

      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fechaCreacion = new Date(base.fechaCreacion);
        if (criteriosAplicados.fechaDesde) {
          matchesFecha = matchesFecha && fechaCreacion >= new Date(criteriosAplicados.fechaDesde);
        }
        if (criteriosAplicados.fechaHasta) {
          const hasta = new Date(criteriosAplicados.fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          matchesFecha = matchesFecha && fechaCreacion <= hasta;
        }
      }

      return matchesSearch && matchesEstado && matchesFecha;
    });
  }, [bases, searchTerm, filterEstado, criteriosAplicados]);

  const productosActivos = productos.filter((p) => p.estado === 'activo');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Bases de Cobranza</CardTitle>
              <CardDescription>
                Gestione las bases de datos de cobranza
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">Desde:</span>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="h-7 text-xs w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">Hasta:</span>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="h-7 text-xs w-36"
            />
          </div>
          <Button size="sm" className="h-7 text-xs px-3" onClick={handleBuscar}>
            <Search className="w-3 h-3 mr-1" />
            Buscar
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Select value={filterEstado} onValueChange={(value: any) => setFilterEstado(value)}>
              <SelectTrigger className="w-28 !h-7 !py-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs px-3" onClick={resetForm}>
                <Plus className="w-3 h-3 mr-1" />
                Nueva Base
              </Button>
            </DialogTrigger>
            <DialogContent className="text-xs !max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
              <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  {editingBase ? 'Editar Base' : 'Nueva Base'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Complete los datos de la base de datos
                </DialogDescription>
              </DialogHeader>
              <div>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="productoId" className="text-xs font-medium text-slate-600">Producto *</Label>
                      <Select
                        value={formData.productoId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, productoId: value })
                        }
                      >
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-[35ch]">
                          <SelectValue placeholder="Seleccione un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productosActivos.length === 0 ? (
                            <div className="p-2 text-xs text-slate-400">
                              No hay productos activos disponibles
                            </div>
                          ) : (
                            productosActivos.map((producto) => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.nombre}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="nombreBase" className="text-xs font-medium text-slate-600">Nombre de la Base *</Label>
                      <Input
                        id="nombreBase"
                        value={formData.nombreBase}
                        onChange={(e) =>
                          setFormData({ ...formData, nombreBase: e.target.value })
                        }
                        placeholder="Ej: Base de Marzo 2026"
                        className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="alias" className="text-xs font-medium text-slate-600">Alias *</Label>
                      <Input
                        id="alias"
                        value={formData.alias}
                        onChange={(e) =>
                          setFormData({ ...formData, alias: e.target.value })
                        }
                        placeholder="Ej: BCPMar2026"
                        className="h-7 text-xs border-slate-200 focus:border-sky-300"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="cargueGestionar" className="text-xs font-medium text-slate-600">Cargue Gestionar *</Label>
                      <Select
                        value={formData.cargueGestionar}
                        onValueChange={(value) =>
                          setFormData({ ...formData, cargueGestionar: value })
                        }
                      >
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-[15ch]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          {carguesObligacionActivos.length > 0 &&
                            carguesObligacionActivos.map((cargue) => (
                              <SelectItem key={cargue.id} value={cargue.codigo}>
                                {cargue.codigo}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="maximoCuotas" className="text-xs font-medium text-slate-600">Máximo de Cuotas *</Label>
                      <Input
                        id="maximoCuotas"
                        type="number"
                        min="1"
                        value={formData.maximoCuotas}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maximoCuotas: parseInt(e.target.value),
                          })
                        }
                        className="h-7 text-xs border-slate-200 focus:border-sky-300 w-[10ch]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="estado" className="text-xs font-medium text-slate-600">Estado *</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) =>
                          setFormData({ ...formData, estado: value as 'activo' | 'inactivo' })
                        }
                      >
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-[15ch]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!editingBase && (
                      <div className="col-span-2 bg-sky-50 border-2 border-sky-200 rounded-lg p-2">
                        <p className="text-xs text-sky-700">
                          <strong>Nota:</strong> El código de la base se generará automáticamente.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button type="submit" className="!h-7 bg-black hover:bg-gray-800 text-white px-8 text-xs">
                      {editingBase ? 'Actualizar' : 'Crear Base'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="!h-7 px-8 text-xs border-slate-200"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>

                {editingBase && carguesAsociados.length > 0 && (() => {
                  const totalPages = Math.ceil(carguesAsociados.length / itemsPerPage);
                  const startIndex = (carguesPage - 1) * itemsPerPage;
                  const paginatedCargues = carguesAsociados.slice(startIndex, startIndex + itemsPerPage);
                  
                  return (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-4 text-lg">Cargues Asociados</h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-200">
                            <TableHead className="font-semibold text-left border-r border-gray-300 py-2">Código</TableHead>
                            <TableHead className="font-semibold text-left border-r border-gray-300 py-2">Tipo</TableHead>
                            <TableHead className="font-semibold text-left border-r border-gray-300 py-2">Cargue</TableHead>
                            <TableHead className="font-semibold text-right border-r border-gray-300 py-2">Registros</TableHead>
                            <TableHead className="font-semibold text-left border-r border-gray-300 py-2">Usuario</TableHead>
                            <TableHead className="font-semibold text-left border-r border-gray-300 py-2">Fecha</TableHead>
                            <TableHead className="font-semibold text-center border-r border-gray-300 py-2">Estado</TableHead>
                            <TableHead className="font-semibold text-right py-2">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCargues.map((cargue) => (
                            <TableRow key={cargue.id} className="border-b border-gray-300">
                              <TableCell className="font-medium text-left border-r border-gray-300 py-0.5.5 text-sm">{cargue.codigo}</TableCell>
                              <TableCell className="text-left border-r border-gray-300 py-0.5.5 text-sm">
                                <span className="capitalize">{cargue.tipo}</span>
                              </TableCell>
                              <TableCell className="text-left border-r border-gray-300 py-0.5.5 text-sm">{cargue.nombreCargue}</TableCell>
                              <TableCell className="text-gray-600 text-right border-r border-gray-300 py-0.5.5 text-sm">{cargue.registrosCargados.toLocaleString()}</TableCell>
                              <TableCell className="text-gray-600 text-left border-r border-gray-300 py-0.5.5 text-sm">{cargue.usuarioCreador}</TableCell>
                              <TableCell className="text-gray-600 text-left border-r border-gray-300 py-0.5.5 text-sm">
                                {new Date(cargue.fechaCreacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell className="text-center border-r border-gray-300 py-0.5.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                    cargue.estado === 'activo'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {cargue.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right py-0.5.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-900 h-7 px-2 text-xs"
                                  onClick={() => handleToggleCargueEstado(cargue.id)}
                                >
                                  {cargue.estado === 'activo' ? 'Inactivar' : 'Activar'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600">
                          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, carguesAsociados.length)} de {carguesAsociados.length} registros
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCarguesPage(carguesPage - 1)}
                            disabled={carguesPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="px-3 py-0.5 text-sm">
                            Página {carguesPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCarguesPage(carguesPage + 1)}
                            disabled={carguesPage === totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Código</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Producto</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre Base</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Alias</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Cargue Gestionar</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Máximo Cuotas</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Usuario</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha Creación</TableHead>
                <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
                <TableHead className="font-semibold text-right py-0.5 text-xs">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No hay bases configuradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredBases.map((base) => (
                  <TableRow key={base.id} className="border-b border-gray-300">
                    <TableCell className="font-medium border-r border-gray-300">{base.codigo}</TableCell>
                    <TableCell className="text-sm border-r border-gray-300">{base.productoNombre}</TableCell>
                    <TableCell className="font-medium border-r border-gray-300">{base.nombreBase}</TableCell>
                    <TableCell className="text-sm text-gray-600 border-r border-gray-300">{base.alias}</TableCell>
                    <TableCell className="border-r border-gray-300">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          base.cargueGestionar === 'Completado'
                            ? 'bg-green-100 text-green-800'
                            : base.cargueGestionar === 'En Proceso'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {base.cargueGestionar}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border-r border-gray-300">{base.maximoCuotas}</TableCell>
                    <TableCell className="text-sm border-r border-gray-300">{base.usuarioCreador}</TableCell>
                    <TableCell className="text-sm border-r border-gray-300">
                      {new Date(base.fechaCreacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="border-r border-gray-300">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          base.estado === 'activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {base.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(base)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(base.id)}
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
      </CardContent>
    </Card>
  );
}