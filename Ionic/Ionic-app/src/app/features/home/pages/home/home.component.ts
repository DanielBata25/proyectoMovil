import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ProductService } from 'src/app/shared/services/product/product.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { ContainerCardComponent } from 'src/app/shared/components/cards/container-card/container-card.component';
import { CarruselComponent } from 'src/app/shared/components/carrusel/carrusel.component';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    CarruselComponent,
    ContainerCardComponent,
    ButtonComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  products: ProductSelectModel[] = [];
  productFeatured: ProductSelectModel[] = [];
  loadingProducts = true;
  loadingFeatured = true;

  ngOnInit(): void {
    this.loadProduct();
    this.loadProductFeatured();
  }

private loadProduct(): void {
  this.loadingProducts = true;
  this.productService.getAllHome().subscribe({
    next: (data) => {
      this.products = data;
      console.log('HomeComponent - productos cargados:', this.products);
      this.loadingProducts = false;
    },
    error: () => {
      this.loadingProducts = false;
    }
  });
}

private loadProductFeatured(): void {
  this.loadingFeatured = true;
  this.productService.getFeatured().subscribe({
    next: (data) => {
      this.productFeatured = data;
      console.log('HomeComponent - productos destacados:', this.productFeatured);
      this.loadingFeatured = false;
    },
    error: () => {
      this.loadingFeatured = false;
    }
  });
}
}
