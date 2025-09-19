import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown'; // جایگزین SelectModule
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TreeNode } from 'primeng/api';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { CategoryService } from '../../../services/category.service';
import { AttributeService } from '../../../services/attribute.service';
import { CategoryAttributeDTO, Attribute, AttributeType } from '../../../models/attribute.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    ButtonModule,
    InputTextModule,
    DropdownModule, // اصلاح به DropdownModule
    CheckboxModule,
    TableModule,
  ],
  templateUrl: './category-attributes.component.html',
  styleUrls: ['./category-attributes.component.css'],
})
export class CategoryAttributesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private attributeService = inject(AttributeService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private queryClient = injectQueryClient();

  attributeForm: FormGroup;
  attributeTypes = signal([
    { label: 'رشته', value: AttributeType.STRING },
    { label: 'عدد', value: AttributeType.NUMBER },
    { label: 'بولی', value: AttributeType.BOOLEAN },
    { label: 'انتخابی', value: AttributeType.SELECT },
    { label: 'چند انتخابی', value: AttributeType.MULTISELECT },
  ]);

  constructor() {
    this.attributeForm = this.fb.group({
      name: ['', Validators.required],
      type: [null, Validators.required],
      required: [false],
    });

    const navigation = this.router.getCurrentNavigation();
    const nodeFromState = navigation?.extras.state?.['node'] || null;

    if (!nodeFromState) {
      const categoryId = this.route.snapshot.paramMap.get('id');
      if (!categoryId) {
        this.router.navigate(['/']);
      }
    }
  }

  private toPromise<T>(observable: any): Promise<T> {
    return lastValueFrom(observable.pipe(take(1))) as Promise<T>;
  }

  private async fetchAllInheritedAttributes(categoryId: number): Promise<CategoryAttributeDTO[]> {
  try {
    const categoryChain: Category[] = [];

    // مرحله ۱: جمع کردن همه والدها تا ریشه
    let currentId: number | null = categoryId;
    const seenCategoryIds = new Set<number>();

    while (currentId !== null && !seenCategoryIds.has(currentId)) {
      seenCategoryIds.add(currentId);

      const category: Category = await this.toPromise<Category>(
        this.categoryService.getCategory(currentId)
      );

      categoryChain.push(category);
      currentId = category.parentId;
    }

    // برعکس کن: حالا ترتیب ریشه تا فرزند داریم
    categoryChain.reverse();

    // مرحله ۲: گرفتن ویژگی‌ها و برچسب‌گذاری inherited
    const seenAttributeIds = new Set<number>();
    const collected: CategoryAttributeDTO[] = [];

    for (let i = 0; i < categoryChain.length; i++) {
      const cat = categoryChain[i];
      const attrs = await this.toPromise<CategoryAttributeDTO[]>(
        this.attributeService.getCategoryAttributes(cat.id!)
      );

      attrs.forEach(attr => {
        if (!seenAttributeIds.has(attr.attributeId)) {
          seenAttributeIds.add(attr.attributeId);
          collected.push({
  ...attr,
  inherited: i < categoryChain.length - 1,
  categoryId: cat.id!,
  categoryName: cat.name
});

        }
      });
    }

    console.log('Final collected attributes:', collected);
    return collected;

  } catch (error: unknown) {
    console.error(`Error fetching attributes for category ${categoryId}:`, error);
    this.messageService.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده: ' + ((error instanceof Error) ? error.message : 'نامشخص'),
      life: 3000
    });
    return [];
  }
}

  query = injectQuery(() => {
    const categoryId = this.route.snapshot.paramMap.get('id');
    return {
      queryKey: ['category-attributes', categoryId],
      queryFn: () => this.fetchAllInheritedAttributes(Number(categoryId)),
      enabled: !!categoryId,
      staleTime: 5 * 60 * 1000,
      onSuccess: (data: CategoryAttributeDTO[]) => {
        console.log('Query success, final attributes:', data);
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ویژگی‌ها با موفقیت لود شدند',
          life: 3000,
        });
      },
      onError: (error: Error) => {
        console.error('Query error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در بارگذاری ویژگی‌ها: ' + (error.message || 'مشکل ناشناخته'),
          life: 3000,
        });
      },
    };
  });

  addAttributeMutation = injectMutation(() => ({
    mutationFn: (newAttribute: Attribute) =>
      this.toPromise<Attribute>(this.attributeService.addAttribute(newAttribute)),
    onSuccess: async (addedAttribute: Attribute) => {
      const categoryId = Number(this.route.snapshot.paramMap.get('id'));
      const newCatAttr: CategoryAttributeDTO = {
        id: 0,
        categoryId,
        attributeId: addedAttribute.id,
        attributeName: addedAttribute.name,
        attributeType: addedAttribute.type,
        required: this.attributeForm.get('required')?.value || false,
        categoryName: this.node?.label || '',
        inherited: false,
      };
      try {
        await this.toPromise<CategoryAttributeDTO>(
          this.attributeService.addCategoryAttribute(newCatAttr)
        );
        this.queryClient.invalidateQueries({ queryKey: ['category-attributes', categoryId] });
        this.queryClient.invalidateQueries({ queryKey: ['categories'] }); // برای تازه کردن درخت
        this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.route.snapshot.paramMap.get('id')] });
        this.attributeForm.reset();
        this.messageService.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ویژگی با موفقیت اضافه شد',
          life: 3000,
        });
      } catch (error) {
        console.error('Error adding category attribute:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در اضافه کردن ویژگی به دسته‌بندی',
          life: 3000,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error adding attribute:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در اضافه کردن ویژگی: ' + (error.message || 'مشکل ناشناخته'),
        life: 3000,
      });
    },
  }));

  deleteAttributeMutation = injectMutation(() => ({
    mutationFn: (id: number) =>
      this.toPromise<void>(this.attributeService.deleteCategoryAttribute(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['category-attributes', this.route.snapshot.paramMap.get('id')] });
      this.messageService.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'ویژگی با موفقیت حذف شد',
        life: 3000,
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting attribute:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در حذف ویژگی: ' + (error.message || 'مشکل ناشناخته'),
        life: 3000,
      });
    },
  }));

  get node(): TreeNode | null {
    const categoryId = this.route.snapshot.paramMap.get('id');
    if (!categoryId || this.query.isLoading() || this.query.isError() || !this.query.data()) {
      return null;
    }

    return {
      key: categoryId,
      label: this.query.data()?.find(attr => attr.categoryId === Number(categoryId))?.categoryName || 'دسته‌بندی',
      data: { id: Number(categoryId), description: '', attributes: this.query.data() },
      children: [],
      expanded: false,
    };
  }

  get isLoading(): boolean {
    return this.query.isLoading();
  }

  get isError(): boolean {
    return this.query.isError();
  }

  addAttribute() {
    if (!this.attributeForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'نام و نوع ویژگی اجباری است',
        life: 3000,
      });
      return;
    }

    const newAttribute: Attribute = {
      id: 0,
      name: this.attributeForm.get('name')?.value.trim(),
      type: this.attributeForm.get('type')?.value,
    };

    const existingAttribute = this.node?.data?.attributes?.find(
      (attr: { attributeName: string }) => attr.attributeName.toLowerCase() === newAttribute.name.toLowerCase()
    );
    if (existingAttribute) {
      this.messageService.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'ویژگی با این نام قبلاً وجود دارد',
        life: 3000,
      });
      return;
    }

    this.addAttributeMutation.mutate(newAttribute);
  }

  deleteAttribute(id: number) {
    this.deleteAttributeMutation.mutate(id);
  }

  goBack() {
    this.router.navigate(['category-management']);
  }

  trackByAttribute(_: number, attr: CategoryAttributeDTO) {
    return attr.id;
  }

  get sortedAttributes(): CategoryAttributeDTO[] {
  if (!this.node?.data?.attributes) return [];
  return [...this.node.data.attributes].sort((a, b) => {
    if (a.inherited === b.inherited) return 0;
    return a.inherited ? 1 : -1; // غیرارثی (false) اول، ارثی (true) بعد
  });
}

}