import { useState, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Upload, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function Cargue() {
  const [selectedBase, setSelectedBase] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        toast.error('Tipo de archivo no válido. Use CSV o Excel.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor seleccione un archivo');
      return;
    }

    if (!selectedBase) {
      toast.error('Por favor seleccione una base');
      return;
    }

    setUploading(true);

    // Simular carga de archivo
    setTimeout(() => {
      setUploading(false);
      toast.success(`Archivo "${file.name}" cargado correctamente a la base ${selectedBase}`);
      setFile(null);
      setSelectedBase('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const downloadTemplate = () => {
    toast.success('Descargando plantilla de ejemplo...');
    // En producción, aquí se descargaría un archivo real
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>Cargue de Cartera</CardTitle>
            <CardDescription>
              Importe archivos de cartera a las bases de datos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Instrucciones de cargue:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Los archivos deben estar en formato CSV o Excel (.xlsx)</li>
                <li>La primera fila debe contener los encabezados de las columnas</li>
                <li>Utilice la plantilla proporcionada para evitar errores</li>
                <li>Tamaño máximo: 50 MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Descargar plantilla */}
        <div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla de Ejemplo
          </Button>
        </div>

        {/* Selección de base */}
        <div className="space-y-2">
          <Label htmlFor="base">Base de Destino *</Label>
          <Select value={selectedBase} onValueChange={setSelectedBase}>
            <SelectTrigger id="base" className="!h-7 !py-1 text-xs">
              <SelectValue placeholder="Seleccione una base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base001">BASE001 - Cartera Enero 2026</SelectItem>
              <SelectItem value="base002">BASE002 - Cartera Febrero 2026</SelectItem>
              <SelectItem value="base003">BASE003 - Cartera Marzo 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selector de archivo */}
        <div className="space-y-2">
          <Label htmlFor="file">Archivo de Cartera *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Arrastra y suelta tu archivo aquí o
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Botón de carga */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedBase || uploading}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Cargando...' : 'Cargar Archivo'}
          </Button>
        </div>

        {/* Historial reciente */}
        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-3">Últimos Cargues</h3>
          <div className="space-y-2">
            {[
              {
                nombre: 'cartera_enero_2026.xlsx',
                base: 'BASE001',
                fecha: '2026-03-05',
                registros: 1250,
              },
              {
                nombre: 'cartera_febrero_2026.csv',
                base: 'BASE002',
                fecha: '2026-03-04',
                registros: 980,
              },
              {
                nombre: 'actualización_cartera.xlsx',
                base: 'BASE001',
                fecha: '2026-03-03',
                registros: 450,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="h-7 text-xs flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {item.base} • {item.registros.toLocaleString()} registros
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.fecha).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
