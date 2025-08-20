import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TreeNode } from 'primeng/api';
import { CategoryAttributeDTO } from '../../../models/attribute.model';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-attributes.component.html' ,
  styleUrls: ['./category-attributes.component.css']
})
export class CategoryAttributesComponent {
  private router = inject(Router);
  node: TreeNode | null = null;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.node = navigation?.extras.state?.['node'] || null;
  }

  goBack() {
    this.router.navigate(['/']); // یا مسیر مناسب دیگر
  }
}