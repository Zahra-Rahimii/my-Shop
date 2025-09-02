import { Component, inject, signal, input, output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreeSelectModule } from 'primeng/treeselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipsModule } from 'primeng/chips';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { AttributeType, CategoryAttributeDTO } from '../../../models/attribute.model';
import { CategoryTreeNodeDTO, ProductCondition, Category } from '../../../models/category.model';
import { ProductDTO, Product, ProductAttributeValueDTO } from '../../../models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    MultiSelectModule,
    TreeSelectModule,
    AutoCompleteModule,
    ChipsModule,
    CardModule,
    RadioButtonModule,
    ProgressSpinnerModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit, OnChanges {
  editingProductId = input<number | null>(null);
  productAdded = output<void>();
  productForm: FormGroup;
  categories = signal<any[]>([]);
  categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  selectOptions = signal<{ [key: number]: any[] }>({});
  attributeTypes = signal(Object.values(AttributeType));
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private queryClient = injectQueryClient();

  constructor() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      condition: ['new', Validators.required],
      attributeValues: this.fb.array([])
    });
  }

  ngOnInit() {
    this.categoriesQuery.refetch();
    this.productForm.get('categoryId')?.valueChanges.subscribe((categoryId: number | null) => {
      if (categoryId) {
        this.attributesQuery.refetch();
      } else {
        this.categoryAttributes.set([]);
        this.attributeValuesFormArray.clear();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingProductId'] && this.editingProductId()) {
      this.productQuery.refetch();
    }
  }

  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await this.categoryService.getCategories().data() ?? [];
      return this.mapToTreeNodes(cats);
    },
    onSuccess: (data: any[]) => {
      this.categories.set(data);
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'دسته‌بندی‌ها با موفقیت لود شدند',
        life: 3000
      });
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message || 'خطا در بارگذاری دسته‌بندی‌ها',
        life: 3000
      });
    }
  }));

  attributesQuery = injectQuery(() => ({
    queryKey: ['category-attributes', this.productForm.get('categoryId')?.value],
    queryFn: async () => {
      const categoryId = this.productForm.get('categoryId')?.value;
      if (!categoryId) return [];
      const attrs = await this.loadAllInheritedAttributes(categoryId);
      this.updateAttributeValuesFormArray(attrs);
      attrs.forEach((attr: CategoryAttributeDTO) => {
        if (attr.attributeType === AttributeType.SELECT || attr.attributeType === AttributeType.MULTISELECT) {
          this.loadSelectOptions(attr.attributeId);
        }
      });
      return attrs;
    },
    enabled: !!this.productForm.get('categoryId')?.value,
    onSuccess: (attrs: CategoryAttributeDTO[]) => {
      this.categoryAttributes.set(attrs);
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی‌های دسته با موفقیت لود شدند',
        life: 3000
      });
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message || 'خطا در بارگذاری ویژگی‌ها',
        life: 3000
      });
    }
  }));

  productQuery = injectQuery(() => ({
    queryKey: ['product', this.editingProductId()],
    queryFn: async () => {
      if (!this.editingProductId()) return null;
      const product = await this.productService.getProduct(this.editingProductId()!);
      return product ?? null;
    },
    enabled: !!this.editingProductId(),
    onSuccess: (product: Product | null) => {
      if (product) {
        this.productForm.patchValue({
          title: product.title,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          condition: product.condition
        });
        product.attributeValues.forEach((attr) => {
          const index = this.attributeValuesFormArray.controls.findIndex(
            (control) => control.get('attributeId')?.value === attr.attributeId
          );
          if (index >= 0) {
            this.attributeValuesFormArray.at(index).patchValue({ value: attr.value });
          }
        });
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'محصول با موفقیت لود شد',
          life: 3000
        });
      }
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message || 'خطا در بارگذاری محصول',
        life: 3000
      });
    }
  }));

  addProductMutation = injectMutation(() => ({
    mutationFn: async (product: ProductDTO): Promise<Product | null> => {
      const result = this.editingProductId()
        ? await this.productService.updateProduct(this.editingProductId()!, product)
        : await this.productService.addProduct(product);
      return result ?? null;
    },
    onSuccess: (product: Product | null) => {
      if (!product) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'محصول دریافت نشد',
          life: 3000
        });
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
        return { attributeId: attr.attributeId, value };
      });

      const attributeRequests = attributes
        .filter((attr: ProductAttributeValueDTO) => attr.value)
        .map((attr: ProductAttributeValueDTO) => this.productService.addProductAttribute(attr));

      if (attributeRequests.length > 0) {
        Promise.all(attributeRequests).then(() => {
          this.finalizeSubmission(product);
        }).catch((err: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'خطا',
            detail: err.message || 'خطا در افزودن ویژگی‌های محصول',
            life: 3000
          });
        });
      } else {
        this.finalizeSubmission(product);
      }
    },
    onError: (err: Error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err.message || 'خطا در ثبت محصول',
        life: 3000
      });
    }
  }));

  private async loadAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = []): Promise<CategoryAttributeDTO[]> {
    const categoryQuery = this.categoryService.getCategory(categoryId);
    const attrsQuery = this.attributeService.getCategoryAttributes(categoryId);

    const category = await categoryQuery.data() ?? null;
    const attrs = await attrsQuery.data() ?? [];
    const merged = [...collected, ...attrs.map((a: CategoryAttributeDTO) => ({ ...a, inherited: collected.length > 0 }))];

    if (category?.parentId) {
      return this.loadAllInheritedAttributes(category.parentId, merged);
    }
    return merged;
  }

  mapToTreeNodes(categories: CategoryTreeNodeDTO[]): any[] {
    return categories
      .filter((cat) => cat && cat.data && cat.data.id != null)
      .map((cat) => ({
        key: cat.key,
        label: cat.label || 'بدون نام',
        data: { id: cat.data.id },
        children: cat.children ? this.mapToTreeNodes(cat.children) : []
      }));
  }

  onCategorySelect(event: any) {
    const categoryId = event.node?.data?.id;
    if (categoryId) {
      this.productForm.patchValue({ categoryId });
      this.attributesQuery.refetch();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'دسته‌بندی نامعتبر انتخاب شد',
        life: 3000
      });
    }
  }

  get attributeValuesFormArray(): FormArray {
    return this.productForm.get('attributeValues') as FormArray;
  }

  loadSelectOptions(attributeId: number) {
    // Replace with actual API call if available
    const mockOptions = [
      { label: 'گزینه ۱', value: 'گزینه ۱' },
      { label: 'گزینه ۲', value: 'گزینه ۲' }
    ];
    this.selectOptions.update((options) => ({
      ...options,
      [attributeId]: mockOptions
    }));
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

  resetForm() {
    this.productForm.reset({
      title: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: null,
      condition: 'new',
      attributeValues: []
    });
    this.categoryAttributes.set([]);
    this.attributeValuesFormArray.clear();
  }

  onSubmit() {
    if (!this.productForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'لطفاً فرم را کامل و صحیح پر کنید.',
        life: 3000
      });
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
      return { attributeId: attr.attributeId, value };
    });

    const productDTO: ProductDTO = {
      id: this.editingProductId() || 0,
      title: this.productForm.get('title')?.value?.toString() || '',
      description: this.productForm.get('description')?.value?.toString() || '',
      price: Number(this.productForm.get('price')?.value) || 0,
      stock: Number(this.productForm.get('stock')?.value) || 0,
      categoryId: Number(this.productForm.get('categoryId')?.value),
      attributeValues: attributes,
      condition: this.productForm.get('condition')?.value || ProductCondition.NEW
    };

    this.addProductMutation.mutate(productDTO);
  }

  private finalizeSubmission(product: Product) {
    this.productAdded.emit();
    this.queryClient.invalidateQueries({ queryKey: ['products'] });
    this.resetForm();
    this.messageService.add({
      severity: 'success',
      summary: 'موفق',
      detail: `محصول "${product.title}" با موفقیت ${this.editingProductId() ? 'ویرایش' : 'اضافه'} شد`,
      life: 3000
    });
  }
}