import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);
  const session = auth.session();
  const apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  const isApiRequest =
    request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
  const isLoginRequest = request.url === `${apiBaseUrl}/Auth/login`;
  const authenticatedRequest =
    environment.dataSource === 'api' &&
    isApiRequest &&
    !isLoginRequest &&
    session?.token &&
    session.expiresAt > Date.now()
      ? request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        session?.token &&
        isApiRequest &&
        environment.dataSource === 'api'
      ) {
        auth.logout();
        toast.show('Your session expired. Sign in again to continue.', 'info');
        void router.navigateByUrl('/admin/login');
      }
      return throwError(() => error);
    }),
  );
};
