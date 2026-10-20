
import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { StudentDashboard } from './pages/student-dashboard/student-dashboard';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'student/dashboard', component: StudentDashboard },
  { path: 'admin/dashboard', component: AdminDashboard },
  { path: '**', redirectTo: '' }
];
