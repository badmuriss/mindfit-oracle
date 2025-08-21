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

export interface MeasurementFormData {
  id?: string;
  weightInKG: number;
  heightInCM: number;
  timestamp: string;
}

export interface MeasurementDialogData {
  measurement?: MeasurementFormData;
  isEdit: boolean;
  userId: string;
}

@Component({
  selector: 'app-measurement-form-dialog',
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
    <div class="measurement-form-dialog">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">
        {{ data.isEdit ? 'Edit Measurement' : 'Add New Measurement' }}
      </h2>

      <form [formGroup]="measurementForm" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Date</mat-label>
          <input matInput 
                 [matDatepicker]="picker"
                 formControlName="timestamp"
                 placeholder="Select date">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="measurementForm.get('timestamp')?.invalid && measurementForm.get('timestamp')?.touched">
            Date is required
          </mat-error>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Weight</mat-label>
            <input matInput 
                   type="number"
                   step="0.1"
                   formControlName="weightInKG"
                   placeholder="0.0">
            <span matSuffix>kg</span>
            <mat-icon matSuffix>monitor_weight</mat-icon>
            <mat-error *ngIf="measurementForm.get('weightInKG')?.invalid && measurementForm.get('weightInKG')?.touched">
              Must be a positive number
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Height</mat-label>
            <input matInput 
                   type="number"
                   step="0.1"
                   formControlName="heightInCM"
                   placeholder="0.0">
            <span matSuffix>cm</span>
            <mat-icon matSuffix>height</mat-icon>
            <mat-error *ngIf="measurementForm.get('heightInCM')?.invalid && measurementForm.get('heightInCM')?.touched">
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
                [disabled]="measurementForm.invalid || loading"
                class="flex items-center gap-2">
          <mat-progress-spinner *ngIf="loading" diameter="18" strokeWidth="2"></mat-progress-spinner>
          {{ loading ? 'Saving...' : (data.isEdit ? 'Update' : 'Add Measurement') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .measurement-form-dialog {
      min-width: 450px;
      max-width: 500px;
      padding: 8px;
    }

    mat-form-field {
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class MeasurementFormDialogComponent implements OnInit {
  measurementForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MeasurementFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MeasurementDialogData
  ) {
    this.measurementForm = this.fb.group({
      weightInKG: [0, [Validators.required, Validators.min(0)]],
      heightInCM: [0, [Validators.required, Validators.min(0)]],
      timestamp: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.measurement) {
      this.measurementForm.patchValue({
        weightInKG: this.data.measurement.weightInKG,
        heightInCM: this.data.measurement.heightInCM,
        timestamp: new Date(this.data.measurement.timestamp)
      });
    } else {
      // Set default timestamp to now
      this.measurementForm.patchValue({
        timestamp: new Date()
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.measurementForm.valid) {
      const formValue = this.measurementForm.value;
      const measurementData: MeasurementFormData = {
        weightInKG: formValue.weightInKG,
        heightInCM: formValue.heightInCM,
        timestamp: formValue.timestamp.toISOString()
      };

      if (this.data.isEdit && this.data.measurement) {
        measurementData.id = this.data.measurement.id;
      }

      this.dialogRef.close(measurementData);
    }
  }
}