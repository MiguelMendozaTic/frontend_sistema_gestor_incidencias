import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@services/auth.service';
import { IncidenciaService } from '@services/incidencia.service';
import { SeguimientoService } from '@services/seguimiento.service';
import { SeguimientoResponseDto } from 'src/app/core/models/seguimiento.model';
import {
  ESTADO_LABEL,
  ESTADOS,
  Incidencia,
  Status,
  ticketKey,
} from 'src/app/core/models/incident.model';
import { AREA_LABEL } from 'src/app/core/models/usuario.model';
import { Icon } from '@shared/components/icon/icon';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Avatar, PriorityBadge, StatusBadge } from '@shared/components/badges/badges';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { AutoRefrescoBadge } from '@shared/components/auto-refresco-badge';

/** Comentarios que genera el propio sistema al crear/editar/cambiar estado. */
const PREFIJOS_SISTEMA = [
  'Incidencia creada por',
  'Incidencia modificada por',
  'Incidencia editada por',
  'Estado cambiado de',
];

@Component({
  selector: 'app-seguimiento-incidencia',
  imports: [DatePipe, RouterLink, Icon, LoadingSpinner, Avatar, StatusBadge, PriorityBadge, AutoRefrescoBadge],
  templateUrl: './seguimiento-incidencia.html',
})
export class SeguimientoIncidencia {
  private seguimientoService = inject(SeguimientoService);
  private incidenciaService = inject(IncidenciaService);
  protected authService = inject(AuthService);

  protected readonly key = ticketKey;
  protected readonly estados = ESTADOS;
  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly areaLabel = AREA_LABEL;

  incidenciaId = signal<number | null>(null);
  incidencia = signal<Incidencia | null>(null);
  misSeguimientos = signal<SeguimientoResponseDto[] | null>(null);
  errorCarga = signal('');

  comentario = signal('');
  enviando = signal(false);
  errorComentario = signal('');

  estadoNuevo = signal<Status>('PENDIENTE');
  guardandoEstado = signal(false);
  errorEstado = signal('');

  protected yo = computed(() => this.authService.currentUser()?.username ?? '');

  /** Cerrada = solo lectura para todos menos el administrador (único que puede reabrir). */
  protected cerrada = computed(() => this.incidencia()?.estado === 'CERRADO');
  protected bloqueada = computed(() => this.cerrada() && !this.authService.isAdmin());

  protected puedeCambiarEstado = computed(() => {
    const inc = this.incidencia();
    if (!inc || this.bloqueada()) return false;
    if (this.authService.isAdmin()) return true;
    return this.authService.isTecnico() && inc.tecnico?.username === this.yo();
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((params) => {
        const id = Number(params.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
          this.errorCarga.set('El identificador de la incidencia no es válido.');
          return;
        }
        this.incidenciaId.set(id);
        this.cargar();
      });

    autoRefresco(
      () => this.cargar(true),
      () => this.enviando() || this.guardandoEstado() || !!this.errorCarga(),
    );
  }

  /** `silencioso`: recarga en segundo plano sin alterar lo que el usuario está editando. */
  cargar(silencioso = false) {
    const id = this.incidenciaId();
    if (!id) return;
    if (!silencioso) this.errorCarga.set('');
    this.incidenciaService.getIncidencia(id).subscribe({
      next: (inc) => {
        const anterior = this.incidencia()?.estado;
        this.incidencia.set(inc);
        // Solo sincroniza el selector si el usuario no lo había cambiado.
        if (!silencioso || this.estadoNuevo() === anterior) this.estadoNuevo.set(inc.estado);
      },
      error: (e) =>
        !silencioso &&
        this.errorCarga.set(
          e?.status === 404
            ? 'La incidencia no existe o fue eliminada.'
            : mensajeError(e, 'No se pudo cargar la incidencia.'),
        ),
    });
    this.getMisSeguimientos(silencioso);
  }

  getMisSeguimientos(silencioso = false) {
    const id = this.incidenciaId();
    if (!id) return;
    this.seguimientoService.obtenerMisSeguimientos(id).subscribe({
      next: (lista) =>
        this.misSeguimientos.set(
          lista
            .map((s) => ({ ...s, fecha: new Date(s.fecha) }))
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
        ),
      error: (e) => {
        if (silencioso) return;
        this.misSeguimientos.set([]);
        if (!this.errorCarga()) this.errorCarga.set(mensajeError(e, 'No se pudo cargar el historial.'));
      },
    });
  }

  esEvento(s: SeguimientoResponseDto) {
    return PREFIJOS_SISTEMA.some((p) => s.comentario.startsWith(p));
  }

  enviarSeguimiento() {
    const texto = this.comentario().trim();
    const id = this.incidenciaId();
    if (texto.length < 2 || !id || this.enviando() || this.bloqueada()) return;
    this.enviando.set(true);
    this.errorComentario.set('');
    this.seguimientoService
      .crearSeguimiento({ comentario: texto, estado: 'ACTIVO', idIncidencia: String(id) })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.comentario.set('');
          this.getMisSeguimientos();
        },
        error: (e) => {
          this.enviando.set(false);
          this.errorComentario.set(mensajeError(e, 'No se pudo publicar el comentario.'));
        },
      });
  }

  onComentarioKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.enviarSeguimiento();
    }
  }

  guardarEstado() {
    const inc = this.incidencia();
    if (!inc || this.estadoNuevo() === inc.estado) return;
    this.guardandoEstado.set(true);
    this.errorEstado.set('');
    this.incidenciaService.cambiarEstado({ idIncidencia: inc.id, estado: this.estadoNuevo() }).subscribe({
      next: () => {
        this.guardandoEstado.set(false);
        // Recarga completa: trae fecha y técnico de cierre, y aplica el bloqueo si se cerró.
        this.cargar();
      },
      error: (e) => {
        this.guardandoEstado.set(false);
        this.errorEstado.set(mensajeError(e, 'No se pudo cambiar el estado.'));
      },
    });
  }
}
