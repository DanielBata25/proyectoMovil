import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ContainerCardFlexComponent } from 'src/app/shared/components/cards/container-card-flex/container-card-flex.component';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';

@Component({
  selector: 'app-farm-list',
  standalone: true,
  imports: [CommonModule, IonicModule, ContainerCardFlexComponent, ButtonComponent],
  templateUrl: './farm-list.component.html',
  styleUrls: ['./farm-list.component.scss'],
})
export class FarmListComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly alertCtrl = inject(AlertController);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  farms: FarmSelectModel[] = [];
  loadingFarms = true;

  pageIndex = 0;
  readonly pageSize = 8;

  get totalPages(): number {
    const count = this.farms.length;
    return count > 0 ? Math.ceil(count / this.pageSize) : 1;
  }

  get pagedFarms(): FarmSelectModel[] {
    const start = this.pageIndex * this.pageSize;
    return this.farms.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.loadFarms();
  }

  get isFirstPage(): boolean {
    return this.pageIndex === 0;
  }

  get isLastPage(): boolean {
    return this.pageIndex >= this.totalPages - 1;
  }

  onPrevPage(): void {
    if (!this.isFirstPage) this.pageIndex--;
  }

  onNextPage(): void {
    if (!this.isLastPage) this.pageIndex++;
  }

  onCreate(): void {
    this.router.navigate(['/account/producer/farm/create']);
  }

  goBack(): void {
    this.location.back();
  }

  onView(farm: FarmSelectModel): void {
    if (!farm?.id) return;
    this.router.navigate(['/home/farm', farm.id]);
  }

  onEdit(farm: FarmSelectModel): void {
    if (!farm?.id) return;
    this.router.navigate(['/account/producer/farm/update', farm.id]);
  }

  async onDelete(farm: FarmSelectModel): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar finca',
      message: `Eliminar "${farm.name}"? Esta accion no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmDelete(farm.id),
        },
      ],
    });
    await alert.present();
  }

  private confirmDelete(id: number): void {
    this.farmService.delete(id).subscribe({
      next: () => {
        this.farms = this.farms.filter(f => f.id !== id);
        this.pageIndex = 0;
      },
      error: err => console.error('[Farm][delete]', err),
    });
  }

  private loadFarms(): void {
    this.loadingFarms = true;
    this.farmService.getByProducer().subscribe({
      next: farms => {
        this.farms = farms ?? [];
        this.pageIndex = 0;
        this.loadingFarms = false;
      },
      error: err => {
        console.error('[Farm][getByProducer]', err);
        this.farms = [];
        this.loadingFarms = false;
      },
    });
  }
}
