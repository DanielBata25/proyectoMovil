import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { CardComponent } from '../card/card.component';



@Component({
  selector: 'app-container-card',
  standalone: true,
  imports: [CommonModule, IonicModule, CardComponent],
  templateUrl: './container-card.component.html',
  styleUrls: ['./container-card.component.scss'],
})
export class ContainerCardComponent {
  @Input() title = 'Últimos Agregados';
  @Input() showHeader = true;
  @Input() showFavorite = true;
  @Input() products: ProductSelectModel[] = [];
  @Input() loading = false;
  @Input() skeletonCount = 4;

  private readonly placeholderProduct = {} as ProductSelectModel;

  trackById = (_: number, p: ProductSelectModel) => p.id;

  get skeletonItems(): number[] {
    return Array.from({ length: this.skeletonCount }, (_, i) => i);
  }

  get placeholder(): ProductSelectModel {
    return this.placeholderProduct;
  }
}
