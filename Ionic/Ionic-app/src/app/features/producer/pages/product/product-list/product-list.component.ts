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

  products: ProductSelectModel[] = [];
  page = 1;
  pageSize = 6;
  totalPages = 1;

  ngOnInit(): void {
    this.loadProduct();
  }

  trackById = (_: number, p: ProductSelectModel) => p.id;

  loadProduct(): void {
    this.productService.getAllHome().subscribe((data) => {
      this.products = data;
      this.page = 1;
      this.updatePagination();
    });
  }

  createProduct(): void {
    this.router.navigate(['/account/producer/management/product/create']);
  }

  onEdit(p: ProductSelectModel): void {
    this.router.navigate(['/account/producer/management/product/update', p.id]);
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
              this.updatePagination();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  getCover(product: ProductSelectModel): string | null {
    return product.images?.[0]?.imageUrl || product.imageUrl || null;
  }

  get paginatedProducts(): ProductSelectModel[] {
    const start = (this.page - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.products.length / this.pageSize));
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }
}
