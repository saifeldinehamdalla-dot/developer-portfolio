import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (state.url.endsWith('/login')) {
    return auth.isAuthenticated() ? router.createUrlTree(['/admin']) : true;
  }
  return auth.isAuthenticated() ? true : router.createUrlTree(['/admin/login']);
};
