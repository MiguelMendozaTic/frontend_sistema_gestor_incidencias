import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { ApiResponse, UsuarioResponseDto } from '../models/auth.response';
import {
  PaginatedResponse,
  Area,
  RegisterData,
  Solicitante,
  TecnicosDTO,
  UserUpdate,
  Usuario,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/usuario';

  getUsersPaginados(
    page = 0,
    size = 10,
    texto = '',
    estado: 'ACTIVO' | 'INACTIVO' | null = null,
  ): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams().set('page', page).set('size', size).set('texto', texto);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<Usuario>>(`${this.apiUrl}/paginado`, { params });
  }

  /** Alta de usuario por el administrador (permite elegir rol). */
  crearUsuario(data: RegisterData) {
    return this.http.post<ApiResponse<UsuarioResponseDto>>(this.apiUrl, data);
  }

  updateUsuario(id: bigint, usuario: UserUpdate) {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  getUser(id: bigint) {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  getUsuarioPrincipal() {
    const username = this.authService.currentUser()?.username;
    return this.http.get<Usuario>(`${this.apiUrl}/${username}/username`);
  }

  actualizarPerfil(usuario: { username: string; nombre: string; correo: string }) {
    return this.http.post<Usuario>(`${this.apiUrl}/updatePerfil`, usuario);
  }

  eliminarRol(data: { id: number; rol: string }) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/${data.id}/eliminarRol`, {
      role: data.rol,
    });
  }

  cambiarRol(data: { id: number; rol: string }) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/${data.id}/role`, {
      role: data.rol,
    });
  }

  /** Usuarios activos para elegir como solicitante (todos los roles). */
  buscarSolicitantes(texto = '', area: Area | null = null) {
    let params = new HttpParams().set('texto', texto);
    if (area) params = params.set('area', area);
    return this.http.get<Solicitante[]>(`${this.apiUrl}/solicitantes`, { params });
  }

  /** Técnicos con su carga de incidencias abiertas/en progreso. */
  listarTecnicos() {
    return this.http.get<ApiResponse<TecnicosDTO[]>>(`${this.apiUrl}/lista_tecnicos`);
  }
}
