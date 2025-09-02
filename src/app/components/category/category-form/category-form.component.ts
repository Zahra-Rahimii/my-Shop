import { Component, signal, input, output, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { Attribute, CategoryAttributeDTO, AttributeType } from '../../../models/attribute.model';
import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { ToastService } from '../../../services/toast.service';
import { QueryClient } from '@tanstack/query-core';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TreeSelectModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
  providers: [ToastService],
})
export class CategoryFormComponent {
  categoryId = input<number | null>(null);
  categoryUpdated = output<void>();
  categoryForm: FormGroup;
  categories = signal<{ label: string; value: number | null }[]>([{ label: 'بدون والد', value: null }]);
  attributeTypes = signal([
    { label: 'رشته', value: AttributeType.STRING },
    { label: 'عدد', value: AttributeType.NUMBER },
    { label: 'بولی', value: AttributeType.BOOLEAN },
    { label: 'انتخابی', value: AttributeType.SELECT },
    { label: 'چند انتخابی', value: AttributeType.MULTISELECT },
  ]);
  categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  inheritedAttributes = signal<CategoryAttributeDTO[]>([]);
  editMode = signal(false);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private queryClient = inject(QueryClient);

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      attributeName: [''],
      attributeType: [null],
      required: [false],
    });

    this.categoryForm.get('parentId')?.valueChanges.subscribe(parentId => {
      this.inheritedAttributesQuery.refetch();
    });

    effect(() => {
      const result = this.categoriesQuery.data();
      if (this.categoriesQuery.isSuccess() && result) {
        this.categories.set(result);
      }
    });

    effect(() => {
      const result = this.categoryQuery.data();
      if (this.categoryQuery.isSuccess() && result) {
        this.editMode.set(true);
        this.categoryForm.patchValue({
          name: result.name,
          description: result.description || '',
          parentId: result.parentId || null,
        });
      }
    });

    effect(() => {
      const result = this.attributesQuery.data();
      if (this.attributesQuery.isSuccess() && result) {
        this.categoryAttributes.set(result);
      }
    });

    effect(() => {
      const result = this.inheritedAttributesQuery.data();
      if (this.inheritedAttributesQuery.isSuccess() && result) {
        this.inheritedAttributes.set(result);
      }
    });
  }

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await this.categoryService.getCategories().data() ?? [];
      const flatCategories = this.flattenCategories(cats);
      return [
        { label: 'بدون والد', value: null },
        ...flatCategories.map(cat => ({ label: cat.name, value: cat.id })),
      ];
    },
    onSuccess: () => {
      this.toastService.success('موفق', 'دسته‌بندی‌ها با موفقیت لود شدند');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری دسته‌بندی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  inheritedAttributesQuery = injectQuery(() => ({
    queryKey: ['inherited-attributes', this.categoryForm.get('parentId')?.value],
    queryFn: async () => {
      const parentId = this.categoryForm.get('parentId')?.value;
      if (!parentId) return [];
      return this.attributeService.loadAllInheritedAttributes(parentId);
    },
    enabled: !!this.categoryForm.get('parentId')?.value,
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری ویژگی‌ها', error.message || 'ویژگی‌های ارث‌بری‌شده بارگذاری نشدند.');
    },
  }));

  categoryQuery = injectQuery(() => ({
    queryKey: ['category', this.categoryId()],
    queryFn: async () => {
      if (!this.categoryId()) return null;
      return this.categoryService.getCategory(this.categoryId()!).data() ?? null;
    },
    enabled: !!this.categoryId(),
    onSuccess: () => {
      this.toastService.success('موفق', 'دسته‌بندی با موفقیت لود شد');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری دسته‌بندی', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  attributesQuery = injectQuery(() => ({
    queryKey: ['category-attributes', this.categoryId()],
    queryFn: async () => {
      if (!this.categoryId()) return [];
      const attrs = await this.attributeService.getCategoryAttributes(this.categoryId()!).data() ?? [];
      return attrs.filter((attr: CategoryAttributeDTO) => !attr.inherited);
    },
    enabled: !!this.categoryId(),
    onSuccess: () => {
      this.toastService.success('موفق', 'ویژگی‌های دسته‌بندی با موفقیت لود شدند');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در بارگذاری ویژگی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  addAttributeMutation = injectMutation(() => ({
    mutationFn: async (newAttribute: Attribute) => {
      return this.attributeService.addAttribute(newAttribute);
    },
    onSuccess: (addedAttribute: Attribute) => {
      const newCatAttr: CategoryAttributeDTO = {
        id: 0,
        categoryId: this.categoryId() || 0,
        attributeId: addedAttribute.id,
        attributeName: addedAttribute.name,
        attributeType: addedAttribute.type,
        required: this.categoryForm.get('required')?.value,
        categoryName: this.categoryForm.get('name')?.value || '',
        inherited: false,
      };
      this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
      this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
      this.toastService.success('موفق', 'ویژگی با موفقیت اضافه شد');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در افزودن ویژگی', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  deleteAttributeMutation = injectMutation(() => ({
    mutationFn: async (id: number) => {
      return this.attributeService.deleteCategoryAttribute(id);
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
      this.toastService.success('موفق', 'ویژگی با موفقیت حذف شد');
    },
    onError: (error: any) => {
      this.toastService.error('خطا در حذف ویژگی', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  addCategoryMutation = injectMutation(() => ({
    mutationFn: async (category: CategoryDTO) => {
      return this.editMode()
        ? this.categoryService.updateCategory(this.categoryId()!, category)
        : this.categoryService.addCategory(category);
    },
    onSuccess: (category: Category) => {
      const categoryId = category.id;
      const attributeRequests = this.categoryAttributes()
        .filter(attr => !attr.id)
        .map(attr => {
          const categoryAttributeDTO: CategoryAttributeDTO = {
            id: 0,
            categoryId,
            attributeId: attr.attributeId,
            attributeName: attr.attributeName,
            attributeType: attr.attributeType,
            required: attr.required,
            categoryName: category.name,
            inherited: false,
          };
          return this.attributeService.addCategoryAttribute(categoryAttributeDTO);
        });

      if (attributeRequests.length > 0) {
        Promise.all(attributeRequests)
          .then(newCatAttrs => {
            this.categoryAttributes.update(attrs =>
              attrs.map(attr => {
                const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
                return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
              })
            );
            this.finalizeSubmission(category);
          })
          .catch(error => {
            this.toastService.error('خطا در افزودن ویژگی‌ها', error.message || 'لطفاً دوباره تلاش کنید.');
          });
      } else {
        this.finalizeSubmission(category);
      }
    },
    onError: (error: any) => {
      this.toastService.error('خطا در ثبت دسته‌بندی', error.message || 'لطفاً دوباره تلاش کنید.');
    },
  }));

  private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
    const currentCategoryId = this.categoryId();
    const result: Category[] = [];

    for (const node of nodes) {
      if (!node.data || !node.data.id) continue;
      if (currentCategoryId && (node.data.id === currentCategoryId || this.isDescendant(node, currentCategoryId))) continue;
      const category: Category = {
        id: node.data.id,
        name: node.label || 'بدون نام',
        description: node.data.description || '',
        parentId: node.data.parentId || null,
        children: [],
      };
      result.push(category);
      if (node.children && node.children.length > 0) {
        result.push(...this.flattenCategories(node.children));
      }
    }

    return result;
  }

  private isDescendant(node: CategoryTreeNodeDTO, categoryId: number): boolean {
    if (node.data.id === categoryId) return true;
    return (node.children || []).some(child => this.isDescendant(child, categoryId));
  }

  addAttribute() {
    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;

    if (!attributeName || !attributeType) {
      this.toastService.warn('هشدار', 'نام و نوع ویژگی اجباری است');
      return;
    }

    const existingAttribute = this.categoryAttributes().find(
      attr => attr.attributeName.toLowerCase() === attributeName.toLowerCase()
    );
    if (existingAttribute) {
      this.toastService.warn('هشدار', 'ویژگی با این نام قبلاً اضافه شده است');
      return;
    }

    this.addAttributeMutation.mutate({ id: 0, name: attributeName, type: attributeType });
  }

  removeAttribute(index: number) {
    const attr = this.categoryAttributes()[index];
    if (attr.id) {
      this.deleteAttributeMutation.mutate(attr.id);
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.toastService.success('موفق', 'ویژگی با موفقیت حذف شد');
    }
  }

  onSubmit() {
    if (!this.categoryForm.get('name')?.valid) {
      this.toastService.warn('هشدار', 'نام دسته اجباری است');
      return;
    }

    if (this.categoryAttributes().length === 0) {
      this.toastService.warn('هشدار', 'حداقل یک ویژگی باید اضافه شود');
      return;
    }

    const categoryDTO: CategoryDTO = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value || '',
      parentId: this.categoryForm.get('parentId')?.value || null,
    };

    this.addCategoryMutation.mutate(categoryDTO);
  }

  private finalizeSubmission(category: Category) {
    this.categoryUpdated.emit();
    this.queryClient.invalidateQueries({ queryKey: ['categories'] });
    this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.inheritedAttributes.set([]);
    this.editMode.set(false);
    this.toastService.success(
      'موفق',
      `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`
    );
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}