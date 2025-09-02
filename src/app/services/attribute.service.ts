import { Injectable, inject } from '@angular/core';
import { BaseService } from './base.service';
import { Attribute, CategoryAttributeDTO } from '../models/attribute.model';
import { CategoryService } from './category.service';
import { QueryClient } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root',
})
export class AttributeService extends BaseService {
  private readonly attributesEndpoint = 'attributes';
  private readonly categoryAttributesEndpoint = 'category-attributes';
  private readonly categoryService = inject(CategoryService);
  private readonly queryClient = inject(QueryClient);

  getAttributes() {
    return this.getQuery<Attribute[]>(this.attributesEndpoint);
  }

  addAttribute(attribute: Attribute) {
    return this.postMutation<Attribute>(this.attributesEndpoint).mutateAsync(attribute).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.attributesEndpoint] });
      return result;
    });
  }

  getCategoryAttributes(categoryId: number) {
    return this.getQuery<CategoryAttributeDTO[]>(`${this.categoryAttributesEndpoint}/category/${categoryId}`);
  }

  addCategoryAttribute(categoryAttribute: CategoryAttributeDTO) {
    return this.postMutation<CategoryAttributeDTO>(this.categoryAttributesEndpoint).mutateAsync(categoryAttribute).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.categoryAttributesEndpoint] });
      return result;
    });
  }

  deleteCategoryAttribute(id: number) {
    return this.deleteMutation<void>(`${this.categoryAttributesEndpoint}/${id}`).mutateAsync().then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.categoryAttributesEndpoint] });
      return result;
    });
  }

  async loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    const categoryQuery = this.categoryService.getCategory(categoryId);
    const attrsQuery = this.getCategoryAttributes(categoryId);

    if (!categoryQuery.isSuccess() || !attrsQuery.isSuccess()) {
      throw new Error('خطا در دریافت دسته‌بندی یا ویژگی‌ها');
    }

    const category = categoryQuery.data();
    const attrs = attrsQuery.data();
    const merged = [...collected, ...attrs.map((attr: CategoryAttributeDTO) => ({ ...attr, inherited: collected.length > 0 }))];

    if (category.parentId) {
      return this.loadAllInheritedAttributes(category.parentId, merged);
    }
    return merged;
  }
}