import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { CategoryService } from '../../services/category.service';
import { AttributeService } from '../../services/attribute.service';
import { CategoryTreeNodeDTO } from '../../models/category.model';
import { CategoryAttributeDTO } from '../../models/attribute.model';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, DialogModule],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent {
  categories = signal<TreeNode[]>([]);
  @Output() nodeSelected = new EventEmitter<number | null>();
  showDialog = signal(false);
  selectedNode = signal<TreeNode | null>(null);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(this.mapCategoriesToTreeNodes(cats));
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
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
          attributes: [] as CategoryAttributeDTO[]
        },
        children: category.children ? this.mapCategoriesToTreeNodes(category.children) : []
      }));
  }

  selectNode(event: any) {
    if (event.node && event.node.data && event.node.data.id) {
      this.nodeSelected.emit(Number(event.node.data.id));
    } else {
      this.nodeSelected.emit(null);
    }
  }

  showAttributesDialog(node: TreeNode) {
    this.selectedNode.set(node);
    this.attributeService.getCategoryAttributes(node.data.id, true).subscribe({
      next: (attributes) => {
        console.log('Loaded attributes:', attributes); // لاگ برای دیباگ
        node.data.attributes = attributes;
        this.showDialog.set(true);
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌ها با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  deleteCategory(id: number) {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.loadCategories();
        this.nodeSelected.emit(null);
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت حذف شد' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }
}
