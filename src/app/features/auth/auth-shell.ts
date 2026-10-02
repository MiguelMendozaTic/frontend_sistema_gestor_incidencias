import { Component, inject } from '@angular/core';
import { Icon } from '@shared/components/icon/icon';
import { SessionThema } from '@shared/utils/session-tema';

/** Marco común de las pantallas de acceso: marca, tarjeta central y tema. */
@Component({
  selector: 'app-auth-shell',
  imports: [Icon],
  template: `
    <div class="relative flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <button
        type="button"
        class="btn-icon absolute top-4 right-4"
        (click)="tema.cambiarThema()"
        [attr.aria-label]="tema._isDark() ? 'Usar tema claro' : 'Usar tema oscuro'"
      >
        <app-icon [name]="tema._isDark() ? 'sun' : 'moon'" [size]="18" />
      </button>

      <div class="w-full max-w-sm">
        <div class="mb-6 flex items-center justify-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-fg">
            <app-icon name="ticket" [size]="20" />
          </span>
          <span class="text-lg font-semibold tracking-tight text-fg">Gestor de Incidencias</span>
        </div>

        <div class="card p-6 shadow-sm sm:p-8">
          <ng-content />
        </div>

        <ng-content select="[after-card]" />
      </div>
    </div>
  `,
})
export class AuthShell {
  protected tema = inject(SessionThema);
}
