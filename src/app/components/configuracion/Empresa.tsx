import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import { Building2, Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface EmpresaData {
  id: string;
  codigo: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  logoUrl: string;
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
}

// Datos simulados del BCP
const empresasBCP: EmpresaData[] = [
  {
    id: '1',
    codigo: '1',
    razonSocial: 'Banco de Crédito del Perú - BCP',
    ruc: '20100047218',
    direccion: 'Av. Centenario 156, La Molina',
    telefono: '+51 1 311-9898',
    email: 'contacto@bcp.com.pe',
    logoUrl: '',
    estado: 'activo',
    fechaCreacion: new Date('2024-01-15').toISOString(),
  },
];

export function Empresa() {
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('activo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [criteriosAplicados, setCriteriosAplicados] = useState({ fechaDesde: '', fechaHasta: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaData | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<EmpresaData>>({
    razonSocial: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    logoUrl: '',
    estado: 'activo',
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = () => {
    const savedData = localStorage.getItem('empresas');
    if (savedData) {
      setEmpresas(JSON.parse(savedData));
    } else {
      // Cargar datos simulados de BCP por defecto
      setEmpresas(empresasBCP);
      localStorage.setItem('empresas', JSON.stringify(empresasBCP));
    }
  };

  const saveEmpresas = (data: EmpresaData[]) => {
    localStorage.setItem('empresas', JSON.stringify(data));
    setEmpresas(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 2MB');
        return;
      }

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos PNG, JPG o SVG');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData({ ...formData, logoUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData({ ...formData, logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmpresa) {
      const updated = empresas.map((emp) =>
        emp.id === editingEmpresa.id ? { ...editingEmpresa, ...formData } : emp
      );
      saveEmpresas(updated);
      toast.success('Empresa actualizada correctamente');
    } else {
      const newEmpresa: EmpresaData = {
        id: Date.now().toString(),
        codigo: generateCodigo(),
        razonSocial: formData.razonSocial!,
        ruc: formData.ruc!,
        direccion: formData.direccion!,
        telefono: formData.telefono!,
        email: formData.email!,
        logoUrl: formData.logoUrl || '',
        estado: formData.estado as 'activo' | 'inactivo',
        fechaCreacion: new Date().toISOString(),
      };
      saveEmpresas([...empresas, newEmpresa]);
      toast.success('Empresa creada correctamente');
    }

    resetForm();
  };

  const handleEdit = (empresa: EmpresaData) => {
    setEditingEmpresa(empresa);
    setFormData(empresa);
    setLogoPreview(empresa.logoUrl || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      const updated = empresas.filter((emp) => emp.id !== id);
      saveEmpresas(updated);
      toast.success('Empresa eliminada correctamente');
    }
  };

  const resetForm = () => {
    setFormData({
      razonSocial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      logoUrl: '',
      estado: 'activo',
    });
    setEditingEmpresa(null);
    setLogoPreview(null);
    setIsDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof EmpresaData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBuscar = () => {
    setCriteriosAplicados({ fechaDesde, fechaHasta });
  };

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchesSearch =
        empresa.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.ruc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === 'todos' || empresa.estado === filterEstado;

      let matchesFecha = true;
      if (criteriosAplicados.fechaDesde || criteriosAplicados.fechaHasta) {
        const fechaCreacion = new Date(empresa.fechaCreacion);
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
  }, [empresas, searchTerm, filterEstado, criteriosAplicados]);

  const generateCodigo = () => {
    const maxCodigo = empresas.reduce((max, e) => {
      const num = parseInt(e.codigo);
      return num > max ? num : max;
    }, 0);
    return String(maxCodigo + 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>
                Gestione las empresas del sistema
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
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
              <DialogHeader className="bg-gradient-to-r from-sky-100 to-indigo-100 -mx-6 -mt-6 px-4 py-2 rounded-t-lg mb-2 border-b border-sky-200">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  {editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Complete los datos de la empresa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                  {/* Logo Upload */}
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="logo" className="text-xs font-medium text-slate-600">Logo de la Empresa</Label>
                    <div className="flex gap-3 items-start">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 object-contain border-2 border-slate-200 rounded-lg bg-white p-1"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="logo"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Seleccionar Logo
                        </Button>
                        <p className="text-xs text-slate-400 mt-1">
                          Formatos: PNG, JPG, SVG. Máx: 2MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="razonSocial" className="text-xs font-medium text-slate-600">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      value={formData.razonSocial}
                      onChange={(e) => handleChange('razonSocial', e.target.value)}
                      required
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ruc" className="text-xs font-medium text-slate-600">RUC *</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc}
                      onChange={(e) => handleChange('ruc', e.target.value)}
                      required
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="telefono" className="text-xs font-medium text-slate-600">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      required
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="direccion" className="text-xs font-medium text-slate-600">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      required
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium text-slate-600">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      className="h-7 text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="estado" className="text-xs font-medium text-slate-600">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => handleChange('estado', value)}
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

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="descripcion" className="text-xs font-medium text-slate-600">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      rows={2}
                      placeholder="Descripción breve de la empresa..."
                      className="text-xs border-slate-200 focus:border-sky-300"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Button type="submit" className="flex-1 h-7 bg-black hover:bg-gray-800 text-white text-xs">
                    {editingEmpresa ? 'Actualizar' : 'Crear Empresa'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 h-7 text-xs border-slate-200"
                  >
                    Cancelar
                  </Button>
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
            {filteredEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron empresas
                </TableCell>
              </TableRow>
            ) : (
              filteredEmpresas.map((empresa) => (
                <TableRow key={empresa.id} className="border-b border-gray-300">
                  <TableCell className="border-r border-gray-300 py-0.5">
                    {empresa.logoUrl ? (
                      <img
                        src={empresa.logoUrl}
                        alt={empresa.razonSocial}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium border-r border-gray-300 py-0.5 text-xs">{empresa.razonSocial}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.ruc}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.telefono}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5 text-xs">{empresa.email}</TableCell>
                  <TableCell className="border-r border-gray-300 py-0.5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        empresa.estado === 'activo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {empresa.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-0.5">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(empresa)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(empresa.id)}
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