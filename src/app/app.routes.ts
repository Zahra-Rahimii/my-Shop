import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: 'admin', component: AdminDashboardComponent },
  { path: '', redirectTo: '/admin', pathMatch: 'full' }
];