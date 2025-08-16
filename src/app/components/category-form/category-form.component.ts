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
      this.messageService.clear(); 
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
        this.messageService.clear(); 
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
        this.messageService.clear(); 
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
        this.messageService.clear(); 
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
        this.messageService.clear(); 
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
      this.messageService.clear(); 
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
        this.messageService.clear(); 
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
          this.messageService.clear(); 
          this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
        },
        error: () => {
          // خطا توسط BaseService با p-toast مدیریت می‌شه
        }
      });
    } else {
      this.categoryAttributes.update(attrs => attrs.filter((_, i) => i !== index));
      this.messageService.clear(); 
      this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی با موفقیت حذف شد' });
    }
  }

  onSubmit() {
    if (!this.categoryForm.valid) {
      this.messageService.clear(); 
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً فرم را کامل و صحیح پر کنید' });
      return;
    }

    const attributeName = this.categoryForm.get('attributeName')?.value?.trim();
    const attributeType = this.categoryForm.get('attributeType')?.value;
    if (attributeName || attributeType) {
      this.messageService.clear(); 
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
          this.messageService.clear(); 
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
    this.messageService.clear(); 
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `دسته‌بندی "${category.name}" با موفقیت ${this.editMode() ? 'ویرایش' : 'ایجاد'} شد`
    });
  }
}
