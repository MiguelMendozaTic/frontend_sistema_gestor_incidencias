import { Component, inject, signal } from '@angular/core';
import { ConfiguracionService } from '@services/configuracion.service';
import { RouterOutlet } from '@angular/router';
import { SidebarDashboardComponent } from '../sidebar/sidebar-dashboard.component';
import { HeaderDashboardComponent } from '../header/header-dashboard.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [SidebarDashboardComponent, HeaderDashboardComponent, RouterOutlet],
  template: `
    <div class="min-h-screen bg-canvas">
      <app-sidebar [(collapsed)]="sidebarCollapsed" [(isOpen)]="isOpenSidebar" />
      <div
        class="flex min-h-screen flex-col transition-[padding] duration-200"
        [class]="sidebarCollapsed() ? 'md:pl-16' : 'md:pl-60'"
      >
        <app-header (toggleSidebar)="isOpenSidebar.set(true)" />
        <main class="flex-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  isOpenSidebar = signal(false);

  constructor() {
    // Ajustes globales (p. ej. intervalo de recarga) al entrar a la aplicación.
    inject(ConfiguracionService).cargar();
  }
}
