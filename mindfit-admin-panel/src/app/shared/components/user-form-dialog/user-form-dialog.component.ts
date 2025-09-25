import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
  name?: string;
  email: string;
  password?: string;
  userType?: string;
  roles?: string[];
  createdAt?: string;
  lastLogonDate?: string;
  profile?: string;
  sex?: string;
  birthDate?: string;
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
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="user-form-dialog">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">
        {{ data.isEdit ? 'Edit User' : 'Create New User' }}
      </h2>

      <form [formGroup]="userForm" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput 
                 type="text" 
                 formControlName="name"
                 placeholder="Full name">
          <mat-icon matSuffix>person</mat-icon>
          @if (userForm.get('name')?.invalid && userForm.get('name')?.touched) {
          <mat-error>
            Please enter a name
          </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email Address</mat-label>
          <input matInput 
                 type="email" 
                 formControlName="email"
                 placeholder="user@example.com">
          <mat-icon matSuffix>email</mat-icon>
          @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
          <mat-error>
            Please enter a valid email address
          </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>{{ data.isEdit ? 'New Password (optional)' : 'Password' }}</mat-label>
          <input matInput 
                 [type]="hidePassword ? 'password' : 'text'"
                 formControlName="password"
                 [placeholder]="data.isEdit ? 'Leave empty to keep current password' : 'Enter password'">
          <button matSuffix 
                  mat-icon-button 
                  type="button"
                  (click)="hidePassword = !hidePassword">
            <mat-icon>{{hidePassword ? 'visibility' : 'visibility_off'}}</mat-icon>
          </button>
          @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
          <mat-error>
            {{ data.isEdit ? 'Password must be at least 6 characters if provided' : 'Password must be at least 6 characters' }}
          </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sex</mat-label>
          <mat-select formControlName="sex">
            <mat-option value="MALE">Male</mat-option>
            <mat-option value="FEMALE">Female</mat-option>
            <mat-option value="NOT_INFORMED">Prefer not to say</mat-option>
          </mat-select>
          <mat-icon matSuffix>wc</mat-icon>
          @if (userForm.get('sex')?.invalid && userForm.get('sex')?.touched) {
          <mat-error>
            Please select sex
          </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Birth Date</mat-label>
          <input matInput 
                 type="text"
                 formControlName="birthDate"
                 placeholder="DD/MM/YYYY"
                 (input)="formatBirthDateInput($event)"
                 maxlength="10">
          <mat-icon matSuffix>calendar_today</mat-icon>
          @if (userForm.get('birthDate')?.invalid && userForm.get('birthDate')?.touched) {
          <mat-error>
            @if (userForm.get('birthDate')?.errors?.['required']) {
            <span>Birth date is required</span>
            }
            @if (userForm.get('birthDate')?.errors?.['ageValidation']) {
            <span>Age must be between 13 and 120 years</span>
            }
            @if (userForm.get('birthDate')?.errors?.['dateFormat']) {
            <span><br>Please enter a valid date (DD/MM/YYYY)</span>
            }
          </mat-error>
          }
        </mat-form-field>

        @if (!data.isEdit) {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>User Type</mat-label>
          <mat-select formControlName="userType">
            <mat-option value="user">User</mat-option>
            @if (isSuperAdmin) {
            <mat-option value="admin">Admin</mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>person</mat-icon>
          @if (userForm.get('userType')?.invalid && userForm.get('userType')?.touched) {
          <mat-error>
            Please select user type
          </mat-error>
          }
        </mat-form-field>
        }
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
          @if (loading) {
          <mat-progress-spinner diameter="18" strokeWidth="2"></mat-progress-spinner>
          }
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

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as UserDialogData;

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.data.isEdit ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      sex: ['', [Validators.required]],
      birthDate: ['', this.data.isEdit ? [this.dateFormatValidator, this.ageValidator] : [Validators.required, this.dateFormatValidator, this.ageValidator]],
      userType: ['user', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if current user is super_admin
    const currentUser = this.authService.getCurrentUser();
    this.isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN') ?? false;

    if (this.data.isEdit && this.data.user) {
      // For editing, populate all existing fields
      const formattedBirthDate = this.data.user.birthDate ? 
        this.formatDateForDisplay(this.data.user.birthDate) : '';
      
      this.userForm.patchValue({
        name: this.data.user.name || '',
        email: this.data.user.email,
        sex: this.data.user.sex || '',
        birthDate: formattedBirthDate
      });
      
      // Set birthDate validator for edit mode (optional)
      this.userForm.get('birthDate')?.setValidators([this.dateFormatValidator, this.ageValidator]);
      this.userForm.get('birthDate')?.updateValueAndValidity();
    }
  }

  dateFormatValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const dateStr = control.value as string;
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    
    if (!dateRegex.test(dateStr)) {
      return { dateFormat: true };
    }

    const [, day, month, year] = dateStr.match(dateRegex)!;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Check if the date is valid
    if (date.getFullYear() != parseInt(year) || 
        date.getMonth() != parseInt(month) - 1 || 
        date.getDate() != parseInt(day)) {
      return { dateFormat: true };
    }

    return null;
  }

  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }
    
    const dateStr = control.value as string;
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    
    if (!dateRegex.test(dateStr)) {
      return null; // Let dateFormatValidator handle this
    }

    const [, day, month, year] = dateStr.match(dateRegex)!;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const adjustedAge = age - 1;
      if (adjustedAge < 13 || adjustedAge > 120) {
        return { ageValidation: true };
      }
    } else if (age < 13 || age > 120) {
      return { ageValidation: true };
    }
    
    return null;
  }

  formatBirthDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length <= 2) {
      // Value stays as is for length <= 2
    } else if (value.length <= 4) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    } else {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`;
    }
    
    input.value = value;
    this.userForm.get('birthDate')?.setValue(value);
  }

  formatDateForDisplay(isoDateString: string): string {
    const date = new Date(isoDateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData: UserFormData = {
        name: formValue.name,
        email: formValue.email,
        sex: formValue.sex
      };

      // Format birth date as ISO string for API consistency
      if (formValue.birthDate) {
        const dateStr = formValue.birthDate as string;
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        
        if (dateRegex.test(dateStr)) {
          const [, day, month, year] = dateStr.match(dateRegex)!;
          const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          userData.birthDate = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }

      if (!this.data.isEdit) {
        userData.password = formValue.password;
        userData.userType = formValue.userType;
      } else if (formValue.password && formValue.password.trim()) {
        userData.password = formValue.password;
      }

      if (this.data.isEdit && this.data.user) {
        userData.id = this.data.user.id;
      }

      this.dialogRef.close(userData);
    }
  }
}
