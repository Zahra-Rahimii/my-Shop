
import { Component, signal, input, output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { take, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

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
    DropdownModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
})
export class CategoryFormComponent implements OnInit, OnChanges {
  categoryId = input<number | null>(null);
  categoryUpdated = output<void>();
  categoryForm: FormGroup;
  categories = signal<{ label: string; value: number | null }[]>([{ label: 'بدون والد', value: null }]);
  attributeTypes = signal([
    { label: 'رشته', value: AttributeType.STRING },
    { label: 'عدد', value: AttributeType.NUMBER },
    { label: 'بولی', value: AttributeType.BOOLEAN },
    { label: 'انتخابی', value: AttributeType.SELECT },
    { label: 'چند انتخابی', value: AttributeType.MULTISELECT }
  ]);
  categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  inheritedAttributes = signal<CategoryAttributeDTO[]>([]);
  isLoadingAttributes = signal(false);
  editMode = signal(false);
  
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private queryClient = injectQueryClient();

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      attributeName: [''],
      attributeType: [null],
      required: [false]
    });
    console.log('CategoryFormComponent initialized');
  }


// ngOnInit() {
//   // حذف فراخوانی loadInheritedAttributes از اینجا
//   // فقط برای دیباگ لاگ نگه می‌داریم
//   console.log('CategoryFormComponent initialized');
// }
ngOnInit() {
  // اجرای دستی categoriesQuery
  this.queryClient.fetchQuery({
    queryKey: ['categories'],
    queryFn: () => this.toPromise<CategoryTreeNodeDTO[]>(this.categoryService.getCategories().pipe(take(1))),
  }).then(cats => {
    console.log('Manually loaded categories:', JSON.stringify(cats, null, 2));
    const flatCategories = this.flattenCategories(cats);
    this.categories.set([
      { label: 'بدون والد', value: null },
      ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
    ]);
    console.log('Manually updated categories signal:', JSON.stringify(this.categories(), null, 2));
  }).catch(error => {
    console.error('Manual categories fetch error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در بارگذاری دسته‌بندی‌ها',
      life: 3000
    });
  });
}

ngOnChanges(changes: SimpleChanges) {
  if (changes['categoryId'] && this.categoryId() !== null) {
    this.editMode.set(true);
    console.log('Edit mode activated for categoryId:', this.categoryId());
    // بارگذاری دسته‌بندی
    this.queryClient.fetchQuery({
      queryKey: ['category', this.categoryId()],
      queryFn: () => this.toPromise<Category>(this.categoryService.getCategory(this.categoryId()!).pipe(take(1))),
    }).then(category => {
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || null
      });
      // بارگذاری ویژگی‌ها
      this.queryClient.fetchQuery({
        queryKey: ['category-attributes', this.categoryId()],
        queryFn: () => this.loadInheritedAttributes(this.categoryId()!),
      }).then(attrs => {
        console.log('Manually loaded category attributes:', JSON.stringify(attrs, null, 2));
        this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
        this.inheritedAttributes.set(attrs.filter(attr => attr.inherited));
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند',
          life: 3000
        });
      }).catch(error => {
        console.error('Manual category attributes fetch error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در بارگذاری ویژگی‌های دسته‌بندی',
          life: 3000
        });
      });
    }).catch(error => {
      console.error('Manual category fetch error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری دسته‌بندی',
        life: 3000
      });
    });
  } else if (this.categoryId() === null) {
    this.editMode.set(false);
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.inheritedAttributes.set([]);
    this.messageService.clear();
    this.messageService.add({ 
      severity: 'info', 
      summary: 'اطلاعات', 
      detail: 'فرم برای ایجاد دسته جدید آماده شد', 
      life: 3000 
    });
  }
}
  private toPromise<T>(observable: any): Promise<T> {
    return lastValueFrom(observable) as Promise<T>;
  }

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () => {
      console.log('Running categoriesQuery with real API - Form Component');
      return this.toPromise<CategoryTreeNodeDTO[]>(this.categoryService.getCategories().pipe(take(1)));
    },
    staleTime: 5 * 60 * 1000,
    onSuccess: (cats: CategoryTreeNodeDTO[]) => {
      console.log('onSuccess categoriesQuery - Form Component, raw cats length:', cats.length);
      console.log('Raw categories from API:', JSON.stringify(cats, null, 2));
      const flatCategories = this.flattenCategories(cats);
      console.log('Flattened categories:', JSON.stringify(flatCategories, null, 2));
      this.categories.set([
        { label: 'بدون والد', value: null },
        ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
      ]);
      console.log('Updated categories signal:', JSON.stringify(this.categories(), null, 2));
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'موفق', 
        detail: 'دسته‌بندی‌ها با موفقیت لود شدند', 
        life: 3000 
      });
    },
    onError: (error: any) => {
      console.error('Categories query error - Form Component:', error);
      console.error('Categories query error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری دسته‌بندی‌ها: ' + (error?.message || 'مشکل ناشناخته'),
        life: 3000
      });
    }
  }));

  categoryQuery = injectQuery(() => ({
    queryKey: ['category', this.categoryId()],
    queryFn: () => this.toPromise<Category>(this.categoryService.getCategory(this.categoryId()!).pipe(take(1))),
    enabled: !!this.categoryId(),
    onSuccess: (category: Category) => {
      console.log('Category loaded:', JSON.stringify(category, null, 2));
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || null
      });
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'موفق', 
        detail: 'دسته‌بندی با موفقیت لود شد', 
        life: 3000 
      });
      this.loadInheritedAttributes(category.parentId ?? null).then(attrs => {
        this.inheritedAttributes.set(attrs);
        this.isLoadingAttributes.set(false);
        console.log('Inherited attributes for category:', JSON.stringify(attrs, null, 2));
      }).catch(error => {
        console.error('Error loading inherited attributes:', error);
        this.inheritedAttributes.set([]);
        this.isLoadingAttributes.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده',
          life: 3000
        });
      });
    },
    onError: (error: any) => {
      console.error('Category query error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری دسته‌بندی',
        life: 3000
      });
    }
  }));

  
  categoryAttributesQuery = injectQuery(() => ({
  queryKey: ['category-attributes', this.categoryId()],
  queryFn: () => this.loadInheritedAttributes(this.categoryId()!), // استفاده از تابع loadInheritedAttributes
  enabled: !!this.categoryId(),
  onSuccess: (attrs: CategoryAttributeDTO[]) => {
    console.log('Category attributes loaded:', JSON.stringify(attrs, null, 2));
    this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
    this.inheritedAttributes.set(attrs.filter(attr => attr.inherited));
    this.messageService.add({ 
      severity: 'success', 
      summary: 'موفق', 
      detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند', 
      life: 3000 
    });
  },
  onError: (error: any) => {
    console.error('Category attributes query error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در بارگذاری ویژگی‌های دسته‌بندی',
      life: 3000
    });
  }
}));
  addAttributeMutation = injectMutation(() => ({
    mutationFn: (newAttribute: Attribute) => 
      this.toPromise<Attribute>(this.attributeService.addAttribute(newAttribute).pipe(take(1))),
    onSuccess: (addedAttribute: Attribute) => {
      const newCatAttr: CategoryAttributeDTO = {
        id: 0,
        categoryId: this.categoryId() || 0,
        attributeId: addedAttribute.id,
        attributeName: addedAttribute.name,
        attributeType: addedAttribute.type,
        required: this.categoryForm.get('required')?.value || false,
        categoryName: this.categoryForm.get('name')?.value || '',
        inherited: false
      };
      this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
      this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'موفق', 
        detail: 'ویژگی با موفقیت اضافه شد', 
        life: 3000 
      });
    }
  }));

  removeAttributeMutation = injectMutation(() => ({
    mutationFn: (attrId: number) => 
      this.toPromise<void>(this.attributeService.deleteCategoryAttribute(attrId).pipe(take(1))),
    onSuccess: (_, attrId) => {
      this.categoryAttributes.update(attrs => attrs.filter(attr => attr.id !== attrId));
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'موفق', 
        detail: 'ویژگی با موفقیت حذف شد', 
        life: 3000 
      });
    }
  }));

  saveCategoryMutation = injectMutation(() => ({
    mutationFn: (categoryDTO: CategoryDTO) => 
      this.editMode() 
        ? this.toPromise<Category>(this.categoryService.updateCategory(this.categoryId()!, categoryDTO).pipe(take(1)))
        : this.toPromise<Category>(this.categoryService.addCategory(categoryDTO).pipe(take(1))),
    onSuccess: (category: Category) => {
      console.log('Category saved:', JSON.stringify(category, null, 2));
      const categoryId = category.id;
      if (!categoryId) {
        this.messageService.clear();
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطا', 
          detail: 'شناسه دسته‌بندی معتبر نیست.', 
          life: 3000 
        });
        return;
      }

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
            inherited: false
          };
          return this.toPromise<CategoryAttributeDTO>(this.attributeService.addCategoryAttribute(categoryAttributeDTO).pipe(take(1)));
        });

      if (attributeRequests.length > 0) {
        Promise.all(attributeRequests).then(newCatAttrs => {
          this.categoryAttributes.update(attrs =>
            attrs.map(attr => {
              const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
              return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
            })
          );
          this.finalizeSubmission(category);
        }).catch(error => {
          console.error('Error saving attributes:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'خطا',
            detail: 'خطا در ذخیره ویژگی‌ها',
            life: 3000
          });
        });
      } else {
        this.finalizeSubmission(category);
      }

      this.queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (this.categoryId()) {
        this.queryClient.invalidateQueries({ queryKey: ['category', this.categoryId()] });
        this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
      }
    }
  }));

  
private async loadInheritedAttributes(categoryId: number | null, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
  if (!categoryId) {
    console.log('No categoryId provided, returning empty attributes');
    return [];
  }
  this.isLoadingAttributes.set(true);
  try {
    const category = await this.toPromise<Category>(this.categoryService.getCategory(categoryId).pipe(take(1)));
    console.log('Category for inherited attributes:', JSON.stringify(category, null, 2));
    const attrs = await this.toPromise<CategoryAttributeDTO[]>(this.attributeService.getCategoryAttributes(categoryId, false).pipe(take(1)));
    console.log('Attributes for category', categoryId, ':', JSON.stringify(attrs, null, 2));
    const merged = [...collected, ...attrs.map(attr => ({ ...attr, inherited: collected.length > 0 }))];
    console.log('Merged inherited attributes:', JSON.stringify(merged, null, 2));
    return category.parentId ? this.loadInheritedAttributes(category.parentId, merged) : merged;
  } catch (error) {
    console.error('Error in loadInheritedAttributes:', error);
    return collected; // بازگشت ویژگی‌های جمع‌آوری‌شده تا کنون
  } finally {
    this.isLoadingAttributes.set(false);
  }
}
 
private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
  console.log('Starting flattenCategories with:', JSON.stringify(nodes, null, 2));
  if (!nodes || !Array.isArray(nodes)) {
    console.log('Invalid nodes input:', nodes);
    return [];
  }

  const currentCategoryId = this.categoryId();  // لاگ currentCategoryId
  console.log('Current categoryId for filtering:', currentCategoryId);
  const result: Category[] = [];

  for (const node of nodes) {
    console.log('Processing node:', JSON.stringify(node, null, 2));
    if (!node.data) {
      console.log('Skipping node with missing data:', node);
      continue;
    }

    // لاگ فیلتر
    const isCurrent = node.data.id === currentCategoryId;
    const isDescendant = currentCategoryId ? this.isDescendant(node, currentCategoryId) : false;
    console.log('Node ID:', node.data.id, 'Is current:', isCurrent, 'Is descendant:', isDescendant);

    if (currentCategoryId && (isCurrent || isDescendant)) {
      console.log('Skipping current or descendant category:', node.data.id);
      continue;
    }

    const category: Category = {
      id: node.data.id ?? null,
      name: node.label || 'بدون نام',
      description: node.data.description || '',
      parentId: node.data.parentId || null,
      children: []
    };
    result.push(category);
    if (node.children && node.children.length > 0) {
      result.push(...this.flattenCategories(node.children));
    }
  }

  console.log('Flattened categories result:', JSON.stringify(result, null, 2));
  return result;
}
  private isDescendant(node: CategoryTreeNodeDTO, categoryId: number): boolean {
    if (node.data?.id === categoryId) return true;
    return (node.children || []).some(child => this.isDescendant(child, categoryId));
  }

  addAttribute() {
    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;
    const required = this.categoryForm.get('required')?.value;

    if (!attributeName || !attributeType) {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'هشدار', 
        detail: 'نام و نوع ویژگی اجباری است', 
        life: 3000 
      });
      return;
    }

    const existingAttribute = this.categoryAttributes().find(attr => 
      attr.attributeName.toLowerCase() === attributeName.toLowerCase()
    );
    if (existingAttribute) {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'هشدار', 
        detail: 'ویژگی با این نام قبلاً اضافه شده است', 
        life: 3000 
      });
      return;
    }

    const newAttribute: Attribute = {
      id: 0,
      name: attributeName,
      type: attributeType
    };
    
    this.addAttributeMutation.mutate(newAttribute);
  }

  removeAttribute(index: number) {
    const attr = this.categoryAttributes()[index];
    if (attr.id) {
      this.removeAttributeMutation.mutate(attr.id);
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'موفق', 
        detail: 'ویژگی با موفقیت حذف شد', 
        life: 3000 
      });
    }
  }
  
  onSubmit() {
    if (!this.categoryForm.get('name')?.valid) {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'هشدار', 
        detail: 'نام دسته اجباری است', 
        life: 3000 
      });
      return;
    }

    if (this.categoryAttributes().length === 0) {
      this.messageService.clear();
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'هشدار', 
        detail: 'حداقل یک ویژگی باید اضافه شود', 
        life: 3000 
      });
      return;
    }

    const categoryDTO: CategoryDTO = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value || '',
      parentId: this.categoryForm.get('parentId')?.value || null
    };

    console.log('Submitting category:', JSON.stringify(categoryDTO, null, 2));
    this.saveCategoryMutation.mutate(categoryDTO);
  }

  private finalizeSubmission(category: Category) {
    console.log('Finalizing submission for category:', JSON.stringify(category, null, 2));
    this.categoryUpdated.emit();
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.inheritedAttributes.set([]);
    this.editMode.set(false);
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`,
      life: 3000
    });
  }

  trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}