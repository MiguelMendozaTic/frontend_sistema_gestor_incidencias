import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@services/user.service';
import { noWhitespaceValidator } from '@shared/utils/validadores';
import { mensajeError } from '@shared/utils/errores';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Area, AREA_LABEL, AREAS, UserUpdate } from 'src/app/core/models/usuario.model';

type Campo = 'nombre' | 'username' | 'correo';

@Component({
  selector: 'app-update-user-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  template: `
    <form [formGroup]="updateUserForm" (ngSubmit)="submitForm()" class="space-y-4" novalidate>
      @if (errorCarga() || error()) {
        <p class="alert alert-error" role="alert">{{ errorCarga() || error() }}</p>
      }

      @if (cargando()) {
        <div class="flex items-center justify-center gap-2 py-10 text-fg-subtle">
          <loading-spinner /> Cargando usuario…
        </div>
      } @else {
        <div>
          <label for="uu-nombre" class="label">Nombre completo</label>
          <input id="uu-nombre" type="text" formControlName="nombre" class="input" [attr.aria-invalid]="invalido('nombre')" />
          @if (invalido('nombre')) {
            <span class="field-error">Mínimo 4 caracteres, sin dejarlo vacío.</span>
          }
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="uu-usuario" class="label">Usuario</label>
            <input id="uu-usuario" type="text" formControlName="username" class="input" [attr.aria-invalid]="invalido('username')" />
            @if (invalido('username')) {
              <span class="field-error">Mínimo 4 caracteres.</span>
            }
          </div>
          <div>
            <label for="uu-correo" class="label">Correo electrónico</label>
            <input id="uu-correo" type="email" formControlName="correo" class="input" [attr.aria-invalid]="invalido('correo')" />
            @if (invalido('correo')) {
              <span class="field-error">Ingresa un correo válido.</span>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="uu-area" class="label">Área</label>
            <select id="uu-area" formControlName="area" class="input">
              @for (item of areas; track item) {
                <option [value]="item">{{ areaLabel[item] }}</option>
              }
            </select>
          </div>
          <div>
            <label for="uu-estado" class="label">Estado de la cuenta</label>
            <select id="uu-estado" formControlName="estado" class="input">
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo (no puede iniciar sesión)</option>
            </select>
          </div>
        </div>
      }

      <div class="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="cargando() || loading()">
          @if (loading()) {
            <loading-spinner /> Guardando…
          } @else {
            Guardar cambios
          }
        </button>
      </div>
    </form>
  `,
})
export class UpdateUserForm {
  idUsuario = input<bigint>();
  loading = input(false);
  error = input('');
  dataResponse = output<UserUpdate>();
  cancel = output<void>();

  protected cargando = signal(false);
  protected errorCarga = signal('');
  protected areas = AREAS;
  protected areaLabel = AREA_LABEL;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  public updateUserForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]],
    username: ['', [Validators.required, Validators.minLength(4), noWhitespaceValidator]],
    correo: ['', [Validators.required, Validators.email]],
    area: ['ADMINISTRACION' as Area, Validators.required],
    estado: ['ACTIVO' as 'ACTIVO' | 'INACTIVO', Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.idUsuario();
      if (!id) return;
      this.cargando.set(true);
      this.errorCarga.set('');
      this.userService.getUser(id).subscribe({
        next: (data) => {
          this.updateUserForm.reset({
            nombre: data.nombre,
            username: data.username,
            correo: data.correo,
            area: data.area,
            estado: data.estado,
          });
          this.cargando.set(false);
        },
        error: (err) => {
          this.errorCarga.set(mensajeError(err, 'No se pudo cargar el usuario.'));
          this.cargando.set(false);
        },
      });
    });
  }

  protected invalido(campo: Campo) {
    const c = this.updateUserForm.controls[campo];
    return c.touched && c.invalid;
  }

  submitForm() {
    if (this.updateUserForm.invalid) {
      this.updateUserForm.markAllAsTouched();
      return;
    }
    const v = this.updateUserForm.getRawValue();
    this.dataResponse.emit({ ...v, nombre: v.nombre.trim(), username: v.username.trim() });
  }
}
