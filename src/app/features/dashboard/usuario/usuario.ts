import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { DashboardService } from '@services/dashboard.service';
import { IncedenteStatsUsuario } from 'src/app/core/models/dashboard.model';
import { ticketKey } from 'src/app/core/models/incident.model';
import { Icon } from '@shared/components/icon/icon';
import { PriorityBadge, StatusBadge } from '@shared/components/badges/badges';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { EstadoDistribucion, KpiTiles } from '../widgets';

@Component({
  selector: 'app-usuario',
  imports: [DatePipe, RouterLink, Icon, StatusBadge, PriorityBadge, KpiTiles, EstadoDistribucion],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Hola, {{ authService.currentUser()?.username }}</h1>
          <p class="page-subtitle">
            @if (authService.isTecnico()) {
              Resumen de las incidencias que tienes asignadas o reportaste.
            } @else {
              Resumen de las incidencias que reportaste.
            }
          </p>
        </div>
        @if (authService.puedeCrearIncidencia()) {
          <a routerLink="/incidencia" [queryParams]="{ nueva: 1 }" class="btn btn-primary">
            <app-icon name="plus" /> Nueva incidencia
          </a>
        }
      </header>

      @if (error()) {
        <p class="alert alert-error" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span class="flex-1">{{ error() }}</span>
          <button type="button" class="font-medium underline" (click)="getDashboard()">Reintentar</button>
        </p>
      }

      <app-kpi-tiles [stats]="data()?.incidentStats ?? null" totalLabel="Mis incidencias" />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section class="card">
          <header class="card-header"><h2 class="card-title">Por estado</h2></header>
          <div class="p-4">
            <app-estado-distribucion [stats]="data()?.incidentStats ?? null" />
          </div>
        </section>

        <section class="card lg:col-span-2">
          <header class="card-header">
            <h2 class="card-title">Actividad reciente</h2>
            <a routerLink="/incidencia" class="text-sm font-medium text-primary hover:underline">Ver todas</a>
          </header>
          <ul class="divide-y divide-line">
            @if (!data()) {
              @for (i of [1, 2, 3]; track i) {
                <li class="space-y-2 px-4 py-3">
                  <div class="skeleton h-3.5 w-64"></div>
                  <div class="skeleton h-3 w-32"></div>
                </li>
              }
            } @else {
              @for (inc of data()!.incidenciasRecientes; track inc.id) {
                <li>
                  <a
                    [routerLink]="['/incidencia/seguimiento', inc.id]"
                    class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <span class="ticket-key w-20">{{ key(inc.id) }}</span>
                    <span class="min-w-0 flex-1 truncate font-medium text-fg">{{ inc.titulo }}</span>
                    <app-priority-badge [prioridad]="inc.prioridad" />
                    <app-status-badge [estado]="inc.estado" />
                    <span class="w-24 text-right text-xs text-fg-subtle">
                      {{ inc.fechaCreacion | date: 'dd MMM yyyy' }}
                    </span>
                  </a>
                </li>
              } @empty {
                <li class="px-4 py-10 text-center">
                  <app-icon name="inbox" [size]="28" class="mx-auto text-fg-subtle" />
                  <p class="mt-2 text-sm text-fg-subtle">Todavía no tienes incidencias.</p>
                </li>
              }
            }
          </ul>
        </section>
      </div>
    </div>
  `,
})
export class Usuario {
  protected authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  protected data = signal<IncedenteStatsUsuario | null>(null);
  protected error = signal('');
  protected key = ticketKey;

  constructor() {
    this.getDashboard();
    autoRefresco(() => this.getDashboard(true));
  }

  getDashboard(silencioso = false) {
    if (!silencioso) this.error.set('');
    this.dashboardService.getIncientesStats().subscribe({
      next: (e) => this.data.set(e),
      error: (e) => !silencioso && this.error.set(mensajeError(e, 'No se pudo cargar tu resumen.')),
    });
  }
}
