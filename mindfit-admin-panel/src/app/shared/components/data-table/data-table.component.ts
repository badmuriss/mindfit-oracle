import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'actions' | 'longText';
}

export interface TableAction {
  icon: string;
  label: string;
  handler: (item: unknown) => void;
  color?: string;
  visible?: (item: unknown) => boolean;
}

export interface TableFilters {
  from?: string;
  to?: string;
  search?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-data-table',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTooltipModule
  ],
  template: `
    <div class="data-table-container">
      <!-- Filters -->
      <mat-card class="mb-4 p-4" *ngIf="showFilters">
        <form [formGroup]="filterForm">
          <div class="flex flex-wrap gap-4">
            <mat-form-field *ngIf="showSearch" class="flex-1 w-full sm:min-w-64">
              <mat-label>Search</mat-label>
              <input matInput formControlName="search" placeholder="Search...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <div class="flex flex-col sm:flex-row gap-4 sm:ml-auto" *ngIf="showDateFilters">
              <mat-form-field>
                <mat-label>From Date</mat-label>
                <input matInput [matDatepicker]="fromPicker" formControlName="from">
                <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field *ngIf="showToDateFilter">
                <mat-label>To Date</mat-label>
                <input matInput [matDatepicker]="toPicker" formControlName="to">
                <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button mat-stroked-button (click)="clearFilters()" type="button">
              Clear
            </button>
            <button mat-raised-button color="primary" (click)="applyFilters()" type="button">
              Apply
            </button>
          </div>
        </form>
      </mat-card>

      <!-- Table -->
      <mat-card>
        <div class="table-header p-4 border-b" *ngIf="title || showCreateButton">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold" *ngIf="title">{{ title }}</h2>
            <button mat-raised-button color="primary" *ngIf="showCreateButton" (click)="onCreate()">
              <mat-icon>add</mat-icon>
              Create
            </button>
          </div>
        </div>

        <div class="relative">
          <mat-spinner *ngIf="loading" class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"></mat-spinner>
          
          <div class="w-full overflow-x-auto">
          <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)" [class.opacity-50]="loading" class="min-w-[640px] sm:min-w-0 w-full">
            <ng-container *ngFor="let column of columns; trackBy: trackByKey" [matColumnDef]="column.key">
              <th mat-header-cell *matHeaderCellDef 
                  [mat-sort-header]="column.key"
                  [disabled]="column.sortable === false"
                  class="font-semibold">
                {{ column.label }}
              </th>
              <td mat-cell *matCellDef="let element">
                <ng-container [ngSwitch]="column.type">
                  <span *ngSwitchCase="'date'">
                    {{ element[column.key] | date:'short' }}
                  </span>
                  <span *ngSwitchCase="'longText'"
                        class="block truncate max-w-[500px]" 
                        [matTooltip]="element[column.key]"
                        matTooltipPosition="above">
                    {{ element[column.key] }}
                  </span>
                  <div *ngSwitchCase="'actions'" class="flex gap-2">
                    <ng-container *ngFor="let action of actions">
                      <button *ngIf="!action.visible || action.visible(element)"
                              mat-icon-button
                              [color]="action.color || 'primary'"
                              [matTooltip]="action.label"
                              (click)="$event.preventDefault(); $event.stopPropagation(); action.handler(element)">
                        <mat-icon>{{ action.icon }}</mat-icon>
                      </button>
                    </ng-container>
                  </div>
                  <span *ngSwitchDefault>
                    {{ element[column.key] }}
                  </span>
                </ng-container>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          </div>

          <div *ngIf="!loading && dataSource.data.length === 0" class="text-center py-8 text-gray-500">
            <mat-icon class="text-6xl text-gray-300 mb-4">inbox</mat-icon>
            <p>No data available</p>
          </div>
        </div>

        <mat-paginator
          [length]="totalElements"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="pageSizeOptions"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .data-table-container {
      width: 100%;
    }
    
    table {
      width: 100%;
    }
    
    .mat-mdc-header-row {
      background-color: #f5f5f5;
    }
  `]
})
export class DataTableComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() columns: TableColumn[] = [];
  @Input() data: unknown[] = [];
  @Input() totalElements = 0;
  @Input() pageSize = 20;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() loading = false;
  @Input() actions: TableAction[] = [];
  @Input() title?: string;
  @Input() showFilters = false;
  @Input() showSearch = true;
  @Input() showDateFilters = true;
  @Input() showToDateFilter = true;
  @Input() showCreateButton = false;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() filtersChange = new EventEmitter<TableFilters>();
  @Output() create = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<unknown>([]);
  displayedColumns: string[] = [];
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      from: [''],
      to: ['']
    });
  }

  ngOnInit(): void {
    this.dataSource.data = this.data;
    if (this.showFilters) {
      this.filterForm.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(() => {
          this.applyFilters();
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.displayedColumns = this.columns.map(col => col.key);
    }
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const cleanFilters: TableFilters = {};

    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== '') {
        if (key === 'from' || key === 'to') {
          cleanFilters[key] = filters[key]?.toISOString();
        } else {
          cleanFilters[key] = filters[key];
        }
      }
    });

    this.filtersChange.emit(cleanFilters);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filtersChange.emit({});
  }

  onCreate(): void {
    this.create.emit();
  }

  trackByKey = (_: number, col: TableColumn) => col.key;
}
