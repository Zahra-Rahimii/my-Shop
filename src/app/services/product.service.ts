import { Injectable, inject } from '@angular/core';
import { BaseService } from './base.service';
import { Product, ProductDTO, ProductAttributeValue, ProductAttributeValueDTO } from '../models/product.model';
import { CategoryAttributeDTO } from '../models/attribute.model';
import { AttributeService } from './attribute.service';
import { QueryClient } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseService {
  private readonly productsEndpoint = 'products';
  private readonly productAttributesEndpoint = 'product-attributes';
  private readonly attributeService = inject(AttributeService);
  private readonly queryClient = inject(QueryClient);

  getProducts() {
    return this.getQuery<Product[]>(this.productsEndpoint);
  }

  getProduct(id: number) {
    return this.getQuery<Product>(`${this.productsEndpoint}/${id}`);
  }

  addProduct(product: ProductDTO | FormData) {
    return this.postMutation<Product>(this.productsEndpoint).mutateAsync(product).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.productsEndpoint] });
      return result;
    });
  }

  updateProduct(id: number, product: ProductDTO | FormData) {
    return this.putMutation<Product>(`${this.productsEndpoint}/${id}`).mutateAsync(product).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.productsEndpoint] });
      return result;
    });
  }

  getProductAttributes(productId: number) {
    return this.getQuery<ProductAttributeValue[]>(`${this.productAttributesEndpoint}?productId=${productId}`);
  }

  addProductAttribute(productAttribute: ProductAttributeValueDTO) {
    return this.postMutation<ProductAttributeValue>(this.productAttributesEndpoint).mutateAsync(productAttribute).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.productAttributesEndpoint] });
      return result;
    });
  }

  getAvailableAttributesForProduct(categoryId: number) {
    return this.attributeService.getCategoryAttributes(categoryId);
  }

  deleteProduct(productId: number) {
    return this.deleteMutation<void>(`${this.productsEndpoint}/${productId}`).mutateAsync().then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.productsEndpoint] });
      return result;
    });
  }

  buyProduct(productId: number) {
    return this.patchMutation<void>(`${this.productsEndpoint}/${productId}`).mutateAsync({ stockChange: -1 }).then(result => {
      this.queryClient.invalidateQueries({ queryKey: [this.productsEndpoint] });
      return result;
    });
  }

  searchProducts(term: string) {
    const encodedTerm = encodeURIComponent(term);
    return this.getQuery<Product[]>(`${this.productsEndpoint}/search?term=${encodedTerm}`);
  }
}