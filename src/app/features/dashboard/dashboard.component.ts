import { AuthService } from './../../core/services/auth.service';
import { Component, inject } from '@angular/core';
import { Admin } from "./admin/admin";
import { Usuario } from "./usuario/usuario";

@Component({
  selector: 'app-dashboard',
  imports: [Admin, Usuario],
  template: `

    @if(authService.isAdmin()){
      <app-admin />

    }@else {
      <app-usuario />
    }
  `,
})
export class DashboardComponent {
  authService = inject(AuthService);
}
