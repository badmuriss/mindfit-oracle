import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DataTableComponent, TableColumn, TableAction, TableFilters } from '../../shared/components/data-table/data-table.component';
import { ApiService, PaginationParams } from '../../api/api.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserFormDialogComponent, UserDialogData, UserFormData } from '../../shared/components/user-form-dialog/user-form-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { AuthService } from '../../auth/auth.service';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
  lastLogonDate: string;
}

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    DataTableComponent
  ],
  template: `
    <div class="container mx-auto p-4 sm:p-6">
      <app-data-table
        title="Users Management"
        [columns]="columns"
        [data]="users"
        [totalElements]="totalElements"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [loading]="loading"
        [actions]="actions"
        [showFilters]="true"
        [showSearch]="true"
        [showDateFilters]="false"
        [showCreateButton]="true"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
        (filtersChange)="onFiltersChange($event)"
        (create)="onCreateUser()">
      </app-data-table>
    </div>
  `,
  styles: [`
    .container { max-width: 1300px; }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: User[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  loading = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roles', label: 'Roles', sortable: false },
    { key: 'lastLogonDate', label: 'Last Login', type: 'date', sortable: true },
    { key: 'createdAt', label: 'Created At', type: 'date', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  actions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      handler: (user: User) => this.viewUser(user),
      color: 'primary'
    },
    {
      icon: 'edit',
      label: 'Edit',
      handler: (user: User) => this.editUser(user),
      color: 'accent',
      visible: (user: User) => this.canEditUser(user)
    },
    {
      icon: 'delete',
      label: 'Delete',
      handler: (user: User) => this.deleteUser(user),
      color: 'warn',
      visible: (user: User) => this.canEditUser(user)
    }
  ];

  private currentFilters: TableFilters = {};
  private currentSort = '';
  private currentSearch = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toast: ToastService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    
    const params: PaginationParams = {
      page: this.pageIndex,
      size: this.pageSize,
      sort: this.currentSort || 'createdAt,desc',
      ...this.currentFilters
    };

    this.apiService.get<any>('/users', params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const serverData: User[] = response.content || [];
          if (this.currentSearch) {
            const q = this.currentSearch.toLowerCase();
            const filtered = serverData.filter(u => {
              const name = (u.name || '').toLowerCase();
              const email = (u.email || '').toLowerCase();
              const roles = (u.roles || []).join(',').toLowerCase();
              const created = (u.createdAt || '').toLowerCase();
              const lastLogon = (u.lastLogonDate || '').toLowerCase();
              return name.includes(q) || email.includes(q) || roles.includes(q) || created.includes(q) || lastLogon.includes(q);
            });
            this.users = filtered;
            this.totalElements = filtered.length;
          } else {
            this.users = serverData;
            this.totalElements = response.page.totalElements || serverData.length || 0;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          this.loading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.currentSort = `${sort.active},${sort.direction}`;
    } else {
      this.currentSort = '';
    }
    this.pageIndex = 0;
    this.loadUsers();
  }

  onFiltersChange(filters: TableFilters): void {
    // Extract search for client-side filtering; keep other filters (e.g., from/to) for server
    this.currentSearch = (filters.search || '').trim();
    const { search, ...rest } = filters;
    this.currentFilters = rest;
    this.pageIndex = 0;
    this.loadUsers();
  }

  viewUser(user: User): void {
    this.router.navigate(['/users', user.id]);
  }

  editUser(user: User): void {
    if (!this.canEditUser(user)) {
      this.toast.error('You do not have permission to edit this user');
      return;
    }

    const dialogData: UserDialogData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
        lastLogonDate: user.lastLogonDate
      },
      isEdit: true
    };

    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(result);
      }
    });
  }

  deleteUser(user: User): void {
    if (!this.canEditUser(user)) {
      this.toast.error('You do not have permission to delete this user');
      return;
    }

    if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
      this.apiService.delete(`/users/${user.id}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('User deleted successfully');
            this.loadUsers();
          },
          error: (error) => {
            console.error('Failed to delete user:', error);
          }
        });
    }
  }

  onCreateUser(): void {
    const dialogData: UserDialogData = {
      isEdit: false
    };

    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  private createUser(userData: UserFormData): void {
    // Determine endpoint based on user type
    const endpoint = userData.userType === 'admin' ? '/auth/admin/signup' : '/auth/user/signup';
    
    // Prepare request data (remove userType from payload)
    const requestData = {
      name: userData.name,
      email: userData.email,
      password: userData.password
    };

    this.apiService.post(endpoint, requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('User created successfully');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to create user:', error);
          this.toast.error('Failed to create user');
        }
      });
  }

  private updateUser(userData: UserFormData): void {
    // Update editable fields (name, email, and optionally password)
    const payload: any = {
      name: userData.name,
      email: userData.email
    };
    
    // Include password if provided
    if (userData.password && userData.password.trim()) {
      payload.password = userData.password;
    }
    
    this.apiService.put(`/users/${userData.id}`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('User updated successfully');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to update user:', error);
          this.toast.error('Failed to update user');
        }
      });
  }

  private canEditUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.roles) {
      return false;
    }

    const isSuperAdmin = currentUser.roles.includes('SUPER_ADMIN');
    const isAdmin = currentUser.roles.includes('ADMIN');
    const targetIsSuperAdmin = user.roles?.includes('SUPER_ADMIN');
    const targetIsAdmin = user.roles?.includes('ADMIN');

    // Super admin can edit anyone except other super admins (unless it's themselves)
    if (isSuperAdmin) {
      if (targetIsSuperAdmin) {
        return currentUser.email === user.email; // Can only edit themselves
      }
      return true; // Can edit admins and regular users
    }

    // Admin can only edit regular users (not other admins or super admins)
    if (isAdmin) {
      return !targetIsAdmin && !targetIsSuperAdmin;
    }

    // Regular users cannot edit anyone
    return false;
  }
}
