import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Incidencia, IncidenciaCreate, IncidenciaUpdate, Status } from '../models/incident.model';
import { PaginatedResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/incidencia';
  private readonly _incidencias = signal<Incidencia[]>([]);
  readonly incidencias = this._incidencias.asReadonly();

  public getIncidencia(id: number) {
    return this.http.get<Incidencia>(`${this.apiUrl}/${id}`);
  }

  /** Todas las incidencias (solo administrador). */
  public getIncidencias(page = 0, size = 10, texto = '') {
    return this.paginado('/paginado', page, size, texto);
  }

  /** Incidencias que el usuario reportó o tiene asignadas. */
  public misIncidencias(page = 0, size = 10, texto = '') {
    return this.paginado('/incidenciasPropias', page, size, texto);
  }

  public createIncidencia(data: IncidenciaCreate) {
    return this.http.post<Incidencia>(this.apiUrl, data);
  }

  /** Edición completa (solo administrador). */
  public editarIncidencia(id: number, data: IncidenciaUpdate) {
    // El backend recibe la entidad: técnico, equipo y solicitante van como { id } o null.
    const { tecnicoId, equipoId, solicitanteId, ...resto } = data;
    return this.http.put<Incidencia>(`${this.apiUrl}/${id}`, {
      ...resto,
      solicitante: { id: solicitanteId },
      tecnico: tecnicoId !== null ? { id: tecnicoId } : null,
      equipo: equipoId !== null ? { id: equipoId } : null,
    });
  }

  public cambiarEstado(data: { idIncidencia: number; estado: Status }) {
    return this.http.post<Incidencia>(`${this.apiUrl}/actualizarEstado`, data);
  }

  public cambiarTecnico(data: { idIncidencia: number; idTecnico: number }) {
    return this.http.post<Incidencia>(`${this.apiUrl}/actualizarTecnico`, data);
  }

  private paginado(path: string, page: number, size: number, texto: string) {
    const params = new HttpParams().set('page', page).set('size', size).set('texto', texto);
    return this.http.get<PaginatedResponse<Incidencia>>(this.apiUrl + path, { params }).pipe(
      tap((data) =>
        this._incidencias.set(
          data.content.map((d) => ({ ...d, fechaCreacion: new Date(d.fechaCreacion) })),
        ),
      ),
    );
  }
}
