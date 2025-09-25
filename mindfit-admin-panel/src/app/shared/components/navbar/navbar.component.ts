import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService, LoginResponse } from '../../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar class="navbar bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center flex-1">
        <!-- Logo and Brand -->
        <div class="flex items-center mr-8">
          <img src="/logo_mindfit.png" alt="MindFit" class="w-8 h-10 mr-3">
          <h1 class="text-xl text-gray-900 tracking-tight">
            MindFit
            <span class="text-sm font-medium text-gray-500 ml-2">Admin</span>
          </h1>
        </div>
        
        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-2" *ngIf="currentUser">
          <a mat-button 
             routerLink="/users" 
             routerLinkActive="active"
             class="nav-link font-medium flex items-center">
            <mat-icon class="mr-2">people</mat-icon>
            Users
          </a>
          
          <a mat-button 
             routerLink="/logs" 
             routerLinkActive="active"
             class="nav-link font-medium flex items-center">
            <mat-icon class="mr-2">description</mat-icon>
            Logs
          </a>
        </nav>
      </div>
      
      <!-- Mobile menu toggle -->
      <button mat-icon-button class="md:hidden mr-2" *ngIf="currentUser" (click)="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle navigation">
        <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
      </button>

      <!-- User Menu -->
      <div class="flex items-center" *ngIf="currentUser">
        <button mat-icon-button 
                [matMenuTriggerFor]="userMenu"
                class="user-menu-trigger">
          <mat-icon class="text-gray-600">account_circle</mat-icon>
        </button>
        
        <mat-menu #userMenu="matMenu" class="user-menu">
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="text-sm font-semibold text-gray-900">{{ currentUser.email }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ currentUser.roles.join(', ') }}</p>
          </div>
          <button mat-menu-item (click)="logout()" class="text-red-600 font-medium">
            <mat-icon class="mr-2">logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>

    <!-- Mobile nav drawer -->
    <div *ngIf="currentUser && mobileMenuOpen" class="md:hidden bg-white border-b border-gray-200 shadow-sm px-4 py-2">
      <a 
        routerLink="/users" 
        routerLinkActive="active"
        (click)="mobileMenuOpen = false"
        class="block py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50">
        <span class="inline-flex items-center"><mat-icon class="mr-2">people</mat-icon> Users</span>
      </a>
      <a 
        routerLink="/logs" 
        routerLinkActive="active"
        (click)="mobileMenuOpen = false"
        class="block py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50">
        <span class="inline-flex items-center"><mat-icon class="mr-2">description</mat-icon> Logs</span>
      </a>
    </div>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 64px;
      padding: 0 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .nav-link {
      border-radius: 8px;
      transition: all 0.2s ease;
      color: rgb(75, 85, 99);
      margin: 0 4px;
      min-width: 0;
    }
    
    .nav-link:hover {
      background-color: rgb(249, 250, 251);
      color: rgb(16, 185, 129);
    }
    
    .nav-link.active {
      background-color: rgb(236, 253, 245);
      color: rgb(16, 185, 129);
      font-weight: 600;
    }
    
    .user-menu-trigger {
      background-color: rgb(249, 250, 251);
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    
    .user-menu-trigger:hover {
      background-color: rgb(243, 244, 246);
    }
    
    .user-menu .mat-mdc-menu-item {
      min-height: 44px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    h1 {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  currentUser: LoginResponse | null = null;
  mobileMenuOpen = false;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
