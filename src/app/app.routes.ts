import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        title: 'Usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'equipos',
        title: 'Equipos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/equipos/equipos.component').then((m) => m.EquiposComponent),
      },
      {
        path: 'incidencia',
        loadChildren: () =>
          import('@features/incidencia/incidencia.routes').then((m) => m.routes),
      },
      {
        path: 'configuracion',
        title: 'Configuración',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/configuracion/configuracion').then((m) => m.Configuracion),
      },
      {
        path: 'perfil-usuario',
        title: "Perfil Usuario",
        loadComponent: () =>
          import('./features/perfil-usuario/perfil-usuario').then((m) => m.PerfilUsuario),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
