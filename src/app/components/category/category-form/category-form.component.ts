import { Component, signal, input, output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';

import { Attribute, CategoryAttributeDTO, AttributeType } from '../../../models/attribute.model';
import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';

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
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
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

  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private queryClient = injectQueryClient();

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      parentId: [null],
      attributeName: ['', Validators.minLength(2)],
      attributeType: [null],
      required: [false],
    });
  }

  // Query برای لود دسته‌بندی‌ها
  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () => firstValueFrom(this.categoryService.getCategories()),
    onSuccess: (cats: CategoryTreeNodeDTO[]) => {
      const flatCategories = this.flattenCategories(cats);
      this.categories.set([
        { label: 'بدون والد', value: null },
        ...flatCategories.map(cat => ({ label: cat.name, value: cat.id })),
      ]);
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها لود شدند', life: 3000 });
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود دسته‌بندی‌ها انجام نشد', life: 3000 });
    },
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  }));

  // Query برای لود داده‌های فرم در حالت ویرایش
  categoryQuery = injectQuery(() => ({
    queryKey: ['category', this.categoryId()],
    queryFn: () => this.categoryId() ? firstValueFrom(this.categoryService.getCategory(this.categoryId()!)) : Promise.resolve(null),
    enabled: !!this.categoryId(),
    onSuccess: (category: Category | null) => {
      if (category) {
        this.categoryForm.patchValue({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
        });
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی لود شد', life: 3000 });
      } else {
        this.categoryForm.reset();
        this.categoryAttributes.set([]);
        this.messageService.add({ severity: 'info', summary: 'اطلاعات', detail: 'فرم برای ایجاد دسته جدید آماده شد', life: 3000 });
      }
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود دسته‌بندی انجام نشد', life: 3000 });
    },
  }));

  // Query برای لود ویژگی‌های ارث‌بری‌شده
  inheritedAttributesQuery = injectQuery(() => ({
    queryKey: ['inheritedAttributes', this.categoryForm.get('parentId')?.value],
    queryFn: () => this.loadAllInheritedAttributes(this.categoryForm.get('parentId')?.value || null),
    enabled: !!this.categoryForm.get('parentId')?.value,
    onSuccess: (attrs: CategoryAttributeDTO[]) => {
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های ارث‌بری‌شده لود شدند', life: 3000 });
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌های ارث‌بری‌شده انجام نشد', life: 3000 });
    },
  }));

  // Query برای لود ویژگی‌های دسته‌بندی
  categoryAttributesQuery = injectQuery(() => ({
    queryKey: ['categoryAttributes', this.categoryId()],
    queryFn: () => this.categoryId() ? firstValueFrom(this.attributeService.getCategoryAttributes(this.categoryId()!, true)) : Promise.resolve([]),
    enabled: !!this.categoryId(),
    onSuccess: (attrs: CategoryAttributeDTO[]) => {
      this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی لود شدند', life: 3000 });
    },
    onError: () => {
      this.categoryAttributes.set([]);
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'لود ویژگی‌ها انجام نشد', life: 3000 });
    },
  }));

  // Mutation برای اضافه کردن ویژگی
  addAttributeMutation = injectMutation(() => ({
    mutationFn: (attribute: Attribute) => firstValueFrom(this.attributeService.addAttribute(attribute)),
    onMutate: async (newAttribute) => {
      await this.queryClient.cancelQueries({ queryKey: ['categoryAttributes', this.categoryId()] });
      const previousAttrs = this.queryClient.getQueryData<CategoryAttributeDTO[]>(['categoryAttributes', this.categoryId()]) || [];
      const newCatAttr: CategoryAttributeDTO = {
        id: 0,
        categoryId: this.categoryId() || 0,
        attributeId: 0,
        attributeName: newAttribute.name,
        attributeType: newAttribute.type,
        required: this.categoryForm.get('required')?.value,
        categoryName: this.categoryForm.get('name')?.value || '',
        inherited: false,
      };
      this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
      return { previousAttrs };
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
      this.categoryAttributes.update(attrs => [...attrs.filter(a => a.attributeId !== 0), newCatAttr]);
      this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی اضافه شد', life: 3000 });
    },
    onError: (err, newAttr, context: { previousAttrs: CategoryAttributeDTO[] } | undefined) => {
      this.categoryAttributes.set(context?.previousAttrs || []);
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'اضافه کردن ویژگی انجام نشد', life: 3000 });
    },
  }));

  // Mutation برای حذف ویژگی
  deleteAttributeMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.attributeService.deleteCategoryAttribute(id)),
    onMutate: async (id) => {
      await this.queryClient.cancelQueries({ queryKey: ['categoryAttributes', this.categoryId()] });
      const previousAttrs = this.queryClient.getQueryData<CategoryAttributeDTO[]>(['categoryAttributes', this.categoryId()]) || [];
      this.categoryAttributes.update(attrs => attrs.filter(attr => attr.id !== id));
      return { previousAttrs };
    },
    onError: (err, id, context: { previousAttrs: CategoryAttributeDTO[] } | undefined) => {
      this.categoryAttributes.set(context?.previousAttrs || []);
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'حذف ویژگی انجام نشد', life: 3000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['categoryAttributes', this.categoryId()] });
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی حذف شد', life: 3000 });
    },
  }));

  // Mutation برای ثبت یا ویرایش دسته‌بندی
  saveCategoryMutation = injectMutation(() => ({
    mutationFn: (categoryDTO: CategoryDTO) => firstValueFrom(
      this.categoryId()
        ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
        : this.categoryService.addCategory(categoryDTO)
    ),
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
          return firstValueFrom(this.attributeService.addCategoryAttribute(categoryAttributeDTO));
        });

      Promise.all(attributeRequests).then(newCatAttrs => {
        this.categoryAttributes.update(attrs =>
          attrs.map(attr => {
            const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
            return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
          })
        );
        this.finalizeSubmission(category);
      }).catch(() => {
        this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'ثبت ویژگی‌ها انجام نشد', life: 3000 });
      });
    },
    onError: () => {
      this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'ثبت دسته‌بندی انجام نشد', life: 3000 });
    },
  }));

  private loadAllInheritedAttributes(categoryId: number | null, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    if (!categoryId) return Promise.resolve([]);
    return firstValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
      firstValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
        const merged = [...collected, ...attrs.map(a => ({ ...a, inherited: collected.length > 0 }))];
        return category.parentId ? this.loadAllInheritedAttributes(category.parentId, merged) : merged;
      })
    );
  }

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
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است', life: 3000 });
      return;
    }

    const existingAttribute = this.categoryAttributes().find(attr => attr.attributeName.toLowerCase() === attributeName.toLowerCase());
    if (existingAttribute) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی با این نام قبلاً اضافه شده است', life: 3000 });
      return;
    }

    const newAttribute: Attribute = {
      id: 0,
      name: attributeName,
      type: attributeType,
    };
    this.addAttributeMutation.mutate(newAttribute);
  }

  removeAttribute(index: number) {
    const attr = this.categoryAttributes()[index];
    if (attr.id) {
      this.deleteAttributeMutation.mutate(attr.id);
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی حذف شد', life: 3000 });
    }
  }

  onSubmit() {
    if (!this.categoryForm.get('name')?.valid) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام دسته اجباری است', life: 3000 });
      return;
    }

    if (this.categoryAttributes().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'حداقل یک ویژگی باید اضافه شود', life: 3000 });
      return;
    }

    const categoryDTO: CategoryDTO = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value || '',
      parentId: this.categoryForm.get('parentId')?.value || null,
    };

    this.saveCategoryMutation.mutate(categoryDTO);
  }

  private finalizeSubmission(category: Category) {
    this.categoryUpdated.emit();
    this.queryClient.invalidateQueries({ queryKey: ['categories'] });
    this.queryClient.invalidateQueries({ queryKey: ['categoryAttributes', this.categoryId()] });
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `دسته‌بندی "${category.name}" با موفقیت ${this.categoryId() ? 'ویرایش' : 'ایجاد'} شد`,
      life: 3000,
    });
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}
