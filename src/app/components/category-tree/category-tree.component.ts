import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent {
  categories = signal<TreeNode[]>([]);
  @Output() nodeSelected = new EventEmitter<number>();
  private categoryService = inject(CategoryService);

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(this.mapCategoriesToTreeNodes(cats));
      },
      error: (err) => {
        console.error('خطا در لود دسته‌بندی‌ها:', err);
        alert('خطایی در لود دسته‌بندی‌ها رخ داد.');
      }
    });
  }

  mapCategoriesToTreeNodes(categories: Category[]): TreeNode[] {
    return categories.map(category => ({
      key: category.id.toString(),
      label: category.name,
      data: { id: category.id, description: category.description },
      children: category.children ? this.mapCategoriesToTreeNodes(category.children) : []
    }));
  }

  selectNode(event: any) {
    this.nodeSelected.emit(Number(event.node.key));
  }

  deleteCategory(id: number) {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err) => {
        console.error('خطا در حذف دسته‌بندی:', err);
        alert('خطایی در حذف دسته‌بندی رخ داد.');
      }
    });
  }
}