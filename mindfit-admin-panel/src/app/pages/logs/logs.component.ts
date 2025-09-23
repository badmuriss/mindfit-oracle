import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
 

import { DataTableComponent, TableColumn, TableFilters } from '../../shared/components/data-table/data-table.component';
import { ApiService, PaginationParams } from '../../api/api.service';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

 

export interface LogEntry {
  id: string;
  type: string;
  category: string;
  name: string;
  stackTrace: string;
  timestamp: string;
}

@Component({
  selector: 'app-logs',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    DataTableComponent
  ],
  template: `
    <div class="container mx-auto p-4 sm:p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">System Logs</h1>

      <!-- Responsive Chart Section -->
      <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div class="relative w-full pt-[75%]">
          <iframe
            class="absolute inset-0 w-full h-full rounded-lg shadow"
            frameborder="0"
            src="https://analytics.zoho.com/open-view/3117779000000004246/cf5a625e9d9a75dcf2f247f830bcb5d4"
          ></iframe>
        </div>
        <div class="relative w-full pt-[75%]">
          <iframe
            class="absolute inset-0 w-full h-full rounded-lg shadow"
            frameborder="0"
            src="https://analytics.zoho.com/open-view/3117779000000004228/960d27d124a62a624887ad319a6d7623"
          ></iframe>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="mb-4">
        <div class="p-4">
          <form [formGroup]="filtersForm">
            <div class="flex flex-wrap gap-4">
              <mat-form-field class="w-full sm:min-w-40">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="">All Types</mat-option>
                  <mat-option value="ERROR">Error</mat-option>
                  <mat-option value="WARNING">Warning</mat-option>
                  <mat-option value="INFO">Info</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="flex flex-col sm:flex-row gap-4 sm:ml-auto">
                <mat-form-field class="w-full sm:min-w-40">
                  <mat-label>From</mat-label>
                  <input matInput [matDatepicker]="fromPicker" formControlName="from">
                  <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fromPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field class="w-full sm:min-w-40">
                  <mat-label>To</mat-label>
                  <input matInput [matDatepicker]="toPicker" formControlName="to">
                  <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                  <mat-datepicker #toPicker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button mat-stroked-button type="button" (click)="clear()">Clear</button>
              <button mat-raised-button color="primary" type="button" (click)="apply()">Apply</button>
            </div>
          </form>
        </div>
      </mat-card>

      <!-- Logs Table -->
      <app-data-table
        title="Log Entries"
        [columns]="columns"
        [data]="logs"
        [totalElements]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [loading]="loading"
        [showFilters]="false"
        [showSearch]="false"
        [showDateFilters]="false"
        [showCreateButton]="false"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
      >
      </app-data-table>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1300px;
    }
  `]
})
export class LogsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private loadLogs$ = new Subject<void>();

  logs: LogEntry[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  loading = false;

  filtersForm: FormGroup;
  
  columns: TableColumn[] = [
    { key: 'timestamp', label: 'Timestamp', type: 'date', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'stackTrace', label: 'Details', sortable: false, type: 'longText' }
  ];

  private currentFilters: TableFilters = {};
  private currentSort = 'timestamp,desc';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.filtersForm = this.fb.group({
      type: [''],
      from: [null],
      to: [null]
    });
  }

  ngOnInit(): void {
    // Set up loading stream to prevent race conditions
    this.loadLogs$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          this.loading = true;
          const params: PaginationParams = {
            page: this.pageIndex,
            size: this.pageSize,
            sort: this.currentSort,
            ...this.currentFilters
          };
          return this.apiService.get<any>('/logs', params);
        })
      )
      .subscribe({
        next: (response) => {
          this.logs = response.content || [];
          this.totalElements = response.page.totalElements || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load logs:', error);
          this.loading = false;
        }
      });

    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs(): void {
    this.loadLogs$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.currentSort = `${sort.active},${sort.direction}`;
    } else {
      this.currentSort = 'timestamp,desc';
    }
    this.pageIndex = 0;
    this.loadLogs();
  }

  apply(): void {
    const { type, from, to } = this.filtersForm.value;
    const mapped: any = {};
    if (type) mapped.type = type;
    if (from) mapped.startDate = this.toDateOnly(from);
    if (to) mapped.endDate = this.toDateOnly(to);

    delete (this.currentFilters as any).type;
    delete (this.currentFilters as any).startDate;
    delete (this.currentFilters as any).endDate;

    this.currentFilters = { ...this.currentFilters, ...mapped };
    this.pageIndex = 0;
    this.loadLogs();
  }

  clear(): void {
    this.filtersForm.reset({ type: '', from: null, to: null });
    delete (this.currentFilters as any).type;
    delete (this.currentFilters as any).startDate;
    delete (this.currentFilters as any).endDate;
    this.pageIndex = 0;
    this.loadLogs();
  }

  private toDateOnly(value: string): string {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}