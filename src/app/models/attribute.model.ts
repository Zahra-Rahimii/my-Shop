export enum AttributeType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT'
}

export interface Attribute {
  id: number;
  name: string;
  type: AttributeType;
}

export interface CategoryAttribute {
  id?: number;
  categoryId?: number;
  attributeId: number;
  attributeName?: string;
  attributeType?: AttributeType;
  required: boolean;
}

export interface CategoryAttributeDTO {
  categoryId: number;
  attributeId: number;
  required: boolean;
}