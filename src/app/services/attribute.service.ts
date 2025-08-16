// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';

// import { BaseService } from './base.service';
// import { Attribute, CategoryAttribute, CategoryAttributeDTO } from '../models/attribute.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class AttributeService extends BaseService {
//   private readonly attributesEndpoint = 'attributes';
//   private readonly categoryAttributesEndpoint = 'category-attributes';

//   getAttributes(): Observable<Attribute[]> {
//     return this.get<Attribute[]>(this.attributesEndpoint);
//   }

//   getAttribute(id: number): Observable<Attribute> {
//     return this.get<Attribute>(`${this.attributesEndpoint}/${id}`);
//   }

//   addAttribute(attribute: Attribute): Observable<Attribute> {
//     return this.post<Attribute>(this.attributesEndpoint, attribute);
//   }

//   updateAttribute(id: number, attribute: Attribute): Observable<Attribute> {
//     return this.put<Attribute>(`${this.attributesEndpoint}/${id}`, attribute);
//   }

//   deleteAttribute(id: number): Observable<void> {
//     return this.delete<void>(`${this.attributesEndpoint}/${id}`);
//   }

//   addCategoryAttribute(categoryAttribute: CategoryAttributeDTO): Observable<CategoryAttribute> {
//     return this.post<CategoryAttribute>(this.categoryAttributesEndpoint, categoryAttribute);
//   }

//   getCategoryAttributes(categoryId: number): Observable<CategoryAttribute[]> {
//     return this.get<CategoryAttribute[]>(`${this.categoryAttributesEndpoint}/category/${categoryId}`);
//   }

//   deleteCategoryAttribute(id: number): Observable<void> {
//     return this.delete<void>(`${this.categoryAttributesEndpoint}/${id}`);
//   }
// }


// import { Injectable, inject } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { catchError, tap } from 'rxjs/operators';

// import { BaseService } from './base.service';
// import { CategoryAttributeDTO, Attribute } from '../models/attribute.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class AttributeService extends BaseService {
//   private readonly attributesEndpoint = 'attributes';
//   private readonly categoryAttributesEndpoint = 'category-attributes';
//   private attributeCache = new Map<number, CategoryAttributeDTO[]>();

//   /**
//    * گرفتن همه ویژگی‌های مستقل
//    */
//   getAttributes(): Observable<Attribute[]> {
//     return this.get<Attribute[]>(this.attributesEndpoint).pipe(
//       catchError(this.handleError)
//     );
//   }

//   addAttribute(attribute: Attribute): Observable<Attribute> {
//     return this.post<Attribute>(this.attributesEndpoint, attribute).pipe(
//       catchError(this.handleError)
//     );
//   }
//   /**
//    * 
//    * 
//    * گرفتن ویژگی‌های یک دسته‌بندی (شامل ارث‌بری‌شده‌ها)
//    */
//   getCategoryAttributes(categoryId: number): Observable<CategoryAttributeDTO[]> {
//     if (this.attributeCache.has(categoryId)) {
//       return of(this.attributeCache.get(categoryId)!);
//     }
//     return this.get<CategoryAttributeDTO[]>(`${this.categoryAttributesEndpoint}/category/${categoryId}`).pipe(
//       tap(attributes => this.attributeCache.set(categoryId, attributes)),
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * اضافه کردن ویژگی به دسته‌بندی
//    */
//   addCategoryAttribute(categoryAttribute: CategoryAttributeDTO): Observable<CategoryAttributeDTO> {
//     return this.post<CategoryAttributeDTO>(this.categoryAttributesEndpoint, categoryAttribute).pipe(
//       tap(() => this.attributeCache.clear()), // پاک کردن کش برای آپدیت
//       catchError(this.handleError)
//     );
//   }

//   /**
//    * حذف ویژگی از دسته‌بندی
//    */
//   deleteCategoryAttribute(id: number): Observable<void> {
//     return this.delete<void>(`${this.categoryAttributesEndpoint}/${id}`).pipe(
//       tap(() => this.attributeCache.clear()), // پاک کردن کش برای آپدیت
//       catchError(this.handleError)
//     );
//   }
// }




import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Attribute, CategoryAttributeDTO, AttributeType } from '../models/attribute.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeService extends BaseService {
  private readonly attributesEndpoint = 'attributes';
  private readonly categoryAttributesEndpoint = 'category-attributes';
  private attributeCache = new Map<number, CategoryAttributeDTO[]>();

  getAttributes(): Observable<Attribute[]> {
    return this.get<Attribute[]>(this.attributesEndpoint).pipe(
      catchError(this.handleError)
    );
  }

  addAttribute(attribute: Attribute): Observable<Attribute> {
    return this.post<Attribute>(this.attributesEndpoint, attribute).pipe(
      catchError(this.handleError)
    );
  }

  getCategoryAttributes(categoryId: number, forceRefresh = false): Observable<CategoryAttributeDTO[]> {
    if (forceRefresh || !this.attributeCache.has(categoryId)) {
      return this.get<CategoryAttributeDTO[]>(`${this.categoryAttributesEndpoint}/category/${categoryId}`).pipe(
        tap(attributes => this.attributeCache.set(categoryId, attributes)),
        catchError(this.handleError)
      );
    }
    return of(this.attributeCache.get(categoryId)!);
  }

  addCategoryAttribute(categoryAttribute: CategoryAttributeDTO): Observable<CategoryAttributeDTO> {
    return this.post<CategoryAttributeDTO>(this.categoryAttributesEndpoint, categoryAttribute).pipe(
      tap(() => this.attributeCache.clear()),
      catchError(this.handleError)
    );
  }

  deleteCategoryAttribute(id: number): Observable<void> {
    return this.delete<void>(`${this.categoryAttributesEndpoint}/${id}`).pipe(
      tap(() => this.attributeCache.clear()),
      catchError(this.handleError)
    );
  }
}
