import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../../../shared/services/product/product.service';
import { ProductSelectModel } from '../../../../shared/models/product/product.model';
import { CategoryService } from '../../../parameters/services/category/category.service';
import { CategoryNodeModel } from '../../../parameters/models/category/category.model';

// Tu componente de cards
import { ContainerCardFlexComponent } from '../../../../shared/components/cards/container-card-flex/container-card-flex.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, ContainerCardFlexComponent],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  /** Estado */
  products: ProductSelectModel[] = [];
  categories: CategoryNodeModel[] = [];

  breadcrumb: { id: number; name: string }[] = [];
  selectedCategoryId: number | null = null;

  /** Controles */
  categoryCtrl = new FormControl<number | null>({ value: null, disabled: true });
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  /** Loading */
  isLoadingProducts = false;
  isLoadingCategories = false;
  atLeaf = false;

  /** UI */
  showFilters = false;

  /** Pagination (client side) */
  pageIndex = 0;
  readonly pageSize = 8;

  /** Computed filtrado y paginado */
  private normalize = (v: string) =>
    (v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  get filteredProducts(): ProductSelectModel[] {
    const q = this.normalize(this.searchCtrl.value || '');
    if (!q) return this.products;
    return this.products.filter(p => {
      const name = this.normalize(p.name);
      const producer = this.normalize(p.personName || '');
      return name.includes(q) || producer.includes(q);
    });
  }

  get totalPages(): number {
    const count = this.filteredProducts.length;
    return count > 0 ? Math.ceil(count / this.pageSize) : 1;
  }

  get pagedProducts(): ProductSelectModel[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.categoryCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    this.loadRootCategories();
    this.loadProductsHome();

    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.resetPaging());
  }

  /** Handlers UI */
  onSearch(ev: CustomEvent) {
    const value = (ev.detail as any)?.value ?? '';
    this.searchCtrl.setValue(value, { emitEvent: true });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  /** Productos */
  private loadProductsHome(): void {
    this.isLoadingProducts = true;
    this.productService.getAllHome().subscribe({
      next: (items) => {
        this.products = items;
        this.resetPaging();
        this.isLoadingProducts = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingProducts = false;
      },
    });
  }

  private loadProductsByCategory(categoryId: number): void {
    this.isLoadingProducts = true;
    this.productService.getByCategory(categoryId).subscribe({
      next: (items) => {
        this.products = items;
        this.resetPaging();
        this.isLoadingProducts = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingProducts = false;
      },
    });
  }

  /** Categorías */
  private applyCategoryNodes(nodes: CategoryNodeModel[], resetSelection = false): void {
    this.categories = nodes;
    this.atLeaf = nodes.length === 0;

    if (resetSelection || this.atLeaf) {
      this.categoryCtrl.setValue(null, { emitEvent: false });
    }

    this.updateCategoryControlState();
  }

  private updateCategoryControlState(): void {
    if (this.isLoadingCategories || this.atLeaf) {
      this.categoryCtrl.disable({ emitEvent: false });
    } else {
      this.categoryCtrl.enable({ emitEvent: false });
    }
  }

  private loadRootCategories(): void {
    this.isLoadingCategories = true;
    this.updateCategoryControlState();
    this.categoryCtrl.setValue(null, { emitEvent: false });

    this.categoryService.getNodes(null).subscribe({
      next: (nodes) => {
        this.isLoadingCategories = false;
        this.applyCategoryNodes(nodes, true);
      },
      error: (err) => {
        console.error(err);
        this.isLoadingCategories = false;
        this.updateCategoryControlState();
      },
    });
  }

  private loadChildren(parentId: number): void {
    this.isLoadingCategories = true;
    this.updateCategoryControlState();
    this.categoryCtrl.setValue(null, { emitEvent: false });

    this.categoryService.getNodes(parentId).subscribe({
      next: (nodes) => {
        this.isLoadingCategories = false;
        this.applyCategoryNodes(nodes, true);
      },
      error: (err) => {
        console.error(err);
        this.isLoadingCategories = false;
        this.updateCategoryControlState();
      },
    });
  }

  /** Navegación categorías */
  onSelectCategory(categoryId: number): void {
    if (categoryId === null || categoryId === undefined) {
      return;
    }

    const node = this.categories.find((c) => c.id === categoryId);
    if (!node) return;

    this.selectedCategoryId = categoryId;
    this.pushToBreadcrumb(categoryId, node.name);
    this.loadProductsByCategory(categoryId);
    this.resetPaging();
    this.loadChildren(categoryId);
  }

  onBreadcrumbClick(index: number): void {
    const target = this.breadcrumb[index];
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.selectedCategoryId = target.id;
    this.loadProductsByCategory(target.id);
    this.resetPaging();
    this.loadChildren(target.id);
  }

  clearFilter(): void {
    this.selectedCategoryId = null;
    this.breadcrumb = [];
    this.categoryCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    this.searchCtrl.setValue('', { emitEvent: true });
    this.loadRootCategories();
    this.loadProductsHome();
  }

  /** Pagination */
  get isFirstPage(): boolean {
    return this.pageIndex === 0;
  }

  get isLastPage(): boolean {
    return this.pageIndex >= this.totalPages - 1;
  }

  onPrevPage(): void {
    if (!this.isFirstPage) {
      this.pageIndex--;
    }
  }

  onNextPage(): void {
    if (!this.isLastPage) {
      this.pageIndex++;
    }
  }

  /** Util */
  private resetPaging(): void {
    this.pageIndex = 0;
  }

  private pushToBreadcrumb(id: number, name: string): void {
    const idx = this.breadcrumb.findIndex((b) => b.id === id);
    if (idx >= 0) this.breadcrumb = this.breadcrumb.slice(0, idx + 1);
    else this.breadcrumb.push({ id, name });
  }

  trackById = (_: number, item: { id: number }) => item.id;
}







