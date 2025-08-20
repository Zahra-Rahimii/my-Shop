import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TreeNode } from 'primeng/api';

import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './category-attributes.component.html',
  styleUrls: ['./category-attributes.component.css']
})
export class CategoryAttributesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  node = signal<TreeNode | null>(null);
  isLoading = signal(false);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const nodeFromState = navigation?.extras.state?.['node'] || null;
    
    if (nodeFromState) {
      this.node.set(nodeFromState);
    } else {
      const categoryId = this.route.snapshot.paramMap.get('id');
      if (categoryId) {
        this.loadAttributes(+categoryId);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  private loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return new Promise((resolve, reject) => {
      this.categoryService.getCategory(categoryId).subscribe({
        next: category => {
          this.attributeService.getCategoryAttributes(categoryId, false).subscribe({
            next: attrs => {
              const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
              if (category.parentId) this.loadAllInheritedAttributes(category.parentId, merged).then(resolve).catch(reject);
              else resolve(merged);
            },
            error: reject
          });
        },
        error: reject
      });
    });
  }

  private loadAttributes(categoryId: number) {
    this.isLoading.set(true);
    this.loadAllInheritedAttributes(categoryId)
      .then(attrs => {
        const node: TreeNode = {
          key: categoryId.toString(),
          label: 'دسته‌بندی', // می‌توانید نام واقعی را از API بگیرید
          data: { id: categoryId, description: '', attributes: attrs },
          children: [],
          expanded: false
        };
        this.node.set(node);
        this.isLoading.set(false);
      })
      .catch(() => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}