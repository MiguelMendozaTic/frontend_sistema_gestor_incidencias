import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { RegisterData } from 'src/app/core/models/usuario.model';
import { UserFormComponent } from '@shared/components/user-form-component/user-form-component';
import { Icon } from '@shared/components/icon/icon';
import { mensajeError } from '@shared/utils/errores';
import { AuthShell } from '../auth-shell';

@Component({
  selector: 'app-register',
  imports: [UserFormComponent, RouterLink, AuthShell, Icon],
  template: `
    <app-auth-shell>
      <h1 class="text-xl font-semibold text-fg">Crear cuenta</h1>
      <p class="mt-1 text-sm text-fg-subtle">
        Las cuentas nuevas se registran como empleado. Un administrador puede asignar otros roles.
      </p>

      @if (success()) {
        <p class="alert alert-success mt-5" role="status">
          <app-icon name="check" class="mt-0.5" />
          <span>Cuenta creada. Te llevamos al inicio de sesión…</span>
        </p>
      }
      @if (error()) {
        <p class="alert alert-error mt-5" role="alert">
          <app-icon name="alert" class="mt-0.5" />
          <span>{{ error() }}</span>
        </p>
      }

      <div class="mt-6">
        <app-user-form-component
          [isAdmin]="false"
          submitLabel="Crear cuenta"
          (submitForm)="handleRegister($event)"
        />
      </div>

      <p class="mt-6 text-center text-sm text-fg-subtle">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login" class="font-medium text-primary hover:underline">Inicia sesión</a>
      </p>
    </app-auth-shell>
  `,
})
export class RegisterComponent {
  success = signal(false);
  error = signal('');
  private authService = inject(AuthService);
  private router = inject(Router);

  async handleRegister(userData: RegisterData) {
    this.error.set('');
    try {
      await firstValueFrom(this.authService.registerNewUser(userData));
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo crear la cuenta.'));
    }
  }
}
