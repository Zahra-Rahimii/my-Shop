import { Component, EventEmitter, Output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';

import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryTreeComponent {
  @Output() nodeSelected = new EventEmitter<number | null>();

  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private queryClient = injectQueryClient();

  categories = signal<TreeNode[]>([]);
  isLoadingAttributes = signal(false);
  loadingChildrenIds = signal<Set<number>>(new Set());

  // === Query برای دسته‌بندی‌ها ===
  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () => firstValueFrom(this.categoryService.getCategories()),
    onSuccess: (cats: CategoryTreeNodeDTO[]) => {
      this.categories.set(this.mapCategoriesToTreeNodes(cats));
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود دسته‌بندی‌ها انجام نشد' });
    }
  }));

  // === Mutation حذف دسته‌بندی ===
  deleteCategoryMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.categoryService.deleteCategory(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['categories'] });
      this.nodeSelected.emit(null);
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی حذف شد' });
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'حذف دسته‌بندی انجام نشد' });
    }
  }));

  // === تبدیل API response به TreeNode ===
  mapCategoriesToTreeNodes(categories: CategoryTreeNodeDTO[]): TreeNode[] {
    return categories
      .filter(cat => cat?.data?.id != null)
      .map(cat => ({
        key: cat.key,
        label: cat.label || 'بدون نام',
        data: {
          id: cat.data.id,
          description: cat.data.description || '',
          attributes: [] as CategoryAttributeDTO[]
        },
        children: cat.children ? this.mapCategoriesToTreeNodes(cat.children) : [],
        expanded: false
      }));
  }

  selectNode(event: any) {
    const id = event?.node?.data?.id ?? null;
    this.nodeSelected.emit(id ? Number(id) : null);
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded && !node.children?.length) {
      this.loadNodeChildren(node);
    }
  }

  private async loadNodeChildren(node: TreeNode) {
    this.loadingChildrenIds.update(s => s.add(node.data.id));
    try {
      const children = await firstValueFrom(this.categoryService.getCategoryChildren(node.data.id));
      node.children = this.mapCategoriesToTreeNodes(children);
    } catch {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود زیرمجموعه انجام نشد' });
    } finally {
      this.loadingChildrenIds.update(s => {
        s.delete(node.data.id);
        return s;
      });
    }
  }

  private async loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    const category = await firstValueFrom(this.categoryService.getCategory(categoryId));
    const attrs = await firstValueFrom(this.attributeService.getCategoryAttributes(categoryId, false));
    const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
    if (category.parentId) return this.loadAllInheritedAttributes(category.parentId, merged);
    return merged;
  }

  async showAttributesDialog(node: TreeNode) {
    if (this.isLoadingAttributes() || !node.data?.id) return;
    this.isLoadingAttributes.set(true);

    try {
      const attributes = await this.loadAllInheritedAttributes(node.data.id);
      node.data.attributes = attributes;
      this.router.navigate([`/category/${node.data.id}/attributes`], { state: { node } });
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌ها با موفقیت لود شدند' });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌ها انجام نشد' });
    } finally {
      this.isLoadingAttributes.set(false);
    }
  }

  deleteCategory(id: number) {
    this.deleteCategoryMutation.mutate(id);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}
