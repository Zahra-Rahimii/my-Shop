import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
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
    SelectModule,
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

  private async fetchAllInheritedAttributes(categoryId: number, collected: CategoryAttributeDTO[] = [], isRoot: boolean = true): Promise<CategoryAttributeDTO[]> {
    try {
      const category: Category = await this.toPromise(this.categoryService.getCategory(categoryId));
      console.log(`Fetching attributes for category: ${categoryId} (${category.name}), isRoot: ${isRoot}`);
      const seenCategoryIds = new Set(collected.map(attr => attr.categoryId).filter(id => id !== undefined));
      if (seenCategoryIds.has(categoryId)) {
        console.log(`Cycle detected for category: ${categoryId}, stopping recursion`);
        return collected;
      }
      const attrs = await this.toPromise(this.attributeService.getCategoryAttributes(categoryId)) as CategoryAttributeDTO[];
      console.log(`Attributes for category ${categoryId}:`, attrs);
      const seenAttributeIds = new Set(collected.map(attr => attr.attributeId));
      const uniqueAttrs = attrs
        .filter((attr: { attributeId: number; }) => !seenAttributeIds.has(attr.attributeId))
        .map((attr: any) => ({
          ...attr,
          inherited: !isRoot,
          inheritedFrom: !isRoot ? category.name : undefined,
          categoryId, // اطمینان از تنظیم categoryId درست
        }));
      uniqueAttrs.forEach((attr: { attributeId: number; }) => seenAttributeIds.add(attr.attributeId));
      // ویژگی‌های دسته فعلی اول، سپس ویژگی‌های والدها
      const merged = isRoot ? [...uniqueAttrs, ...collected] : [...collected, ...uniqueAttrs];
      console.log(`Merged attributes for category ${categoryId}:`, merged);
      return category.parentId ? this.fetchAllInheritedAttributes(category.parentId, merged, false) : merged;
    } catch (error: unknown) {
      console.error(`Error fetching attributes for category ${categoryId}:`, error);
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'خطا در بارگذاری ویژگی‌های ارث‌بری‌شده: ' + ((error instanceof Error) ? error.message : 'مشکل ناشناخته'),
        life: 3000,
      });
      return collected;
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
        console.log('Query success, attributes:', data);
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
      (      attr: { attributeName: string; }) => attr.attributeName.toLowerCase() === newAttribute.name.toLowerCase()
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
}