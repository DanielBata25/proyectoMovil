import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';
import { CardFarmComponent } from '../card-farm/card-farm.component';
import { CardComponent } from '../card/card.component';





type Item = ProductSelectModel | FarmSelectModel;

@Component({
  selector: 'app-container-card-flex',
  standalone: true,
  imports: [CommonModule, IonicModule, CardComponent, CardFarmComponent],
  templateUrl: './container-card-flex.component.html',
  styleUrls: ['./container-card-flex.component.scss'],
})
export class ContainerCardFlexComponent {
  /** 'product' => usa <app-card>; 'farm' => usa <app-card-farm> */
  @Input() type: 'product' | 'farm' = 'product';

  /** Lista de ítems (según el type) */
  @Input({ required: true }) items: Item[] = [];

  /** Opcionales comunes */
  @Input() showActions = false;
  @Input() showFavorite = false; // solo aplica a product
  @Input() togglingId: number | null = null; // solo aplica a product

  /** Eventos comunes */
  @Output() editProduct = new EventEmitter<ProductSelectModel>();
  @Output() deleteProduct = new EventEmitter<ProductSelectModel>();
  @Output() viewProduct = new EventEmitter<ProductSelectModel>();
  @Output() editFarm = new EventEmitter<FarmSelectModel>();
  @Output() deleteFarm = new EventEmitter<FarmSelectModel>();
  @Output() viewFarm = new EventEmitter<FarmSelectModel>();
  @Output() toggleFavorite = new EventEmitter<ProductSelectModel>(); // solo product

  trackById = (_: number, it: Item) => (it as any).id;

  // Helpers de tipado
  isProduct(it: Item): it is ProductSelectModel {
    return (it as ProductSelectModel).price !== undefined;
  }

  isFarm(it: Item): it is FarmSelectModel {
    return (it as FarmSelectModel).hectares !== undefined;
  }

  get gridClasses(): string[] {
    return this.type === 'farm'
      ? ['card-grid', 'card-grid--farm']
      : ['card-grid', 'card-grid--product'];
  }
}
