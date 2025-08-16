import { AttributeType } from './attribute.model';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName?: string;
  attributeValues: ProductAttributeValue[];
}

export interface ProductDTO {
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  attributeValues: ProductAttributeValueDTO[];
}

export interface ProductAttributeValue {
  id: number;
  attributeId: number;
  attributeName: string;
  attributeType: AttributeType;
  value: string;
}

export interface ProductAttributeValueDTO {
  attributeId: number;
  value: string;
}
