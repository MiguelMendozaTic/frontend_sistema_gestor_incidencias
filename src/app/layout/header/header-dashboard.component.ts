import { Component, computed, ElementRef, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionThema } from 'src/app/shared/utils/session-tema';
import { convertirRol } from '@shared/utils/convertidoFunction';
import { Icon } from '@shared/components/icon/icon';
import { Avatar } from '@shared/components/badges/badges';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Icon, Avatar, RouterLink],
  host: {
    '(document:click)': 'cerrarSiFuera($event)',
    '(document:keydown.escape)': 'menuAbierto.set(false)',
  },
  template: `
    <header
      class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6"
    >
      <button
        type="button"
        class="btn-icon md:hidden"
        (click)="toggleSidebar.emit()"
        aria-label="Abrir menú"
      >
        <app-icon name="menu" [size]="20" />
      </button>

      <div class="ml-auto flex items-center gap-1">
        <button
          type="button"
          class="btn-icon"
          (click)="sessionThema.cambiarThema()"
          [attr.aria-label]="sessionThema._isDark() ? 'Usar tema claro' : 'Usar tema oscuro'"
          [attr.title]="sessionThema._isDark() ? 'Tema claro' : 'Tema oscuro'"
        >
          <app-icon [name]="sessionThema._isDark() ? 'sun' : 'moon'" [size]="18" />
        </button>

        <div class="relative ml-1">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2.5 rounded-md py-1 pr-1.5 pl-1 transition-colors hover:bg-surface-hover"
            (click)="menuAbierto.set(!menuAbierto())"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuAbierto()"
          >
            <app-avatar [nombre]="username()" [size]="30" />
            <span class="hidden text-left leading-tight sm:block">
              <span class="block text-sm font-medium text-fg">{{ username() }}</span>
              <span class="block text-xs text-fg-subtle">{{ rol() }}</span>
            </span>
            <app-icon name="chevron-down" class="text-fg-subtle" />
          </button>

          @if (menuAbierto()) {
            <div
              role="menu"
              class="absolute right-0 mt-1 w-56 animate-dialog-in rounded-md border border-line bg-surface py-1 shadow-lg"
            >
              <div class="border-b border-line px-3 py-2">
                <p class="truncate text-sm font-medium text-fg">{{ username() }}</p>
                <p class="text-xs text-fg-subtle">{{ rol() }}</p>
              </div>
              <a
                role="menuitem"
                routerLink="/perfil-usuario"
                (click)="menuAbierto.set(false)"
                class="flex items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-surface-hover"
              >
                <app-icon name="user" class="text-fg-subtle" /> Mi perfil
              </a>
              <button
                type="button"
                role="menuitem"
                (click)="cerrarSession()"
                class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-surface-hover"
              >
                <app-icon name="logout" /> Cerrar sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderDashboardComponent {
  toggleSidebar = output<void>();
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  protected sessionThema = inject(SessionThema);
  private authService = inject(AuthService);

  protected menuAbierto = signal(false);
  protected username = computed(() => this.authService.currentUser()?.username ?? '');
  protected rol = computed(() => {
    const rol = this.authService.currentUser()?.roles?.[0];
    return rol ? convertirRol(rol) : 'Sin rol';
  });

  protected cerrarSiFuera(event: Event) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuAbierto.set(false);
  }

  cerrarSession() {
    this.menuAbierto.set(false);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
