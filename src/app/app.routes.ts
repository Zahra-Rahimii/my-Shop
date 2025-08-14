import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () => 
      import('./components/admin-dashboard/admin-dashboard.component')
        .then(c => c.AdminDashboardComponent)
  }

];