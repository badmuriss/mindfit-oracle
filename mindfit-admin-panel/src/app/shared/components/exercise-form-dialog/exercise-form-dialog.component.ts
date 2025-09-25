import { Component, OnInit, inject } from '@angular/core';
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

export interface ExerciseFormData {
  id?: string;
  name: string;
  timestamp: string;
  durationInMinutes: number;
  caloriesBurnt: number;
  description: string;
}

export interface ExerciseDialogData {
  exercise?: ExerciseFormData;
  isEdit: boolean;
  userId: string;
}

@Component({
  selector: 'app-exercise-form-dialog',
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
    <div class="exercise-form-dialog">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">
        {{ data.isEdit ? 'Edit Exercise' : 'Add New Exercise' }}
      </h2>

      <form [formGroup]="exerciseForm" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Exercise Name</mat-label>
          <input matInput 
                 formControlName="name"
                 placeholder="e.g., Running, Cycling, Weight Training">
          <mat-icon matSuffix>fitness_center</mat-icon>
          <mat-error *ngIf="exerciseForm.get('name')?.invalid && exerciseForm.get('name')?.touched">
            Exercise name is required
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
          <mat-error *ngIf="exerciseForm.get('timestamp')?.invalid && exerciseForm.get('timestamp')?.touched">
            Date is required
          </mat-error>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Duration</mat-label>
            <input matInput 
                   type="number"
                   formControlName="durationInMinutes"
                   placeholder="0">
            <span matSuffix>minutes</span>
            <mat-error *ngIf="exerciseForm.get('durationInMinutes')?.invalid && exerciseForm.get('durationInMinutes')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Calories Burnt</mat-label>
            <input matInput 
                   type="number"
                   formControlName="caloriesBurnt"
                   placeholder="0">
            <span matSuffix>kcal</span>
            <mat-error *ngIf="exerciseForm.get('caloriesBurnt')?.invalid && exerciseForm.get('caloriesBurnt')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput 
                    formControlName="description"
                    placeholder="Add notes about the exercise session..."
                    rows="3"></textarea>
          <mat-icon matSuffix>notes</mat-icon>
        </mat-form-field>
      </form>

      <div mat-dialog-actions class="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button mat-stroked-button (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
        <button mat-raised-button 
                color="primary"
                (click)="onSave()"
                [disabled]="exerciseForm.invalid || loading"
                class="flex items-center gap-2">
          <mat-progress-spinner *ngIf="loading" diameter="18" strokeWidth="2"></mat-progress-spinner>
          {{ loading ? 'Saving...' : (data.isEdit ? 'Update' : 'Add Exercise') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .exercise-form-dialog {
      min-width: 500px;
      max-width: 600px;
      padding: 8px;
    }

    mat-form-field {
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class ExerciseFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  dialogRef = inject<MatDialogRef<ExerciseFormDialogComponent>>(MatDialogRef);
  data = inject<ExerciseDialogData>(MAT_DIALOG_DATA);

  exerciseForm: FormGroup;
  loading = false;

  constructor() {
    this.exerciseForm = this.fb.group({
      name: ['', [Validators.required]],
      timestamp: ['', [Validators.required]],
      durationInMinutes: [0, [Validators.required, Validators.min(0)]],
      caloriesBurnt: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.exercise) {
      this.exerciseForm.patchValue({
        name: this.data.exercise.name,
        timestamp: new Date(this.data.exercise.timestamp),
        durationInMinutes: this.data.exercise.durationInMinutes,
        caloriesBurnt: this.data.exercise.caloriesBurnt,
        description: this.data.exercise.description
      });
    } else {
      // Set default timestamp to now
      this.exerciseForm.patchValue({
        timestamp: new Date()
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.exerciseForm.valid) {
      const formValue = this.exerciseForm.value;
      const exerciseData: ExerciseFormData = {
        name: formValue.name,
        timestamp: formValue.timestamp.toISOString(),
        durationInMinutes: formValue.durationInMinutes,
        caloriesBurnt: formValue.caloriesBurnt,
        description: formValue.description || ''
      };

      if (this.data.isEdit && this.data.exercise) {
        exerciseData.id = this.data.exercise.id;
      }

      this.dialogRef.close(exerciseData);
    }
  }
}