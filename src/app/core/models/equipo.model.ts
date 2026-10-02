import { Area } from './usuario.model';

export type TipoEquipo =
  | 'LAPTOP'
  | 'PC'
  | 'IMPRESORA'
  | 'MONITOR'
  | 'TECLADO'
  | 'MOUSE'
  | 'SCANNER'
  | 'PROYECTOR'
  | 'SERVIDOR'
  | 'OTRO';

export type EstadoEquipo = 'ACTIVO' | 'INACTIVO';

export interface Equipo {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  tipo: TipoEquipo;
  area: Area;
  estado: EstadoEquipo;
}

/** Alta / edición. Si `codigo` va vacío, el backend lo genera (LAP-001...). */
export interface EquipoSave {
  nombre: string;
  codigo: string;
  descripcion: string;
  tipo: TipoEquipo;
  area: Area;
  estado?: EstadoEquipo;
}

export const TIPOS_EQUIPO: TipoEquipo[] = [
  'LAPTOP',
  'PC',
  'IMPRESORA',
  'MONITOR',
  'TECLADO',
  'MOUSE',
  'SCANNER',
  'PROYECTOR',
  'SERVIDOR',
  'OTRO',
];

export const TIPO_EQUIPO_LABEL: Record<TipoEquipo, string> = {
  LAPTOP: 'Laptop',
  PC: 'PC de escritorio',
  IMPRESORA: 'Impresora',
  MONITOR: 'Monitor',
  TECLADO: 'Teclado',
  MOUSE: 'Mouse',
  SCANNER: 'Escáner',
  PROYECTOR: 'Proyector',
  SERVIDOR: 'Servidor',
  OTRO: 'Otro',
};

/** Texto corto para selects y listados: "LAP-001 · Laptop Dell RRHH". */
export const equipoLabel = (e: Pick<Equipo, 'codigo' | 'nombre'>) => `${e.codigo} · ${e.nombre}`;
