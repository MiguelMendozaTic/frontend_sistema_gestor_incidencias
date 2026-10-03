import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@services/user.service';
import { AREA_LABEL, Usuario } from 'src/app/core/models/usuario.model';
import { Icon } from '@shared/components/icon/icon';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Avatar, RoleBadge, UserStateBadge } from '@shared/components/badges/badges';
import { noWhitespaceValidator } from '@shared/utils/validadores';
import { mensajeError } from '@shared/utils/errores';

type Campo = 'nombre' | 'username' | 'correo';

@Component({
  selector: 'app-perfil-usuario',
  imports: [ReactiveFormsModule, Icon, LoadingSpinner, Avatar, RoleBadge, UserStateBadge],
  template: `
    <div class="page max-w-4xl">
      <header class="page-header">
        <div>
          <h1 class="page-title">Mi perfil</h1>
          <p class="page-subtitle">Tus datos de contacto dentro de la mesa de servicio.</p>
        </div>
      </header>

      @if (error()) {
        <p class="alert alert-error" role="alert">
          <app-icon name="alert" class="mt-0.5" /> <span>{{ error() }}</span>
        </p>
      }
      @if (aviso()) {
        <p class="alert alert-success" role="status">
          <app-icon name="check" class="mt-0.5" /> <span>{{ aviso() }}</span>
        </p>
      }

      <section class="card">
        <div class="flex flex-wrap items-center gap-4 border-b border-line p-5">
          @if (user(); as u) {
            <app-avatar [nombre]="u.nombre" [size]="56" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-semibold text-fg">{{ u.nombre }}</p>
              <p class="text-sm text-fg-subtle">&#64;{{ u.username }} · {{ areaLabel[u.area] }}</p>
            </div>
            <div class="flex flex-wrap gap-1">
              @for (r of u.roles; track r.id) {
                <app-role-badge [rol]="r.name" />
              }
              <app-user-state-badge [estado]="u.estado" />
            </div>
          } @else {
            <div class="skeleton h-14 w-14 rounded-full"></div>
            <div class="space-y-2">
              <div class="skeleton h-4 w-40"></div>
              <div class="skeleton h-3 w-28"></div>
            </div>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="p-5" novalidate>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="pf-nombre" class="label">Nombre completo</label>
              <input id="pf-nombre" type="text" formControlName="nombre" class="input" [attr.aria-invalid]="invalido('nombre')" />
              @if (invalido('nombre')) {
                <span class="field-error">Entre 4 y 35 caracteres.</span>
              }
            </div>
            <div>
              <label for="pf-usuario" class="label">Usuario</label>
              <input id="pf-usuario" type="text" formControlName="username" class="input" readonly />
              @if (editMode()) {
                <span class="field-hint">Solo el administrador puede cambiarlo.</span>
              }
            </div>
            <div>
              <label for="pf-correo" class="label">Correo electrónico</label>
              <input id="pf-correo" type="email" formControlName="correo" class="input" readonly />
              @if (editMode()) {
                <span class="field-hint">Solo el administrador puede cambiarlo.</span>
              }
            </div>
          </div>

          <p class="mt-4 flex items-center gap-1.5 text-xs text-fg-subtle">
            <app-icon name="lock" [size]="12" /> Tu usuario, correo, área, estado y roles solo los modifica un administrador.
          </p>

          <div class="mt-5 flex justify-end gap-2 border-t border-line pt-4">
            @if (!editMode()) {
              <button type="button" class="btn btn-secondary" (click)="editar()" [disabled]="!user()">
                <app-icon name="pencil" /> Editar perfil
              </button>
            } @else {
              <button type="button" class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                @if (guardando()) {
                  <loading-spinner /> Guardando…
                } @else {
                  Guardar cambios
                }
              </button>
            }
          </div>
        </form>
      </section>
    </div>
  `,
})
export class PerfilUsuario {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UserService);

  protected areaLabel = AREA_LABEL;
  user = signal<Usuario | null>(null);
  editMode = signal(false);
  guardando = signal(false);
  error = signal('');
  aviso = signal('');

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(35), noWhitespaceValidator]],
    // Solo lectura: los cambia el administrador desde Usuarios
    username: [''],
    correo: [''],
  });

  constructor() {
    this.form.disable();
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.usuarioService.getUsuarioPrincipal().subscribe({
      next: (usuario) => {
        this.user.set(usuario);
        this.restablecer();
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudo cargar tu perfil.')),
    });
  }

  protected invalido(campo: Campo) {
    const c = this.form.controls[campo];
    return c.enabled && c.touched && c.invalid;
  }

  private restablecer() {
    const u = this.user();
    if (!u) return;
    this.form.reset({ nombre: u.nombre, username: u.username, correo: u.correo });
    this.form.disable();
  }

  editar() {
    this.aviso.set('');
    this.editMode.set(true);
    this.form.controls.nombre.enable(); // usuario y correo siguen bloqueados
  }

  cancelar() {
    this.restablecer();
    this.editMode.set(false);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const u = this.user()!;
    this.guardando.set(true);
    this.error.set('');

    this.usuarioService
      // Se envían el usuario y el correo actuales: el backend solo acepta cambios de nombre
      .actualizarPerfil({ username: u.username, correo: u.correo, nombre: this.form.getRawValue().nombre.trim() })
      .subscribe({
        next: (usuarioActualizado) => {
          this.guardando.set(false);
          this.user.set(usuarioActualizado);
          this.editMode.set(false);
          this.restablecer();
          this.aviso.set('Perfil actualizado correctamente.');
        },
        error: (e) => {
          this.guardando.set(false);
          this.error.set(mensajeError(e, 'No se pudo actualizar el perfil.'));
        },
      });
  }
}
