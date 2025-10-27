import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { register } from 'swiper/element/bundle';

import { FarmService } from '../../../../shared/services/farm/farm.service';
import { FarmSelectModel } from '../../../../shared/models/farm/farm.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-farm-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './farm-detail.component.html',
  styleUrls: ['./farm-detail.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FarmDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly farmService = inject(FarmService);

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('swiperRef', { static: false }) swiperRef?: ElementRef<HTMLElement>;

  farmId!: number;
  farm?: FarmSelectModel;

  loading = true;
  error = false;

  readonly slidesOpts = { slidesPerView: 1, spaceBetween: 12, pagination: true };

  private viewReady = false;
  private map?: L.Map;
  private marker?: L.CircleMarker;
  private tileLayer?: L.TileLayer;

  constructor() {
    register();
  }

  ngOnInit(): void {
    this.farmId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.farmId) {
      this.navigateBack();
      return;
    }

    this.loadFarm();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderMap();
    this.initSwiperAutoplay();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  get galleryImages(): string[] {
    return (this.farm?.images ?? [])
      .map(img => img.imageUrl)
      .filter(url => !!url);
  }

  get hasValidCoordinates(): boolean {
    return (
      this.isValidCoordinate(this.farm?.latitude) &&
      this.isValidCoordinate(this.farm?.longitude)
    );
  }

  get googleMapsLink(): string | null {
    const lat = this.farm?.latitude;
    const lon = this.farm?.longitude;
    if (!this.isValidCoordinate(lat) || !this.isValidCoordinate(lon)) return null;
    return `https://www.google.com/maps?q=${lat},${lon}`;
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
        this.renderMap();
        this.initSwiperAutoplay();
      },
      error: err => {
        console.error('[Farm Detail] getById', err);
        this.loading = false;
        this.error = true;
      },
    });
  }

  private initSwiperAutoplay(): void {
    if (!this.viewReady) return;
    if (this.galleryImages.length <= 1) return;

    requestAnimationFrame(() => {
      const swiperEl: any = this.swiperRef?.nativeElement;
      if (!swiperEl) return;

      if (typeof swiperEl.initialize === 'function' && !swiperEl.classList.contains('swiper-initialized')) {
        swiperEl.initialize();
      } else if (swiperEl.swiper?.update) {
        swiperEl.swiper.update();
      }

      const swiper = swiperEl.swiper;
      if (swiper?.autoplay) {
        swiper.params.autoplay = swiper.params.autoplay || {};
        swiper.params.autoplay.delay = 4000;
        swiper.params.autoplay.disableOnInteraction = false;
        swiper.autoplay.stop();
        swiper.autoplay.start();
      }
    });
  }

  private renderMap(): void {
    if (!this.viewReady || !this.farm || !this.hasValidCoordinates) return;

    const container = this.mapContainer?.nativeElement;
    if (!container) {
      setTimeout(() => this.renderMap(), 50);
      return;
    }

    const lat = this.farm.latitude;
    const lon = this.farm.longitude;

    if (!this.map) {
      this.map = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        preferCanvas: false,
      });

      this.tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        detectRetina: true,
        crossOrigin: true,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });

      this.tileLayer.on('tileerror', ev => {
        console.warn('[Farm Detail] tile load error', ev.error, ev.coords);
      });

      this.tileLayer.addTo(this.map);
    }

    this.map.setView([lat, lon], 15);
    this.tileLayer?.redraw();

    if (this.marker) {
      this.marker.remove();
    }

    this.marker = L.circleMarker([lat, lon], {
      radius: 10,
      color: '#2563eb',
      weight: 3,
      opacity: 0.9,
      fillColor: '#3b82f6',
      fillOpacity: 0.7,
      interactive: false,
    }).addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private destroyMap(): void {
    this.marker?.remove();
    this.marker = undefined;
    this.tileLayer?.remove();
    this.tileLayer = undefined;
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = undefined;
    }
  }

  private isValidCoordinate(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
