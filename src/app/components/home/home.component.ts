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


@Component({
  selector: 'app-home',
  imports: [CommonModule, InputTextModule, ButtonModule, CardModule],
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
    queryFn: () => firstValueFrom(this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`)),
    onError: (err: any) => console.error('Error fetching products:', err),
  }));

   // fill this one later!
   buyProductMutation = injectMutation(() => ({
    mutationFn: (productId: number) => {
      const product = this.productsQuery.data()?.find(p => p.id === productId);
      if (!product) return Promise.reject('Product not found');
  
      const updatedProduct = { ...product, stock: product.stock - 1 };
  
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

}
// 🤓
//   // private productService = inject(ProductService);
//   private http = inject(HttpClient);
//   // private router= Router

//   // productDetails: Product[] = [];
//   // allProducts: Product[] = [];
//   // searchKeyword: string = '';
//   // showLoadButton: boolean = true;
//   // page: number = 1;

//   // Products signal
//   products = signal<ProductDTO[]>([]);
//   // navigateTo(route: string) {
//   //   this.router.navigate([route]);
//   // }


//   productsQuery = injectQuery(() => ({
//     queryKey: ['products'],
//     queryFn: () =>
//       firstValueFrom(
//         this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`)
//       ),
//     onSuccess: (data: ProductDTO[]) => {
//       console.log('Products fetched from local JSON:', data);
//       this.products.set(data);
//     },
//     onError: (err: any) => console.error('Error fetching products:', err),
//   }));


// buyingProduct(productId: number) {
//   this.productService.buyProduct(productId).subscribe({
//     next: (res) => {
//       console.log('Purchase successful:', res);
//       //this is foooooor refresh products after buying
//       this.productService.getProducts().subscribe({
//         next: (data) => this.products.set(data),
//         error: (err) => console.error('Error fetching products:', err)
//       });
//     },
//     error: (err) => console.error('Error buying product:', err)
//   });
// }

//--------------------------------------------------------------------------------------------------------
//Method to filter products based on the search keyword
// searchByKeyword(keyword: string) {
//   this.searchKeyword = keyword;

//   if (this.searchKeyword.trim()) {
//     this.productDetails = this.allProducts.filter((product) =>
//       product.title.toLowerCase().includes(this.searchKeyword.toLowerCase())
//     );
//   } else {
//     this.productDetails = [...this.allProducts];
//   }
// }

// Handle showing the product details
// showProductDetails(productId: number) {
//   console.log('Product ID:', productId);
// }

// Load more products when button is clicked
//   loadMoreProduct() {
//     console.log('Load more products...');
//     this.page += 1;
//     this.productService.getProducts().subscribe({
//       next: (data: any) => {
//         this.productDetails = [...this.productDetails, ...data];
//       },
//       error: (error: any) => {
//         console.error('Error loading more products', error);
//       },
//     });
//   }