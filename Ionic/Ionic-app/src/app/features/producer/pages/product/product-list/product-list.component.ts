import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Location } from '@angular/common';

import { ProductService } from 'src/app/shared/services/product/product.service';
import { CategoryService } from 'src/app/features/parameters/services/category/category.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { CategoryNodeModel } from 'src/app/features/parameters/models/category/category.model';
import { ContainerCardFlexComponent } from 'src/app/shared/components/cards/container-card-flex/container-card-flex.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, ContainerCardFlexComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private location = inject(Location);

  // 🔹 Variables de datos
  products: ProductSelectModel[] = [];
  paginatedProducts: ProductSelectModel[] = [];
  categories: CategoryNodeModel[] = [];

  // 🔹 Estado
  loading = true;
  isLoadingCategories = false;
  atLeaf = false;

  // 🔹 Filtros
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  categoryCtrl = new FormControl<number | null>({ value: null, disabled: true });
  breadcrumb: { id: number; name: string }[] = [];
  selectedCategoryId: number | null = null;

  // 🔹 Paginación
  page = 1;
  pageSize = 6;
  totalPages = 1;

  ngOnInit(): void {
    this.loadProducts();
    this.loadRootCategories();

    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // 🧠 Normalizar texto para búsqueda
  private normalize(v: string): string {
    return (v || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  // 🔍 Aplicar filtros
  applyFilters(): void {
    let filtered = this.products;

    const query = this.normalize(this.searchCtrl.value);
    if (query) {
      filtered = filtered.filter(p =>
        this.normalize(p.name).includes(query) ||
        this.normalize(p.personName || '').includes(query)
      );
    }

    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    this.paginatedProducts = filtered.slice(start, start + this.pageSize);
  }

  onSearch(ev: CustomEvent) {
    const value = (ev.detail as any)?.value ?? '';
    this.searchCtrl.setValue(value, { emitEvent: true });
  }

  // 📦 Cargar productos
  loadProducts(): void {
    this.loading = true;
    this.productService.getAllHome().subscribe({
      next: (data) => {
        this.products = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // 📂 Categorías
  loadRootCategories(): void {
    this.isLoadingCategories = true;
    this.updateCategoryControlState();
    this.categoryCtrl.setValue(null, { emitEvent: false });

    this.categoryService.getNodes(null).subscribe({
      next: (nodes) => {
        this.isLoadingCategories = false;
        this.applyCategoryNodes(nodes, true);
      },
      error: () => {
        this.isLoadingCategories = false;
        this.updateCategoryControlState();
      }
    });
  }

  loadChildren(parentId: number): void {
    this.isLoadingCategories = true;
    this.updateCategoryControlState();
    this.categoryCtrl.setValue(null, { emitEvent: false });

    this.categoryService.getNodes(parentId).subscribe({
      next: (nodes) => {
        this.isLoadingCategories = false;
        this.applyCategoryNodes(nodes, true);
      },
      error: () => {
        this.isLoadingCategories = false;
        this.updateCategoryControlState();
      }
    });
  }

  onSelectCategory(categoryId: number): void {
    if (categoryId == null) return;
    const node = this.categories.find(c => c.id === categoryId);
    if (!node) return;

    this.fetchCategory(categoryId, node.name, true);
  }

  onBreadcrumbClick(index: number): void {
    const target = this.breadcrumb[index];
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.fetchCategory(target.id, target.name, false);
  }

  clearFilter(): void {
    this.selectedCategoryId = null;
    this.breadcrumb = [];
    this.categoryCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    this.updateCategoryControlState();
    this.searchCtrl.setValue('', { emitEvent: true });
    this.loadRootCategories();
    this.loadProducts();
  }

  pushToBreadcrumb(id: number, name: string): void {
    const idx = this.breadcrumb.findIndex(b => b.id === id);
    if (idx >= 0) this.breadcrumb = this.breadcrumb.slice(0, idx + 1);
    else this.breadcrumb.push({ id, name });
  }

  // 🔹 Navegación y CRUD
trackByProduct = (_: number, p: ProductSelectModel) => p.id;

trackByCategory = (_: number, c: CategoryNodeModel) => c.id;

trackByBreadcrumb = (_: number, b: { id: number; name: string }) => b.id;

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFilters();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyFilters();
    }
  }

  createProduct(): void {
    this.router.navigate(['/account/producer/product/create']);
  }

  goBack(): void {
    this.location.back();
  }

  onEdit(p: ProductSelectModel): void {
    this.router.navigate(['/account/producer/product/update', p.id]);
  }

  viewProduct(p: ProductSelectModel): void {
    this.router.navigate(['/products', p.id]);
  }

  async onDelete(p: ProductSelectModel): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar producto?',
      message: `Se eliminará "${p.name}". Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.productService.delete(p.id).subscribe(() => {
              this.products = this.products.filter(x => x.id !== p.id);
              this.applyFilters();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  private fetchCategory(categoryId: number, name: string, pushBreadcrumb: boolean): void {
    this.selectedCategoryId = categoryId;
    if (pushBreadcrumb) {
      this.pushToBreadcrumb(categoryId, name);
    }

    this.loading = true;
    this.productService.getByCategory(categoryId).subscribe({
      next: (items) => {
        this.products = items;
        this.page = 1;
        this.applyFilters();
        this.loadChildren(categoryId);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private applyCategoryNodes(nodes: CategoryNodeModel[] | null | undefined, resetSelection = false): void {
    this.categories = nodes ?? [];
    this.atLeaf = this.categories.length === 0 || !this.categories.some(n => n.hasChildren);

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
}
