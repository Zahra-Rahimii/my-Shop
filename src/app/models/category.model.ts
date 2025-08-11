export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null; // اضافه کردن null
  children?: Category[];
}

export interface CategoryDTO {
  name: string;
  description?: string;
  parentId?: number | null; // اضافه کردن null
}

export interface CategoryTreeNodeDTO {
  key: string;
  label: string;
  data: { id: number; description: string };
  children: CategoryTreeNodeDTO[];
}