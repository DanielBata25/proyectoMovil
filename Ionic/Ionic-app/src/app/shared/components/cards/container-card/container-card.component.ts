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
  @Input({ required: true }) products: ProductSelectModel[] = [];

  trackById = (_: number, p: ProductSelectModel) => p.id;
}
