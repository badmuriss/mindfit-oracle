import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../auth/auth.service';

export interface UserFormData {
  id?: string;
  email: string;
  password?: string;
  userType?: string;
  roles?: string[];
  createdAt?: string;
  lastLogonDate?: string;
  profile?: string;
}

export interface UserDialogData {
  user?: UserFormData;
  isEdit: boolean;
}

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="user-form-dialog">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">
        {{ data.isEdit ? 'Edit User' : 'Create New User' }}
      </h2>

      <form [formGroup]="userForm" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email Address</mat-label>
          <input matInput 
                 type="email" 
                 formControlName="email"
                 placeholder="user@example.com">
          <mat-icon matSuffix>email</mat-icon>
          <mat-error *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
            Please enter a valid email address
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full" *ngIf="!data.isEdit">
          <mat-label>Password</mat-label>
          <input matInput 
                 [type]="hidePassword ? 'password' : 'text'"
                 formControlName="password"
                 placeholder="Enter password">
          <button matSuffix 
                  mat-icon-button 
                  type="button"
                  (click)="hidePassword = !hidePassword">
            <mat-icon>{{hidePassword ? 'visibility' : 'visibility_off'}}</mat-icon>
          </button>
          <mat-error *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
            Password must be at least 6 characters
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>User Type</mat-label>
          <mat-select formControlName="userType">
            <mat-option value="user">User</mat-option>
            <mat-option value="admin" *ngIf="isSuperAdmin">Admin</mat-option>
          </mat-select>
          <mat-icon matSuffix>person</mat-icon>
          <mat-error *ngIf="userForm.get('userType')?.invalid && userForm.get('userType')?.touched">
            Please select user type
          </mat-error>
        </mat-form-field>
      </form>

      <div mat-dialog-actions class="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button mat-stroked-button (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary"
                (click)="onSave()"
                [disabled]="userForm.invalid || loading"
                class="flex items-center gap-2">
          <mat-progress-spinner *ngIf="loading" diameter="18" strokeWidth="2"></mat-progress-spinner>
          {{ loading ? 'Saving...' : (data.isEdit ? 'Update' : 'Create') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-form-dialog {
      min-width: 400px;
      max-width: 500px;
      padding: 8px;
    }

    mat-form-field {
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class UserFormDialogComponent implements OnInit {
  userForm: FormGroup;
  hidePassword = true;
  loading = false;
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.data.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      userType: ['user', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if current user is super_admin
    const currentUser = this.authService.getCurrentUser();
    this.isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN') ?? false;

    if (this.data.isEdit && this.data.user) {
      // For editing, determine user type from roles array
      const userType = this.data.user.roles?.includes('ADMIN') ? 'admin' : 'user';
      this.userForm.patchValue({
        email: this.data.user.email,
        userType: userType
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData: UserFormData = {
        email: formValue.email,
        userType: formValue.userType
      };

      if (!this.data.isEdit) {
        userData.password = formValue.password;
      }

      if (this.data.isEdit && this.data.user) {
        userData.id = this.data.user.id;
      }

      this.dialogRef.close(userData);
    }
  }
}