import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TreeNode } from 'primeng/api';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './category-attributes.component.html',
  styleUrls: ['./category-attributes.component.css'],
})
export class CategoryAttributesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private queryClient = injectQueryClient();

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const nodeFromState = navigation?.extras.state?.['node'] || null;

    if (!nodeFromState) {
      const categoryId = this.route.snapshot.paramMap.get('id');
      if (!categoryId) {
        this.router.navigate(['/']);
      }
    }
  }

  // تابع برای دریافت تمام ویژگی‌های ارث‌بری‌شده
  private fetchAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return lastValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      lastValueFrom(this.attributeService.getCategoryAttributes(categoryId)).then(attrs => {
        const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
        return category.parentId ? this.fetchAllInheritedAttributes(category.parentId, merged) : merged;
      })
    );
  }

  // تعریف query با injectQuery
  query = injectQuery(() => {
    const categoryId = this.route.snapshot.paramMap.get('id');
    return {
      queryKey: ['category-attributes', categoryId],
      queryFn: () => this.fetchAllInheritedAttributes(Number(categoryId)),
      enabled: !!categoryId,
      staleTime: 5 * 60 * 1000, // 5 دقیقه کش
    };
  });

  // تبدیل داده‌ها به TreeNode
  get node(): TreeNode | null {
    const categoryId = this.route.snapshot.paramMap.get('id');
    if (!categoryId || this.query.isLoading() || this.query.isError() || !this.query.data()) {
      return null;
    }

    return {
      key: categoryId,
      label: 'دسته‌بندی', // می‌تونید از API نام واقعی بگیرید
      data: { id: Number(categoryId), description: '', attributes: this.query.data() },
      children: [],
      expanded: false,
    };
  }

  // متد برای بررسی وضعیت لودینگ
  get isLoading(): boolean {
    return this.query.isLoading();
  }

  // متد برای بررسی خطا
  get isError(): boolean {
    return this.query.isError();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}