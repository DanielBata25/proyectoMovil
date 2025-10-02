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

  ngOnInit(): void {
    this.loadProduct();
  }

  trackById = (_: number, p: ProductSelectModel) => p.id;

  loadProduct() {
    this.productService.getByProducerId().subscribe((data) => {
      this.products = data;
    });
  }

  onEdit(p: ProductSelectModel) {
    this.router.navigate(['/account/producer/management/product/update', p.id]);
  }

  async onDelete(p: ProductSelectModel) {
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
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
