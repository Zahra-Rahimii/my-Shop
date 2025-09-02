import {
  Component,
  effect,
  EventEmitter,
  inject,
  Input,
  input,
  OnChanges,
  OnInit,
  output,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
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
import { debounceTime, firstValueFrom, forkJoin } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import {
  AttributeType,
  CategoryAttributeDTO,
} from '../../../models/attribute.model';
import {
  CategoryTreeNodeDTO,
  ProductCondition,
} from '../../../models/category.model';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ProductDTO } from '../../../models/product.model';
import { ActivatedRoute } from '@angular/router';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

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
    TreeSelectModule,
    AutoCompleteModule,
    ChipsModule,
    CardModule,
    RadioButtonModule,
  ],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() productToEdit: ProductDTO | null = null;

  editingProductId = signal<number | null>(null);
  productForm!: FormGroup;
  categories = signal<any[]>([]);
  categoryAttributes = signal<CategoryAttributeDTO[]>([]);
  selectOptions = signal<{ [key: number]: any[] }>({});
  attributeTypes = signal(Object.values(AttributeType));
  categoryId = input<number | null>(null);
  productAdded = output<void>();
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  attributesQuery: any; //////////



  
  productImages: File[] = [];
  productImagesPreview: string[] = [];


  //  mutation for form value changes
  // formValueMutation = injectMutation(() => ({
  //   mutationFn: (formValue: any) => {
  //     console.log('Form changed:', formValue);
  //     return Promise.resolve();
  //   },
  // }));

  // Fetch categories
  categoriesQuery = injectQuery(() => ({
    queryKey: ['categories'],
    queryFn: () =>
      //HttpClient.get returns an Observable.
      // But @tanstack/angular-query expects the queryFn to return a Promise  so i use firstValueForm
      firstValueFrom(
        this.http.get<CategoryTreeNodeDTO[]>(`${environment.apiUrl}/categories`)
      ),
    // .subscribe((res) => console.log(res)),
    onSuccess: (res: CategoryTreeNodeDTO[]) => {
      console.log('Categories loaded:', res);
      this.categories.set(res);
    },
    onError: (err: unknown) => {
      console.error('Failed to load categories', err);
    },
  }));

  // Fetch products (for editing)
  productsQuery = injectQuery(() => ({
    queryKey: ['products'],
    queryFn: () =>
      this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`).toPromise(),
    enabled: !!this.editingProductId(), // only fetch if editing
  }));

  // Product add/update
  // productMutation = injectMutation(() => ({
  //   mutationFn: (productDTO: ProductDTO) => {
  //     if (this.editingProductId() !== null) {
  //       return this.http
  //         .put<ProductDTO>(
  //           `${environment.apiUrl}/products/${this.editingProductId()}`,
  //           productDTO
  //         )
  //         .toPromise();
  //     }
  //     return this.http
  //       .post<ProductDTO>(`${environment.apiUrl}/products`, productDTO)
  //       .toPromise();
  productMutation = injectMutation(() => ({
    mutationFn: async (formData: FormData) => {
      if (this.editingProductId() !== null) {
        return await firstValueFrom(
          this.http.put(`${environment.apiUrl}/products/${this.editingProductId()}`, formData)
        );
      }
      return await firstValueFrom(
        this.http.post(`${environment.apiUrl}/products`, formData)
      );
    },
    onSuccess: () => {
      this.resetForm();
      this.productAdded.emit();
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'محصول با موفقیت ثبت شد',
        life: 3000,
      });
    },
    onError: (err) => {
      console.error('Product mutation failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'عملیات ثبت محصول ناموفق بود', 
        life: 3000, 
      });
    }, 
  }));

  result = this.categoriesQuery;
  selectedFiles: any;

  ngOnInit() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null],
      condition: ['new', Validators.required],
      attributeValues: this.fb.array([]),
    });

    // Subscribe to form changes
    // this.productForm.valueChanges
    // .pipe(debounceTime(300))
    // .subscribe((v) => this.formValueMutation.mutate(v)); //HERE!

    this.productForm.get('categoryId')?.valueChanges.subscribe((categoryId) => {
      if (categoryId) {
        this.loadAttributes(categoryId);
      } else {
        this.categoryAttributes.set([]);
        this.attributeValuesFormArray.clear();
      }
    });

    if (this.categoryId()) {
      this.productForm.patchValue({ categoryId: this.categoryId() });
      this.loadAttributes(this.categoryId()!);
    }

    // Edit mode check
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingProductId.set(Number(id));
      this.productService.getProducts().subscribe({
        next: (products) => {
          const product = products.find((p) => p.id === Number(id));
          if (product) {
            this.patchForm(product);
          }
        },
        error: (err) => console.error(err),
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoryId'] && this.categoryId()) {
      this.productForm.patchValue({ categoryId: this.categoryId() });
      this.loadAttributes(this.categoryId()!);
    }
    if (changes['productToEdit'] && this.productToEdit) {
      this.productForm.patchValue({ title: this.productToEdit.title });
      this.editingProductId.set(this.productToEdit.id);
    }
  }

  // private fillForm(product: ProductDTO) {
  //   this.editingProductId.set(product.id);
  //   this.productForm.patchValue({
  //     title: product.title,
  //     description: product.description,
  //     price: product.price,
  //     stock: product.stock,
  //     categoryId: product.categoryId,
  //     condition: product.condition,
  //   });
  // }

  private patchForm(product: ProductDTO) {
    this.productForm.patchValue({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      condition: product.condition ?? 'new',
    });

    if (product.categoryId) {
      this.loadAttributes(product.categoryId);

      product.attributeValues?.forEach((val) => {
        const index = this.categoryAttributes().findIndex(
          (attr) => attr.attributeId === val.attributeId
        );
        if (index !== -1) {
          this.getValueControl(index).setValue(val.value);
        }
      });
    }
  }

  mapToTreeNodes(categories: CategoryTreeNodeDTO[]): any[] {
    return categories.map((cat) => ({
      key: cat.key ?? String(cat.data.id),
      label: cat.label || cat.data.description || 'بدون نام',
      data: cat.data,
      children: cat.children ? this.mapToTreeNodes(cat.children) : [],
    }));
  }

  onCategorySelect(event: any) {
    const categoryId = event.node?.data?.id;
    if (categoryId) {
      this.productForm.patchValue({ categoryId });
    }
  }
  // onCategorySelect(event: any) {
  //   const categoryId = event.node?.data?.id;
  //   if (categoryId) {
  //     this.productForm.patchValue({ categoryId });
  //     this.loadAttributes(categoryId);
  //   } else {
  //     this.messageService.add({
  //       severity: 'warn',
  //       summary: 'هشدار',
  //       detail: 'دسته‌بندی نامعتبر انتخاب شد',
  //       life: 3000,
  //     });
  //   }
  // }

  get attributeValuesFormArray(): FormArray {
    return this.productForm.get('attributeValues') as FormArray;
  }

  // Updated loadAttributes  
  loadAttributes(categoryId: number) {
    this.attributesQuery = injectQuery(() => ({
      queryKey: ['categoryAttributes', categoryId],
      queryFn: () =>
        this.http
          .get<CategoryAttributeDTO[]>(
            // `${environment.apiUrl}/CategoryAttributeDTO?categoryId=${categoryId}`
            `${environment.apiUrl}/CategoryAttributeDTO`
          )
          .toPromise(),
      onSuccess: (attrs: any[]) => {
        this.categoryAttributes.set(attrs);
        this.updateAttributeValuesFormArray(attrs);
        attrs.forEach((attr) => {
          if (
            attr.attributeType === AttributeType.SELECT ||
            attr.attributeType === AttributeType.MULTISELECT
          ) {
            this.loadSelectOptions(attr.attributeId);
          }
        });
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ویژگی‌های دسته با موفقیت لود شدند',
          life: 3000,
        });
      },
      onError: (err: any) => {
        console.error('Failed to load category attributes:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا', 
          detail: 'ویژگی‌های دسته بارگیری نشدند', 
          life: 3000, 
        }); 
      },
    }));
  }

  loadSelectOptions(attributeId: number) {
    const mockOptions = [
      { label: 'گزینه ۱', value: 'گزینه ۱' },
      { label: 'گزینه ۲', value: 'گزینه ۲' },
    ];
    this.selectOptions.update((options) => ({
      ...options,
      [attributeId]: mockOptions,
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

  resetForm() {
    this.productForm.reset();
    this.editingProductId.set(null);
    this.categoryAttributes.set([]);
    this.attributeValuesFormArray.clear();
  }







  ////////////////////

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }
  
  addFiles(files: FileList) {
    Array.from(files).forEach(file => {
      this.productImages.push(file);
  
      // 👇 Log details about the file 
      console.log('📂 File ready to send:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productImagesPreview.push(e.target.result);
  
        // 👇 If you want to log the Base64 preview address (what frontend sees)
        // console.log('🖼️ Preview Base64 URL:', e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }
  
  removeImage(index: number) {
    this.productImages.splice(index, 1);
    this.productImagesPreview.splice(index, 1);
  }





//////////////////////

  onSubmit() {
    if (!this.productForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'لطفاً فرم را کامل و صحیح پر کنید.',
        life: 3000,
      });
      return;
    }

    const attributes = this.attributeValuesFormArray.value.map(
      (val: any, i: number) => {
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
          value,
        };
      }
    );

///////////////////
if (!this.productForm.valid) return;

const formData = new FormData();
formData.append(
  'product',
  new Blob([JSON.stringify(this.productForm.value)], { type: 'application/json' })
);

this.productImages.forEach(file => {
  formData.append('files', file, file.name);

  // 👇 Log the exact form-data entry you’re sending
  console.log(`📤 Sending file to backend: ${file.name}`);
});

// Mutation / API call
this.productMutation.mutate(formData as any);

console.log('🚀 Full FormData ready to send:', formData);

//////////////////

    // const productDTO: ProductDTO = {
    //   title: this.productForm.get('title')?.value?.toString() || '',
    //   description: this.productForm.get('description')?.value?.toString() || '',
    //   price: Number(this.productForm.get('price')?.value) || 0,
    //   stock: Number(this.productForm.get('stock')?.value) || 0,
    //   categoryId: Number(this.productForm.get('categoryId')?.value),
    //   attributeValues: attributes,
    //   condition:
    //     this.productForm.get('condition')?.value ?? ProductCondition.NEW,
    //   id: 0,
    // };
    // this.productMutation.mutate(productDTO);
  }
}
