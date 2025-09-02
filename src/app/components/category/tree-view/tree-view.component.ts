import { Component, signal, inject } from '@angular/core';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TreeModule } from 'primeng/tree';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO, Category } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule, ToastModule],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css'],
  providers: [ToastService],
})
export class TreeViewComponent {
  categories = signal<TreeNode[]>([]);
  isLoadingAttributes = signal(false);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private toastService = inject(ToastService);
  private router = inject(Router);

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

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded && !node.children?.length) {
      this.loadNodeMutation.mutate(node.data.id);
    }
  }

  showAttributesDialog(node: TreeNode) {
    if (this.isLoadingAttributes() || !node.data?.id) return;

    this.isLoadingAttributes.set(true);

    this.attributeService.loadAllInheritedAttributes(node.data.id).then(attrs => {
      node.data.attributes = attrs;
      this.router.navigate([`/category/${node.data.id}/attributes`], {
        state: { node },
      });
      this.isLoadingAttributes.set(false);
      this.toastService.success('موفق', 'ویژگی‌ها با موفقیت لود شدند');
    }).catch(error => {
      this.isLoadingAttributes.set(false);
      this.toastService.error('خطا در بارگذاری ویژگی‌ها', error.message || 'لود ویژگی‌ها انجام نشد');
    });
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

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}