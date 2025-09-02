import { Component, inject, OnInit, signal } from '@angular/core';
// import { ProductService } from '../../../../services/product.service';
import { ProductDTO } from '../../../models/product.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, CommonModule],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  // private productService = inject(ProductService);

  products = signal<ProductDTO[]>([]);

  expanded = signal<number | null>(null);

  productBeingEdited = signal<ProductDTO | null>(null);
  private router = inject(Router);
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);

  ////////HERE! GOOD GIRL
  //firstValueFrom() converts an Observable into a Promise that resolves with the first emitted value.
  // •	Angular HttpClient → Observable
	// •	TanStack Query queryFn → Promise
	// •	firstValueFrom() bridges the two.
  productsQuery = injectQuery(() => ({
    queryKey: ['products'],
    // queryFn: () => Promise.resolve(mockProducts),
    queryFn: () =>
      firstValueFrom(
        this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`)
      ),
    // this.http.get<ProductDTO[]>(`${environment.apiUrl}`),
    onSuccess: (data: ProductDTO[]) =>{
      console.log('Products fetched:', data),
       this.products.set(data) },
    onError: (err: any) => console.error('Error fetching products:', err),
  }));

  ngOnInit() {}

  loadProducts() {
    // this is for refetching the data
    this.queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  deleteMutation = injectMutation(() => ({
    mutationFn: (productId: number) => {
      return Promise.resolve(productId);
    },
    // mutationFn: (productId: number) =>
    // lastValueFrom(this.http.delete(`${environment.apiUrl}/products/${productId}`)),
    onSuccess: (deletedId) => {
      console.log('ooopsie you just deleted the Mock👹', deletedId);
    },
    onError: (err) => console.error(err),
  }));

  deleteProduct(id: number) {
    this.deleteMutation.mutate(id);
  }

  toggleExpanded(id: number) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  editProduct(product: ProductDTO) {
    this.router.navigate(['/add-product'], { queryParams: { id: product.id } });
  }
}
