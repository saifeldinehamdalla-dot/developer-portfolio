import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((routes) => routes.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
