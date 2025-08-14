import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

import { Attribute, CategoryAttribute, CategoryAttributeDTO } from '../models/attribute.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeService extends BaseService {
  private readonly attributesEndpoint = 'attributes';
  private readonly categoryAttributesEndpoint = 'category-attributes';

  getAttributes(): Observable<Attribute[]> {
    return this.get<Attribute[]>(this.attributesEndpoint);
  }

  getAttribute(id: number): Observable<Attribute> {
    return this.get<Attribute>(`${this.attributesEndpoint}/${id}`);
  }

  addAttribute(attribute: Attribute): Observable<Attribute> {
    return this.post<Attribute>(this.attributesEndpoint, attribute);
  }

  updateAttribute(id: number, attribute: Attribute): Observable<Attribute> {
    return this.put<Attribute>(`${this.attributesEndpoint}/${id}`, attribute);
  }

  deleteAttribute(id: number): Observable<void> {
    return this.delete<void>(`${this.attributesEndpoint}/${id}`);
  }

  addCategoryAttribute(categoryAttribute: CategoryAttributeDTO): Observable<CategoryAttribute> {
    return this.post<CategoryAttribute>(this.categoryAttributesEndpoint, categoryAttribute);
  }

  getCategoryAttributes(categoryId: number): Observable<CategoryAttribute[]> {
    return this.get<CategoryAttribute[]>(`${this.categoryAttributesEndpoint}/category/${categoryId}`);
  }

  deleteCategoryAttribute(id: number): Observable<void> {
    return this.delete<void>(`${this.categoryAttributesEndpoint}/${id}`);
  }
}