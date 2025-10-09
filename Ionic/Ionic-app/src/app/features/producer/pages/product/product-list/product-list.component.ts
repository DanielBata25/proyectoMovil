import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProductService } from 'src/app/shared/services/product/product.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  // 🔹 Variables de datos
  products: ProductSelectModel[] = [];
  paginatedProducts: ProductSelectModel[] = [];

  // 🔹 Estado
  loading = true;

  // 🔹 Paginación (solo front)
  page = 1;
  pageSize = 6;
  totalPages = 1;

  ngOnInit(): void {
    this.loadProducts();
  }

  trackById = (_: number, p: ProductSelectModel) => p.id;

  /** 🔹 Cargar todos los productos del servicio */
  loadProducts(): void {
    this.loading = true;

    this.productService.getAllHome().subscribe({
      next: (data) => {
        this.products = data || [];
        this.totalPages = Math.max(1, Math.ceil(this.products.length / this.pageSize));
        this.updatePage();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /** 🔹 Actualizar el listado visible según la página actual */
  updatePage(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.products.slice(start, end);
  }

  /** 🔹 Navegar a la siguiente página */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.updatePage();
    }
  }

  /** 🔹 Navegar a la página anterior */
  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.updatePage();
    }
  }

  /** 🔹 Crear producto nuevo */
  createProduct(): void {
    this.router.navigate(['/account/producer/management/product/create']);
  }

  /** 🔹 Editar */
  onEdit(p: ProductSelectModel): void {
    this.router.navigate(['/account/producer/management/product/update', p.id]);
  }

  /** 🔹 Ver detalle */
  viewProduct(p: ProductSelectModel): void {
    this.router.navigate(['/products', p.id]);
  }

  /** 🔹 Eliminar producto */
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
              this.totalPages = Math.max(1, Math.ceil(this.products.length / this.pageSize));
              if (this.page > this.totalPages) this.page = this.totalPages;
              this.updatePage();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /** 🔹 Obtener imagen principal */
  getCover(product: ProductSelectModel): string | null {
    return product.images?.[0]?.imageUrl || product.imageUrl || null;
  }
}
