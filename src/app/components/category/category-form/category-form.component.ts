// import { Component, signal, input, output, inject } from '@angular/core';
  // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
  // import { CommonModule } from '@angular/common';
  // import { InputTextModule } from 'primeng/inputtext';
  // import { TreeSelectModule } from 'primeng/treeselect';
  // import { SelectModule } from 'primeng/select';
  // import { CheckboxModule } from 'primeng/checkbox';
  // import { ButtonModule } from 'primeng/button';
  // import { MessageService } from 'primeng/api';
  // import { ProgressSpinnerModule } from 'primeng/progressspinner';
  // import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
  // import { lastValueFrom } from 'rxjs';

  // import { Attribute, CategoryAttributeDTO, AttributeType } from '../../../models/attribute.model';
  // import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../../models/category.model';
  // import { CategoryService } from '../../../services/category.service';
  // import { AttributeService } from '../../../services/attribute.service';

  // @Component({
  //   selector: 'app-category-form',
  //   standalone: true,
  //   imports: [
  //     CommonModule,
  //     ReactiveFormsModule,
  //     InputTextModule,
  //     TreeSelectModule,
  //     SelectModule,
  //     CheckboxModule,
  //     ButtonModule,
  //     ProgressSpinnerModule,
  //   ],
  //   templateUrl: './category-form.component.html',
  //   styleUrls: ['./category-form.component.css'],
  // })
  // export class CategoryFormComponent {
  //   categoryId = input<number | null>(null);
  //   categoryUpdated = output<void>();
  //   categoryForm: FormGroup;
  //   categories = signal<{ label: string; value: number | null }[]>([{ label: 'بدون والد', value: null }]);
  //   attributeTypes = signal([
  //     { label: 'رشته', value: AttributeType.STRING },
  //     { label: 'عدد', value: AttributeType.NUMBER },
  //     { label: 'بولی', value: AttributeType.BOOLEAN },
  //     { label: 'انتخابی', value: AttributeType.SELECT },
  //     { label: 'چند انتخابی', value: AttributeType.MULTISELECT },
  //   ]);
  //   categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  //   inheritedAttributes = signal<CategoryAttributeDTO[]>([]);
  //   isLoadingAttributes = signal(false);
  //   editMode = signal(false);
  //   private categoryService = inject(CategoryService);
  //   private attributeService = inject(AttributeService);
  //   private messageService = inject(MessageService);
  //   private fb = inject(FormBuilder);
  //   private queryClient = injectQueryClient();

  //   constructor() {
  //     this.categoryForm = this.fb.group({
  //       name: ['', Validators.required],
  //       description: [''],
  //       parentId: [null],
  //       attributeName: [''],
  //       attributeType: [null],
  //       required: [false],
  //     });

  //     // مشاهده تغییرات parentId برای بارگذاری ویژگی‌های ارث‌بری‌شده
  //     this.categoryForm.get('parentId')?.valueChanges.subscribe(parentId => {
  //       this.queryClient.invalidateQueries({ queryKey: ['inherited-attributes', parentId] });
  //     });
  //   }

  //   // Query برای دریافت دسته‌بندی‌ها
  //   categoriesQuery = injectQuery(() => ({
  //     queryKey: ['categories'],
  //     queryFn: () => lastValueFrom(this.categoryService.getCategories()).then(cats => this.flattenCategories(cats)),
  //     staleTime: 5 * 60 * 1000, // 5 دقیقه کش
  //     onSuccess: (cats: Category[]) => {
  //       this.categories.set([
  //         { label: 'بدون والد', value: null },
  //         ...cats.map(cat => ({ label: cat.name, value: cat.id })),
  //       ]);
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند', life: 3000 });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Query برای دریافت ویژگی‌های ارث‌بری‌شده
  //   inheritedAttributesQuery = injectQuery(() => ({
  //     queryKey: ['inherited-attributes', this.categoryForm.get('parentId')?.value],
  //     queryFn: () => this.loadInheritedAttributes(this.categoryForm.get('parentId')?.value || null),
  //     enabled: !!this.categoryForm.get('parentId')?.value,
  //     staleTime: 5 * 60 * 1000, // 5 دقیقه کش
  //     onSuccess: (attrs: CategoryAttributeDTO[]) => {
  //       this.inheritedAttributes.set(attrs);
  //       this.isLoadingAttributes.set(false);
  //     },
  //     onError: () => {
  //       this.inheritedAttributes.set([]);
  //       this.isLoadingAttributes.set(false);
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'خطا',
  //         detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده',
  //         life: 3000,
  //       });
  //     },
  //   }));

  //   // Query برای دریافت اطلاعات دسته‌بندی در حالت ویرایش
  //   categoryQuery = injectQuery(() => ({
  //     queryKey: ['category', this.categoryId()],
  //     queryFn: () => lastValueFrom(this.categoryService.getCategory(this.categoryId()!)),
  //     enabled: !!this.categoryId(),
  //     staleTime: 5 * 60 * 1000, // 5 دقیقه کش
  //     onSuccess: (category: Category) => {
  //       this.categoryForm.patchValue({
  //         name: category.name,
  //         description: category.description || '',
  //         parentId: category.parentId || null,
  //       });
  //       this.editMode.set(true);
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت لود شد', life: 3000 });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Query برای دریافت ویژگی‌های دسته‌بندی
  //   categoryAttributesQuery = injectQuery(() => ({
  //     queryKey: ['category-attributes', this.categoryId()],
  //     queryFn: () => lastValueFrom(this.attributeService.getCategoryAttributes(this.categoryId()!, true)),
  //     enabled: !!this.categoryId(),
  //     staleTime: 5 * 60 * 1000, // 5 دقیقه کش
  //     onSuccess: (attrs: CategoryAttributeDTO[]) => {
  //       this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
  //       this.inheritedAttributes.update(existing => [
  //         ...existing,
  //         ...attrs.filter(attr => attr.inherited),
  //       ]);
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند', life: 3000 });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Mutation برای افزودن ویژگی جدید
  //   addAttributeMutation = injectMutation(() => ({
  //     mutationFn: (attribute: Attribute) => lastValueFrom(this.attributeService.addAttribute(attribute)),
  //     onSuccess: (addedAttribute: Attribute) => {
  //       const newCatAttr: CategoryAttributeDTO = {
  //         id: 0,
  //         categoryId: this.categoryId() || 0,
  //         attributeId: addedAttribute.id,
  //         attributeName: addedAttribute.name,
  //         attributeType: addedAttribute.type,
  //         required: this.categoryForm.get('required')?.value,
  //         categoryName: this.categoryForm.get('name')?.value || '',
  //         inherited: false,
  //       };
  //       this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
  //       this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت اضافه شد', life: 3000 });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Mutation برای حذف ویژگی
  //   deleteAttributeMutation = injectMutation(() => ({
  //     mutationFn: (id: number) => lastValueFrom(this.attributeService.deleteCategoryAttribute(id)),
  //     onSuccess: (_, id) => {
  //       this.categoryAttributes.update(attrs => attrs.filter(attr => attr.id !== id));
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد', life: 3000 });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Mutation برای ثبت یا ویرایش دسته‌بندی
  //   saveCategoryMutation = injectMutation(() => ({
  //     mutationFn: (categoryDTO: CategoryDTO) =>
  //       lastValueFrom(
  //         this.editMode()
  //           ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
  //           : this.categoryService.addCategory(categoryDTO)
  //       ),
  //     onSuccess: (category: Category) => {
  //       const categoryId = category.id;
  //       if (!categoryId) {
  //         this.messageService.clear();
  //         this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'شناسه دسته‌بندی معتبر نیست.', life: 3000 });
  //         return;
  //       }

  //       const attributeRequests = this.categoryAttributes()
  //         .filter(attr => !attr.id)
  //         .map(attr =>
  //           this.addCategoryAttributeMutation.mutateAsync({
  //             id: 0,
  //             categoryId,
  //             attributeId: attr.attributeId,
  //             attributeName: attr.attributeName,
  //             attributeType: attr.attributeType,
  //             required: attr.required,
  //             categoryName: category.name,
  //             inherited: false,
  //           })
  //         );

  //       if (attributeRequests.length > 0) {
  //         Promise.all(attributeRequests).then(newCatAttrs => {
  //           this.categoryAttributes.update(attrs =>
  //             attrs.map(attr => {
  //               const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
  //               return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
  //             })
  //           );
  //           this.finalizeSubmission(category);
  //         });
  //       } else {
  //         this.finalizeSubmission(category);
  //       }
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   // Mutation برای افزودن ویژگی به دسته‌بندی
  //   addCategoryAttributeMutation = injectMutation(() => ({
  //     mutationFn: (categoryAttribute: CategoryAttributeDTO) =>
  //       lastValueFrom(this.attributeService.addCategoryAttribute(categoryAttribute)),
  //     onSuccess: () => {
  //       this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
  //     },
  //     onError: () => {
  //       // خطاها توسط BaseService مدیریت می‌شوند
  //     },
  //   }));

  //   private loadInheritedAttributes(categoryId: number | null, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
  //     if (!categoryId) return Promise.resolve([]);
  //     this.isLoadingAttributes.set(true);
  //     return lastValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
  //       lastValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
  //         const merged = [...collected, ...attrs.map(attr => ({ ...attr, inherited: collected.length > 0 }))];
  //         return category.parentId ? this.loadInheritedAttributes(category.parentId, merged) : merged;
  //       })
  //     );
  //   }

  //   private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
  //     const currentCategoryId = this.categoryId();
  //     const result: Category[] = [];

  //     for (const node of nodes) {
  //       if (!node.data || !node.data.id) continue;
  //       if (currentCategoryId && (node.data.id === currentCategoryId || this.isDescendant(node, currentCategoryId))) continue;
  //       const category: Category = {
  //         id: node.data.id,
  //         name: node.label || 'بدون نام',
  //         description: node.data.description || '',
  //         parentId: node.data.parentId || null,
  //         children: [],
  //       };
  //       result.push(category);
  //       if (node.children && node.children.length > 0) {
  //         result.push(...this.flattenCategories(node.children));
  //       }
  //     }
  //     return result;
  //   }

  //   private isDescendant(node: CategoryTreeNodeDTO, categoryId: number): boolean {
  //     if (node.data.id === categoryId) return true;
  //     return (node.children || []).some(child => this.isDescendant(child, categoryId));
  //   }

  //   addAttribute() {
  //     const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
  //     const attributeType = this.categoryForm.get('attributeType')?.value;

  //     if (!attributeName || !attributeType) {
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است', life: 3000 });
  //       return;
  //     }

  //     const existingAttribute = this.categoryAttributes().find(attr => attr.attributeName.toLowerCase() === attributeName.toLowerCase());
  //     if (existingAttribute) {
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی با این نام قبلاً اضافه شده است', life: 3000 });
  //       return;
  //     }

  //     this.addAttributeMutation.mutate({ id: 0, name: attributeName, type: attributeType });
  //   }

  //   removeAttribute(index: number) {
  //     const attr = this.categoryAttributes()[index];
  //     if (attr.id) {
  //       this.deleteAttributeMutation.mutate(attr.id);
  //     } else {
  //       this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد', life: 3000 });
  //     }
  //   }

  //   onSubmit() {
  //     if (!this.categoryForm.get('name')?.valid) {
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام دسته اجباری است', life: 3000 });
  //       return;
  //     }

  //     if (this.categoryAttributes().length === 0) {
  //       this.messageService.clear();
  //       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'حداقل یک ویژگی باید اضافه شود', life: 3000 });
  //       return;
  //     }

  //     const categoryDTO: CategoryDTO = {
  //       name: this.categoryForm.get('name')?.value,
  //       description: this.categoryForm.get('description')?.value || '',
  //       parentId: this.categoryForm.get('parentId')?.value || null,
  //     };

  //     this.saveCategoryMutation.mutate(categoryDTO);
  //   }

  //   private finalizeSubmission(category: Category) {
  //     this.categoryUpdated.emit();
  //     this.queryClient.invalidateQueries({ queryKey: ['categories'] });
  //     this.categoryForm.reset();
  //     this.categoryAttributes.set([]);
  //     this.inheritedAttributes.set([]);
  //     this.editMode.set(false);
  //     this.messageService.clear();
  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'موفق',
  //       detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`,
  //       life: 3000,
  //     });
  //   }

  //   trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
  //     return attr.id;
  //   }
  // }



  import { Component, signal, input, output, inject, OnInit } from '@angular/core';
  import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
  import { CommonModule } from '@angular/common';
  import { InputTextModule } from 'primeng/inputtext';
  import { TreeSelectModule } from 'primeng/treeselect';
  import { SelectModule } from 'primeng/select';
  import { CheckboxModule } from 'primeng/checkbox';
  import { ButtonModule } from 'primeng/button';
  import { MessageService } from 'primeng/api';
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
      SelectModule,
      CheckboxModule,
      ButtonModule,
      ProgressSpinnerModule,
    ],
    templateUrl: './category-form.component.html',
    styleUrls: ['./category-form.component.css'],
  })
  export class CategoryFormComponent implements OnInit {
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
        this.queryClient.invalidateQueries({ queryKey: ['inherited-attributes', parentId] });
      });
    }

    ngOnInit() {
      if (this.categoryId()) {
        this.loadCategoryData();
      }
    }

    // Query برای دریافت دسته‌بندی‌ها
    categoriesQuery = injectQuery(() => ({
      queryKey: ['categories'],
      queryFn: () => lastValueFrom(this.categoryService.getCategories()).then(cats => this.flattenCategories(cats)),
      staleTime: 5 * 60 * 1000,
      onSuccess: (cats: Category[]) => {
        this.categories.set([
          { label: 'بدون والد', value: null },
          ...cats.map(cat => ({ label: cat.name, value: cat.id })),
        ]);
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند', life: 3000 });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Query برای دریافت ویژگی‌های ارث‌بری‌شده
    inheritedAttributesQuery = injectQuery(() => ({
      queryKey: ['inherited-attributes', this.categoryForm.get('parentId')?.value],
      queryFn: () => this.loadInheritedAttributes(this.categoryForm.get('parentId')?.value || null),
      enabled: !!this.categoryForm.get('parentId')?.value,
      staleTime: 5 * 60 * 1000,
      onSuccess: (attrs: CategoryAttributeDTO[]) => {
        this.inheritedAttributes.set(attrs);
        this.isLoadingAttributes.set(false);
      },
      onError: () => {
        this.inheritedAttributes.set([]);
        this.isLoadingAttributes.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده',
          life: 3000,
        });
      },
    }));

    // Query برای دریافت اطلاعات دسته‌بندی در حالت ویرایش
    categoryQuery = injectQuery(() => ({
      queryKey: ['category', this.categoryId()],
      queryFn: () => lastValueFrom(this.categoryService.getCategory(this.categoryId()!)),
      enabled: !!this.categoryId(),
      staleTime: 5 * 60 * 1000,
      onSuccess: (category: Category) => {
        this.categoryForm.patchValue({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
        });
        this.editMode.set(true);
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت لود شد', life: 3000 });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Query برای دریافت ویژگی‌های دسته‌بندی
    categoryAttributesQuery = injectQuery(() => ({
      queryKey: ['category-attributes', this.categoryId()],
      queryFn: () => lastValueFrom(this.attributeService.getCategoryAttributes(this.categoryId()!, true)),
      enabled: !!this.categoryId(),
      staleTime: 5 * 60 * 1000,
      onSuccess: (attrs: CategoryAttributeDTO[]) => {
        this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
        this.inheritedAttributes.update(existing => [
          ...existing,
          ...attrs.filter(attr => attr.inherited),
        ]);
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند', life: 3000 });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Mutation برای افزودن ویژگی جدید
    addAttributeMutation = injectMutation(() => ({
      mutationFn: (attribute: Attribute) => lastValueFrom(this.attributeService.addAttribute(attribute)),
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
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت اضافه شد', life: 3000 });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Mutation برای حذف ویژگی
    deleteAttributeMutation = injectMutation(() => ({
      mutationFn: (id: number) => lastValueFrom(this.attributeService.deleteCategoryAttribute(id)),
      onSuccess: (_, id) => {
        this.categoryAttributes.update(attrs => attrs.filter(attr => attr.id !== id));
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد', life: 3000 });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Mutation برای ثبت یا ویرایش دسته‌بندی
    saveCategoryMutation = injectMutation(() => ({
      mutationFn: (categoryDTO: CategoryDTO) =>
        lastValueFrom(
          this.editMode()
            ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
            : this.categoryService.addCategory(categoryDTO)
        ),
      onSuccess: (category: Category) => {
        const categoryId = category.id;
        if (!categoryId) {
          this.messageService.clear();
          this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'شناسه دسته‌بندی معتبر نیست.', life: 3000 });
          return;
        }

        const attributeRequests = this.categoryAttributes()
          .filter(attr => !attr.id)
          .map(attr =>
            this.addCategoryAttributeMutation.mutateAsync({
              id: 0,
              categoryId,
              attributeId: attr.attributeId,
              attributeName: attr.attributeName,
              attributeType: attr.attributeType,
              required: attr.required,
              categoryName: category.name,
              inherited: false,
            })
          );

        if (attributeRequests.length > 0) {
          Promise.all(attributeRequests).then(newCatAttrs => {
            this.categoryAttributes.update(attrs =>
              attrs.map(attr => {
                const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
                return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
              })
            );
            this.finalizeSubmission(category);
          });
        } else {
          this.finalizeSubmission(category);
        }
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    // Mutation برای افزودن ویژگی به دسته‌بندی
    addCategoryAttributeMutation = injectMutation(() => ({
      mutationFn: (categoryAttribute: CategoryAttributeDTO) =>
        lastValueFrom(this.attributeService.addCategoryAttribute(categoryAttribute)),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.categoryId()] });
      },
      onError: () => {
        // خطاها توسط BaseService مدیریت می‌شوند
      },
    }));

    private loadCategoryData() {
      this.categoryQuery.refetch();
      this.categoryAttributesQuery.refetch();
    }

    private loadInheritedAttributes(categoryId: number | null, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
      if (!categoryId) return Promise.resolve([]);
      this.isLoadingAttributes.set(true);
      return lastValueFrom(this.categoryService.getCategory(categoryId)).then(category =>
        lastValueFrom(this.attributeService.getCategoryAttributes(categoryId, false)).then(attrs => {
          const merged = [...collected, ...attrs.map(attr => ({ ...attr, inherited: collected.length > 0 }))];
          return category.parentId ? this.loadInheritedAttributes(category.parentId, merged) : merged;
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
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است', life: 3000 });
        return;
      }

      const existingAttribute = this.categoryAttributes().find(attr => attr.attributeName.toLowerCase() === attributeName.toLowerCase());
      if (existingAttribute) {
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی با این نام قبلاً اضافه شده است', life: 3000 });
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
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد', life: 3000 });
      }
    }

    onSubmit() {
      if (!this.categoryForm.get('name')?.valid) {
        this.messageService.clear();
        this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام دسته اجباری است', life: 3000 });
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
      
      if (!this.editMode()) {
        this.categoryForm.reset();
        this.categoryAttributes.set([]);
        this.inheritedAttributes.set([]);
      }
      
      this.messageService.clear();
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`,
        life: 3000,
      });
    }

    trackByAttribute(index: number, attr: CategoryAttributeDTO): number {
      return attr.id;
    }
  }