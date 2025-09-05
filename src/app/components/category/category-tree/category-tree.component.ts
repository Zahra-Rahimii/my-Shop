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


  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () => firstValueFrom(this.categoryService.getCategories()),
    onSuccess: (cats: CategoryTreeNodeDTO[]) => {
      this.categories.set(this.mapCategoriesToTreeNodes(cats));
    }
  }));

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

  mapCategoriesToTreeNodes(categories: CategoryTreeNodeDTO[]): TreeNode[] {
    return categories
      .filter(category => category && category.data && category.data.id != null)
      .map(category => ({
        key: category.key,
        label: category.label || 'بدون نام',
        data: {
          id: category.data.id,
          description: category.data.description || '',
          attributes: [] as CategoryAttributeDTO[]
        },
        children: category.children ? this.mapCategoriesToTreeNodes(category.children) : [],
        expanded: false
      }));
  }

  selectNode(event: any) {
    if (event.node?.data?.id) {
      this.nodeSelected.emit(Number(event.node.data.id));
    } else {
      this.nodeSelected.emit(null);
    }
  }

toggleNode(node: TreeNode) {
  node.expanded = !node.expanded;
  if (node.expanded && !node.children?.length) {
    this.loadingChildrenIds.update(set => set.add(node.data.id));
    this.loadNodeChildren(node).finally(() => {
      this.loadingChildrenIds.update(set => {
        set.delete(node.data.id);
        return set;
      });
    });
  }
}


private loadNodeChildren(node: TreeNode): Promise<void> {
  const nodeChildrenQuery = injectQuery(() => ({
    queryKey: ['categoryChildren', node.data.id],
    queryFn: () => firstValueFrom(this.categoryService.getCategoryChildren(node.data.id)),
    enabled: false
  }));

  return nodeChildrenQuery.refetch().then(result => {
    if (result.data) {
      node.children = this.mapCategoriesToTreeNodes(result.data);
    }
  }).catch(() => {
    this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود زیرمجموعه انجام نشد' });
  });
}


  private loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return firstValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      firstValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
        const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
        if (category.parentId) {
          return this.loadAllInheritedAttributes(category.parentId, merged);
        }
        return merged;
      })
    );
  }

  showAttributesDialog(node: TreeNode) {
    if (this.isLoadingAttributes() || !node.data?.id) return;
    this.isLoadingAttributes.set(true);

const nodeAttributesQuery = injectQuery(() => ({
  queryKey: ['categoryAttributes', node.data.id],
  queryFn: () => this.loadAllInheritedAttributes(node.data.id),
  enabled: false
}));

nodeAttributesQuery.refetch()
  .then(result => {
    if (result.data) {
      node.data.attributes = result.data;
      this.router.navigate([`/category/${node.data.id}/attributes`], { state: { node } });
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌ها با موفقیت لود شدند' });
    }
  })
  .catch(() => {
    this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌ها انجام نشد' });
  })
  .finally(() => {
    this.isLoadingAttributes.set(false);
  });

  }

  deleteCategory(id: number) {
    this.deleteCategoryMutation.mutate(id);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}
