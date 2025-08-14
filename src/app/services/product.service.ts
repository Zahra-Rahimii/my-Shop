import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

import { Product, ProductDTO, ProductAttributeValue, ProductAttributeValueDTO } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseService {
  private readonly productsEndpoint = 'products';
  private readonly productAttributesEndpoint = 'product-attributes';

  getProducts(): Observable<Product[]> {
    return this.get<Product[]>(this.productsEndpoint);
  }

  addProduct(product: ProductDTO): Observable<Product> {
    return this.post<Product>(this.productsEndpoint, product);
  }

  addProductAttribute(productAttribute: ProductAttributeValueDTO): Observable<ProductAttributeValue> {
    return this.post<ProductAttributeValue>(this.productAttributesEndpoint, productAttribute);
  }

  getProductAttributes(productId: number): Observable<ProductAttributeValue[]> {
    return this.get<ProductAttributeValue[]>(`${this.productAttributesEndpoint}?productId=${productId}`);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.delete<void>(`${this.productsEndpoint}/${productId}`);
  }
}