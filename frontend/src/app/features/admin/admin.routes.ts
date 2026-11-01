import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./cms-dashboard.component').then((component) => component.CmsDashboardComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./admin-login.component').then((component) => component.AdminLoginComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
