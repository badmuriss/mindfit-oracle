import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface ProfileGenerationDialogData {
  userName: string;
  currentProfile?: string;
}

export interface ProfileGenerationFormData {
  observations: string;
}

@Component({
  selector: 'app-profile-generation-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon color="primary">smart_toy</mat-icon>
      Generate AI Profile for {{ data.userName }}
    </h2>
    
    <mat-dialog-content class="min-w-96">
      <div class="space-y-4">
        <div *ngIf="data.currentProfile" class="bg-gray-50 p-3 rounded-lg">
          <h3 class="font-medium text-sm text-gray-700 mb-2">Current Profile:</h3>
          <p class="text-sm text-gray-600">{{ data.currentProfile }}</p>
        </div>
        
        <div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Observations for AI Profile Generation</mat-label>
            <textarea
              matInput
              [(ngModel)]="formData.observations"
              placeholder="Enter observations about the user's goals, dietary restrictions, health conditions, preferences, etc. This information will be used to generate a personalized AI profile for better recommendations."
              rows="4"
              maxlength="1000"
              #observationsTextarea></textarea>
            <mat-hint align="end">{{ observationsTextarea.value?.length || 0 }}/1000</mat-hint>
          </mat-form-field>
        </div>
        
        <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <mat-icon class="text-blue-600 text-sm mr-1">info</mat-icon>
          <strong>Note:</strong> These observations will be used to generate/update the user's AI profile. 
          The observations themselves are not stored permanently - only the generated profile is saved.
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button (click)="onCancel()" type="button">
        Cancel
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()" 
        [disabled]="!formData.observations.trim()"
        class="flex items-center gap-2">
        <mat-icon>auto_awesome</mat-icon>
        {{ data.currentProfile ? 'Update Profile' : 'Generate Profile' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .space-y-4 > * + * {
      margin-top: 1rem;
    }
    
    .bg-gray-50 {
      background-color: #f9fafb;
    }
    
    .bg-blue-50 {
      background-color: #eff6ff;
    }
    
    .text-blue-600 {
      color: #2563eb;
    }
    
    .rounded-lg {
      border-radius: 0.5rem;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
  `]
})
export class ProfileGenerationDialogComponent {
  private dialogRef = inject<MatDialogRef<ProfileGenerationDialogComponent>>(MatDialogRef);
  data = inject<ProfileGenerationDialogData>(MAT_DIALOG_DATA);

  formData: ProfileGenerationFormData = {
    observations: ''
  };

  onSubmit(): void {
    if (this.formData.observations.trim()) {
      this.dialogRef.close(this.formData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}