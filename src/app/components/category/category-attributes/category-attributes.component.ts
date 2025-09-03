import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TreeNode } from 'primeng/api';
import { first, firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';

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

  private categoryId = this.route.snapshot.paramMap.get('id');

  private loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    return firstValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      firstValueFrom(this.attributeService.getCategoryAttributes(categoryId,false)).then(attrs => {
        const merged = [
          ...collected,
          ...attrs.map(a => ({...a, inherited: collected.length > 0}))
        ];
        if (category.parentId) {
          return this.loadAllInheritedAttributes(category.parentId, merged);
        }
        return merged;
      })
    )
  }

attributesQuery = injectQuery(() => ({
  queryKey: ['categoryAttributes', this.categoryId],
  queryFn: () =>
    this.categoryId
      ? this.loadAllInheritedAttributes(+this.categoryId)
      : Promise.resolve([]),
  onSuccess: (attrs: CategoryAttributeDTO[]) => {
    if (!this.categoryId) return;
    const node: TreeNode = {
      key: this.categoryId?.toString(),
      label: 'دسته بندی',
      data: { id: +this.categoryId, description: '', attributes: attrs },
      children: [],
      expanded: false
    };
    this.node.set(node);
  },
  onError: () => this.router.navigate(['/'])
}));

  goBack() {
    this.router.navigate(['/']);
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }
}