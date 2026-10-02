import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipoService } from '@services/equipo.service';
import { noWhitespaceValidator } from '@shared/utils/validadores';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Icon } from '@shared/components/icon/icon';
import {
  Equipo,
  EquipoSave,
  EstadoEquipo,
  TIPO_EQUIPO_LABEL,
  TipoEquipo,
  TIPOS_EQUIPO,
} from 'src/app/core/models/equipo.model';
import { Area, AREA_LABEL, AREAS } from 'src/app/core/models/usuario.model';

/**
 * Formulario de equipo.
 * - Sin [equipo]: alta; el código se genera según el tipo (se muestra una vista previa).
 * - Con [equipo]: edición; permite cambiar el código y el estado.
 */
@Component({
  selector: 'app-equipo-form',
  imports: [ReactiveFormsModule, LoadingSpinner, Icon],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitForm()" class="space-y-4" novalidate>
      @if (error()) {
        <p class="alert alert-error" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span>{{ error() }}</span>
        </p>
      }

      <div>
        <label for="eq-nombre" class="label">Nombre <span class="text-danger">*</span></label>
        <input
          id="eq-nombre"
          type="text"
          formControlName="nombre"
          class="input"
          maxlength="100"
          placeholder="Ej. Laptop Dell Latitude 5420"
          [attr.aria-invalid]="invalido('nombre')"
        />
        @if (invalido('nombre')) {
          <span class="field-error">El nombre es obligatorio (mínimo 3 caracteres).</span>
        }
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="eq-tipo" class="label">Tipo <span class="text-danger">*</span></label>
          <select id="eq-tipo" formControlName="tipo" class="input">
            @for (t of tipos; track t) {
              <option [value]="t">{{ tipoLabel[t] }}</option>
            }
          </select>
        </div>

        <div>
          <label for="eq-area" class="label">Área <span class="text-danger">*</span></label>
          <select id="eq-area" formControlName="area" class="input">
            @for (a of areas; track a) {
              <option [value]="a">{{ areaLabel[a] }}</option>
            }
          </select>
        </div>

        <div>
          <label for="eq-codigo" class="label">Código</label>
          @if (esEdicion()) {
            <input
              id="eq-codigo"
              type="text"
              formControlName="codigo"
              class="input font-mono uppercase"
              maxlength="20"
              [attr.aria-invalid]="invalido('codigo')"
            />
            @if (invalido('codigo')) {
              <span class="field-error">El código es obligatorio.</span>
            }
          } @else {
            <p id="eq-codigo" class="input flex items-center bg-surface-sunken font-mono text-fg-muted">
              {{ codigoPreview() || '—' }}
            </p>
            <span class="mt-1 block text-xs text-fg-subtle">Se asigna automáticamente según el tipo.</span>
          }
        </div>

        @if (esEdicion()) {
          <div>
            <label for="eq-estado" class="label">Estado</label>
            <select id="eq-estado" formControlName="estado" class="input">
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        }
      </div>

      <div>
        <label for="eq-descripcion" class="label">Descripción</label>
        <textarea
          id="eq-descripcion"
          formControlName="descripcion"
          class="input"
          rows="3"
          maxlength="255"
          placeholder="Marca, modelo, serie, ubicación…"
        ></textarea>
      </div>

      <div class="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          @if (loading()) {
            <loading-spinner /> Guardando…
          } @else {
            {{ esEdicion() ? 'Guardar cambios' : 'Registrar equipo' }}
          }
        </button>
      </div>
    </form>
  `,
})
export class EquipoForm {
  /** Equipo a editar; si es null el formulario registra uno nuevo. */
  equipo = input<Equipo | null>(null);
  loading = input(false);
  error = input('');

  save = output<EquipoSave>();
  cancel = output<void>();

  protected tipos = TIPOS_EQUIPO;
  protected tipoLabel = TIPO_EQUIPO_LABEL;
  protected areas = AREAS;
  protected areaLabel = AREA_LABEL;
  protected esEdicion = () => this.equipo() !== null;
  protected codigoPreview = signal('');

  private equipoService = inject(EquipoService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), noWhitespaceValidator]],
    codigo: [''],
    descripcion: [''],
    tipo: ['LAPTOP' as TipoEquipo, Validators.required],
    area: ['SISTEMAS' as Area, Validators.required],
    estado: ['ACTIVO' as EstadoEquipo],
  });

  constructor() {
    effect(() => {
      const eq = this.equipo();
      const codigo = this.form.controls.codigo;
      if (eq) {
        codigo.setValidators([Validators.required, noWhitespaceValidator]);
        this.form.reset({
          nombre: eq.nombre,
          codigo: eq.codigo,
          descripcion: eq.descripcion ?? '',
          tipo: eq.tipo,
          area: eq.area,
          estado: eq.estado,
        });
      } else {
        codigo.clearValidators();
        this.form.reset();
        this.actualizarPreview(this.form.controls.tipo.value);
      }
      codigo.updateValueAndValidity();
    });

    this.form.controls.tipo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipo) => {
        if (!this.esEdicion()) this.actualizarPreview(tipo);
      });
  }

  private actualizarPreview(tipo: TipoEquipo) {
    this.codigoPreview.set('');
    this.equipoService.previewCodigo(tipo).subscribe({
      next: (c) => this.codigoPreview.set(c),
      error: () => this.codigoPreview.set(''),
    });
  }

  protected invalido(campo: 'nombre' | 'codigo') {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const data: EquipoSave = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      tipo: v.tipo,
      area: v.area,
      // En el alta va vacío para que el backend genere el correlativo.
      codigo: this.esEdicion() ? v.codigo.trim().toUpperCase() : '',
    };
    if (this.esEdicion()) data.estado = v.estado;
    this.save.emit(data);
  }
}
