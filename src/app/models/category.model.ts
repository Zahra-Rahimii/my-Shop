import { AttributeType, CategoryAttributeDTO } from "./attribute.model";

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null;
  children?: Category[];
}

export interface CategoryDTO {
  name: string;
  description?: string;
  parentId?: number | null;
}

// export interface CategoryTreeNodeDTO {
//   key: string;
//   label: string;
//   data: { id: number; description: string };
//   children: CategoryTreeNodeDTO[];
// }

export interface CategoryTreeNodeDTO {
  key: string;
  label: string;
  data: { id: number; description: string; parentId: number | null };
  children?: CategoryTreeNodeDTO[];
  attributes?: CategoryAttributeDTO[]; // هماهنگ با بک‌اند
}

/*چیکار میکنه؟؟؟؟*/
export interface CategoryAttribute {
  attributeId: number;
  name: string;
  attributeType: AttributeType;
  required: boolean;
}