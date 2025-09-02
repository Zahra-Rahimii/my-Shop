import { inject, Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../models/category.model';
import { QueryClient } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BaseService {
  private readonly categoriesEndpoint = 'categories';
  private readonly treeEndpoint = 'categories/tree';
  private readonly queryClient = inject(QueryClient);

  getCategories() {
    return this.getQuery<CategoryTreeNodeDTO[]>(this.treeEndpoint);
  }

  getCategory(id: number) {
    return this.getQuery<Category>(`${this.categoriesEndpoint}/${id}`);
  }

  addCategory(category: CategoryDTO) {
    return this.postMutation<Category>(this.categoriesEndpoint).mutateAsync(category).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.categoriesEndpoint] });
      this.queryClient.invalidateQueries({ queryKey: [this.treeEndpoint] });
      return result;
    });
  }

  updateCategory(id: number, category: CategoryDTO) {
    return this.putMutation<Category>(`${this.categoriesEndpoint}/${id}`).mutateAsync(category).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.categoriesEndpoint] });
      this.queryClient.invalidateQueries({ queryKey: [this.treeEndpoint] });
      return result;
    });
  }

  deleteCategory(id: number) {
    return this.deleteMutation<void>(`${this.categoriesEndpoint}/${id}`).mutateAsync().then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.categoriesEndpoint] });
      this.queryClient.invalidateQueries({ queryKey: [this.treeEndpoint] });
      return result;
    });
  }

  getCategoryChildren(parentId: number) {
    return this.getQuery<CategoryTreeNodeDTO[]>(`${this.categoriesEndpoint}/${parentId}/children`);
  }
}