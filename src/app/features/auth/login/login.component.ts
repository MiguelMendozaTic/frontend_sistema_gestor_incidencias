import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from 'src/app/core/models/usuario.model';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Icon } from '@shared/components/icon/icon';
import { AuthShell } from '../auth-shell';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, LoadingSpinner, Icon],
  template: `
    <app-auth-shell>
      <h1 class="text-xl font-semibold text-fg">Iniciar sesión</h1>
      <p class="mt-1 text-sm text-fg-subtle">Accede para registrar y dar seguimiento a incidencias.</p>

      @if (error()) {
        <p class="alert alert-error mt-5" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span>{{ error() }}</span>
        </p>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-4" novalidate>
        <div>
          <label for="usuario" class="label">Usuario</label>
          <input
            id="usuario"
            type="text"
            formControlName="usuario"
            class="input"
            autocomplete="username"
            placeholder="Tu nombre de usuario"
            [attr.aria-invalid]="invalido('usuario')"
            aria-describedby="usuario-error"
          />
          @if (invalido('usuario')) {
            <span id="usuario-error" class="field-error">
              {{ loginForm.controls.usuario.errors?.['required'] ? 'Ingresa tu usuario.' : 'Mínimo 4 caracteres.' }}
            </span>
          }
        </div>

        <div>
          <label for="password" class="label">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="input"
            autocomplete="current-password"
            placeholder="••••••••"
            [attr.aria-invalid]="invalido('password')"
            aria-describedby="password-error"
          />
          @if (invalido('password')) {
            <span id="password-error" class="field-error">
              {{ loginForm.controls.password.errors?.['required'] ? 'Ingresa tu contraseña.' : 'Mínimo 6 caracteres.' }}
            </span>
          }
        </div>

        <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
          @if (loading()) {
            <loading-spinner /> Ingresando…
          } @else {
            Ingresar
          }
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-fg-subtle">
        ¿No tienes cuenta?
        <a routerLink="/auth/register" class="font-medium text-primary hover:underline">Regístrate</a>
      </p>

      <details after-card class="card mt-4 px-4 py-3 text-sm">
        <summary class="cursor-pointer font-medium text-fg-muted select-none">Cuentas de demostración</summary>
        <table class="mt-3 w-full text-left text-xs">
          <thead class="text-fg-subtle">
            <tr><th class="py-1 font-semibold">Rol</th><th class="font-semibold">Usuario</th><th class="font-semibold">Contraseña</th></tr>
          </thead>
          <tbody class="text-fg">
            @for (demo of demos; track demo.usuario) {
              <tr class="border-t border-line">
                <td class="py-1.5">{{ demo.rol }}</td>
                <td>
                  <button type="button" class="cursor-pointer font-mono text-primary hover:underline" (click)="usarDemo(demo.usuario)">
                    {{ demo.usuario }}
                  </button>
                </td>
                <td class="font-mono">123456</td>
              </tr>
            }
          </tbody>
        </table>
      </details>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  error = signal('');
  loading = signal(false);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected demos = [
    { rol: 'Administrador', usuario: 'jaime' },
    { rol: 'Empleado', usuario: 'juan' },
    { rol: 'Técnico', usuario: 'pedro' },
  ];

  loginForm = this.fb.nonNullable.group({
    usuario: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected invalido(campo: 'usuario' | 'password') {
    const c = this.loginForm.controls[campo];
    return c.touched && c.invalid;
  }

  protected usarDemo(usuario: string) {
    this.loginForm.patchValue({ usuario, password: '123456' });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.loading.set(true);

    const credenciales: LoginCredentials = {
      username: this.loginForm.getRawValue().usuario,
      password: this.loginForm.getRawValue().password,
    };
    this.authService.login(credenciales).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
            : 'Usuario o contraseña incorrectos, o la cuenta está inactiva.',
        );
      },
    });
  }
}
