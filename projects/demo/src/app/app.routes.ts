import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'colors',
    loadComponent: () => import('./components/colors/colors.component').then(m => m.ColorsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
