import { Component, signal, input, output, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { take, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
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
    CheckboxModule,
    ButtonModule,
    ProgressSpinnerModule,
    SkeletonModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
})
export class CategoryFormComponent implements OnChanges {
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
  isLoadingAttributes = signal(false);
  editMode = signal(false);
  

  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private queryClient = injectQueryClient();
  private parentSub?: Subscription;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      attributeName: [''],
      attributeType: [null],
      required: [false],
    });

    effect(() => {
      const data = this.categoriesQuery.data();
      if (data) {
        const flatCategories = this.flattenCategories(data);
        this.categories.set([
          { label: 'بدون والد', value: null },
          ...flatCategories.map(cat => ({ label: cat.name, value: cat.id })),
        ]);
        flatCategories.forEach(cat => {
          if (cat.id) {
            this.queryClient.prefetchQuery({
              queryKey: ['category-attributes-local', cat.id],
              queryFn: () => this.toPromise<CategoryAttributeDTO[]>(this.attributeService.getCategoryAttributes(cat.id, false)),
              staleTime: 10 * 60 * 1000,
            });
          }
        });
      }
    });

    effect(() => {
      const category = this.categoryQuery.data();
      if (category) {
        this.categoryForm.patchValue({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
        });
      }
    });

    effect(() => {
      const attrs = this.categoryAttributesQuery.data();
      if (attrs) {
        this.categoryAttributes.set(attrs.filter((attr: CategoryAttributeDTO) => !attr.inherited));
        this.inheritedAttributes.set(attrs.filter((attr: CategoryAttributeDTO) => attr.inherited));
        this.isLoadingAttributes.set(false);
      }
    });

    effect(() => {
      const parentId = this.categoryForm.get('parentId')?.value;
      const currentCategoryId = this.categoryId();
      if (parentId && (!currentCategoryId || !this.editMode())) {
        this.isLoadingAttributes.set(true);
        this.queryClient.invalidateQueries({ queryKey: ['category-attributes', parentId] });
      } else if (!parentId && !this.editMode()) {
        this.inheritedAttributes.set([]);
        this.isLoadingAttributes.set(false);
      }
    });

    this.parentSub = this.categoryForm.get('parentId')?.valueChanges.pipe(distinctUntilChanged()).subscribe(async (parentId: number | null) => {
      const currentCategoryId = this.categoryId();
      if (!parentId && !this.editMode()) {
        this.inheritedAttributes.set([]);
        this.isLoadingAttributes.set(false);
        return;
      }
      if (parentId && (!currentCategoryId || !this.editMode())) {
        this.isLoadingAttributes.set(true);
        try {
          const attrs = await this.queryClient.fetchQuery({
            queryKey: ['category-attributes', parentId],
            queryFn: () => this.loadInheritedAttributes(parentId),
            staleTime: 10 * 60 * 1000,
          }) as CategoryAttributeDTO[];
          this.categoryAttributes.set(attrs.filter(a => !a.inherited));
          this.inheritedAttributes.set(attrs.filter(a => a.inherited));
        } catch (err) {
          this.messageService.add({
            severity: 'error',
            summary: 'خطا',
            detail: 'خطا در بارگذاری ویژگی‌های والد: ' + ((err instanceof Error) ? err.message : 'نامشخص'),
            life: 3000,
          });
        } finally {
          this.isLoadingAttributes.set(false);
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoryId'] && this.categoryId() !== null) {
      this.editMode.set(true);
      this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
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
        life: 3000,
      });
    }
  }

  ngOnDestroy() {
    this.parentSub?.unsubscribe();
  }

  private toPromise<T>(observable: any): Promise<T> {
    return lastValueFrom(observable.pipe(take(1))) as Promise<T>;
  }

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories', this.categoryId()],
    queryFn: () => this.toPromise<CategoryTreeNodeDTO[]>(this.categoryService.getCategories()),
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: Infinity,
    keepPreviousData: true,
    onSuccess: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'دسته‌بندی‌ها با موفقیت لود شدند',
        life: 3000,
      });
    },
    onError: (error: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری دسته‌بندی‌ها: ' + (error.message || 'مشکل ناشناخته'),
        life: 3000,
      });
    },
  }));

  categoryQuery = injectQuery(() => ({
    queryKey: ['category', this.categoryId()],
    queryFn: () => this.toPromise<Category>(this.categoryService.getCategory(this.categoryId()!)),
    enabled: () => !!this.categoryId(),
    staleTime: 10 * 60 * 1000,
    gcTime: Infinity,
    keepPreviousData: true,
    onSuccess: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'دسته‌بندی با موفقیت لود شد',
        life: 3000,
      });
    },
    onError: (error: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری دسته‌بندی: ' + (error.message || 'مشکل ناشناخته'),
        life: 3000,
      });
    },
  }));

  categoryAttributesQuery = injectQuery(() => ({
    queryKey: ['category-attributes', this.categoryId() || this.categoryForm.get('parentId')?.value],
    queryFn: () => this.loadInheritedAttributes(this.categoryId() || this.categoryForm.get('parentId')?.value || null),
    enabled: () => !!this.categoryId() || !!this.categoryForm.get('parentId')?.value,
    staleTime: 10 * 60 * 1000,
    gcTime: Infinity,
    keepPreviousData: true,
    onSuccess: (attrs: CategoryAttributeDTO[]) => {
      this.categoryAttributes.set(attrs.filter(a => !a.inherited));
      this.inheritedAttributes.set(attrs.filter(a => a.inherited));
      this.isLoadingAttributes.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند',
        life: 3000,
      });
    },
    onError: (error: Error) => {
      this.isLoadingAttributes.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری ویژگی‌های دسته‌بندی: ' + (error.message || 'مشکل ناشناخته'),
        life: 3000,
      });
    },
  }));

  addAttributeMutation = injectMutation(() => ({
    mutationFn: (newAttribute: Attribute) => this.toPromise<Attribute>(this.attributeService.addAttribute(newAttribute)),
    onSuccess: async (addedAttribute: Attribute) => {
      const newCatAttr: CategoryAttributeDTO = {
        id: 0,
        categoryId: this.categoryId() || 0,
        attributeId: addedAttribute.id,
        attributeName: addedAttribute.name,
        attributeType: addedAttribute.type,
        required: this.categoryForm.get('required')?.value || false,
        categoryName: this.categoryForm.get('name')?.value || '',
        inherited: false,
      };
      if (this.editMode()) {
        try {
          const savedCatAttr = await this.toPromise<CategoryAttributeDTO>(
            this.attributeService.addCategoryAttribute(newCatAttr)
          );
          this.categoryAttributes.update(attrs => [...attrs, savedCatAttr]);
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'خطا',
            detail: 'خطا در اضافه کردن ویژگی به دسته‌بندی',
            life: 3000,
          });
          return;
        }
      } else {
        this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
      }
      this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی با موفقیت اضافه شد',
        life: 3000,
      });
    },
  }));

  removeAttributeMutation = injectMutation(() => ({
    mutationFn: (attrId: number) => this.toPromise<void>(this.attributeService.deleteCategoryAttribute(attrId)),
    onSuccess: (_, attrId) => {
      this.categoryAttributes.update(attrs => attrs.filter(attr => attr.id !== attrId));
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی با موفقیت حذف شد',
        life: 3000,
      });
    },
  }));

  saveCategoryMutation = injectMutation(() => ({
    mutationFn: (categoryDTO: CategoryDTO) =>
      this.editMode() ? this.toPromise<Category>(this.categoryService.updateCategory(this.categoryId()!, categoryDTO)) :
        this.toPromise<Category>(this.categoryService.addCategory(categoryDTO)),
    onSuccess: (category: Category) => {
      const categoryId = category.id;
      if (!categoryId) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'شناسه دسته‌بندی معتبر نیست.',
          life: 3000,
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
            inherited: false,
          };
          return this.toPromise<CategoryAttributeDTO>(this.attributeService.addCategoryAttribute(categoryAttributeDTO));
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
          this.messageService.add({
            severity: 'error',
            summary: 'خطا',
            detail: 'خطا در ذخیره ویژگی‌ها',
            life: 3000,
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
    },
  }));

  private async loadInheritedAttributes(categoryId: number | null): Promise<CategoryAttributeDTO[]> {
    if (!categoryId) return [];
    let collected: CategoryAttributeDTO[] = [];
    let currentId: number | null = categoryId;
    const seenCategoryIds = new Set<number>();

    try {
      const categoryIds: number[] = [];
      while (currentId !== null && !seenCategoryIds.has(currentId)) {
        seenCategoryIds.add(currentId);
        categoryIds.push(currentId);
        const category: Category = await this.queryClient.fetchQuery({
          queryKey: ['category', currentId],
          queryFn: () => this.toPromise<Category>(this.categoryService.getCategory(currentId!)),
          staleTime: 10 * 60 * 1000,
        });
        currentId = category.parentId;
      }

      categoryIds.reverse();

      const attributeResults = await Promise.all(
        categoryIds.map(id =>
          this.queryClient.fetchQuery({
            queryKey: ['category-attributes-local', id],
            queryFn: () => this.toPromise<CategoryAttributeDTO[]>(this.attributeService.getCategoryAttributes(id, false)),
            staleTime: 10 * 60 * 1000,
          })
        )
      );

      const seenAttributeIds = new Set<number>();
      attributeResults.forEach((attrs, index) => {
        const isInherited = index < attributeResults.length - 1;
        const uniqueAttrs = attrs.filter(attr => !seenAttributeIds.has(attr.attributeId));
        uniqueAttrs.forEach(attr => {
          seenAttributeIds.add(attr.attributeId);
          collected.push({
            ...attr,
            inherited: isInherited,
          });
        });
      });

      return collected;
    } catch (error: unknown) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده: ' + ((error instanceof Error) ? error.message : 'نامشخص'),
        life: 3000,
      });
      return collected;
    }
  }

  private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
    if (!nodes || !Array.isArray(nodes)) return [];
    const currentCategoryId = this.categoryId();
    const result: Category[] = [];

    for (const node of nodes) {
      if (!node.data) continue;
      if (currentCategoryId && (node.data.id === currentCategoryId || this.isDescendant(node, currentCategoryId))) {
        continue;
      }
      const category: Category = {
        id: node.data.id ?? null,
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
    if (node.data?.id === categoryId) return true;
    return (node.children || []).some(child => this.isDescendant(child, categoryId));
  }

  addAttribute() {
    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;
    const required = this.categoryForm.get('required')?.value;

    if (!attributeName || !attributeType) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'نام و نوع ویژگی اجباری است',
        life: 3000,
      });
      return;
    }

    const existingAttribute = this.categoryAttributes().find(attr =>
      attr.attributeName.toLowerCase() === attributeName.toLowerCase()
    );
    if (existingAttribute) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'ویژگی با این نام قبلاً اضافه شده است',
        life: 3000,
      });
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
      this.removeAttributeMutation.mutate(attr.id);
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی با موفقیت حذف شد',
        life: 3000,
      });
    }
  }

  onSubmit() {
    if (!this.categoryForm.get('name')?.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'نام دسته اجباری است',
        life: 3000,
      });
      return;
    }

    if (this.categoryAttributes().length + this.inheritedAttributes().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'حداقل یک ویژگی باید اضافه شود',
        life: 3000,
      });
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
    const wasEdit = this.editMode();
    this.categoryUpdated.emit();
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.inheritedAttributes.set([]);
    this.editMode.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `دسته‌بندی "${category.name}" با موفقیت ${wasEdit ? 'ویرایش' : 'ایجاد'} شد`,
      life: 3000,
    });
  }

  trackByAttribute(_: number, attr: CategoryAttributeDTO): number {
    return attr.id;
  }
}