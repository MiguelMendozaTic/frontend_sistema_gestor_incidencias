import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConfiguracionSistema {
  /** Segundos entre recargas automáticas; 0 = desactivado. */
  intervaloRefresco: number;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/configuracion';

  private readonly _intervalo = signal(30);
  readonly intervaloRefresco = this._intervalo.asReadonly();

  cargar() {
    this.http.get<ConfiguracionSistema>(this.apiUrl).subscribe({
      next: (c) => this._intervalo.set(c.intervaloRefresco),
      // Sin configuración disponible se mantiene el valor por defecto.
      error: () => {},
    });
  }

  guardar(intervaloRefresco: number) {
    return this.http
      .put<ConfiguracionSistema>(this.apiUrl, { intervaloRefresco })
      .pipe(tap((c) => this._intervalo.set(c.intervaloRefresco)));
  }
}
