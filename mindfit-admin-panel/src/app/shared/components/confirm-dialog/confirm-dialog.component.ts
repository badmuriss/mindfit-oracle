import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center mb-4">
        <mat-icon class="text-amber-500 mr-3 text-3xl">warning</mat-icon>
        <h2 class="text-xl font-semibold text-gray-900">{{ data.title }}</h2>
      </div>
      
      <div class="mb-6">
        <p class="text-gray-700 leading-relaxed">{{ data.message }}</p>
      </div>
      
      <div class="flex justify-end gap-3">
        <button mat-stroked-button 
                (click)="onCancel()"
                class="min-w-20">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button 
                [color]="data.confirmColor || 'warn'"
                (click)="onConfirm()"
                class="min-w-20">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 400px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}