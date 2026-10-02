import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IncidenciaService } from '@services/incidencia.service';
import { DashboardService } from '@services/dashboard.service';
import { DashboardAdmin } from 'src/app/core/models/dashboard.model';
import { ticketKey } from 'src/app/core/models/incident.model';
import { Area, AREA_LABEL } from 'src/app/core/models/usuario.model';
import { Icon } from '@shared/components/icon/icon';
import {
  Avatar,
  PriorityBadge,
  StatusBadge,
  UserStateBadge,
} from '@shared/components/badges/badges';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { EstadoDistribucion, KpiTiles } from '../widgets';

@Component({
  selector: 'app-admin',
  imports: [
    RouterLink,
    DatePipe,
    Icon,
    Avatar,
    StatusBadge,
    PriorityBadge,
    UserStateBadge,
    KpiTiles,
    EstadoDistribucion,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Panel de control</h1>
          <p class="page-subtitle">Resumen general de la mesa de servicio.</p>
        </div>
        <a routerLink="/incidencia" class="btn btn-secondary">
          <app-icon name="ticket" /> Ver incidencias
        </a>
      </header>

      @if (error()) {
        <p class="alert alert-error" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span class="flex-1">{{ error() }}</span>
          <button type="button" class="font-medium underline" (click)="cargar()">Reintentar</button>
        </p>
      }

      <app-kpi-tiles [stats]="data()?.incidentStats ?? null" />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section class="card">
          <header class="card-header"><h2 class="card-title">Incidencias por estado</h2></header>
          <div class="p-4">
            <app-estado-distribucion [stats]="data()?.incidentStats ?? null" />
          </div>
        </section>

        <section class="card">
          <header class="card-header">
            <h2 class="card-title">Usuarios por área</h2>
            @if (data(); as d) {
              <span class="text-xs text-fg-subtle">{{ d.userStats.totalUsuarios }} activos</span>
            }
          </header>
          <div class="space-y-3 p-4">
            @if (!data()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton h-6 w-full"></div>
              }
            } @else {
              @for (a of areas(); track a.area) {
                <div [title]="a.label + ': ' + a.cantidad + ' usuarios'">
                  <div class="flex justify-between text-sm">
                    <span class="text-fg-muted">{{ a.label }}</span>
                    <span class="font-medium text-fg tabular-nums">{{ a.cantidad }}</span>
                  </div>
                  <div class="mt-1 h-1.5 w-full rounded-full bg-surface-hover">
                    <div class="h-full rounded-full bg-primary" [style.width.%]="a.pct"></div>
                  </div>
                </div>
              } @empty {
                <p class="py-6 text-center text-sm text-fg-subtle">Sin usuarios registrados.</p>
              }
            }
          </div>
        </section>

        <section class="card">
          <header class="card-header">
            <h2 class="card-title">Últimos usuarios registrados</h2>
            <a routerLink="/users" class="text-sm font-medium text-primary hover:underline">Gestionar</a>
          </header>
          <ul class="divide-y divide-line">
            @if (!data()) {
              @for (i of [1, 2, 3]; track i) {
                <li class="flex items-center gap-3 px-4 py-3">
                  <div class="skeleton h-8 w-8 rounded-full"></div>
                  <div class="skeleton h-3 w-32"></div>
                </li>
              }
            } @else {
              @for (u of data()!.latestUsers; track $index) {
                <li class="flex items-center gap-3 px-4 py-2.5">
                  <app-avatar [nombre]="u.nombre" />
                  <span class="min-w-0 flex-1 truncate text-sm text-fg">{{ u.nombre }}</span>
                  <app-user-state-badge [estado]="u.estado" />
                </li>
              } @empty {
                <li class="px-4 py-6 text-center text-sm text-fg-subtle">Sin registros.</li>
              }
            }
          </ul>
        </section>
      </div>

      <section class="card overflow-hidden">
        <header class="card-header">
          <h2 class="card-title">Incidencias recientes</h2>
          <a routerLink="/incidencia" class="text-sm font-medium text-primary hover:underline">Ver todas</a>
        </header>
        <div class="overflow-x-auto">
          <table class="data-table min-w-[720px]">
            <thead>
              <tr>
                <th scope="col" class="w-28">Clave</th>
                <th scope="col">Resumen</th>
                <th scope="col" class="w-28">Prioridad</th>
                <th scope="col" class="w-32">Estado</th>
                <th scope="col" class="w-44">Reportado por</th>
                <th scope="col" class="w-32">Creada</th>
              </tr>
            </thead>
            <tbody>
              @for (inc of incidentService.incidencias(); track inc.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/incidencia/seguimiento', inc.id]" class="ticket-key hover:text-primary hover:underline">
                      {{ key(inc.id) }}
                    </a>
                  </td>
                  <td class="max-w-sm">
                    <a
                      [routerLink]="['/incidencia/seguimiento', inc.id]"
                      class="line-clamp-1 font-medium hover:text-primary hover:underline"
                      >{{ inc.titulo }}</a
                    >
                  </td>
                  <td><app-priority-badge [prioridad]="inc.prioridad" /></td>
                  <td><app-status-badge [estado]="inc.estado" /></td>
                  <td class="truncate text-fg-muted">{{ inc.usuario.nombre }}</td>
                  <td class="whitespace-nowrap text-fg-muted">{{ inc.fechaCreacion | date: 'dd MMM yyyy' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-10 text-center text-fg-subtle">No hay incidencias registradas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class Admin {
  protected incidentService = inject(IncidenciaService);
  private dashboardService = inject(DashboardService);

  protected data = signal<DashboardAdmin | null>(null);
  protected error = signal('');
  protected key = ticketKey;

  protected areas = computed(() => {
    const lista = this.data()?.userStats.areas ?? [];
    const max = Math.max(...lista.map((a) => a.cantidad), 1);
    return [...lista]
      .sort((a, b) => b.cantidad - a.cantidad)
      .map((a) => ({
        area: a.area,
        label: AREA_LABEL[a.area as Area] ?? a.area,
        cantidad: a.cantidad,
        pct: (a.cantidad / max) * 100,
      }));
  });

  constructor() {
    this.cargar();
    autoRefresco(() => this.cargar(true));
  }

  cargar(silencioso = false) {
    if (!silencioso) this.error.set('');
    forkJoin([
      this.dashboardService.getDashboardAdmin(),
      this.incidentService.getIncidencias(0, 5),
    ]).subscribe({
      next: ([data]) => this.data.set(data),
      error: (e) => !silencioso && this.error.set(mensajeError(e, 'No se pudo cargar el panel.')),
    });
  }
}
