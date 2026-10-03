import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceValidator } from '@shared/utils/validadores';
import {
  ESTADO_LABEL,
  ESTADOS,
  Incidencia,
  IncidenciaCreate,
  IncidenciaUpdate,
  Prioridad,
  PRIORIDAD_LABEL,
  PRIORIDADES,
  Status,
} from 'src/app/core/models/incident.model';
import { AREA_LABEL, Solicitante, TecnicosDTO, Usuario } from 'src/app/core/models/usuario.model';
import { Equipo, equipoLabel, TIPO_EQUIPO_LABEL } from 'src/app/core/models/equipo.model';
import { EquipoService } from '@services/equipo.service';
import { UserService } from '@services/user.service';
import { AuthService } from '@services/auth.service';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { Avatar } from '../badges/badges';
import { SolicitantePicker } from '../solicitante-picker/solicitante-picker';
import { Icon } from '../icon/icon';

type CampoTexto = 'titulo' | 'descripcion';

const aSolicitante = (u: Usuario): Solicitante => ({
  id: Number(u.id),
  nombre: u.nombre,
  username: u.username,
  correo: u.correo,
  area: u.area,
});

/**
 * Formulario de incidencia.
 * - Sin [incidencia]: alta (título, descripción, prioridad y equipo afectado).
 * - Con [incidencia]: edición del administrador (además estado y técnico).
 */
@Component({
  selector: 'app-incidencia-form',
  imports: [ReactiveFormsModule, LoadingSpinner, Icon, SolicitantePicker, Avatar],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitForm()" class="space-y-4" novalidate>
      @if (error()) {
        <p class="alert alert-error" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span>{{ error() }}</span>
        </p>
      }

      <div>
        <label for="inc-titulo" class="label">Resumen <span class="text-danger">*</span></label>
        <input
          id="inc-titulo"
          type="text"
          formControlName="titulo"
          class="input"
          maxlength="120"
          placeholder="Ej. La impresora del 2.º piso no imprime"
          [attr.aria-invalid]="invalido('titulo')"
        />
        @if (invalido('titulo')) {
          <span class="field-error">{{ mensaje('titulo') }}</span>
        }
      </div>

      <div>
        <label for="inc-descripcion" class="label">Descripción <span class="text-danger">*</span></label>
        <textarea
          id="inc-descripcion"
          formControlName="descripcion"
          class="input"
          rows="5"
          placeholder="Qué ocurre, desde cuándo, a quién afecta y qué ya intentaste."
          [attr.aria-invalid]="invalido('descripcion')"
        ></textarea>
        @if (invalido('descripcion')) {
          <span class="field-error">{{ mensaje('descripcion') }}</span>
        }
      </div>

      <fieldset class="rounded-md border border-line p-3">
        <legend class="px-1 text-sm font-semibold text-fg">Solicitante</legend>
        <p class="mb-3 text-xs text-fg-subtle">
          Usuario que recibirá por correo los avisos de la incidencia: registro, seguimiento, cambios y cierre.
        </p>
        @if (puedeElegirSolicitante()) {
          <app-solicitante-picker
            [seleccionado]="solicitante()"
            (seleccionadoChange)="elegirSolicitante($event)"
            [invalido]="form.controls.solicitanteId.touched && form.controls.solicitanteId.invalid"
          />
        } @else {
          <!-- Empleado: la incidencia siempre queda a su nombre -->
          @if (solicitante(); as s) {
            <div class="flex items-center gap-3 rounded-md border border-line bg-surface-sunken px-3 py-2.5">
              <app-avatar [nombre]="s.nombre" [size]="36" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-fg">{{ s.nombre }}</p>
                <p class="truncate text-xs text-fg-subtle">&#64;{{ s.username }} · {{ areaLabel[s.area] }}</p>
                <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-fg-muted" [title]="s.correo">
                  <app-icon name="send" [size]="12" /> Se notificará a
                  <strong class="font-medium">{{ s.correo }}</strong>
                </p>
              </div>
            </div>
          } @else {
            <p class="flex items-center gap-2 text-sm text-fg-subtle"><loading-spinner /> Cargando tus datos…</p>
          }
        }
      </fieldset>

      <div>
        <label for="inc-equipo" class="label">Equipo afectado</label>
        <select id="inc-equipo" formControlName="equipoId" class="input" aria-describedby="inc-equipo-ayuda">
          <option [ngValue]="null">
            {{ cargandoEquipos() ? 'Cargando equipos…' : 'Ninguno / no aplica' }}
          </option>
          @for (eq of opcionesEquipo(); track eq.id) {
            <option [ngValue]="eq.id">
              {{ etiquetaEquipo(eq) }} — {{ tipoEquipoLabel[eq.tipo] }}{{ eq.estado === 'INACTIVO' ? ' (inactivo)' : '' }}
            </option>
          }
        </select>
        <span id="inc-equipo-ayuda" class="mt-1 block text-xs text-fg-subtle">
          @if (errorEquipos()) {
            <span class="text-danger">{{ errorEquipos() }}</span>
          } @else {
            Opcional. Elige el equipo con el problema para que el técnico lo ubique.
          }
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4" [class]="esEdicion() ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
        <div>
          <label for="inc-prioridad" class="label">Prioridad</label>
          <select id="inc-prioridad" formControlName="prioridad" class="input">
            @for (p of prioridades; track p) {
              <option [value]="p">{{ prioridadLabel[p] }}</option>
            }
          </select>
        </div>

        @if (esEdicion()) {
          <div>
            <label for="inc-estado" class="label">Estado</label>
            <select id="inc-estado" formControlName="estado" class="input">
              @for (e of estados; track e) {
                <option [value]="e">{{ estadoLabel[e] }}</option>
              }
            </select>
          </div>

          <div>
            <label for="inc-tecnico" class="label">Técnico asignado</label>
            <select id="inc-tecnico" formControlName="tecnicoId" class="input">
              <option [ngValue]="null">Sin asignar</option>
              @for (t of tecnicos(); track t.id) {
                <option [ngValue]="toNumber(t.id)">
                  {{ t.nombre }} ({{ t.cantidadIncidenciaPendiente }} activas)
                </option>
              }
            </select>
          </div>
        }
      </div>

      <div class="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          @if (loading()) {
            <loading-spinner /> Guardando…
          } @else {
            {{ esEdicion() ? 'Guardar cambios' : 'Crear incidencia' }}
          }
        </button>
      </div>
    </form>
  `,
})
export class IncidenciaForm {
  /** Incidencia a editar; si es null el formulario crea una nueva. */
  incidencia = input<Incidencia | null>(null);
  tecnicos = input<TecnicosDTO[]>([]);
  loading = input(false);
  error = input('');

  create = output<IncidenciaCreate>();
  update = output<IncidenciaUpdate>();
  cancel = output<void>();

  protected prioridades = PRIORIDADES;
  protected prioridadLabel = PRIORIDAD_LABEL;
  protected estados = ESTADOS;
  protected estadoLabel = ESTADO_LABEL;
  protected esEdicion = () => this.incidencia() !== null;
  protected toNumber = (id: bigint | number) => Number(id);
  protected etiquetaEquipo = equipoLabel;
  protected tipoEquipoLabel = TIPO_EQUIPO_LABEL;

  /* EQUIPOS (solo los activos se pueden elegir) */
  private equipoService = inject(EquipoService);
  private equiposActivos = signal<Equipo[]>([]);
  protected cargandoEquipos = signal(true);
  protected errorEquipos = signal('');
  /** Activos + el equipo actual de la incidencia aunque ya esté inactivo. */
  protected opcionesEquipo = computed(() => {
    const lista = this.equiposActivos();
    const actual = this.incidencia()?.equipo;
    return actual && !lista.some((e) => e.id === actual.id) ? [actual, ...lista] : lista;
  });

  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120), noWhitespaceValidator]],
    descripcion: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]],
    prioridad: ['MEDIA' as Prioridad, Validators.required],
    estado: ['PENDIENTE' as Status, Validators.required],
    tecnicoId: this.fb.control<number | null>(null),
    equipoId: this.fb.control<number | null>(null),
    solicitanteId: this.fb.control<number | null>(null, Validators.required),
  });

  /* SOLICITANTE: por defecto quien registra la incidencia; solo el admin puede cambiarlo */
  private userService = inject(UserService);
  protected puedeElegirSolicitante = inject(AuthService).isAdmin;
  protected areaLabel = AREA_LABEL;
  protected solicitante = signal<Solicitante | null>(null);

  protected elegirSolicitante(s: Solicitante | null) {
    this.solicitante.set(s);
    this.form.controls.solicitanteId.setValue(s?.id ?? null);
    this.form.controls.solicitanteId.markAsTouched();
  }

  constructor() {
    this.equipoService.listarActivos().subscribe({
      next: (r) => {
        this.equiposActivos.set(r.dato ?? []);
        this.cargandoEquipos.set(false);
      },
      error: () => {
        this.errorEquipos.set('No se pudo cargar la lista de equipos.');
        this.cargandoEquipos.set(false);
      },
    });

    effect(() => {
      const inc = this.incidencia();
      if (inc) {
        this.form.reset({
          titulo: inc.titulo,
          descripcion: inc.descripcion,
          prioridad: inc.prioridad ?? 'MEDIA',
          estado: inc.estado,
          tecnicoId: inc.tecnico ? Number(inc.tecnico.id) : null,
          equipoId: inc.equipo?.id ?? null,
        });
        // Incidencias antiguas sin solicitante: se toma a quien la registró.
        this.elegirSolicitante(aSolicitante(inc.solicitante ?? inc.usuario));
      } else {
        this.form.reset();
        this.solicitante.set(null);
        this.userService.getUsuarioPrincipal().subscribe({
          next: (u) => {
            if (!this.solicitante()) this.elegirSolicitante(aSolicitante(u));
          },
        });
      }
    });
  }

  protected invalido(campo: CampoTexto) {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  protected mensaje(campo: CampoTexto) {
    const e = this.form.controls[campo].errors ?? {};
    if (e['required'] || e['onlyWhitespace']) return 'Este campo es obligatorio.';
    if (e['minlength']) return 'Escribe al menos 4 caracteres.';
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return '';
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const base = {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      prioridad: v.prioridad,
      equipoId: v.equipoId,
      solicitanteId: v.solicitanteId!,
    };
    if (this.esEdicion()) {
      this.update.emit({ ...base, estado: v.estado, tecnicoId: v.tecnicoId });
    } else {
      this.create.emit(base);
    }
  }
}
