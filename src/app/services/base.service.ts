import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected readonly apiUrl = environment.apiUrl;
  protected readonly http = inject(HttpClient);
  protected readonly toastService = inject(ToastService);

  protected getQuery<T>(endpoint: string) {
    return injectQuery(() => ({
      queryKey: [endpoint],
      queryFn: () => lastValueFrom(this.http.get<T>(`${this.apiUrl}/${endpoint}`)).then(result => {
        if (result === undefined) {
          throw new Error('داده‌ای از API دریافت نشد.');
        }
        return result;
      }),
      onError: (error: any) => this.handleError(error),
    }));
  }

  protected postMutation<T>(endpoint: string) {
    return injectMutation(() => ({
      mutationFn: (data: any) => lastValueFrom(this.http.post<T>(`${this.apiUrl}/${endpoint}`, data)).then(result => {
        if (result === undefined) {
          throw new Error('داده‌ای از API دریافت نشد.');
        }
        return result;
      }),
      onError: (error: any) => this.handleError(error),
    }));
  }

  protected putMutation<T>(endpoint: string) {
    return injectMutation(() => ({
      mutationFn: (data: any) => lastValueFrom(this.http.put<T>(`${this.apiUrl}/${endpoint}`, data)).then(result => {
        if (result === undefined) {
          throw new Error('داده‌ای از API دریافت نشد.');
        }
        return result;
      }),
      onError: (error: any) => this.handleError(error),
    }));
  }

  protected patchMutation<T>(endpoint: string) {
    return injectMutation(() => ({
      mutationFn: (data: any) => lastValueFrom(this.http.patch<T>(`${this.apiUrl}/${endpoint}`, data)).then(result => {
        if (result === undefined) {
          throw new Error('داده‌ای از API دریافت نشد.');
        }
        return result;
      }),
      onError: (error: any) => this.handleError(error),
    }));
  }

  protected deleteMutation<T>(endpoint: string) {
    return injectMutation(() => ({
      mutationFn: () => lastValueFrom(this.http.delete<T>(`${this.apiUrl}/${endpoint}`)).then(result => {
        if (result === undefined) {
          throw new Error('داده‌ای از API دریافت نشد.');
        }
        return result;
      }),
      onError: (error: any) => this.handleError(error),
    }));
  }

  protected handleError(error: HttpErrorResponse): void {
    let errorMessage = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
    let errorDetail = error.error?.message || error.message || 'جزئیات خطا در دسترس نیست.';

    if (error.error && typeof error.error === 'object') {
      errorDetail = error.error.message || JSON.stringify(error.error.errors || error.error) || errorDetail;
    }

    if (error.status === 400) {
      errorMessage = 'درخواست نامعتبر است.';
      errorDetail = error.error?.errors?.join(', ') || 'لطفاً اطلاعات ورودی را بررسی کنید.';
    } else if (error.status === 404) {
      errorMessage = 'منبع یافت نشد.';
      errorDetail = 'منبع موردنظر در سرور وجود ندارد.';
    } else if (error.status === 500) {
      errorMessage = 'خطای سرور.';
      errorDetail = 'لطفاً بعداً دوباره تلاش کنید.';
    } else if (error.status === 0) {
      errorMessage = 'عدم اتصال به سرور.';
      errorDetail = 'لطفاً اتصال اینترنت خود را بررسی کنید.';
    }

    this.toastService.error(errorMessage, errorDetail);
    throw new Error(errorMessage);
  }
}