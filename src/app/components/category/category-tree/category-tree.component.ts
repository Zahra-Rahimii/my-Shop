import { Component, EventEmitter, Output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO, Category } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';
import { QueryClient } from '@tanstack/query-core';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule, ToastModule],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class CategoryTreeComponent {
  categories = signal<TreeNode[]>([]);
  @Output() nodeSelected = new EventEmitter<number | null>();
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private queryClient = inject(QueryClient);

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await this.categoryService.getCategories().data() ?? [];
      return this.mapCategoriesToTreeNodes(cats);
    },
    onSuccess: (nodes: TreeNode[]) => {
      this.categories.set(nodes);
      this.toastService.success('موفق', 'دسته‌بندی‌ها با موفقیت لود شدند');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری دسته‌بندی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  deleteCategoryMutation = injectMutation(() => ({
    mutationFn: async (id: number) => {
      return this.categoryService.deleteCategory(id);
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['categories'] });
      this.nodeSelected.emit(null);
      this.toastService.success('موفق', 'دسته‌بندی با موفقیت حذف شد');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در حذف دسته‌بندی', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  loadNodeMutation = injectMutation(() => ({
    mutationFn: async (nodeId: number) => {
      return this.categoryService.getCategoryChildren(nodeId).data() ?? [];
    },
    onSuccess: (children: CategoryTreeNodeDTO[], nodeId: number) => {
      const node = this.findNodeById(this.categories(), nodeId);
      if (node) {
        node.children = this.mapCategoriesToTreeNodes(children);
      }
      this.categories.set([...this.categories()]);
      this.toastService.success('موفق', 'زیرمجموعه‌ها با موفقیت لود شدند');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری زیرمجموعه‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  mapCategoriesToTreeNodes(categories: CategoryTreeNodeDTO[]): TreeNode[] {
    return categories
      .filter(category => category && category.data && category.data.id != null)
      .map(category => ({
        key: category.key,
        label: category.label || 'بدون نام',
        data: {
          id: category.data.id,
          description: category.data.description || '',
          attributes: [] as CategoryAttributeDTO[],
        },
        children: category.children ? this.mapCategoriesToTreeNodes(category.children) : [],
        expanded: false,
      }));
  }

  selectNode(event: any) {
    if (event.node && event.node.data && event.node.data.id) {
      this.nodeSelected.emit(Number(event.node.data.id));
    } else {
      this.nodeSelected.emit(null);
    }
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded && !node.children?.length) {
      this.loadNodeMutation.mutate(node.data.id);
    }
  }

  showAttributesDialog(node: TreeNode) {
    if (!node.data?.id) return;

    this.attributeService.loadAllInheritedAttributes(node.data.id).then(attributes => {
      node.data.attributes = attributes;
      this.router.navigate([`/category/${node.data.id}/attributes`], {
        state: { node },
      });
      this.toastService.success('موفق', 'ویژگی‌ها با موفقیت لود شدند');
    }).catch(error => {
      this.toastService.error('خطا در بارگذاری ویژگی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    });
  }

  deleteCategory(id: number) {
    this.deleteCategoryMutation.mutate(id);
  }

  loadCategories() {
    this.categoriesQuery.refetch();
  }

  private findNodeById(nodes: TreeNode[], id: number): TreeNode | undefined {
    for (const node of nodes) {
      if (node.data.id === id) return node;
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}