import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) return throwError(() => error);
        return throwError(
          () =>
            new Error(
              error.status === 0
                ? 'The API could not be reached.'
                : error.message,
            ),
        );
      }
      return throwError(() => error);
    }),
  );
