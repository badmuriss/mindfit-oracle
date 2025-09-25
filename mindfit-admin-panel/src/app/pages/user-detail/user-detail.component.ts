import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn, TableAction, TableFilters } from '../../shared/components/data-table/data-table.component';
import { ApiService, PaginationParams, PaginatedResponse } from '../../api/api.service';
import { ToastService } from '../../shared/services/toast.service';
import { MealFormDialogComponent, MealDialogData, MealFormData } from '../../shared/components/meal-form-dialog/meal-form-dialog.component';
import { ExerciseFormDialogComponent, ExerciseDialogData, ExerciseFormData } from '../../shared/components/exercise-form-dialog/exercise-form-dialog.component';
import { MeasurementFormDialogComponent, MeasurementDialogData, MeasurementFormData } from '../../shared/components/measurement-form-dialog/measurement-form-dialog.component';
import { ProfileGenerationDialogComponent, ProfileGenerationDialogData, ProfileGenerationFormData } from '../../shared/components/profile-generation-dialog/profile-generation-dialog.component';
import { PageEvent } from '@angular/material/paginator';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
  lastLogonDate: string;
  profile: string;
  sex?: string;
  birthDate?: string;
}

export interface Meal {
  id: string;
  name: string;
  timestamp: string;
  calories: number;
  carbo: number;
  protein: number;
  fat: number;
}

export interface Exercise {
  id: string;
  name: string;
  timestamp: string;
  durationInMinutes: number;
  caloriesBurnt: number;
  description: string;
}

export interface Measurement {
  id: string;
  weightInKG: number;
  heightInCM: number;
  timestamp: string;
}

export interface MealResponse extends PaginatedResponse<Meal> {}
export interface ExerciseResponse extends PaginatedResponse<Exercise> {}
export interface MeasurementResponse extends PaginatedResponse<Measurement> {}
export interface ProfileGenerationResponse {
  profile: string;
}

@Component({
  selector: 'app-user-detail',
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DataTableComponent
  ],
  template: `
    <div class="container mx-auto p-4 sm:p-6">
      <!-- User Info Header -->
      <mat-card class="mb-6">
        <div class="p-6">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-1">
                {{ user?.name || 'Loading...' }}
              </h1>
              <div class="text-gray-500 mb-2 break-words">
                {{ user?.email }}
              </div>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <span><strong>Roles:</strong> {{ user?.roles?.join(', ') || 'N/A' }}</span>
                  <span><strong>Last Login:</strong> {{ (user?.lastLogonDate | date:'medium') || 'Never' }}</span>
                </div>
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <span><strong>Sex:</strong> {{ formatSexDisplay(user?.sex) }}</span>
                  <span><strong>Age:</strong> {{ calculateAge(user?.birthDate) }}</span>
                </div>
                <div>
                  <span><strong>Created:</strong> {{ user?.createdAt | date:'medium' }}</span>
                </div>
                <div class="mt-3">
                  <div class="flex items-center gap-3 mb-2">
                    <span><strong>AI Profile:</strong></span>
                    <button mat-stroked-button 
                            color="primary" 
                            (click)="generateProfile()"
                            [disabled]="generatingProfile"
                            class="flex items-center gap-2">
                      <mat-icon>smart_toy</mat-icon>
                      {{ generatingProfile ? 'Generating...' : 'Generate Profile' }}
                    </button>
                  </div>
                  <p *ngIf="user?.profile" class="mt-1 text-gray-700 bg-gray-50 p-3 rounded-md">{{ user?.profile }}</p>
                  <p *ngIf="!user?.profile" class="mt-1 text-gray-500 italic">No AI profile generated yet.</p>
                </div>
              </div>
            </div>
            <div class="flex gap-2 md:mt-0 mt-2">
              <button mat-stroked-button 
                      color="accent"
                      (click)="openChatbot()"
                      class="flex items-center gap-2 px-4 py-2">
                <mat-icon>chat</mat-icon>
                Chatbot
              </button>
              <button mat-raised-button (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Tabs -->
      <mat-tab-group class="user-detail-tabs" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Meals">
          <div class="p-4">
            <app-data-table
              title="User Meals"
              [columns]="mealColumns"
              [data]="meals"
              [totalElements]="mealsTotalElements"
              [pageSize]="mealsPageSize"
              [pageIndex]="mealsPageIndex"
              [loading]="mealsLoading"
              [actions]="mealActions"
              [showFilters]="true"
              [showDateFilters]="true"
              [showSearch]="false"
              [showCreateButton]="true"
              (pageChange)="onMealsPageChange($event)"
              (filtersChange)="onMealsFiltersChange($event)"
              (create)="onCreateMeal()">
            </app-data-table>
          </div>
        </mat-tab>

        <mat-tab label="Exercises">
          <div class="p-4">
            <app-data-table
              title="User Exercises"
              [columns]="exerciseColumns"
              [data]="exercises"
              [totalElements]="exercisesTotalElements"
              [pageSize]="exercisesPageSize"
              [pageIndex]="exercisesPageIndex"
              [loading]="exercisesLoading"
              [actions]="exerciseActions"
              [showFilters]="true"
              [showDateFilters]="true"
              [showSearch]="false"
              [showCreateButton]="true"
              (pageChange)="onExercisesPageChange($event)"
              (filtersChange)="onExercisesFiltersChange($event)"
              (create)="onCreateExercise()">
            </app-data-table>
          </div>
        </mat-tab>

        <mat-tab label="Measurements">
          <div class="p-4">
            <app-data-table
              title="User Measurements"
              [columns]="measurementColumns"
              [data]="measurements"
              [totalElements]="measurementsTotalElements"
              [pageSize]="measurementsPageSize"
              [pageIndex]="measurementsPageIndex"
              [loading]="measurementsLoading"
              [actions]="measurementActions"
              [showFilters]="true"
              [showDateFilters]="true"
              [showSearch]="false"
              [showCreateButton]="true"
              (pageChange)="onMeasurementsPageChange($event)"
              (filtersChange)="onMeasurementsFiltersChange($event)"
              (create)="onCreateMeasurement()">
            </app-data-table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .user-detail-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();
  private loadMeals$ = new Subject<PaginationParams>();
  private loadExercises$ = new Subject<PaginationParams>();
  private loadMeasurements$ = new Subject<PaginationParams>();

  userId!: string;
  user: User | null = null;

  meals: Meal[] = [];
  mealsTotalElements = 0;
  mealsPageSize = 20;
  mealsPageIndex = 0;
  mealsLoading = false;

  exercises: Exercise[] = [];
  exercisesTotalElements = 0;
  exercisesPageSize = 20;
  exercisesPageIndex = 0;
  exercisesLoading = false;

  measurements: Measurement[] = [];
  measurementsTotalElements = 0;
  measurementsPageSize = 20;
  measurementsPageIndex = 0;
  measurementsLoading = false;
  generatingProfile = false;

  mealColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'timestamp', label: 'Date', type: 'date', sortable: true },
    { key: 'calories', label: 'Calories', sortable: true },
    { key: 'carbo', label: 'Carbs (g)', sortable: true },
    { key: 'protein', label: 'Protein (g)', sortable: true },
    { key: 'fat', label: 'Fat (g)', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  exerciseColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'timestamp', label: 'Date', type: 'date', sortable: true },
    { key: 'durationInMinutes', label: 'Duration (min)', sortable: true },
    { key: 'caloriesBurnt', label: 'Calories Burnt', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  measurementColumns: TableColumn[] = [
    { key: 'weightInKG', label: 'Weight (kg)', sortable: true },
    { key: 'heightInCM', label: 'Height (cm)', sortable: true },
    { key: 'timestamp', label: 'Date', type: 'date', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  mealActions: TableAction[] = [
    { icon: 'edit', label: 'Edit', handler: (item) => this.editMeal(item as Meal) },
    { icon: 'delete', label: 'Delete', handler: (item) => this.deleteMeal(item as Meal), color: 'warn' }
  ];

  exerciseActions: TableAction[] = [
    { icon: 'edit', label: 'Edit', handler: (item) => this.editExercise(item as Exercise) },
    { icon: 'delete', label: 'Delete', handler: (item) => this.deleteExercise(item as Exercise), color: 'warn' }
  ];

  measurementActions: TableAction[] = [
    { icon: 'edit', label: 'Edit', handler: (item) => this.editMeasurement(item as Measurement) },
    { icon: 'delete', label: 'Delete', handler: (item) => this.deleteMeasurement(item as Measurement), color: 'warn' }
  ];

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
    this.loadUser();

    // Set up meals loading stream
    this.loadMeals$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.mealsLoading = true;
          return this.apiService.get<MealResponse>(`/users/${this.userId}/meals`, params);
        })
      )
      .subscribe({
        next: (response) => {
          this.meals = response.content || [];
          this.mealsTotalElements = response.page.totalElements || 0;
          this.mealsLoading = false;
        },
        error: (error) => {
          console.error('Failed to load meals:', error);
          this.mealsLoading = false;
        }
      });

    // Set up exercises loading stream
    this.loadExercises$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.exercisesLoading = true;
          return this.apiService.get<ExerciseResponse>(`/users/${this.userId}/exercises`, params);
        })
      )
      .subscribe({
        next: (response) => {
          this.exercises = response.content || [];
          this.exercisesTotalElements = response.page.totalElements || 0;
          this.exercisesLoading = false;
        },
        error: (error) => {
          console.error('Failed to load exercises:', error);
          this.exercisesLoading = false;
        }
      });

    // Set up measurements loading stream
    this.loadMeasurements$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.measurementsLoading = true;
          return this.apiService.get<MeasurementResponse>(`/users/${this.userId}/measurements`, params);
        })
      )
      .subscribe({
        next: (response) => {
          this.measurements = response.content || [];
          this.measurementsTotalElements = response.page.totalElements || 0;
          this.measurementsLoading = false;
        },
        error: (error) => {
          console.error('Failed to load measurements:', error);
          this.measurementsLoading = false;
        }
      });

    this.loadMeals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(): void {
    this.apiService.get<User>(`/users/${this.userId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
        },
        error: (error) => {
          console.error('Failed to load user:', error);
          this.toast.error('Failed to load user details');
        }
      });
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;
    switch (tabIndex) {
      case 0: // Meals
        this.loadMeals();
        break;
      case 1: // Exercises
        this.loadExercises();
        break;
      case 2: // Measurements
        this.loadMeasurements();
        break;
    }
  }

  loadMeals(): void {
    const params: PaginationParams = {
      page: this.mealsPageIndex,
      size: this.mealsPageSize,
      sort: 'timestamp,desc'
    };
    this.loadMealsWithParams(params);
  }

  loadMealsWithParams(params: PaginationParams): void {
    this.loadMeals$.next(params);
  }

  loadExercises(): void {
    const params: PaginationParams = {
      page: this.exercisesPageIndex,
      size: this.exercisesPageSize,
      sort: 'timestamp,desc'
    };
    this.loadExercisesWithParams(params);
  }

  loadExercisesWithParams(params: PaginationParams): void {
    this.loadExercises$.next(params);
  }

  loadMeasurements(): void {
    const params: PaginationParams = {
      page: this.measurementsPageIndex,
      size: this.measurementsPageSize,
      sort: 'timestamp,desc'
    };
    this.loadMeasurementsWithParams(params);
  }

  loadMeasurementsWithParams(params: PaginationParams): void {
    this.loadMeasurements$.next(params);
  }

  onMealsPageChange(event: PageEvent): void {
    this.mealsPageIndex = event.pageIndex;
    this.mealsPageSize = event.pageSize;
    this.loadMeals();
  }

  onExercisesPageChange(event: PageEvent): void {
    this.exercisesPageIndex = event.pageIndex;
    this.exercisesPageSize = event.pageSize;
    this.loadExercises();
  }

  onMeasurementsPageChange(event: PageEvent): void {
    this.measurementsPageIndex = event.pageIndex;
    this.measurementsPageSize = event.pageSize;
    this.loadMeasurements();
  }

  onMealsFiltersChange(filters: TableFilters): void {
    // Apply date filters to meals
    const params: PaginationParams = {
      page: 0, // Reset to first page
      size: this.mealsPageSize,
      sort: 'timestamp,desc'
    };
    
    if (filters.from) {
      params.from = new Date(filters.from).toISOString().split('T')[0];
    }
    if (filters.to) {
      params.to = new Date(filters.to).toISOString().split('T')[0];
    }
    
    this.mealsPageIndex = 0;
    this.loadMealsWithParams(params);
  }

  onExercisesFiltersChange(filters: TableFilters): void {
    // Apply date filters to exercises
    const params: PaginationParams = {
      page: 0, // Reset to first page
      size: this.exercisesPageSize,
      sort: 'timestamp,desc'
    };
    
    if (filters.from) {
      params.from = new Date(filters.from).toISOString().split('T')[0];
    }
    if (filters.to) {
      params.to = new Date(filters.to).toISOString().split('T')[0];
    }
    
    this.exercisesPageIndex = 0;
    this.loadExercisesWithParams(params);
  }

  onMeasurementsFiltersChange(filters: TableFilters): void {
    // Apply date filters to measurements
    const params: PaginationParams = {
      page: 0, // Reset to first page
      size: this.measurementsPageSize,
      sort: 'timestamp,desc'
    };
    
    if (filters.from) {
      params.from = new Date(filters.from).toISOString().split('T')[0];
    }
    if (filters.to) {
      params.to = new Date(filters.to).toISOString().split('T')[0];
    }
    
    this.measurementsPageIndex = 0;
    this.loadMeasurementsWithParams(params);
  }

  onCreateMeal(): void {
    const dialogData: MealDialogData = {
      isEdit: false,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(MealFormDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMeal(result);
      }
    });
  }

  onCreateExercise(): void {
    const dialogData: ExerciseDialogData = {
      isEdit: false,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(ExerciseFormDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createExercise(result);
      }
    });
  }

  onCreateMeasurement(): void {
    const dialogData: MeasurementDialogData = {
      isEdit: false,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(MeasurementFormDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMeasurement(result);
      }
    });
  }

  editMeal(meal: Meal): void {
    const dialogData: MealDialogData = {
      meal: {
        id: meal.id,
        name: meal.name,
        timestamp: meal.timestamp,
        calories: meal.calories,
        carbo: meal.carbo,
        protein: meal.protein,
        fat: meal.fat
      },
      isEdit: true,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(MealFormDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMeal(result);
      }
    });
  }

  deleteMeal(meal: Meal): void {
    if (confirm(`Are you sure you want to delete the meal "${meal.name}"?`)) {
      this.apiService.delete(`/users/${this.userId}/meals/${meal.id}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Meal deleted successfully');
            this.loadMeals();
          },
          error: (error) => {
            console.error('Failed to delete meal:', error);
          }
        });
    }
  }

  editExercise(exercise: Exercise): void {
    const dialogData: ExerciseDialogData = {
      exercise: {
        id: exercise.id,
        name: exercise.name,
        timestamp: exercise.timestamp,
        durationInMinutes: exercise.durationInMinutes,
        caloriesBurnt: exercise.caloriesBurnt,
        description: exercise.description
      },
      isEdit: true,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(ExerciseFormDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateExercise(result);
      }
    });
  }

  deleteExercise(exercise: Exercise): void {
    if (confirm(`Are you sure you want to delete the exercise "${exercise.name}"?`)) {
      this.apiService.delete(`/users/${this.userId}/exercises/${exercise.id}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Exercise deleted successfully');
            this.loadExercises();
          },
          error: (error) => {
            console.error('Failed to delete exercise:', error);
          }
        });
    }
  }

  editMeasurement(measurement: Measurement): void {
    const dialogData: MeasurementDialogData = {
      measurement: {
        id: measurement.id,
        weightInKG: measurement.weightInKG,
        heightInCM: measurement.heightInCM,
        timestamp: measurement.timestamp
      },
      isEdit: true,
      userId: this.userId
    };

    const dialogRef = this.dialog.open(MeasurementFormDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMeasurement(result);
      }
    });
  }

  deleteMeasurement(measurement: Measurement): void {
    if (confirm(`Are you sure you want to delete this measurement?`)) {
      this.apiService.delete(`/users/${this.userId}/measurements/${measurement.id}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Measurement deleted successfully');
            this.loadMeasurements();
          },
          error: (error) => {
            console.error('Failed to delete measurement:', error);
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  formatSexDisplay(sex?: string): string {
    if (!sex) return 'Not specified';
    switch (sex) {
      case 'MALE': return 'Male';
      case 'FEMALE': return 'Female';
      case 'NOT_INFORMED': return 'Prefer not to say';
      default: return 'Not specified';
    }
  }

  calculateAge(birthDate?: string): string {
    if (!birthDate) return 'Not specified';
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} years`;
  }

  generateProfile(): void {
    const dialogData: ProfileGenerationDialogData = {
      userName: this.user?.name || 'Unknown User',
      currentProfile: this.user?.profile
    };

    const dialogRef = this.dialog.open(ProfileGenerationDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ProfileGenerationFormData) => {
      if (result && result.observations) {
        this.performProfileGeneration(result.observations);
      }
    });
  }

  private performProfileGeneration(observations: string): void {
    this.generatingProfile = true;
    
    const payload = { observations };
    
    this.apiService.post<ProfileGenerationResponse>(`/users/${this.userId}/generate-profile`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.generatingProfile = false;
          this.toast.success('AI profile generated successfully');
          
          // Update the local user profile
          if (this.user && response.profile) {
            this.user.profile = response.profile;
          } else {
            // Fallback: reload user data
            this.loadUser();
          }
        },
        error: (error) => {
          this.generatingProfile = false;
          console.error('Failed to generate profile:', error);
          
          if (error.status === 429) {
            this.toast.error('Rate limit exceeded. Please try again later.');
          } else if (error.error?.message) {
            this.toast.error(`Failed to generate AI profile: ${error.error.message}`);
          } else {
            this.toast.error('Failed to generate AI profile. Please try again.');
          }
        }
      });
  }

  openChatbot(): void {
    this.router.navigate(['/users', this.userId, 'chatbot']);
  }

  // Private CRUD methods
  private createMeal(mealData: MealFormData): void {
    this.apiService.post(`/users/${this.userId}/meals`, mealData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Meal added successfully');
          this.loadMeals();
        },
        error: (error) => {
          console.error('Failed to create meal:', error);
          this.toast.error('Failed to add meal');
        }
      });
  }

  private updateMeal(mealData: MealFormData): void {
    this.apiService.put(`/users/${this.userId}/meals/${mealData.id}`, mealData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Meal updated successfully');
          this.loadMeals();
        },
        error: (error) => {
          console.error('Failed to update meal:', error);
          this.toast.error('Failed to update meal');
        }
      });
  }

  private createExercise(exerciseData: ExerciseFormData): void {
    this.apiService.post(`/users/${this.userId}/exercises`, exerciseData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Exercise added successfully');
          this.loadExercises();
        },
        error: (error) => {
          console.error('Failed to create exercise:', error);
          this.toast.error('Failed to add exercise');
        }
      });
  }

  private updateExercise(exerciseData: ExerciseFormData): void {
    this.apiService.put(`/users/${this.userId}/exercises/${exerciseData.id}`, exerciseData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Exercise updated successfully');
          this.loadExercises();
        },
        error: (error) => {
          console.error('Failed to update exercise:', error);
          this.toast.error('Failed to update exercise');
        }
      });
  }

  private createMeasurement(measurementData: MeasurementFormData): void {
    this.apiService.post(`/users/${this.userId}/measurements`, measurementData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Measurement added successfully');
          this.loadMeasurements();
        },
        error: (error) => {
          console.error('Failed to create measurement:', error);
          this.toast.error('Failed to add measurement');
        }
      });
  }

  private updateMeasurement(measurementData: MeasurementFormData): void {
    this.apiService.put(`/users/${this.userId}/measurements/${measurementData.id}`, measurementData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Measurement updated successfully');
          this.loadMeasurements();
        },
        error: (error) => {
          console.error('Failed to update measurement:', error);
          this.toast.error('Failed to update measurement');
        }
      });
  }
}