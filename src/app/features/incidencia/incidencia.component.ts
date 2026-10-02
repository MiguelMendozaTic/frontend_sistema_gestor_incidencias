import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { IncidenciaService } from '@services/incidencia.service';
import { UserService } from '@services/user.service';
import {
  ESTADO_LABEL,
  ESTADOS,
  Incidencia,
  IncidenciaCreate,
  IncidenciaUpdate,
  PRIORIDAD_LABEL,
  Status,
  ticketKey,
} from 'src/app/core/models/incident.model';
import { AREA_LABEL, Page, TecnicosDTO, Usuario } from 'src/app/core/models/usuario.model';
import { Equipo, equipoLabel, TIPO_EQUIPO_LABEL } from 'src/app/core/models/equipo.model';
import { DetalleField, DetalleModal } from '@shared/components/detalle-modal/detalle-modal';
import { ModalGeneric } from '@shared/components/modal-generic/modal-generic';
import { IncidenciaForm } from '@shared/components/incidencia-form/incidencia-form';
import { BuscadorInput } from '@shared/components/buscador-input/buscador-input';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Pagination } from '@shared/components/pagination/pagination';
import { Icon } from '@shared/components/icon/icon';
import { Avatar, PriorityBadge, StatusBadge } from '@shared/components/badges/badges';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { AutoRefrescoBadge } from '@shared/components/auto-refresco-badge';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    DetalleModal,
    ModalGeneric,
    IncidenciaForm,
    BuscadorInput,
    LoadingSpinner,
    Pagination,
    Icon,
    Avatar,
    StatusBadge,
    PriorityBadge,
    AutoRefrescoBadge,
  ],
  templateUrl: './incidencia.component.html',
})
export class IncidenciaComponent {
  protected authService = inject(AuthService);
  protected incidentService = inject(IncidenciaService);
  private userService = inject(UserService);

  protected readonly ticketKey = ticketKey;
  protected readonly estados = ESTADOS;
  protected readonly estadoLabel = ESTADO_LABEL;

  /* LISTADO */
  searchTerm = signal('');
  pageCurrent = signal(0);
  size = signal(10);
  page = signal<Page | null>(null);
  loading = signal(false);
  errorListado = signal('');
  esqueleto = computed(() => Array.from({ length: Math.min(this.size(), 8) }, (_, i) => i));
  private listadoSub?: Subscription;

  /** Mensaje de confirmación tras una acción. */
  aviso = signal('');
  private avisoTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Acceso directo desde el panel: /incidencia?nueva=1 abre el formulario.
    const route = inject(ActivatedRoute);
    if (route.snapshot.queryParamMap.has('nueva') && this.authService.puedeCrearIncidencia()) {
      this.abrirCrear();
      inject(Router).navigate([], { relativeTo: route, queryParams: {}, replaceUrl: true });
    }

    effect(() => {
      this.pageCurrent();
      this.size();
      this.searchTerm();
      this.getIncidencias();
    });

    autoRefresco(
      () => this.getIncidencias(true),
      () =>
        this.verDetalle() ||
        this.isOpenCreate() ||
        this.isOpenEdit() ||
        this.isOpenChangeState() ||
        this.isOpenModalTecnicos(),
    );
  }

  buscar(texto: string) {
    this.pageCurrent.set(0);
    this.searchTerm.set(texto);
  }

  /** `silencioso`: recarga en segundo plano, sin esqueleto ni mensajes de error. */
  getIncidencias(silencioso = false) {
    if (silencioso && this.listadoSub && !this.listadoSub.closed) return;
    this.listadoSub?.unsubscribe();
    if (!silencioso) {
      this.loading.set(true);
      this.errorListado.set('');
    }

    const peticion = this.authService.isAdmin()
      ? this.incidentService.getIncidencias(this.pageCurrent(), this.size(), this.searchTerm())
      : this.incidentService.misIncidencias(this.pageCurrent(), this.size(), this.searchTerm());

    this.listadoSub = peticion.subscribe({
      next: (e) => {
        this.page.set(e.page);
        this.loading.set(false);
      },
      error: (e) => {
        if (!silencioso) this.errorListado.set(mensajeError(e, 'No se pudieron cargar las incidencias.'));
        this.loading.set(false);
      },
    });
  }

  private mostrarAviso(texto: string) {
    clearTimeout(this.avisoTimer);
    this.aviso.set(texto);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }

  /* PERMISOS */
  puedeCambiarEstado(inc: Incidencia) {
    if (this.authService.isAdmin()) return true;
    // Cerrada: solo el administrador puede reabrirla.
    if (inc.estado === 'CERRADO') return false;
    const yo = this.authService.currentUser()?.username;
    return this.authService.isTecnico() && !!inc.tecnico && inc.tecnico.username === yo;
  }

  /* DETALLE */
  verDetalle = signal(false);
  dataForModal = signal<Incidencia | null>(null);
  errorDetalle = signal('');

  incidenciaFields: DetalleField<Incidencia>[] = [
    { label: 'Resumen', key: 'titulo', wide: true },
    { label: 'Descripción', key: 'descripcion', wide: true },
    { label: 'Estado', key: 'estado', format: (e: Status) => ESTADO_LABEL[e] ?? e },
    {
      label: 'Prioridad',
      key: 'prioridad',
      format: (p) => (p ? PRIORIDAD_LABEL[p as keyof typeof PRIORIDAD_LABEL] : 'Sin prioridad'),
    },
    {
      label: 'Solicitante',
      key: 'solicitante',
      format: (s?: Usuario | null) => {
        const u = s ?? this.dataForModal()?.usuario;
        return u ? `${u.nombre} <${u.correo}>` : 'No indicado';
      },
    },
    { label: 'Reportado por', key: 'usuario', format: (u: Usuario) => `${u.nombre} (@${u.username})` },
    { label: 'Área', key: 'usuario', format: (u: Usuario) => AREA_LABEL[u.area] ?? u.area },
    { label: 'Técnico asignado', key: 'tecnico', format: (u?: Usuario | null) => u?.nombre ?? 'Sin asignar' },
    {
      label: 'Equipo afectado',
      key: 'equipo',
      format: (e?: Equipo | null) =>
        e ? `${equipoLabel(e)} (${TIPO_EQUIPO_LABEL[e.tipo] ?? e.tipo})` : 'Ninguno',
    },
    {
      label: 'Creada',
      key: 'fechaCreacion',
      format: (f: Date) => new Date(f).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }),
    },
    {
      label: 'Cerrada',
      key: 'fechaCierre',
      format: (f?: Date | string | null) =>
        f ? new Date(f).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
    { label: 'Cerrada por', key: 'tecnicoCierre', format: (u?: Usuario | null) => u?.nombre ?? '—' },
  ];

  openModal(id: number): void {
    this.dataForModal.set(null);
    this.errorDetalle.set('');
    this.verDetalle.set(true);
    this.incidentService.getIncidencia(id).subscribe({
      next: (value) => this.dataForModal.set(value),
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar la incidencia.')),
    });
  }

  /* CREAR */
  isOpenCreate = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  abrirCrear() {
    this.errorForm.set('');
    this.isOpenCreate.set(true);
  }

  submitCreate(data: IncidenciaCreate) {
    this.guardando.set(true);
    this.errorForm.set('');
    this.incidentService.createIncidencia(data).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.isOpenCreate.set(false);
        this.mostrarAviso(
          `Incidencia ${ticketKey(r.id)} creada. Se notificará al solicitante por correo.`,
        );
        this.getIncidencias();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e, 'No se pudo crear la incidencia.'));
      },
    });
  }

  /* EDITAR (ADMIN) */
  isOpenEdit = signal(false);
  incidenciaEditar = signal<Incidencia | null>(null);

  abrirEditar(inc: Incidencia) {
    this.errorForm.set('');
    this.incidenciaEditar.set(inc);
    this.isOpenEdit.set(true);
    this.cargarTecnicos();
  }

  submitEdit(data: IncidenciaUpdate) {
    const inc = this.incidenciaEditar();
    if (!inc) return;
    this.guardando.set(true);
    this.errorForm.set('');
    this.incidentService.editarIncidencia(inc.id, data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.isOpenEdit.set(false);
        this.mostrarAviso(`Incidencia ${ticketKey(inc.id)} actualizada.`);
        this.getIncidencias();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e, 'No se pudieron guardar los cambios.'));
      },
    });
  }

  /* CAMBIAR ESTADO */
  isOpenChangeState = signal(false);
  incidenciaEstado = signal<Incidencia | null>(null);
  estadoSeleccionado = signal<Status>('PENDIENTE');
  loadingEstado = signal(false);
  errorEstado = signal('');

  changeState(inc: Incidencia) {
    this.incidenciaEstado.set(inc);
    this.estadoSeleccionado.set(inc.estado);
    this.errorEstado.set('');
    this.isOpenChangeState.set(true);
  }

  submitChangeState() {
    const inc = this.incidenciaEstado();
    if (!inc) return;
    this.loadingEstado.set(true);
    this.errorEstado.set('');
    this.incidentService
      .cambiarEstado({ idIncidencia: inc.id, estado: this.estadoSeleccionado() })
      .subscribe({
        next: () => {
          this.loadingEstado.set(false);
          this.isOpenChangeState.set(false);
          this.mostrarAviso(`Estado de ${ticketKey(inc.id)} actualizado.`);
          this.getIncidencias();
        },
        error: (e) => {
          this.loadingEstado.set(false);
          this.errorEstado.set(mensajeError(e, 'No se pudo cambiar el estado.'));
        },
      });
  }

  /* ASIGNAR TÉCNICO (ADMIN) */
  tecnicos = signal<TecnicosDTO[]>([]);
  isOpenModalTecnicos = signal(false);
  incidenciaModal = signal<Incidencia | null>(null);
  loadingTecnicos = signal(false);
  asignando = signal(false);
  errorTecnico = signal('');
  filtroTecnico = signal('');
  idTecnicoUpdate = signal<number | null>(null);

  tecnicosFiltrados = computed(() => {
    const f = this.filtroTecnico().trim().toLowerCase();
    const lista = [...this.tecnicos()].sort(
      (a, b) => Number(a.cantidadIncidenciaPendiente) - Number(b.cantidadIncidenciaPendiente),
    );
    return f ? lista.filter((t) => t.nombre.toLowerCase().includes(f)) : lista;
  });

  changeIsOpenTecnicos(incidencia: Incidencia) {
    this.incidenciaModal.set(incidencia);
    this.idTecnicoUpdate.set(incidencia.tecnico ? Number(incidencia.tecnico.id) : null);
    this.filtroTecnico.set('');
    this.errorTecnico.set('');
    this.isOpenModalTecnicos.set(true);
    this.cargarTecnicos();
  }

  cargarTecnicos() {
    this.loadingTecnicos.set(true);
    this.userService.listarTecnicos().subscribe({
      next: (e) => {
        this.tecnicos.set(e.dato ?? []);
        this.loadingTecnicos.set(false);
      },
      error: (e) => {
        this.errorTecnico.set(mensajeError(e, 'No se pudo cargar la lista de técnicos.'));
        this.loadingTecnicos.set(false);
      },
    });
  }

  asignarTecnicoIncidencia() {
    const inc = this.incidenciaModal();
    const idTecnico = this.idTecnicoUpdate();
    if (!inc || idTecnico === null) return;
    this.errorTecnico.set('');
    this.asignando.set(true);
    this.incidentService.cambiarTecnico({ idIncidencia: inc.id, idTecnico }).subscribe({
      next: () => {
        this.asignando.set(false);
        this.isOpenModalTecnicos.set(false);
        this.mostrarAviso(`Técnico asignado a ${ticketKey(inc.id)}.`);
        this.getIncidencias();
      },
      error: (e) => {
        this.asignando.set(false);
        this.errorTecnico.set(mensajeError(e, 'No se pudo asignar el técnico.'));
      },
    });
  }

  carga(n: bigint | number): { texto: string; clase: string } {
    const v = Number(n);
    if (v === 0) return { texto: 'Disponible', clase: 'bg-success-soft text-success-soft-fg' };
    if (v <= 2) return { texto: 'Carga media', clase: 'bg-warning-soft text-warning-soft-fg' };
    return { texto: 'Carga alta', clase: 'bg-danger-soft text-danger-soft-fg' };
  }

  protected toNumber = (id: bigint | number) => Number(id);
}
