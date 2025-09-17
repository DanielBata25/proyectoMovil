import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ProductService } from 'src/app/shared/services/product/product.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { ContainerCardComponent } from 'src/app/shared/components/cards/container-card/container-card.component';
import { CarruselComponent } from 'src/app/shared/components/carrusel/carrusel.component';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    CarruselComponent,
    ContainerCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  products: ProductSelectModel[] = [];

  ngOnInit(): void {
    this.loadProduct();
  }

  private loadProduct(): void {
    this.productService.getAllHome().subscribe(data => {
      this.products = data;
      console.log('HomeComponent - productos cargados:', this.products);
    });
  }
}
