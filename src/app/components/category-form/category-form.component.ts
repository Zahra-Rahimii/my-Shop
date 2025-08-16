// // import { Component, signal, input, output, OnInit, inject, effect, SimpleChanges, OnChanges } from '@angular/core';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { CommonModule } from '@angular/common';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { SelectModule } from 'primeng/select';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { ButtonModule } from 'primeng/button';

// // import { Attribute, CategoryAttribute, CategoryAttributeDTO, AttributeType } from '../../models/attribute.model';
// // import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../models/category.model';
// // import { CategoryService } from '../../services/category.service';
// // import { AttributeService } from '../../services/attribute.service';

// // @Component({
// //   selector: 'app-category-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     InputTextModule,
// //     SelectModule,
// //     CheckboxModule,
// //     ButtonModule
// //   ],
// //   templateUrl: './category-form.component.html',
// //   styleUrls: ['./category-form.component.css']
// // })
// // export class CategoryFormComponent implements OnInit, OnChanges {
// //   categoryId = input<number | null>(null);
// //   categoryUpdated = output<void>();
// //   categoryForm!: FormGroup;
// //   categories = signal<{ label: string, value: number | null }[]>([]);
// //   attributeTypes = signal([
// //     { label: 'رشته', value: AttributeType.STRING },
// //     { label: 'عدد', value: AttributeType.NUMBER },
// //     { label: 'بولی', value: AttributeType.BOOLEAN },
// //     { label: 'انتخابی', value: AttributeType.SELECT },
// //     { label: 'چند انتخابی', value: AttributeType.MULTISELECT }
// //   ]);
// //   categoryAttributes = signal<CategoryAttribute[]>([]);
// //   editMode = signal(false);
// //   private categoryService = inject(CategoryService);
// //   private attributeService = inject(AttributeService);

// //   constructor(private fb: FormBuilder) {
// //     this.categoryForm = this.fb.group({
// //       name: ['', Validators.required],
// //       description: [''],
// //       parentId: [null],
// //       attributeName: [''],
// //       attributeType: [null],
// //       required: [false]
// //     });
// //     effect(() => {
// //       this.loadCategories();
// //     });

    
// //   }

// //   ngOnInit() {
// //     this.loadCategories();
// //   }

// //   ngOnChanges(changes: SimpleChanges) {
// //     if (changes['categoryId'] && this.categoryId() !== null) {
// //       this.loadFormData();
// //     } else if (this.categoryId() === null) {
// //       this.editMode.set(false);
// //       this.categoryForm.reset();
// //       this.categoryAttributes.set([]);
// //     }
// //   }

// //   private loadCategories() {
// //     this.categoryService.getCategories().subscribe({
// //       next: (cats) => {
// //         const flatCategories = this.flattenCategories(cats);
// //         this.categories.set([
// //           { label: 'بدون والد', value: null },
// //           ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
// //         ]);
// //       },
// //       error: (err) => {
// //         console.error('خطا در لود دسته‌بندی‌ها:', err);
// //         alert('خطایی در لود دسته‌بندی‌ها رخ داد.');
// //       }
// //     });
// //   }

// //   private loadFormData() {
// //     this.editMode.set(true);
// //     this.categoryService.getCategory(this.categoryId()!).subscribe({
// //       next: (category) => {
// //         this.categoryForm.patchValue({
// //           name: category.name,
// //           description: category.description,
// //           parentId: category.parentId
// //         });
// //       },
// //       error: (err) => {
// //         console.error('خطا در لود دسته‌بندی:', err);
// //         alert('خطایی در لود دسته‌بندی رخ داد.');
// //       }
// //     });
// //     this.attributeService.getCategoryAttributes(this.categoryId()!).subscribe({
// //       next: (attrs) => {
// //         this.categoryAttributes.set(attrs);
// //       },
// //       error: (err) => {
// //         console.error('خطا در لود ویژگی‌های دسته‌بندی:', err);
// //         alert('خطایی در لود ویژگی‌های دسته‌بندی رخ داد.');
// //       }
// //     });
// //   }


// //   private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
// //   return nodes.flatMap(node => [
// //     {
// //       id: node.data.id,
// //       name: node.label, 
// //       description: node.data.description,
// //       parentId: null, 
// //       children: []
// //     },
// //     ...this.flattenCategories(node.children || [])
// //   ]);
// // }

// //   addAttribute() {
// //     const attributeName = this.categoryForm.get('attributeName')?.value;
// //     const attributeType = this.categoryForm.get('attributeType')?.value;
// //     const required = this.categoryForm.get('required')?.value;
// //     if (!attributeName || !attributeType) {
// //       alert('نام و نوع ویژگی اجباری است');
// //       return;
// //     }
// //     const newAttribute: Attribute = {
// //       id: 0,
// //       name: attributeName,
// //       type: attributeType
// //     };
// //     this.attributeService.addAttribute(newAttribute).subscribe({
// //       next: (addedAttribute) => {
// //         const newCatAttr: CategoryAttribute = {
// //           id: 0,
// //           attributeId: addedAttribute.id,
// //           attributeName: attributeName,
// //           attributeType: attributeType,
// //           required: required
// //         };
// //         this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
// //         this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
// //       },
// //       error: (err) => {
// //         console.error('خطا در افزودن ویژگی:', err);
// //         alert('خطایی در افزودن ویژگی رخ داد.');
// //       }
// //     });
// //   }

// //   removeAttribute(index: number) {
// //     const attr = this.categoryAttributes()[index];
// //     if (attr.id) {
// //       this.attributeService.deleteCategoryAttribute(attr.id).subscribe({
// //         next: () => {
// //           this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
// //         },
// //         error: (err) => {
// //           console.error('خطا در حذف ویژگی دسته‌بندی:', err);
// //           alert('خطایی در حذف ویژگی رخ داد.');
// //         }
// //       });
// //     } else {
// //       this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
// //     }
// //   }
  
// //   onSubmit() {
// //     if (this.categoryForm.valid) {
// //         const attributeName = this.categoryForm.get('attributeName')?.value;
// //         const attributeType = this.categoryForm.get('attributeType')?.value;
// //         if (attributeName || attributeType) {
// //             alert('ویژگی جدید وارد شده اما اضافه نشده است. لطفاً ابتدا ویژگی را اضافه کنید.');
// //             return;
// //         }
// //         if (this.categoryAttributes().length === 0) {
// //             alert('حداقل یک ویژگی اضافه کنید.');
// //             return;
// //         }
// //         const categoryDTO: CategoryDTO = {
// //             name: this.categoryForm.get('name')?.value,
// //             description: this.categoryForm.get('description')?.value,
// //             parentId: this.categoryForm.get('parentId')?.value
// //         };

// //         const categoryRequest = this.editMode()
// //             ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
// //             : this.categoryService.addCategory(categoryDTO);

// //         categoryRequest.subscribe({
// //             next: (category) => {
// //                 console.log('پاسخ سرور:', category); // لاگ برای دیباگ
// //                 const categoryId = category.id;
// //                 if (!categoryId) {
// //                     console.error('categoryId null است:', category);
// //                     alert('خطا: شناسه دسته‌بندی معتبر نیست.');
// //                     return;
// //                 }
// //                 this.categoryAttributes().forEach(attr => {
// //                     if (!attr.id) {
// //                         const categoryAttributeDTO: CategoryAttributeDTO = {
// //                             categoryId,
// //                             attributeId: attr.attributeId,
// //                             required: attr.required
// //                         };
// //                         if (!categoryAttributeDTO.categoryId || !categoryAttributeDTO.attributeId) {
// //                             console.error('DTO ناقص است:', categoryAttributeDTO);
// //                             return;
// //                         }
// //                         this.attributeService.addCategoryAttribute(categoryAttributeDTO).subscribe({
// //                             next: (newCatAttr) => {
// //                                 this.categoryAttributes.update(attrs =>
// //                                     attrs.map(a => (a.attributeId === attr.attributeId && !a.id ? { ...a, id: newCatAttr.id } : a))
// //                                 );
// //                             },
// //                             error: (err) => {
// //                                 console.error('خطا در افزودن ویژگی دسته‌بندی:', err);
// //                                 alert('خطایی در افزودن ویژگی رخ داد.');
// //                             }
// //                         });
// //                     }
// //                 });
// //                 this.categoryUpdated.emit();
// //                 this.loadCategories();
// //                 this.categoryForm.reset();
// //                 this.categoryAttributes.set([]);
// //                 this.editMode.set(false);
// //             },
// //             error: (err) => {
// //                 console.error('خطا در ذخیره دسته‌بندی:', err);
// //                 alert('خطایی در ذخیره دسته‌بندی رخ داد.');
// //             }
// //         });
// //     }
// // }
// // }

// import { Component, signal, input, output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';

// import { Attribute, CategoryAttribute, CategoryAttributeDTO, AttributeType } from '../../models/attribute.model';
// import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../models/category.model';
// import { CategoryService } from '../../services/category.service';
// import { AttributeService } from '../../services/attribute.service';

// @Component({
//   selector: 'app-category-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     InputTextModule,
//     SelectModule,
//     CheckboxModule,
//     ButtonModule,
//   ],
//   templateUrl: './category-form.component.html',
//   styleUrls: ['./category-form.component.css'],
// })
// export class CategoryFormComponent implements OnInit, OnChanges {
//   categoryId = input<number | null>(null);
//   categoryUpdated = output<void>();
//   categoryForm: FormGroup;
//   categories = signal<{ label: string; value: number | null }[]>([{ label: 'بدون والد', value: null }]);
//   attributeTypes = signal([
//     { label: 'رشته', value: AttributeType.STRING },
//     { label: 'عدد', value: AttributeType.NUMBER },
//     { label: 'بولی', value: AttributeType.BOOLEAN },
//     { label: 'انتخابی', value: AttributeType.SELECT },
//     { label: 'چند انتخابی', value: AttributeType.MULTISELECT }
//   ]);
//   categoryAttributes = signal<CategoryAttribute[]>([]);
//   editMode = signal(false);
//   private categoryService = inject(CategoryService);
//   private attributeService = inject(AttributeService);
//   private messageService = inject(MessageService);
//   private fb = inject(FormBuilder);

//   constructor() {
//     this.categoryForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''], 
//       parentId: [null],
//       attributeName: [''],
//       attributeType: [null],
//       required: [false]
//     });
//   }

//   ngOnInit() {
//     this.loadCategories();
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['categoryId'] && this.categoryId() !== null) {
//       this.editMode.set(true);
//       this.loadFormData();
//     } else if (this.categoryId() === null) {
//       this.editMode.set(false);
//       this.categoryForm.reset();
//       this.categoryAttributes.set([]);
//       this.messageService.add({ severity: 'info', summary: 'اطلاعات', detail: 'فرم برای ایجاد دسته جدید آماده شد' });
//     }
//   }

//   private loadCategories() {
//     this.categoryService.getCategories().subscribe({
//       next: (cats) => {
//         const flatCategories = this.flattenCategories(cats);
//         this.categories.set([
//           { label: 'بدون والد', value: null },
//           ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
//         ]);
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private loadFormData() {
//     this.categoryService.getCategory(this.categoryId()!).subscribe({
//       next: (category) => {
//         this.categoryForm.patchValue({
//           name: category.name,
//           description: category.description || '',
//           parentId: category.parentId || null
//         });
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت لود شد' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//     this.attributeService.getCategoryAttributes(this.categoryId()!).subscribe({
//       next: (attrs) => {
//         this.categoryAttributes.set(attrs);
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
//     return nodes.flatMap(node => {
//       if (!node.data || !node.data.id) return [];
//       return [
//         {
//           id: node.data.id,
//           name: node.label || 'بدون نام',
//           description: node.data.description || '',
//           parentId: node.data.parentId || null,
//           children: []
//         },
//         ...this.flattenCategories(node.children || [])
//       ];
//     });
//   }

//   addAttribute() {
//     const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
//     const attributeType = this.categoryForm.get('attributeType')?.value;
//     const required = this.categoryForm.get('required')?.value;
//     if (!attributeName || !attributeType) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است' });
//       return;
//     }
//     const newAttribute: Attribute = {
//       id: 0,
//       name: attributeName,
//       type: attributeType
//     };
//     this.attributeService.addAttribute(newAttribute).subscribe({
//       next: (addedAttribute) => {
//         const newCatAttr: CategoryAttribute = {
//           id: 0,
//           attributeId: addedAttribute.id,
//           attributeName: addedAttribute.name,
//           attributeType: addedAttribute.type,
//           required: required
//         };
//         this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
//         this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت اضافه شد' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   removeAttribute(index: number) {
//     const attr = this.categoryAttributes()[index];
//     if (attr.id) {
//       this.attributeService.deleteCategoryAttribute(attr.id).subscribe({
//         next: () => {
//           this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
//           this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
//         },
//         error: () => {
//           // خطا توسط BaseService با p-toast مدیریت می‌شه
//         }
//       });
//     } else {
//       this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
//       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
//     }
//   }

//   onSubmit() {
//     if (!this.categoryForm.valid) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً فرم را کامل و صحیح پر کنید' });
//       return;
//     }

//     const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
//     const attributeType = this.categoryForm.get('attributeType')?.value;
//     if (attributeName || attributeType) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی جدید وارد شده اما اضافه نشده است. لطفاً ابتدا ویژگی را اضافه کنید.' });
//       return;
//     }

//     if (this.categoryAttributes().length === 0) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'حداقل یک ویژگی اضافه کنید.' });
//       return;
//     }

//     const categoryDTO: CategoryDTO = {
//       name: this.categoryForm.get('name')?.value,
//       description: this.categoryForm.get('description')?.value || '',
//       parentId: this.categoryForm.get('parentId')?.value || null
//     };

//     const categoryRequest = this.editMode()
//       ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
//       : this.categoryService.addCategory(categoryDTO);

//     categoryRequest.subscribe({
//       next: (category) => {
//         const categoryId = category.id;
//         if (!categoryId) {
//           this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'شناسه دسته‌بندی معتبر نیست.' });
//           return;
//         }

//         // اضافه کردن ویژگی‌های دسته‌بندی
//         const attributeRequests = this.categoryAttributes()
//           .filter(attr => !attr.id)
//           .map(attr => {
//             const categoryAttributeDTO: CategoryAttributeDTO = {
//               categoryId,
//               attributeId: attr.attributeId,
//               required: attr.required
//             };
//             return this.attributeService.addCategoryAttribute(categoryAttributeDTO);
//           });

//         if (attributeRequests.length > 0) {
//           Promise.all(attributeRequests.map(req => req.toPromise())).then(newCatAttrs => {
//             this.categoryAttributes.update(attrs =>
//               attrs.map(attr => {
//                 const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId);
//                 return newCatAttr && !attr.id ? { ...attr, id: newCatAttr.id } : attr;
//               })
//             );
//             this.finalizeSubmission(category);
//           }).catch(() => {
//             // خطا توسط BaseService با p-toast مدیریت می‌شه
//           });
//         } else {
//           this.finalizeSubmission(category);
//         }
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private finalizeSubmission(category: Category) {
//     this.categoryUpdated.emit();
//     this.loadCategories();
//     this.categoryForm.reset();
//     this.categoryAttributes.set([]);
//     this.editMode.set(false);
//     this.messageService.add({
//       severity: 'success',
//       summary: 'موفق',
//       detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`
//     });
//   }
// }



// import { Component, signal, input, output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';
// import { Attribute, CategoryAttributeDTO, AttributeType } from '../../models/attribute.model';
// import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../models/category.model';
// import { CategoryService } from '../../services/category.service';
// import { AttributeService } from '../../services/attribute.service';

// @Component({
//   selector: 'app-category-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     InputTextModule,
//     SelectModule,
//     CheckboxModule,
//     ButtonModule,
//   ],
//   templateUrl: './category-form.component.html',
//   styleUrls: ['./category-form.component.css'],
// })
// export class CategoryFormComponent implements OnInit, OnChanges {
//   categoryId = input<number | null>(null);
//   categoryUpdated = output<void>();
//   categoryForm: FormGroup;
//   categories = signal<{ label: string; value: number | null }[]>([{ label: 'بدون والد', value: null }]);
//   attributeTypes = signal([
//     { label: 'رشته', value: AttributeType.STRING },
//     { label: 'عدد', value: AttributeType.NUMBER },
//     { label: 'بولی', value: AttributeType.BOOLEAN },
//     { label: 'انتخابی', value: AttributeType.SELECT },
//     { label: 'چند انتخابی', value: AttributeType.MULTISELECT }
//   ]);
//   categoryAttributes = signal<CategoryAttributeDTO[]>([]);
//   editMode = signal(false);
//   private categoryService = inject(CategoryService);
//   private attributeService = inject(AttributeService);
//   private messageService = inject(MessageService);
//   private fb = inject(FormBuilder);

//   constructor() {
//     this.categoryForm = this.fb.group({
//       name: ['', Validators.required],
//       description: [''],
//       parentId: [null],
//       attributeName: ['', Validators.required],
//       attributeType: [null, Validators.required],
//       required: [false]
//     });
//   }

//   ngOnInit() {
//     this.loadCategories();
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['categoryId'] && this.categoryId() !== null) {
//       this.editMode.set(true);
//       this.loadFormData();
//     } else if (this.categoryId() === null) {
//       this.editMode.set(false);
//       this.categoryForm.reset();
//       this.categoryAttributes.set([]);
//       this.messageService.add({ severity: 'info', summary: 'اطلاعات', detail: 'فرم برای ایجاد دسته‌بندی جدید آماده شد' });
//     }
//   }

//   private loadCategories() {
//     this.categoryService.getCategories().subscribe({
//       next: (cats) => {
//         const flatCategories = this.flattenCategories(cats);
//         this.categories.set([
//           { label: 'بدون والد', value: null },
//           ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
//         ]);
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private loadFormData() {
//     if (!this.categoryId()) return;
//     this.categoryService.getCategory(this.categoryId()!).subscribe({
//       next: (category) => {
//         this.categoryForm.patchValue({
//           name: category.name,
//           description: category.description || '',
//           parentId: category.parentId || null
//         });
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت لود شد' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//     this.attributeService.getCategoryAttributes(this.categoryId()!).subscribe({
//       next: (attrs) => {
//         this.categoryAttributes.set(attrs);
//         this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند' });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
//     return nodes.flatMap(node => {
//       if (!node.data || !node.data.id) return [];
//       return [
//         {
//           id: node.data.id,
//           name: node.label || 'بدون نام',
//           description: node.data.description || '',
//           parentId: node.data.parentId || null,
//           children: []
//         },
//         ...this.flattenCategories(node.children || [])
//       ];
//     });
//   }

//   addAttribute() {
//     const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
//     const attributeType = this.categoryForm.get('attributeType')?.value;
//     const required = this.categoryForm.get('required')?.value;
//     if (!attributeName || !attributeType) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است' });
//       return;
//     }
//     const newAttribute: Attribute = {
//       id: 0,
//       name: attributeName,
//       type: attributeType
//     };
//     this.attributeService.addAttribute(newAttribute).subscribe({
//       next: (addedAttribute) => {
//         const newCatAttr: CategoryAttributeDTO = {
//           id: 0,
//           categoryId: this.categoryId() || 0, // 0 تا بک‌اند پر کنه
//           attributeId: addedAttribute.id,
//           attributeName: addedAttribute.name,
//           attributeType: addedAttribute.type,
//           required: required,
//           categoryName: '',
//           inherited: false
//         };
//         if (this.categoryId()) {
//           this.attributeService.addCategoryAttribute(newCatAttr).subscribe({
//             next: (savedCatAttr) => {
//               this.categoryAttributes.update(attrs => [...attrs, savedCatAttr]);
//               this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت اضافه شد' });
//             },
//             error: () => {
//               // خطا توسط BaseService مدیریت می‌شه
//             }
//           });
//         } else {
//           this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
//           this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی به لیست موقت اضافه شد' });
//         }
//         this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   removeAttribute(index: number) {
//     const attr = this.categoryAttributes()[index];
//     if (attr.id) {
//       this.attributeService.deleteCategoryAttribute(attr.id).subscribe({
//         next: () => {
//           this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
//           this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
//         },
//         error: () => {
//           // خطا توسط BaseService با p-toast مدیریت می‌شه
//         }
//       });
//     } else {
//       this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
//       this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
//     }
//   }

//   onSubmit() {
//     if (!this.categoryForm.valid) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً فرم را کامل و صحیح پر کنید' });
//       return;
//     }

//     const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
//     const attributeType = this.categoryForm.get('attributeType')?.value;
//     if (attributeName || attributeType) {
//       this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی جدید وارد شده اما اضافه نشده است. لطفاً ابتدا ویژگی را اضافه کنید.' });
//       return;
//     }

//     const categoryDTO: CategoryDTO = {
//       name: this.categoryForm.get('name')?.value,
//       description: this.categoryForm.get('description')?.value || '',
//       parentId: this.categoryForm.get('parentId')?.value || null
//     };

//     const categoryRequest = this.editMode()
//       ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
//       : this.categoryService.addCategory(categoryDTO);

//     categoryRequest.subscribe({
//       next: (category) => {
//         const categoryId = category.id;
//         if (!categoryId) {
//           this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'شناسه دسته‌بندی معتبر نیست.' });
//           return;
//         }

//         const attributeRequests = this.categoryAttributes()
//           .filter(attr => !attr.id)
//           .map(attr => {
//             const categoryAttributeDTO: CategoryAttributeDTO = {
//               id: 0,
//               categoryId,
//               attributeId: attr.attributeId,
//               attributeName: attr.attributeName,
//               attributeType: attr.attributeType,
//               required: attr.required,
//               categoryName: category.name,
//               inherited: false
//             };
//             return this.attributeService.addCategoryAttribute(categoryAttributeDTO);
//           });

//         if (attributeRequests.length > 0) {
//           Promise.all(attributeRequests.map(req => req.toPromise())).then(newCatAttrs => {
//             this.categoryAttributes.update(attrs =>
//               attrs.map(attr => {
//                 const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
//                 return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
//               })
//             );
//             this.finalizeSubmission(category);
//           }).catch(() => {
//             // خطا توسط BaseService با p-toast مدیریت می‌شه
//           });
//         } else {
//           this.finalizeSubmission(category);
//         }
//       },
//       error: () => {
//         // خطا توسط BaseService با p-toast مدیریت می‌شه
//       }
//     });
//   }

//   private finalizeSubmission(category: Category) {
//     this.categoryUpdated.emit();
//     this.loadCategories();
//     this.categoryForm.reset();
//     this.categoryAttributes.set([]);
//     this.editMode.set(false);
//     this.messageService.add({
//       severity: 'success',
//       summary: 'موفق',
//       detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`
//     });
//   }
// }




import { Component, signal, input, output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { Attribute, CategoryAttributeDTO, AttributeType } from '../../models/attribute.model';
import { Category, CategoryDTO, CategoryTreeNodeDTO } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { AttributeService } from '../../services/attribute.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
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
  editMode = signal(false);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      attributeName: [''],
      attributeType: [null],
      required: [false]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.categoryForm.get('parentId')?.valueChanges.subscribe(parentId => {
      this.loadInheritedAttributes(parentId);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoryId'] && this.categoryId() !== null) {
      this.editMode.set(true);
      this.loadFormData();
    } else if (this.categoryId() === null) {
      this.editMode.set(false);
      this.categoryForm.reset();
      this.categoryAttributes.set([]);
      this.inheritedAttributes.set([]);
      this.messageService.add({ severity: 'info', summary: 'اطلاعات', detail: 'فرم برای ایجاد دسته جدید آماده شد' });
    }
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        const flatCategories = this.flattenCategories(cats);
        this.categories.set([
          { label: 'بدون والد', value: null },
          ...flatCategories.map(cat => ({ label: cat.name, value: cat.id }))
        ]);
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  private loadFormData() {
    if (!this.categoryId()) return;
    this.categoryService.getCategory(this.categoryId()!).subscribe({
      next: (category) => {
        this.categoryForm.patchValue({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null
        });
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی با موفقیت لود شد' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
    this.attributeService.getCategoryAttributes(this.categoryId()!, true).subscribe({
      next: (attrs) => {
        this.categoryAttributes.set(attrs.filter(attr => !attr.inherited));
        this.inheritedAttributes.set(attrs.filter(attr => attr.inherited));
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته‌بندی با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  private loadInheritedAttributes(parentId: number | null) {
    if (!parentId) {
      this.inheritedAttributes.set([]);
      return;
    }
    this.attributeService.getCategoryAttributes(parentId, true).subscribe({
      next: (attrs) => {
        this.inheritedAttributes.set(attrs.map(attr => ({
          ...attr,
          inherited: true
        })));
        this.messageService.add({ severity: 'info', summary: 'اطلاعات', detail: 'ویژگی‌های ارث‌بری‌شده لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  private flattenCategories(nodes: CategoryTreeNodeDTO[]): Category[] {
    return nodes.flatMap(node => {
      if (!node.data || !node.data.id) return [];
      return [
        {
          id: node.data.id,
          name: node.label || 'بدون نام',
          description: node.data.description || '',
          parentId: node.data.parentId || null,
          children: []
        },
        ...this.flattenCategories(node.children || [])
      ];
    });
  }

  addAttribute() {
    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;
    const required = this.categoryForm.get('required')?.value;
    if (!attributeName || !attributeType) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'نام و نوع ویژگی اجباری است' });
      return;
    }
    const newAttribute: Attribute = {
      id: 0,
      name: attributeName,
      type: attributeType
    };
    this.attributeService.addAttribute(newAttribute).subscribe({
      next: (addedAttribute) => {
        const newCatAttr: CategoryAttributeDTO = {
          id: 0,
          categoryId: this.categoryId() || 0,
          attributeId: addedAttribute.id,
          attributeName: addedAttribute.name,
          attributeType: addedAttribute.type,
          required: required,
          categoryName: this.categoryForm.get('name')?.value || '',
          inherited: false
        };
        this.categoryAttributes.update(attrs => [...attrs, newCatAttr]);
        this.categoryForm.patchValue({ attributeName: '', attributeType: null, required: false });
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت اضافه شد' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  removeAttribute(index: number) {
    const attr = this.categoryAttributes()[index];
    if (attr.id) {
      this.attributeService.deleteCategoryAttribute(attr.id).subscribe({
        next: () => {
          this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
          this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
        },
        error: () => {
          // خطا توسط BaseService با p-toast مدیریت می‌شه
        }
      });
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
    }
  }

  onSubmit() {
    if (!this.categoryForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً فرم را کامل و صحیح پر کنید' });
      return;
    }

    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;
    if (attributeName || attributeType) {
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'ویژگی جدید وارد شده اما اضافه نشده است. لطفاً ابتدا ویژگی را اضافه کنید.' });
      return;
    }

    const categoryDTO: CategoryDTO = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value || '',
      parentId: this.categoryForm.get('parentId')?.value || null
    };

    const categoryRequest = this.editMode()
      ? this.categoryService.updateCategory(this.categoryId()!, categoryDTO)
      : this.categoryService.addCategory(categoryDTO);

    categoryRequest.subscribe({
      next: (category) => {
        const categoryId = category.id;
        if (!categoryId) {
          this.messageService.add({ severity: 'error', summary: 'خطا', detail: 'شناسه دسته‌بندی معتبر نیست.' });
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
            return this.attributeService.addCategoryAttribute(categoryAttributeDTO);
          });

        if (attributeRequests.length > 0) {
          Promise.all(attributeRequests.map(req => req.toPromise())).then(newCatAttrs => {
            this.categoryAttributes.update(attrs =>
              attrs.map(attr => {
                const newCatAttr = newCatAttrs.find(nca => nca?.attributeId === attr.attributeId && !attr.id);
                return newCatAttr ? { ...attr, id: newCatAttr.id } : attr;
              })
            );
            this.finalizeSubmission(category);
          }).catch(() => {
            // خطا توسط BaseService با p-toast مدیریت می‌شه
          });
        } else {
          this.finalizeSubmission(category);
        }
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  private finalizeSubmission(category: Category) {
    this.categoryUpdated.emit();
    this.loadCategories();
    this.categoryForm.reset();
    this.categoryAttributes.set([]);
    this.inheritedAttributes.set([]);
    this.editMode.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`
    });
  }
}
