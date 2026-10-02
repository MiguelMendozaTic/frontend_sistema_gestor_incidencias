import { Incidencia } from "./incident.model";
import { Usuario } from "./usuario.model";

export interface  Seguimiento {
  id: bigint,
  incidencia: Incidencia,
  comentario: string,
  fecha: Date,
  estado: "ACTIVO" | "INACTIVO"
  usuario: Usuario
}

export interface SeguimientoResponseDto{
  id: bigint,
  incidenciaId: number,
  comentario: string,
  fecha: Date,
  estado: "ACTIVO" | "INACTIVO"
  nombreUsuario: string
}

export interface SeguimientoDTO{
  comentario :string,
  idIncidencia : string,
  estado: "ACTIVO" | "INACTIVO"
}
