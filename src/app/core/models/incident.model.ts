import { Usuario } from './usuario.model';
import { Equipo } from './equipo.model';

export interface Incidencia {
  id: number;
  titulo: string;
  descripcion: string;
  estado: Status;
  prioridad?: Prioridad | null;
  fechaCreacion: Date;
  usuario: Usuario;
  tecnico?: Usuario | null;
  equipo?: Equipo | null;
  /** Usuario que recibe las notificaciones en su correo registrado. */
  solicitante?: Usuario | null;
  /** Se llenan al cerrar la incidencia. */
  fechaCierre?: Date | string | null;
  tecnicoCierre?: Usuario | null;
}

export type Status = 'ABIERTO' | 'PENDIENTE' | 'CERRADO';

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const ESTADOS: Status[] = ['ABIERTO', 'PENDIENTE', 'CERRADO'];

export const PRIORIDADES: Prioridad[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];

export const ESTADO_LABEL: Record<Status, string> = {
  ABIERTO: 'Abierta',
  PENDIENTE: 'En progreso',
  CERRADO: 'Cerrada',
};

export const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

export interface IncidenciaCreate {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  /** Equipo afectado (opcional). */
  equipoId: number | null;
  solicitanteId: number;
}

export interface IncidenciaUpdate {
  titulo: string;
  descripcion: string;
  estado: Status;
  prioridad: Prioridad;
  tecnicoId: number | null;
  equipoId: number | null;
  solicitanteId: number;
}

/** Clave legible tipo INC-0007 */
export const ticketKey = (id: number | undefined | null) =>
  'INC-' + String(id ?? 0).padStart(4, '0');
