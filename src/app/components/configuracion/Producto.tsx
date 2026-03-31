import { useState, useEffect, useMemo, SyntheticEvent } from 'react';
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
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  empresaId: string;
  empresaNombre: string;
  usuarioCreador: string;
  fechaCreacion: string;
  estado: 'activo' | 'inactivo';
}

interface Empresa {
  id: string;
  razonSocial: string;
  estado: 'activo' | 'inactivo';
}

interface Base {
  id: string;
  codigo: string;
  productoId: string;
  nombreBase: string;
  usuarioCreador: string;
  fechaCreacion: string;
  estado: 'activo' | 'inactivo';
}

// Producto simulado BCP Castigo
const productosBCP: Producto[] = [
  {
    id: '1',
    codigo: '1',
    nombre: 'BCP Castigo',
    empresaId: '1',
    empresaNombre: 'Banco de Crédito del Perú - BCP',
    usuarioCreador: 'admin',
    fechaCreacion: new Date('2024-01-20').toISOString(),
    estado: 'activo',
  },
];

export function Producto() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [basesPage, setBasesPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState<Partial<Producto>>({
    nombre: '',
    empresaId: '',
    estado: 'activo',
  });

  useEffect(() => {
    loadProductos();
    loadEmpresas();
    loadBases();
  }, []);

  const loadProductos = () => {
    const saved = localStorage.getItem('productos');
    if (saved) {
      setProductos(JSON.parse(saved));
    } else {
      // Cargar producto simulado de BCP por defecto
      setProductos(productosBCP);
      localStorage.setItem('productos', JSON.stringify(productosBCP));
    }
  };

  const loadEmpresas = () => {
    const saved = localStorage.getItem('empresas');
    if (saved) {
      const allEmpresas = JSON.parse(saved);
      setEmpresas(allEmpresas);
    }
  };

  const loadBases = () => {
    const saved = localStorage.getItem('bases');
    if (saved) {
      setBases(JSON.parse(saved));
    }
  };

  const saveProductos = (data: Producto[]) => {
    localStorage.setItem('productos', JSON.stringify(data));
    setProductos(data);
  };

  const saveBases = (data: Base[]) => {
    localStorage.setItem('bases', JSON.stringify(data));
    setBases(data);
  };

  const generateCodigo = () => {
    const maxCodigo = productos.reduce((max, p) => {
      const num = parseInt(p.codigo);
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

    if (!formData.empresaId) {
      toast.error('Debe seleccionar una empresa');
      return;
    }

    const empresaSeleccionada = empresas.find((e) => e.id === formData.empresaId);
    
    if (editingProducto) {
      const updated = productos.map((p) =>
        p.id === editingProducto.id 
          ? { 
              ...editingProducto, 
              ...formData,
              empresaNombre: empresaSeleccionada?.razonSocial || editingProducto.empresaNombre
            } 
          : p
      );
      saveProductos(updated);
      toast.success('Producto actualizado correctamente');
    } else {
      const newProducto: Producto = {
        id: Date.now().toString(),
        codigo: generateCodigo(),
        nombre: formData.nombre!,
        empresaId: formData.empresaId!,
        empresaNombre: empresaSeleccionada?.razonSocial || '',
        usuarioCreador: getCurrentUser(),
        fechaCreacion: new Date().toISOString(),
        estado: formData.estado as 'activo' | 'inactivo',
      };
      saveProductos([...productos, newProducto]);
      toast.success('Producto creado correctamente');
    }

    resetForm();
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      empresaId: producto.empresaId,
      estado: producto.estado,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      const updated = productos.filter((p) => p.id !== id);
      saveProductos(updated);
      toast.success('Producto eliminado correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      empresaId: '',
      estado: 'activo',
    });
    setEditingProducto(null);
    setIsDialogOpen(false);
    setBasesPage(1);
  };

  const handleToggleBaseEstado = (baseId: string) => {
    const updatedBases = bases.map((b) =>
      b.id === baseId
        ? { ...b, estado: b.estado === 'activo' ? ('inactivo' as const) : ('activo' as const) }
        : b
    );
    saveBases(updatedBases);
    toast.success('Estado de la base actualizado correctamente');
  };

  const basesAsociadas = useMemo(() => {
    return editingProducto
      ? bases.filter((b) => b.productoId === editingProducto.id)
      : [];
  }, [editingProducto, bases]);

  const handleBuscar = () => {
    setCriteriosAplicados({ fechaDesde, fechaHasta });
  };

  const filteredProductos = useMemo(() => {
    return productos.filter((producto) => {
      const matchesSearch =
        producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.usuarioCreador.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === 'todos' || producto.estado === filterEstado;

      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fechaCreacion = new Date(producto.fechaCreacion);
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
  }, [productos, searchTerm, filterEstado, criteriosAplicados]);

  const empresasActivas = useMemo(() => {
    return empresas.filter((e) => e.estado === 'activo');
  }, [empresas]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Productos de Cobranza</CardTitle>
              <CardDescription>
                Gestione los productos financieros disponibles
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
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="text-xs !max-w-[770px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
              <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Complete los datos del producto
                </DialogDescription>
              </DialogHeader>
              <div>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1">
                      <Label htmlFor="empresaId" className="text-xs font-medium text-slate-600">Empresa *</Label>
                      <Select
                        value={formData.empresaId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, empresaId: value })
                        }
                      >
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-[50ch]">
                          <SelectValue placeholder="Seleccione una empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresasActivas.length === 0 ? (
                            <div className="p-2 text-xs text-slate-400">
                              No hay empresas activas disponibles
                            </div>
                          ) : (
                            empresasActivas.map((empresa) => (
                              <SelectItem key={empresa.id} value={empresa.id}>
                                {empresa.razonSocial}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="nombre" className="text-xs font-medium text-slate-600">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        placeholder="Ej: BCP Castigo"
                        className="h-7 text-xs border-slate-200 focus:border-sky-300 w-[30ch]"
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
                        <SelectTrigger className="!h-7 !py-0.5 text-xs border-slate-200 focus:border-sky-300 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!editingProducto && (
                      <div className="col-span-2 bg-sky-50 border-2 border-sky-200 rounded-lg p-2">
                        <p className="text-xs text-sky-700">
                          <strong>Nota:</strong> El código del producto se generará automáticamente.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button type="submit" className="!h-7 bg-black hover:bg-gray-800 text-white px-8 text-xs">
                      {editingProducto ? 'Actualizar' : 'Crear Producto'}
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

                {editingProducto && basesAsociadas.length > 0 && (() => {
                  const totalPages = Math.ceil(basesAsociadas.length / itemsPerPage);
                  const startIndex = (basesPage - 1) * itemsPerPage;
                  const paginatedBases = basesAsociadas.slice(startIndex, startIndex + itemsPerPage);

                  return (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <h3 className="font-semibold mb-2 text-sm text-slate-700">Bases Asociadas</h3>
                    <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-200">
                            <TableHead className="font-medium text-left border-r border-slate-300 py-1 text-xs">Código</TableHead>
                            <TableHead className="font-medium text-left border-r border-slate-300 py-1 text-xs">Base</TableHead>
                            <TableHead className="font-medium text-left border-r border-slate-300 py-1 text-xs">Usuario</TableHead>
                            <TableHead className="font-medium text-left border-r border-slate-300 py-1 text-xs">Fecha</TableHead>
                            <TableHead className="font-medium text-center border-r border-slate-300 py-1 text-xs">Estado</TableHead>
                            <TableHead className="font-medium text-right py-1 text-xs">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedBases.map((base) => (
                            <TableRow key={base.id} className="border-b border-slate-200">
                              <TableCell className="font-medium text-left border-r border-slate-200 py-1 text-xs">{base.codigo}</TableCell>
                              <TableCell className="text-left border-r border-slate-200 py-1 text-xs">{base.nombreBase}</TableCell>
                              <TableCell className="text-slate-500 text-left border-r border-slate-200 py-1 text-xs">{base.usuarioCreador}</TableCell>
                              <TableCell className="text-slate-500 text-left border-r border-slate-200 py-1 text-xs">
                                {new Date(base.fechaCreacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell className="text-center border-r border-slate-200 py-1">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                    base.estado === 'activo'
                                      ? 'bg-emerald-100 text-emerald-600'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {base.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right py-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-500 hover:text-slate-700 h-6 px-2 text-xs"
                                  onClick={() => handleToggleBaseEstado(base.id)}
                                >
                                  {base.estado === 'activo' ? 'Inactivar' : 'Activar'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500">
                          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, basesAsociadas.length)} de {basesAsociadas.length} registros
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setBasesPage(basesPage - 1)}
                            disabled={basesPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="px-2 py-0.5 text-xs">
                            Página {basesPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setBasesPage(basesPage + 1)}
                            disabled={basesPage === totalPages}
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

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Código</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Nombre</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Empresa</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Usuario</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Fecha Creación</TableHead>
              <TableHead className="font-semibold border-r border-gray-300 py-0.5 text-xs">Estado</TableHead>
              <TableHead className="font-semibold text-right py-0.5 text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProductos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay productos configurados
                </TableCell>
              </TableRow>
            ) : (
              filteredProductos.map((producto) => (
                <TableRow key={producto.id} className="border-b border-gray-300">
                  <TableCell className="font-medium border-r border-gray-300 py-0.5 text-xs">{producto.codigo}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{producto.nombre}</TableCell>
                  <TableCell className="text-xs border-r border-gray-300 py-0.5">{producto.empresaNombre}</TableCell>
                  <TableCell className="text-xs border-r border-gray-300 py-0.5">{producto.usuarioCreador}</TableCell>
                  <TableCell className="text-xs border-r border-gray-300 py-0.5">
                    {new Date(producto.fechaCreacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        producto.estado === 'activo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-0.5">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(producto)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(producto.id)}
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
      </CardContent>
    </Card>
  );
}