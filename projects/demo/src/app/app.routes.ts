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
    path: 'radial-gauge-demo',
    loadComponent: () => import('./components/radial-gauge-demo/radial-gauge-demo.component').then(m => m.RadialGaugeDemoComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
