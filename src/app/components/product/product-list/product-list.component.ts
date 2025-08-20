// import { Component, signal, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { MessageService } from 'primeng/api';
// import { ProductService } from '../../../services/product.service';
// import { Product } from '../../../models/product.model';
// import { TreeSelectModule } from 'primeng/treeselect';

// @Component({
//   selector: 'app-product-list',
//   standalone: true,
//   imports: [CommonModule, CardModule, ButtonModule, TagModule, TreeSelectModule],
//   templateUrl: './product-list.component.html',
//   styleUrls: ['./product-list.component.css'],
// })
// export class ProductListComponent implements OnInit {
//   listings = signal<Product[]>([]);
//   private productService = inject(ProductService);
//   private messageService = inject(MessageService);

//   ngOnInit() {
//     this.loadProducts();
//   }

//   loadProducts() {
//     this.productService.getProducts().subscribe({
//       next: (products) => {
//         this.listings.set(products);
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'محصولات با موفقیت لود شدند', life: 3000 });
//       },
//       error: () => {
//         // خطا توسط BaseService مدیریت می‌شود
//       },
//     });
//   }

//   deleteProduct(productId: number, index: number) {
//     this.productService.deleteProduct(productId).subscribe({
//       next: () => {
//         this.listings.update((listings) => listings.filter((_, i) => i !== index));
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'محصول با موفقیت حذف شد', life: 3000 });
//       },
//       error: () => {
//         // خطا توسط BaseService مدیریت می‌شود
//       },
//     });
//   }
// }


import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { ProductDTO } from '../../../models/product.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, CommonModule],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  // Products signal
  products = signal<ProductDTO[]>([]);

  // Expanded row
  expanded = signal<number | null>(null);

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error(err)
    });
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id).subscribe({
      next: () => this.products.update(list => list.filter(p => p.id !== id)),
      error: (err) => console.error(err)
    });
  }

  toggleExpanded(id: number) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  editProduct(product: ProductDTO) {
    // this.productForm.patchValue({
    //   title: product.title,
    //   description: product.description,
    //   price: product.price,
    //   stock: product.stock,
    //   condition: product.condition,
    //   categoryId: product.categoryId
    // });
}
}