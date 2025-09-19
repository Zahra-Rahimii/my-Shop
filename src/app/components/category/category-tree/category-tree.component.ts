import { Component, effect, signal, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule, Message],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTreeComponent {
  categories = signal<TreeNode[]>([]);
  nodeSelected = output<number | null>();
  editNode = output<TreeNode>();
  isLoadingAttributes = signal(false);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private queryClient = injectQueryClient();

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () => lastValueFrom(this.categoryService.getCategories()).then(cats => this.mapCategoriesToTreeNodes(cats)),
    staleTime: 5 * 60 * 1000,
    onSuccess: (data: TreeNode[]) => {
      this.categories.set(data);
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند', life: 3000 });
    },
    onError: () => {
      // خطاها توسط BaseService مدیریت می‌شوند
    },
  }));

  childrenQuery = injectQuery(() => ({
    queryKey: ['category-children'],
    queryFn: () => Promise.resolve([] as TreeNode[]),
    enabled: false,
  }));

  deleteCategoryMutation = injectMutation(() => ({
    mutationFn: (id: number) => lastValueFrom(this.categoryService.deleteCategory(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['categories'] });
      this.nodeSelected.emit(null);
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت حذف شد', life: 3000 });
    },
    onError: () => {
      // خطاها توسط BaseService مدیریت می‌شوند
    },
  }));

  constructor() {
    effect(() => {
      const data = this.categoriesQuery.data();
      if (data) {
        this.categories.set(data);
      }
    });
  }

  refreshCategories() {
    this.queryClient.invalidateQueries({ queryKey: ['categories'] });
  }

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
        leaf: !category.children?.length,
      }));
  }

  selectNode(event: any) {
    const id = event.node?.data?.id ? Number(event.node.data.id) : null;
    this.nodeSelected.emit(id);
  }

  editCategory(node: TreeNode) {
    if (!node.data?.id) return;
    this.editNode.emit(node);
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded && !node.children?.length) {
      this.loadNode({ node });
    }
  }

  loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return lastValueFrom(this.categoryService.getCategory(categoryId)).then(category => {
      const seenCategoryIds = new Set(collected.map(attr => attr.categoryId).filter(id => id !== undefined));
      if (seenCategoryIds.has(categoryId)) {
        return collected;
      }
      return lastValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
        const seenAttributeIds = new Set(collected.map(attr => attr.attributeId));
        const uniqueAttrs = attrs.filter(attr => !seenAttributeIds.has(attr.attributeId));
        uniqueAttrs.forEach(attr => seenAttributeIds.add(attr.attributeId));
        const merged = [...collected, ...uniqueAttrs.map(attr => ({ ...attr, inherited: collected.length > 0 }))];
        return category.parentId ? this.loadAllInheritedAttributes(category.parentId, merged) : merged;
      });
    });
  }

  showAttributesDialog(node: TreeNode) {
    if (this.isLoadingAttributes() || !node.data?.id) return;

    this.isLoadingAttributes.set(true);
    this.loadAllInheritedAttributes(node.data.id)
      .then(attributes => {
        node.data.attributes = attributes;
        this.router.navigate([`/category/${node.data.id}/attributes`], {
          state: { node },
        });
        this.isLoadingAttributes.set(false);
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌ها با موفقیت لود شدند', life: 3000 });
      })
      .catch(() => {
        this.isLoadingAttributes.set(false);
        this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌ها انجام نشد', life: 3000 });
      });
  }

  deleteCategory(id: number) {
    this.deleteCategoryMutation.mutate(id);
  }

  loadNode(event: any) {
    if (event.node && !event.node.children?.length) {
      this.queryClient.fetchQuery({
        queryKey: ['category-children', event.node.data.id],
        queryFn: () =>
          lastValueFrom(this.categoryService.getCategoryChildren(event.node.data.id)).then(children =>
            this.mapCategoriesToTreeNodes(children)
          ),
      }).then(children => {
        event.node.children = children;
        this.categories.update(cats => [...cats]);
      });
    }
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}