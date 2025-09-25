import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const token = this.authService.getToken();
    
    let authReq = req;
    // Add Authorization header for all requests except login and user signup
    // Admin signup requires authorization since only admins can create other admins
    const isLoginRequest = req.url.includes('/auth/admin/login');
    const isUserSignup = req.url.includes('/auth/user/signup');
    
    if (token && !isLoginRequest && !isUserSignup) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        const isLoginRequest = req.url.includes('/auth/admin/login');
        const isSignupRequest = req.url.includes('/auth/admin/signup') || req.url.includes('/auth/user/signup');

        switch (error.status) {
          case 401:
          case 403:
            if (isLoginRequest) {
              errorMessage = 'Invalid email or password';
            } else if (isSignupRequest) {
              errorMessage = error.error?.message || 'Failed to create user. Please check your permissions.';
            } else {
              this.authService.logout();
              this.router.navigate(['/login']);
              errorMessage = 'Session expired. Please login again.';
            }
            break;
          case 429:
            errorMessage = 'Rate limit exceeded. Please try again later.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || 'An unexpected error occurred';
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });

        return throwError(() => error);
      })
    );
  }
}
