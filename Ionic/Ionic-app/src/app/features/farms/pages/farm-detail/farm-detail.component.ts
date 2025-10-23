import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { FarmService } from '../../../../shared/services/farm/farm.service';
import { FarmSelectModel } from '../../../../shared/models/farm/farm.model';

@Component({
  selector: 'app-farm-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './farm-detail.component.html',
  styleUrls: ['./farm-detail.component.scss'],
})
export class FarmDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly farmService = inject(FarmService);

  farmId!: number;
  farm?: FarmSelectModel;

  loading = true;
  error = false;

  selectedImage: string | null = null;
  private readonly placeholder = 'assets/img/cargaImagen.png';

  ngOnInit(): void {
    this.farmId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.farmId) {
      this.navigateBack();
      return;
    }

    this.loadFarm();
  }

  get galleryImages(): string[] {
    return (this.farm?.images ?? [])
      .map(img => img.imageUrl)
      .filter(url => !!url);
  }

  get heroImage(): string {
    const primary = this.selectedImage || this.galleryImages[0];
    return primary && primary.trim().length > 0 ? primary : this.placeholder;
  }

  get googleMapsLink(): string | null {
    const lat = this.farm?.latitude;
    const lon = this.farm?.longitude;
    if (lat === null || lat === undefined || lon === null || lon === undefined) return null;
    return `https://www.google.com/maps?q=${lat},${lon}`;
  }

  onSelectImage(url: string): void {
    this.selectedImage = url;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  navigateBack(): void {
    this.router.navigate(['/home/farm']);
  }

  private loadFarm(): void {
    this.loading = true;
    this.error = false;

    this.farmService.getById(this.farmId).subscribe({
      next: farm => {
        this.farm = farm;
        this.loading = false;
        if (this.galleryImages.length) {
          this.selectedImage = this.galleryImages[0];
        }
      },
      error: err => {
        console.error('[Farm Detail] getById', err);
        this.loading = false;
        this.error = true;
      },
    });
  }
}
