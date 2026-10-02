import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SeguimientoDTO, SeguimientoResponseDto } from '../models/seguimiento.model';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/seguimiento';

  obtenerMisSeguimientos(id: number) {
    return this.http.get<SeguimientoResponseDto[]>(`${this.apiUrl}/${id}/seguimientos`);
  }

  crearSeguimiento(data: SeguimientoDTO) {
    return this.http.post<SeguimientoResponseDto>(`${this.apiUrl}`, data);
  }
}
