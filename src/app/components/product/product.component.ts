import { Component, signal, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { AttributeService } from '../../services/attribute.service';
import { ProductDTO } from '../../models/product.model';
import { CategoryTreeNodeDTO } from '../../models/category.model';
import { CategoryAttribute, AttributeType } from '../../models/attribute.model';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown'; // تغییر به DropdownModule
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule, // تغییر به DropdownModule
    CheckboxModule,
    ButtonModule,
    InputNumberModule,
    MultiSelectModule,
  ],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductFormComponent implements OnInit, OnChanges {
  productForm!: FormGroup;
  categories = signal<CategoryTreeNodeDTO[]>([]);
  flatCategories = signal<{ id: number; label: string }[]>([]);
  categoryAttributes = signal<CategoryAttribute[]>([]);
  attributeTypes = signal(Object.values(AttributeType));

  @Input() categoryId!: number;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private attributeService: AttributeService
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      attributeValues: this.fb.array([]),
    });

    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        console.log('دسته‌بندی‌های دریافتی:', JSON.stringify(cats, null, 2));
        this.categories.set(cats);
        this.flatCategories.set(this.flattenCategories(cats));
        console.log('flatCategories:', JSON.stringify(this.flatCategories(), null, 2));
        if (cats.length === 0) {
          console.warn('هیچ دسته‌بندی‌ای دریافت نشد!');
          alert('هیچ دسته‌بندی‌ای موجود نیست. لطفاً ابتدا دسته‌بندی اضافه کنید.');
        }
      },
      error: (err) => {
        console.error('خطا در لود دسته‌بندی‌ها:', err);
        alert('خطایی در لود دسته‌بندی‌ها رخ داد: ' + err.message);
        this.categories.set([]);
        this.flatCategories.set([]);
      }
    });

    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
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

  get attributeValuesFormArray() {
    return this.productForm.get('attributeValues') as FormArray;
  }

  loadAttributes(categoryId: number) {
    this.attributeService.getCategoryAttributes(categoryId).subscribe({
      next: attrs => {
        this.categoryAttributes.set(attrs);
        this.updateAttributeValuesFormArray(attrs);
      },
      error: err => {
        console.error('Error loading attributes:', err);
        this.categoryAttributes.set([]);
        this.attributeValuesFormArray.clear();
      },
    });
  }

  updateAttributeValuesFormArray(attributes: CategoryAttribute[]) {
    this.attributeValuesFormArray.clear();
    attributes.forEach(attr => {
      const validator = attr.required ? Validators.required : null;
      this.attributeValuesFormArray.push(
        this.fb.group({
          attributeId: [attr.attributeId],
          value: new FormControl(
            attr.attributeType === AttributeType.BOOLEAN ? false
              : attr.attributeType === AttributeType.MULTISELECT ? []
              : '',
            validator
          ),
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

  flattenCategories(categories: CategoryTreeNodeDTO[]): { id: number; label: string }[] {
    const result: { id: number; label: string }[] = [];
    const flatten = (cats: CategoryTreeNodeDTO[], prefix: string = '') => {
      cats
        .filter(cat => cat && cat.data && cat.data.id != null && cat.label)
        .forEach(cat => {
          result.push({
            id: cat.data.id,
            label: prefix + (cat.label || 'بدون نام'),
          });
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children, prefix + (cat.label || 'بدون نام') + ' > ');
          }
        });
    };
    flatten(categories);
    return result;
  }

  onSubmit() {
    if (this.productForm.valid) {
      const productDTO: ProductDTO = {
        title: this.productForm.get('title')?.value,
        description: this.productForm.get('description')?.value,
        price: Number(this.productForm.get('price')?.value.toFixed(2)),
        stock: this.productForm.get('stock')?.value,
        categoryId: this.productForm.get('categoryId')?.value,
        attributeValues: this.attributeValuesFormArray.value.map((val: any) => ({
          attributeId: val.attributeId,
          value: Array.isArray(val.value) ? val.value.join(',') : val.value.toString(),
        })),
      };
      console.log('ProductDTO برای ارسال:', JSON.stringify(productDTO, null, 2));
      this.productService.addProduct(productDTO).subscribe({
        next: () => {
          this.productForm.reset();
          this.categoryAttributes.set([]);
          this.attributeValuesFormArray.clear();
        },
        error: (err) => {
          console.error('خطا در افزودن محصول:', err);
          alert('خطایی در افزودن محصول رخ داد.');
        }
      });
    } else {
      alert('لطفا فرم را کامل و صحیح پر کنید.');
    }
  }
}