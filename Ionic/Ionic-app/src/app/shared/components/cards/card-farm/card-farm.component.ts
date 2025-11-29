import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { mapOutline, alertCircleOutline, pinOutline } from 'ionicons/icons';

@Component({
  selector: 'app-card-farm',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './card-farm.component.html',
  styleUrls: ['./card-farm.component.scss']
})
export class CardFarmComponent {
  private readonly router = inject(Router);

  @Input({ required: true }) farm!: FarmSelectModel;
  @Input() showActions = false;

  @Output() edit = new EventEmitter<FarmSelectModel>();
  @Output() delete = new EventEmitter<FarmSelectModel>();
  @Output() view = new EventEmitter<FarmSelectModel>();

  private readonly placeholder = 'assets/img/cargaImagen.png';

  constructor() {
    addIcons({ mapOutline, alertCircleOutline, pinOutline });
  }

  get imageUrl(): string {
    const url = this.farm?.images?.[0]?.imageUrl;
    return url && url.trim() ? url : this.placeholder;
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }

  onDetail(): void {
    if (!this.farm?.id) return;
    this.view.emit(this.farm);
    if (!this.showActions) {
      this.router.navigate(['/home/farm', this.farm.id]);
    }
  }

  onEditClick(ev: Event): void {
    ev.stopPropagation();
    this.edit.emit(this.farm);
  }

  onViewClick(ev: Event): void {
    ev.stopPropagation();
    this.view.emit(this.farm);
    if (!this.showActions) {
      this.router.navigate(['/home/farm', this.farm.id]);
    }
  }

  onDeleteClick(ev: Event): void {
    ev.stopPropagation();
    this.delete.emit(this.farm);
  }
}
