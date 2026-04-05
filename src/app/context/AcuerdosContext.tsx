import { createContext, useContext, useState, ReactNode } from 'react';

// Interfaz para un acuerdo/pre-acuerdo
export interface Acuerdo {
  id: string;
  producto: string;
  identificacion: string;
  nombre: string;
  cuenta: string;
  telefono: string;
  tipoAcuerdo: string;
  tipificacion: string;
  montoNegociado: number;
  cuotas: number;
  fechaCreacion: string;
  agente: string;
  estado: string;
  moneda: string;
  deudaTotal: number;
  fechaCompromiso: string;
  detalleCuotas: CuotaAcuerdo[];
  comentario: string;
  tipo: 'pre-acuerdo' | 'acuerdo';
}

export interface CuotaAcuerdo {
  nro: number | string;
  montoCuota: number;
  fechaCuota: string;
}

interface AcuerdosContextType {
  preAcuerdos: Acuerdo[];
  acuerdos: Acuerdo[];
  agregarAcuerdo: (acuerdo: Acuerdo) => void;
  actualizarAcuerdo: (id: string, acuerdo: Partial<Acuerdo>) => void;
  eliminarAcuerdo: (id: string, tipo: 'pre-acuerdo' | 'acuerdo') => void;
}

const AcuerdosContext = createContext<AcuerdosContextType | undefined>(undefined);

export function AcuerdosProvider({ children }: { children: ReactNode }) {
  const [preAcuerdos, setPreAcuerdos] = useState<Acuerdo[]>([]);
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>([]);

  const agregarAcuerdo = (acuerdo: Acuerdo) => {
    if (acuerdo.tipo === 'pre-acuerdo') {
      setPreAcuerdos(prev => [...prev, acuerdo]);
    } else {
      setAcuerdos(prev => [...prev, acuerdo]);
    }
  };

  const actualizarAcuerdo = (id: string, acuerdoActualizado: Partial<Acuerdo>) => {
    setPreAcuerdos(prev =>
      prev.map(a => a.id === id ? { ...a, ...acuerdoActualizado } : a)
    );
    setAcuerdos(prev =>
      prev.map(a => a.id === id ? { ...a, ...acuerdoActualizado } : a)
    );
  };

  const eliminarAcuerdo = (id: string, tipo: 'pre-acuerdo' | 'acuerdo') => {
    if (tipo === 'pre-acuerdo') {
      setPreAcuerdos(prev => prev.filter(a => a.id !== id));
    } else {
      setAcuerdos(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <AcuerdosContext.Provider value={{
      preAcuerdos,
      acuerdos,
      agregarAcuerdo,
      actualizarAcuerdo,
      eliminarAcuerdo,
    }}>
      {children}
    </AcuerdosContext.Provider>
  );
}

export function useAcuerdos() {
  const context = useContext(AcuerdosContext);
  if (context === undefined) {
    throw new Error('useAcuerdos debe usarse dentro de AcuerdosProvider');
  }
  return context;
}