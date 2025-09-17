import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';

@Component({
  selector: 'app-card-farm',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './card-farm.component.html',
  styleUrls: ['./card-farm.component.scss']
})
export class CardFarmComponent {
  @Input({ required: true }) farm!: FarmSelectModel;
  @Input() showActions = false;

  @Output() edit = new EventEmitter<FarmSelectModel>();
  @Output() delete = new EventEmitter<FarmSelectModel>();

  private readonly placeholder = 'img/cargaImagen.png';

  get imageUrl(): string {
    const url = this.farm?.images?.[0]?.imageUrl;
    return url && url.trim() ? url : this.placeholder;
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }
}
