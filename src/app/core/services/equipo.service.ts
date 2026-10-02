import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '../models/auth.response';
import { Equipo, EquipoSave, EstadoEquipo, TipoEquipo } from '../models/equipo.model';
import { PaginatedResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/equipo';

  getEquiposPaginados(page = 0, size = 10, texto = '', estado: EstadoEquipo | null = null) {
    let params = new HttpParams().set('page', page).set('size', size).set('texto', texto);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<Equipo>>(`${this.apiUrl}/paginado`, { params });
  }

  /** Equipos activos, para elegirlos al reportar una incidencia. */
  listarActivos() {
    return this.http.get<ApiResponse<Equipo[]>>(`${this.apiUrl}/activos`);
  }

  getEquipo(id: number) {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  /** Código que se asignaría a un equipo nuevo de ese tipo. */
  previewCodigo(tipo: TipoEquipo) {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get(`${this.apiUrl}/preview-codigo`, { params, responseType: 'text' });
  }

  crearEquipo(data: EquipoSave) {
    return this.http.post<ApiResponse<Equipo>>(this.apiUrl, data);
  }

  editarEquipo(id: number, data: EquipoSave) {
    return this.http.put<ApiResponse<Equipo>>(`${this.apiUrl}/${id}`, data);
  }

  /** Baja lógica: el equipo pasa a INACTIVO y conserva su historial de incidencias. */
  eliminarEquipo(id: number) {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
