import { Component, inject, signal } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TreeModule } from 'primeng/tree';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css'],
  providers: [MessageService]
})
export class TreeViewComponent {
  categories = signal<TreeNode[]>([]);
  expandedNodeIds = signal<Set<number>>(new Set()); 
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  constructor() {
    this.loadCategoriesQuery();
  }

  private loadCategoriesQuery() {
    injectQuery(() => ({
      queryKey: ['categories'],
      queryFn: () => firstValueFrom(this.categoryService.getCategories()),
      onSuccess: (cats: CategoryTreeNodeDTO[]) => {
        this.categories.set(this.mapCategoriesToTreeNodes(cats));
        this.messageService.clear();
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'دسته‌بندی‌ها با موفقیت لود شدند',
          life: 3000
        });
      },
      onError: () => {
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'لود دسته‌بندی‌ها انجام نشد',
          life: 3000
        });
      }
    }));
  }

  mapCategoriesToTreeNodes(categories: CategoryTreeNodeDTO[]): TreeNode[] {
    return categories.map(cat => ({
      key: cat.key,
      label: cat.label || 'بدون نام',
      data: { id: cat.data.id, description: cat.data.description || '', attributes: [] as CategoryAttributeDTO[] },
      children: cat.children ? this.mapCategoriesToTreeNodes(cat.children) : [],
      expanded: false
    }));
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    const expandedIds = new Set(this.expandedNodeIds());
    node.expanded ? expandedIds.add(node.data.id) : expandedIds.delete(node.data.id);
    this.expandedNodeIds.set(expandedIds);

    if (node.expanded && (!node.children || node.children.length === 0)) {
      this.loadNodeChildrenQuery(node);
    }
  }

  private loadNodeChildrenQuery(node: TreeNode) {
    injectQuery(() => ({
      queryKey: ['categoryChildren', node.data.id],
      queryFn: () => firstValueFrom(this.categoryService.getCategoryChildren(node.data.id)),
      onSuccess: (children: CategoryTreeNodeDTO[]) => {
        node.children = this.mapCategoriesToTreeNodes(children);
      },
      onError: () => {
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'لود زیرمجموعه انجام نشد',
          life: 3000
        });
      }
    }));
  }

  private loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return firstValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      firstValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
        const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
        if (category.parentId) return this.loadAllInheritedAttributes(category.parentId, merged);
        return merged;
      })
    );
  }

  showAttributesDialog(node: TreeNode) {
    if (!node.data?.id) return;

    injectQuery(() => ({
      queryKey: ['categoryAttributes', node.data.id],
      queryFn: () => this.loadAllInheritedAttributes(node.data.id),
      onSuccess: (attrs: CategoryAttributeDTO[]) => {
        node.data.attributes = attrs;
        this.router.navigate([`/category/${node.data.id}/attributes`], { state: { node } });
        this.messageService.clear();
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ویژگی‌ها با موفقیت لود شدند',
          life: 3000
        });
      },
      onError: () => {
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'لود ویژگی‌ها انجام نشد',
          life: 3000
        });
      }
    }));
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}


