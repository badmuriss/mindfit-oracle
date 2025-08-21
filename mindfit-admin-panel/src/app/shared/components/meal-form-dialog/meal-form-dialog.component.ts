import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface MealFormData {
  id?: string;
  name: string;
  timestamp: string;
  calories: number;
  carbo: number;
  protein: number;
  fat: number;
}

export interface MealDialogData {
  meal?: MealFormData;
  isEdit: boolean;
  userId: string;
}

@Component({
  selector: 'app-meal-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="meal-form-dialog">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">
        {{ data.isEdit ? 'Edit Meal' : 'Add New Meal' }}
      </h2>

      <form [formGroup]="mealForm" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Meal Name</mat-label>
          <input matInput 
                 formControlName="name"
                 placeholder="e.g., Breakfast, Lunch, Dinner">
          <mat-icon matSuffix>restaurant</mat-icon>
          <mat-error *ngIf="mealForm.get('name')?.invalid && mealForm.get('name')?.touched">
            Meal name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Date & Time</mat-label>
          <input matInput 
                 [matDatepicker]="picker"
                 formControlName="timestamp"
                 placeholder="Select date">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="mealForm.get('timestamp')?.invalid && mealForm.get('timestamp')?.touched">
            Date is required
          </mat-error>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Calories</mat-label>
            <input matInput 
                   type="number"
                   formControlName="calories"
                   placeholder="0">
            <span matSuffix>kcal</span>
            <mat-error *ngIf="mealForm.get('calories')?.invalid && mealForm.get('calories')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Carbohydrates</mat-label>
            <input matInput 
                   type="number"
                   formControlName="carbo"
                   placeholder="0">
            <span matSuffix>g</span>
            <mat-error *ngIf="mealForm.get('carbo')?.invalid && mealForm.get('carbo')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Protein</mat-label>
            <input matInput 
                   type="number"
                   formControlName="protein"
                   placeholder="0">
            <span matSuffix>g</span>
            <mat-error *ngIf="mealForm.get('protein')?.invalid && mealForm.get('protein')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fat</mat-label>
            <input matInput 
                   type="number"
                   formControlName="fat"
                   placeholder="0">
            <span matSuffix>g</span>
            <mat-error *ngIf="mealForm.get('fat')?.invalid && mealForm.get('fat')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>
        </div>
      </form>

      <div mat-dialog-actions class="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button mat-stroked-button (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary"
                (click)="onSave()"
                [disabled]="mealForm.invalid || loading"
                class="flex items-center gap-2">
          <mat-progress-spinner *ngIf="loading" diameter="18" strokeWidth="2"></mat-progress-spinner>
          {{ loading ? 'Saving...' : (data.isEdit ? 'Update' : 'Add Meal') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .meal-form-dialog {
      min-width: 500px;
      max-width: 600px;
      padding: 8px;
    }

    mat-form-field {
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class MealFormDialogComponent implements OnInit {
  mealForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MealFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MealDialogData
  ) {
    this.mealForm = this.fb.group({
      name: ['', [Validators.required]],
      timestamp: ['', [Validators.required]],
      calories: [0, [Validators.required, Validators.min(0)]],
      carbo: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      fat: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.meal) {
      this.mealForm.patchValue({
        name: this.data.meal.name,
        timestamp: new Date(this.data.meal.timestamp),
        calories: this.data.meal.calories,
        carbo: this.data.meal.carbo,
        protein: this.data.meal.protein,
        fat: this.data.meal.fat
      });
    } else {
      // Set default timestamp to now
      this.mealForm.patchValue({
        timestamp: new Date()
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.mealForm.valid) {
      const formValue = this.mealForm.value;
      const mealData: MealFormData = {
        name: formValue.name,
        timestamp: formValue.timestamp.toISOString(),
        calories: formValue.calories,
        carbo: formValue.carbo,
        protein: formValue.protein,
        fat: formValue.fat
      };

      if (this.data.isEdit && this.data.meal) {
        mealData.id = this.data.meal.id;
      }

      this.dialogRef.close(mealData);
    }
  }
}