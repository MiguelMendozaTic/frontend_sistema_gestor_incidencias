import { Component, computed, inject, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Icon, IconName } from '@shared/components/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <!-- Fondo en móvil -->
    @if (isOpen()) {
      <div class="fixed inset-0 z-30 bg-overlay md:hidden" (click)="isOpen.set(false)"></div>
    }

    <aside
      class="fixed top-0 left-0 z-40 flex h-screen w-60 flex-col bg-nav text-nav-fg transition-[width,translate] duration-200 md:translate-x-0"
      [class]="(collapsed() ? 'md:w-16 ' : '') + (isOpen() ? 'translate-x-0' : '-translate-x-full')"
      aria-label="Navegación principal"
    >
      <div class="flex h-14 items-center gap-2.5 border-b border-nav-line px-4">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-nav-accent text-nav">
          <app-icon name="ticket" [size]="18" />
        </span>
        @if (!collapsed()) {
          <div class="min-w-0 leading-tight">
            <p class="truncate text-sm font-semibold text-nav-fg-active">Gestor de Incidencias</p>
            <p class="truncate text-xs text-nav-fg">Mesa de servicio</p>
          </div>
        }
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto p-2">
        @if (!collapsed()) {
          <p class="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-nav-fg/70 uppercase">
            Menú
          </p>
        }
        @for (item of items(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-nav-active! text-nav-fg-active! before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-nav-accent"
            ariaCurrentWhenActive="page"
            class="relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-nav-hover hover:text-nav-fg-active"
            [class.justify-center]="collapsed()"
            [attr.title]="collapsed() ? item.label : null"
            [attr.aria-label]="collapsed() ? item.label : null"
            (click)="isOpen.set(false)"
          >
            <app-icon [name]="item.icon" [size]="18" />
            @if (!collapsed()) {
              <span class="truncate">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <button
        type="button"
        (click)="collapsed.set(!collapsed())"
        class="hidden h-11 cursor-pointer items-center gap-3 border-t border-nav-line px-5 text-sm hover:bg-nav-hover hover:text-nav-fg-active md:flex"
        [attr.aria-label]="collapsed() ? 'Expandir menú' : 'Contraer menú'"
      >
        <app-icon name="panel-left" [size]="18" />
        @if (!collapsed()) {
          <span>Contraer menú</span>
        }
      </button>
    </aside>
  `,
})
export class SidebarDashboardComponent {
  collapsed = model(false);
  isOpen = model(false);
  private authService = inject(AuthService);

  protected items = computed<NavItem[]>(() => [
    { label: 'Panel', path: '/dashboard', icon: 'dashboard' },
    { label: 'Incidencias', path: '/incidencia', icon: 'ticket' },
    ...(this.authService.isAdmin()
      ? [
          { label: 'Usuarios', path: '/users', icon: 'users' as IconName },
          { label: 'Equipos', path: '/equipos', icon: 'monitor' as IconName },
          { label: 'Configuración', path: '/configuracion', icon: 'settings' as IconName },
        ]
      : []),
    { label: 'Mi perfil', path: '/perfil-usuario', icon: 'user' },
  ]);
}
