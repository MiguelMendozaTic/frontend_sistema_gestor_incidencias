import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { CurrentUser, LoginCredentials, RegisterData } from '../models/usuario.model';
import { ApiResponse, Decoded, LoginResponse, UsuarioResponseDto } from '../models/auth.response';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;

  private _currentUser = signal<CurrentUser | null>(null);
  private _isAuthenticated = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  private readonly roles = computed(() => this._currentUser()?.roles ?? []);
  readonly isAdmin = computed(() => this.roles().includes('ROLE_ADMIN'));
  readonly isEmpleado = computed(() => this.roles().includes('ROLE_EMPLEADO'));
  readonly isTecnico = computed(() => this.roles().some((r) => r.startsWith('ROLE_TECNICO')));
  /** El backend permite crear incidencias a empleados y administradores. */
  readonly puedeCrearIncidencia = computed(() => this.isAdmin() || this.isEmpleado());

  constructor() {
    const token = localStorage.getItem('token');
    if (token) {
      this.registerSession(token);
    }
  }

  login(credentials: LoginCredentials) {
    return this.http
      .post<LoginResponse>(`${this.url}/login`, credentials)
      .pipe(tap((response) => this.registerSession(response.token)));
  }

  /** Registro público: el backend siempre crea el usuario como empleado. */
  registerNewUser(newUser: RegisterData): Observable<ApiResponse<UsuarioResponseDto>> {
    return this.http.post<ApiResponse<UsuarioResponseDto>>(`${this.url}/api/auth/register`, newUser);
  }

  registerSession(token: string): void {
    let decoded: Decoded & { exp?: number };
    try {
      decoded = jwtDecode<Decoded & { exp?: number }>(token);
    } catch {
      this.logout();
      return;
    }

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      this.logout();
      return;
    }

    localStorage.setItem('token', token);
    this._currentUser.set({ username: decoded.sub, roles: decoded.authorities ?? [] });
    this._isAuthenticated.set(true);
  }

  logout(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    localStorage.removeItem('token');
  }
}
