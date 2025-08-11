import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryDTO } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://192.168.222.143:8080/api/categories';
  private treeApiUrl = 'http://192.168.222.143:8080/api/categories/tree';
  private http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.treeApiUrl); // استفاده از endpoint درختی
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  addCategory(category: CategoryDTO): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(id: number, category: CategoryDTO): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}





// import { inject, Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Category, CategoryDTO } from '../models/category.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class CategoryService {
//   private apiUrl = 'http://localhost:8080/api/categories';
//   private treeApiUrl = 'http://localhost:8080/api/categories/tree';
//   private http = inject(HttpClient);

//   getCategories(): Observable<Category[]> {
//     return this.http.get<Category[]>(this.treeApiUrl);
//   }

//   getCategory(id: number): Observable<Category> {
//     return this.http.get<Category>(`${this.apiUrl}/${id}`);  // بک‌تیک اضافه شد
//   }

//   addCategory(category: CategoryDTO): Observable<Category> {
//     return this.http.post<Category>(this.apiUrl, category);
//   }

//   updateCategory(id: number, category: CategoryDTO): Observable<Category> {
//     return this.http.put<Category>(`${this.apiUrl}/${id}`, category);  // بک‌تیک اضافه شد
//   }

//   deleteCategory(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/${id}`);  // بک‌تیک اضافه شد
//   }
// }