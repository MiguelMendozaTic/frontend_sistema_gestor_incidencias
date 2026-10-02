import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DashboardAdmin, IncedenteStatsUsuario } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/dashboard';

  public getDashboardAdmin() {
    return this.http.get<DashboardAdmin>(this.apiUrl + '/principal');
  }

  public getIncientesStats() {
    return this.http.get<IncedenteStatsUsuario>(this.apiUrl + '/usuario');
  }
}
