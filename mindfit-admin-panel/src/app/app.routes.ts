import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component').then(c => c.UsersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./pages/user-detail/user-detail.component').then(c => c.UserDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users/:id/chatbot',
    loadComponent: () => import('./pages/chatbot/chatbot.component').then(c => c.ChatbotComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'logs',
    loadComponent: () => import('./pages/logs/logs.component').then(c => c.LogsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/users'
  }
];
