import { Component, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EquipoService } from '@services/equipo.service';
import {
  Equipo,
  EquipoSave,
  EstadoEquipo,
  TIPO_EQUIPO_LABEL,
} from 'src/app/core/models/equipo.model';
import { AREA_LABEL, Page } from 'src/app/core/models/usuario.model';
import { ModalGeneric } from '@shared/components/modal-generic/modal-generic';
import { BuscadorInput } from '@shared/components/buscador-input/buscador-input';
import { Pagination } from '@shared/components/pagination/pagination';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Icon } from '@shared/components/icon/icon';
import { UserStateBadge } from '@shared/components/badges/badges';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { AutoRefrescoBadge } from '@shared/components/auto-refresco-badge';
import { EquipoForm } from './equipo-form';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [
    ModalGeneric,
    EquipoForm,
    BuscadorInput,
    Pagination,
    LoadingSpinner,
    Icon,
    UserStateBadge,
    AutoRefrescoBadge,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Equipos</h1>
          <p class="page-subtitle">Inventario de equipos que se pueden asociar a una incidencia.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="abrirCrear()">
          <app-icon name="plus" /> Nuevo equipo
        </button>
      </header>

      @if (aviso()) {
        <p class="alert" [class]="avisoError() ? 'alert-error' : 'alert-success'" role="status">
          <app-icon [name]="avisoError() ? 'alert' : 'check'" class="mt-0.5" />
          <span class="flex-1">{{ aviso() }}</span>
          <button type="button" class="btn-icon -my-1 h-6 w-6" (click)="aviso.set('')" aria-label="Cerrar aviso">
            <app-icon name="x" [size]="14" />
          </button>
        </p>
      }

      <section class="card overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div class="w-full sm:w-80">
            <app-buscador-input
              placeholder="Buscar por nombre o código"
              [searchTerm]="searchTerm()"
              (searchTermChange)="buscar($event)"
            />
          </div>
          <div class="inline-flex rounded-md border border-line p-0.5" role="group" aria-label="Filtrar por estado">
            @for (f of filtros; track f.valor) {
              <button
                type="button"
                class="h-7 cursor-pointer rounded px-3 text-sm font-medium transition-colors"
                [class]="
                  filtroEstado() === f.valor
                    ? 'bg-primary-soft text-primary-soft-fg'
                    : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                "
                [attr.aria-pressed]="filtroEstado() === f.valor"
                (click)="filtrar(f.valor)"
              >
                {{ f.label }}
              </button>
            }
          </div>
          <app-auto-refresco-badge class="ml-auto" />
          <button type="button" class="btn btn-subtle" (click)="getEquipos()" [disabled]="loading()">
            <app-icon name="refresh" /> Actualizar
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table min-w-[820px]">
            <thead>
              <tr>
                <th scope="col" class="w-28">Código</th>
                <th scope="col">Equipo</th>
                <th scope="col" class="w-36">Tipo</th>
                <th scope="col" class="w-36">Área</th>
                <th scope="col" class="w-24">Estado</th>
                <th scope="col" class="w-28 text-right"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of esqueleto(); track i) {
                  <tr aria-hidden="true">
                    <td><div class="skeleton h-3 w-16"></div></td>
                    <td>
                      <div class="skeleton h-3.5 w-48"></div>
                      <div class="skeleton mt-2 h-3 w-32"></div>
                    </td>
                    <td><div class="skeleton h-3 w-20"></div></td>
                    <td><div class="skeleton h-3 w-20"></div></td>
                    <td><div class="skeleton h-4 w-14"></div></td>
                    <td></td>
                  </tr>
                }
              } @else if (error()) {
                <tr>
                  <td colspan="6" class="py-12 text-center">
                    <app-icon name="alert" [size]="28" class="mx-auto text-danger" />
                    <p class="mt-2 font-medium text-fg">{{ error() }}</p>
                    <button type="button" class="btn btn-secondary mt-4" (click)="getEquipos()">Reintentar</button>
                  </td>
                </tr>
              } @else {
                @for (eq of equipos(); track eq.id) {
                  <tr>
                    <td class="ticket-key whitespace-nowrap">{{ eq.codigo }}</td>
                    <td class="min-w-56">
                      <p class="truncate font-medium text-fg">{{ eq.nombre }}</p>
                      @if (eq.descripcion) {
                        <p class="mt-0.5 truncate text-xs text-fg-subtle" [title]="eq.descripcion">{{ eq.descripcion }}</p>
                      }
                    </td>
                    <td class="text-fg-muted">{{ tipoLabel[eq.tipo] }}</td>
                    <td class="text-fg-muted">{{ areaLabel[eq.area] }}</td>
                    <td><app-user-state-badge [estado]="eq.estado" /></td>
                    <td>
                      <div class="flex items-center justify-end gap-0.5">
                        <button type="button" class="btn-icon" (click)="abrirEditar(eq)" title="Editar" [attr.aria-label]="'Editar ' + eq.codigo">
                          <app-icon name="pencil" />
                        </button>
                        @if (eq.estado === 'ACTIVO') {
                          <button
                            type="button"
                            class="btn-icon text-danger"
                            (click)="abrirEliminar(eq)"
                            title="Eliminar"
                            [attr.aria-label]="'Eliminar ' + eq.codigo"
                          >
                            <app-icon name="trash" />
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="btn-icon"
                            (click)="reactivar(eq)"
                            title="Reactivar"
                            [attr.aria-label]="'Reactivar ' + eq.codigo"
                          >
                            <app-icon name="refresh" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-14 text-center">
                      <app-icon name="monitor" [size]="32" class="mx-auto text-fg-subtle" />
                      <p class="mt-3 font-medium text-fg">
                        {{
                          searchTerm()
                            ? 'Sin resultados para “' + searchTerm() + '”'
                            : filtroEstado() === 'INACTIVO'
                              ? 'No hay equipos inactivos'
                              : 'No hay equipos registrados'
                        }}
                      </p>
                      @if (!searchTerm() && filtroEstado() !== 'INACTIVO') {
                        <button type="button" class="btn btn-primary mt-4" (click)="abrirCrear()">
                          <app-icon name="plus" /> Nuevo equipo
                        </button>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <app-pagination [page]="page()" [(current)]="pageCurrent" [(size)]="size" />
      </section>
    </div>

    <!-- CREAR / EDITAR -->
    <app-modal-generic
      [(isOpen)]="isOpenForm"
      [title]="equipoEditar() ? 'Editar ' + equipoEditar()!.codigo : 'Nuevo equipo'"
      [description]="equipoEditar() ? equipoEditar()!.nombre : 'Queda activo y disponible al reportar incidencias.'"
      size="lg"
    >
      @if (isOpenForm()) {
        <app-equipo-form
          [equipo]="equipoEditar()"
          [loading]="guardando()"
          [error]="errorForm()"
          (save)="guardar($event)"
          (cancel)="isOpenForm.set(false)"
        />
      }
    </app-modal-generic>

    <!-- ELIMINAR -->
    <app-modal-generic [(isOpen)]="isOpenEliminar" title="Eliminar equipo" size="sm">
      @if (equipoEliminar(); as eq) {
        <p class="text-sm text-fg">
          ¿Eliminar <strong>{{ eq.codigo }} · {{ eq.nombre }}</strong>?
        </p>
        <p class="mt-2 text-sm text-fg-subtle">
          El equipo pasa a <strong>inactivo</strong>: ya no aparecerá al reportar incidencias, pero se conserva
          en el historial de las incidencias existentes. Puedes reactivarlo cuando quieras.
        </p>
      }
      @if (errorEliminar()) {
        <p class="alert alert-error mt-4" role="alert">{{ errorEliminar() }}</p>
      }
      <div class="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" class="btn btn-secondary" (click)="isOpenEliminar.set(false)">Cancelar</button>
        <button type="button" class="btn btn-danger" [disabled]="eliminando()" (click)="confirmarEliminar()">
          @if (eliminando()) {
            <loading-spinner /> Eliminando…
          } @else {
            Eliminar
          }
        </button>
      </div>
    </app-modal-generic>
  `,
})
export class EquiposComponent {
  private equipoService = inject(EquipoService);

  protected tipoLabel = TIPO_EQUIPO_LABEL;
  protected areaLabel = AREA_LABEL;

  equipos = signal<Equipo[]>([]);
  loading = signal(true);
  error = signal('');
  aviso = signal('');
  avisoError = signal(false);
  private avisoTimer?: ReturnType<typeof setTimeout>;

  searchTerm = signal('');
  filtroEstado = signal<EstadoEquipo | null>('ACTIVO');
  protected readonly filtros = [
    { valor: 'ACTIVO' as const, label: 'Activos' },
    { valor: 'INACTIVO' as const, label: 'Inactivos' },
    { valor: null, label: 'Todos' },
  ];
  pageCurrent = signal(0);
  page = signal<Page | null>(null);
  size = signal(10);
  esqueleto = computed(() => Array.from({ length: Math.min(this.size(), 8) }, (_, i) => i));

  private listadoSub?: Subscription;

  constructor() {
    effect(() => {
      this.pageCurrent();
      this.size();
      this.searchTerm();
      this.filtroEstado();
      this.getEquipos();
    });

    autoRefresco(
      () => this.getEquipos(true),
      () => this.isOpenForm() || this.isOpenEliminar(),
    );
  }

  filtrar(estado: EstadoEquipo | null) {
    this.pageCurrent.set(0);
    this.filtroEstado.set(estado);
  }

  buscar(texto: string) {
    this.pageCurrent.set(0);
    this.searchTerm.set(texto);
  }

  /** `silencioso`: recarga en segundo plano, sin esqueleto ni mensajes de error. */
  getEquipos(silencioso = false): void {
    if (silencioso && this.listadoSub && !this.listadoSub.closed) return;
    this.listadoSub?.unsubscribe();
    if (!silencioso) {
      this.loading.set(true);
      this.error.set('');
    }
    this.listadoSub = this.equipoService
      .getEquiposPaginados(this.pageCurrent(), this.size(), this.searchTerm(), this.filtroEstado())
      .subscribe({
        next: (data) => {
          this.equipos.set(data.content);
          this.page.set(data.page);
          this.loading.set(false);
        },
        error: (err) => {
          if (!silencioso) this.error.set(mensajeError(err, 'No se pudieron cargar los equipos.'));
          this.loading.set(false);
        },
      });
  }

  private mostrarAviso(texto: string, esError = false) {
    clearTimeout(this.avisoTimer);
    this.avisoError.set(esError);
    this.aviso.set(texto);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }

  /* CREAR / EDITAR */
  isOpenForm = signal(false);
  equipoEditar = signal<Equipo | null>(null);
  guardando = signal(false);
  errorForm = signal('');

  abrirCrear() {
    this.errorForm.set('');
    this.equipoEditar.set(null);
    this.isOpenForm.set(true);
  }

  abrirEditar(eq: Equipo) {
    this.errorForm.set('');
    this.equipoEditar.set(eq);
    this.isOpenForm.set(true);
  }

  guardar(data: EquipoSave) {
    const eq = this.equipoEditar();
    this.guardando.set(true);
    this.errorForm.set('');
    const peticion = eq
      ? this.equipoService.editarEquipo(eq.id, data)
      : this.equipoService.crearEquipo(data);
    peticion.subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.isOpenForm.set(false);
        const codigo = r.dato?.codigo ?? eq?.codigo ?? '';
        this.mostrarAviso(eq ? `Equipo ${codigo} actualizado.` : `Equipo ${codigo} registrado correctamente.`);
        this.getEquipos();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el equipo.'));
      },
    });
  }

  /* ELIMINAR (baja lógica) / REACTIVAR */
  isOpenEliminar = signal(false);
  equipoEliminar = signal<Equipo | null>(null);
  eliminando = signal(false);
  errorEliminar = signal('');

  abrirEliminar(eq: Equipo) {
    this.equipoEliminar.set(eq);
    this.errorEliminar.set('');
    this.isOpenEliminar.set(true);
  }

  confirmarEliminar() {
    const eq = this.equipoEliminar();
    if (!eq) return;
    this.eliminando.set(true);
    this.errorEliminar.set('');
    this.equipoService.eliminarEquipo(eq.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.isOpenEliminar.set(false);
        this.mostrarAviso(`Equipo ${eq.codigo} eliminado.`);
        this.getEquipos();
      },
      error: (e) => {
        this.eliminando.set(false);
        this.errorEliminar.set(mensajeError(e, 'No se pudo eliminar el equipo.'));
      },
    });
  }

  reactivar(eq: Equipo) {
    const { id, ...datos } = eq;
    this.equipoService
      .editarEquipo(id, { ...datos, descripcion: datos.descripcion ?? '', estado: 'ACTIVO' })
      .subscribe({
        next: () => {
          this.mostrarAviso(`Equipo ${eq.codigo} reactivado.`);
          this.getEquipos();
        },
        error: (e) => this.mostrarAviso(mensajeError(e, 'No se pudo reactivar el equipo.'), true),
      });
  }
}
