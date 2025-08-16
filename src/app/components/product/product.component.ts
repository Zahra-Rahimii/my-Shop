import { Component, signal, OnInit, Input, SimpleChanges, OnChanges, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { AttributeService } from '../../services/attribute.service';
import { ProductDTO } from '../../models/product.model';
import { CategoryTreeNodeDTO } from '../../models/category.model';
import { CategoryAttributeDTO, AttributeType } from '../../models/attribute.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    InputNumberModule,
    MultiSelectModule,
    CardModule,
  ],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductFormComponent implements OnInit, OnChanges {
  productForm!: FormGroup;
  categories = signal<CategoryTreeNodeDTO[]>([]);
  mappedCategories = signal<{ id: number; name: string }[]>([]);
  categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  attributeTypes = signal(Object.values(AttributeType));
  @Input() categoryId!: number | null;
  @Output() productAdded = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService); 

  ngOnInit() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      attributeValues: this.fb.array([])
    });

    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.mappedCategories.set(
          cats.map((cat) => ({ id: cat.data.id, name: cat.label }))
        );
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی‌ها با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });

    this.productForm.get('categoryId')?.valueChanges.subscribe((categoryId) => {
      if (categoryId) {
        this.loadAttributes(categoryId);
      } else {
        this.categoryAttributes.set([]);
        this.attributeValuesFormArray.clear();
      }
    });

    if (this.categoryId) {
      this.productForm.patchValue({ categoryId: this.categoryId });
      this.loadAttributes(this.categoryId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoryId'] && this.categoryId) {
      this.productForm.patchValue({ categoryId: this.categoryId });
      this.loadAttributes(this.categoryId);
    }
  }

  get attributeValuesFormArray(): FormArray {
    return this.productForm.get('attributeValues') as FormArray;
  }

  loadAttributes(categoryId: number) {
    this.attributeService.getCategoryAttributes(categoryId).subscribe({
      next: (attrs) => {
        this.categoryAttributes.set(attrs);
        this.updateAttributeValuesFormArray(attrs);
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'ویژگی‌های دسته با موفقیت لود شدند' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }

  updateAttributeValuesFormArray(attributes: CategoryAttributeDTO[]) {
    this.attributeValuesFormArray.clear();
    attributes.forEach((attr) => {
      const validator = attr.required ? [Validators.required] : [];
      this.attributeValuesFormArray.push(
        this.fb.group({
          attributeId: [attr.attributeId],
          value: new FormControl(
            attr.attributeType === AttributeType.BOOLEAN
              ? false
              : attr.attributeType === AttributeType.MULTISELECT
              ? []
              : '',
            validator
          )
        })
      );
    });
  }

  getValueControl(index: number): FormControl {
    const control = this.attributeValuesFormArray.at(index).get('value');
    if (!control) {
      throw new Error(`FormControl at index ${index} is null`);
    }
    return control as FormControl;
  }

  onSubmit() {
    if (!this.productForm.valid) {
      this.messageService.clear(); 
      this.messageService.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً فرم را کامل و صحیح پر کنید.' });
      return;
    }
    const attributes = this.attributeValuesFormArray.value.map((val: any, i: number) => {
      const attr = this.categoryAttributes()[i];
      let value: any = val.value;

      switch (attr.attributeType) {
        case AttributeType.NUMBER:
          value = value !== null && value !== undefined ? Number(value) : 0;
          break;
        case AttributeType.BOOLEAN:
          value = Boolean(value);
          break;
        case AttributeType.MULTISELECT:
          value = Array.isArray(value) ? value.join(',') : '';
          break;
        case AttributeType.SELECT:
          value = value != null ? value.toString() : '';
          break;
        default:
          value = value != null ? value.toString() : '';
      }

      return {
        attributeId: attr.attributeId,
        value
      };
    });

    const productDTO: ProductDTO = {
      title: this.productForm.get('title')?.value?.toString() || '',
      description: this.productForm.get('description')?.value?.toString() || '',
      price: Number(this.productForm.get('price')?.value) || 0,
      stock: Number(this.productForm.get('stock')?.value) || 0,
      categoryId: Number(this.productForm.get('categoryId')?.value),
      attributeValues: attributes
    };

    this.productService.addProduct(productDTO).subscribe({
      next: () => {
        this.productForm.reset();
        this.categoryAttributes.set([]);
        this.attributeValuesFormArray.clear();
        this.productAdded.emit();
        this.messageService.clear(); 
        this.messageService.add({ severity: 'success', summary: 'موفق', detail: 'محصول با موفقیت اضافه شد' });
      },
      error: () => {
        // خطا توسط BaseService با p-toast مدیریت می‌شه
      }
    });
  }
}