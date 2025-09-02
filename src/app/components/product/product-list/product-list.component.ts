import { Component, signal, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { ProductDTO } from '../../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, CommonModule, ProgressSpinnerModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private queryClient = injectQueryClient();

  products = signal<ProductDTO[]>([]);
  expanded = signal<number | null>(null);
  productBeingEdited = signal<ProductDTO | null>(null);

  productsQuery = injectQuery(() => ({
    queryKey: ['products'],
    queryFn: () => this.productService.getProducts(),
    onSuccess: (data: ProductDTO[]) => {
      this.products.set(data);
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'محصولات با موفقیت لود شدند',
        life: 3000
      });
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message,
        life: 3000
      });
    }
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: (productId: number) => this.productService.deleteProduct(productId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['products'] });
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'محصول با موفقیت حذف شد',
        life: 3000
      });
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message,
        life: 3000
      });
    }
  }));

  deleteProduct(id: number) {
    this.deleteMutation.mutate(id);
  }

  toggleExpanded(id: number) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  editProduct(product: ProductDTO) {
    this.productBeingEdited.set(product);
    this.router.navigate(['/add-product'], { queryParams: { id: product.id } });
  }
}