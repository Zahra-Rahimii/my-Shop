import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseService } from './base.service';

import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseService {
  private readonly categoriesEndpoint = 'categories';
  private readonly treeEndpoint = 'categories/tree';

  /**
   * گرفتن درخت دسته‌بندی‌ها
   */
getCategories(): Observable<CategoryTreeNodeDTO[]> {
  const url = `${this.apiUrl}/${this.treeEndpoint}`;
  console.log('🌐 ارسال درخواست به:', url);
  
  return this.http.get<CategoryTreeNodeDTO[]>(url).pipe(
    tap(response => console.log('📨 پاسخ API:', response)),
    catchError(error => {
      console.error('🔥 خطای HTTP:', error);
      console.error('📊 وضعیت خطا:', error.status, error.message);
      return this.handleError(error);
    })
  );
}
  /**
   * گرفتن یک دسته‌بندی خاص
   */
  getCategory(id: number): Observable<Category> {
    return this.get<Category>(`${this.categoriesEndpoint}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * اضافه کردن دسته‌بندی جدید
   */
  addCategory(category: CategoryDTO): Observable<Category> {
    return this.post<Category>(this.categoriesEndpoint, category).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * بروزرسانی دسته‌بندی
   */
  updateCategory(id: number, category: CategoryDTO): Observable<Category> {
    return this.put<Category>(`${this.categoriesEndpoint}/${id}`, category).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * حذف دسته‌بندی
   */
  deleteCategory(id: number): Observable<void> {
    return this.delete<void>(`${this.categoriesEndpoint}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**شتیبانی از لود تدریجی p-tree */
  getCategoryChildren(parentId: number): Observable<CategoryTreeNodeDTO[]> {
    return this.get<CategoryTreeNodeDTO[]>(`${this.categoriesEndpoint}/${parentId}/children`).pipe(
      catchError(this.handleError)
    );
  }
}
