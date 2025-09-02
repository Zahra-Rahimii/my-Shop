import { Component, OnInit, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductDTO } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CarouselModule } from 'primeng/carousel';


@Component({
  selector: 'app-home',
  imports: [CommonModule, InputTextModule, ButtonModule, CardModule, CarouselModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private producservice = inject(ProductService);

  products = signal<ProductDTO[]>([]);

  productsQuery = injectQuery(() => ({
    queryKey: ['products'],
    queryFn: async () => {
      const products = await firstValueFrom(
        this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`)
      );
      return products.map(product => ({
        ...product,
        media: product.media ?? [], 
      }));
    },
    onError: (err: any) => console.error('Error fetching products:', err),
  }));

   // fill this one later!
   buyProductMutation = injectMutation(() => ({
    mutationFn: (productId: number) => {
      const product = this.productsQuery.data()?.find(p => p.id === productId);
      if (!product) return Promise.reject('Product not found');
  
      const updatedProduct = { ...product, stock: product.stock };
      // const updatedProduct = { ...product, stock: product.stock - 1 };

      // PATCH request to update the product
      return this.http.patch(`${environment.apiUrl}/products/${productId}`, updatedProduct).toPromise();
    },
    onSuccess: (_data, productId) => {
      console.log('Purchase successful for product:', productId);
      this.productsQuery.refetch(); // refresh the list
    },
    onError: (err) => console.error('Error buying product:', err)
  }));
    
  
  buyProduct(productId: number) {
    this.buyProductMutation.mutate(productId);
  }

  constructor(){
    effect(()=>{
      console.log(this.productsQuery.data())
    })
  }
 
  ngOnInit(): void {
    this.productsQuery.refetch();
  }

  
  isVideo(url: string | undefined): boolean {
    if (!url) return false;
    return (
      url.startsWith('data:video') ||
      url.toLowerCase().endsWith('.mp4') ||
      url.toLowerCase().endsWith('.webm') ||
      url.toLowerCase().endsWith('.ogg')
    );
  }
}