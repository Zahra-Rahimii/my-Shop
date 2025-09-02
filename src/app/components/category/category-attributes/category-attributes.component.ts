import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TreeNode } from 'primeng/api';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { ToastService } from '../../../services/toast.service';
import { CategoryAttributeDTO } from '../../../models/attribute.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, ToastModule],
  templateUrl: './category-attributes.component.html',
  styleUrls: ['./category-attributes.component.css'],
  providers: [ToastService],
})
export class CategoryAttributesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private toastService = inject(ToastService);
  node = signal<TreeNode | null>(null);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const nodeFromState = navigation?.extras.state?.['node'] || null;

    if (nodeFromState) {
      this.node.set(nodeFromState);
      this.toastService.success('موفق', 'ویژگی‌های دسته‌بندی با موفقیت لود شدند');
    } else {
      const categoryId = this.route.snapshot.paramMap.get('id');
      if (categoryId) {
        this.attributesQuery.refetch();
      } else {
        this.toastService.error('خطا', 'شناسه دسته‌بندی معتبر نیست.');
        this.router.navigate(['/']);
      }
    }
  }

  attributesQuery = injectQuery(() => ({
    queryKey: ['category-attributes', this.route.snapshot.paramMap.get('id')],
    queryFn: async () => {
      const categoryId = Number(this.route.snapshot.paramMap.get('id'));
      if (!categoryId) throw new Error('شناسه دسته‌بندی معتبر نیست.');
      const attrs = await this.attributeService.loadAllInheritedAttributes(categoryId);
      const category = await this.categoryService.getCategory(categoryId).data();
      const node: TreeNode = {
        key: categoryId.toString(),
        label: category?.name || 'دسته‌بندی',
        data: { id: categoryId, description: category?.description || '', attributes: attrs },
        children: [],
        expanded: false,
      };
      this.node.set(node);
      return attrs;
    },
    enabled: !!this.route.snapshot.paramMap.get('id'),
    onSuccess: () => {
      this.toastService.success('موفق', 'ویژگی‌های دسته‌بندی با موفقیت لود شدند');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری ویژگی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  goBack() {
    this.router.navigate(['/']);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}