import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { InputIcon } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    AvatarModule,
    MenubarModule,
    InputTextModule,
    InputIcon
  ],
})
export class HeaderComponent {
  items: MenuItem[];
  currentRoute: string = '';

  constructor(private router: Router) {
    this.items = [
      { label: 'خانه', icon: 'pi pi-home', command: () => this.navigateTo('home') },
      { 
        label: 'دسته‌بندی‌ها', icon: 'pi pi-list', items: [
          { label: 'افزودن دسته‌بندی جدید', icon: 'pi pi-plus', command: () => this.navigateTo('category-management') },
          { label: 'مشاهده دسته‌بندی‌ها', command: () => this.navigateTo('categories') },
        ]
      },
      { 
        label: 'محصولات', icon: 'pi pi-tags', items: [
          { label: 'افزودن محصولات', icon: 'pi pi-plus', command: () => this.navigateTo('add-product') },
          { label: 'لیست محصولات', command: () => this.navigateTo('product-list') },
        ]
      },
      { label: 'حساب کاربری', icon: 'pi pi-user', command: () => this.navigateTo('admin') },
    ];

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}