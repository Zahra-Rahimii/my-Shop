import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseService {
  private readonly categoriesEndpoint = 'categories';
  private readonly treeEndpoint = 'categories/tree';

  getCategories(): Observable<CategoryTreeNodeDTO[]> {
    return this.get<CategoryTreeNodeDTO[]>(this.treeEndpoint);
  }

  getCategory(id: number): Observable<Category> {
    return this.get<Category>(`${this.categoriesEndpoint}/${id}`);
  }

  addCategory(category: CategoryDTO): Observable<Category> {
    return this.post<Category>(this.categoriesEndpoint, category);
  }

  updateCategory(id: number, category: CategoryDTO): Observable<Category> {
    return this.put<Category>(`${this.categoriesEndpoint}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.delete<void>(`${this.categoriesEndpoint}/${id}`);
  }
}