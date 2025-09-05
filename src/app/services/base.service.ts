import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common'; 
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected readonly apiUrl = environment.apiUrl;
  protected readonly http = inject(HttpClient);
  protected readonly messageService = inject(MessageService, { optional: true });
  private readonly platformId = inject(PLATFORM_ID); 
  protected get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
    if (error.status === 400) {
      errorMessage = error.error?.message || 'درخواست نامعتبر است.';
    } else if (error.status === 401) {
      errorMessage = 'لطفاً ابتدا وارد حساب کاربری خود شوید.';
    } else if (error.status === 403) {
      errorMessage = 'شما به این منبع دسترسی ندارید.';
    } else if (error.status === 404) {
      errorMessage = 'منبع موردنظر یافت نشد.';
    } else if (error.status === 500) {
      errorMessage = 'خطای سرور. لطفاً بعداً تلاش کنید.';
    }

    if (isPlatformBrowser(this.platformId) && this.messageService) {
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: errorMessage,
      });
    } else {
      console.error(`Error ${error.status}:`, errorMessage, error); 
    }

    return throwError(() => new Error(errorMessage));
  }
}