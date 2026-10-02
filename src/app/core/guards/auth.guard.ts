import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
/** Solo administradores; el resto vuelve al panel. */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAdmin() ? true : inject(Router).createUrlTree(['/dashboard']);
};
