import { Component, effect, signal, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, ProgressSpinnerModule, MessageModule],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css'],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent {
  categories = signal<TreeNode[]>([]);
  nodeSelected = output<number | null>();
  isLoadingAttributes = signal(false);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private queryClient = injectQueryClient();

  categoriesQuery = injectQuery<TreeNode[], Error>(() => ({
    queryKey: ['categories'],
    queryFn: () => lastValueFrom(this.categoryService.getCategories()).then(cats => this.mapCategoriesToTreeNodes(cats)),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    onSuccess: (data: TreeNode[]) => {
      this.categories.set(data);
      this.messageService.clear();
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند', life: 3000 });
    },
    onError: () => {
      this.messageService.clear();
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود دسته‌بندی‌ها انجام نشد', life: 3000 });
    },
  }));

  childrenQuery = injectQuery<TreeNode[], Error>(() => ({
    queryKey: ['category-children'],
    queryFn: () => Promise.resolve([] as TreeNode[]),
    enabled: false,
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

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    if (node.expanded && !node.children?.length) {
      this.loadNode({ node });
    }
  }

  loadNode(event: any) {
    if (event.node && !event.node.children?.length) {
      this.queryClient.fetchQuery({
        queryKey: ['category-children', event.node.data.id],
        queryFn: () => lastValueFrom(this.categoryService.getCategoryChildren(event.node.data.id)).then(children =>
          this.mapCategoriesToTreeNodes(children)
        ),
      }).then(children => {
        event.node.children = children;
        this.categories.update(cats => [...cats]);
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'زیرمجموعه‌ها با موفقیت لود شدند', life: 3000 });
      }).catch(() => {
        this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود زیرمجموعه انجام نشد', life: 3000 });
      });
    }
  }

  private loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return lastValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      lastValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
        const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
        return category.parentId ? this.loadAllInheritedAttributes(category.parentId, merged) : merged;
      })
    );
  }

  showAttributesDialog(node: TreeNode) {
    if (this.isLoadingAttributes() || !node.data?.id) return;

    this.isLoadingAttributes.set(true);
    this.loadAllInheritedAttributes(node.data.id)
      .then(attrs => {
        node.data.attributes = attrs;
        this.router.navigate([`/category/${node.data.id}/attributes`], {
          state: { node },
        });
        this.isLoadingAttributes.set(false);
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌ها با موفقیت لود شدند', life: 3000 });
      })
      .catch(() => {
        this.isLoadingAttributes.set(false);
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌ها انجام نشد', life: 3000 });
      });
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}