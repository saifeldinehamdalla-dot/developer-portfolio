import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PORTFOLIO_REPOSITORY_PROVIDERS } from './core/repositories/repository.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    ...PORTFOLIO_REPOSITORY_PROVIDERS,
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
  ],
};
