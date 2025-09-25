import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaginatedResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private buildParams(params: PaginationParams = {}): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      httpParams = httpParams.set(key, String(value));
    });
    return httpParams;
  }

  get<T>(endpoint: string, params?: PaginationParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { 
      params: this.buildParams(params) 
    });
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  put<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
