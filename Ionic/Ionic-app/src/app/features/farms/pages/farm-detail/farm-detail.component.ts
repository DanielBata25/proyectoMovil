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
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { register } from 'swiper/element/bundle';

import { FarmService } from '../../../../shared/services/farm/farm.service';
import { FarmSelectModel } from '../../../../shared/models/farm/farm.model';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { locateOutline } from 'ionicons/icons';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-farm-detail',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './farm-detail.component.html',
  styleUrls: ['./farm-detail.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FarmDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly farmService = inject(FarmService);
  private readonly location = inject(Location);

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
  mapReady = false;
  private readonly defaultCenter: L.LatLngExpression = [4.5709, -74.2973];

  constructor() {
    register();
    addIcons({ locateOutline });
    this.loadLeafletAssets();
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

  ionViewDidEnter(): void {
    setTimeout(() => {
      this.renderMap();
      this.map?.invalidateSize();
      this.centerMapOnFarm();
    }, 150);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  get galleryImages(): string[] {
    return (this.farm?.images ?? [])
      .map(img => img.imageUrl)
      .filter((url): url is string => !!url);
  }

  get hasValidCoordinates(): boolean {
    return this.getDisplayCoordinates() !== null;
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

  goBack(): void {
    this.location.back();
  }

  openMaps(): void {
    const url = this.googleMapsLink;
    if (!url) return;
    window.open(url, '_blank');
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
    if (!this.viewReady || this.galleryImages.length <= 1) return;

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
      setTimeout(() => this.renderMap(), 80);
      return;
    }

    const coords = this.getDisplayCoordinates();
    if (!coords) return;
    const { lat, lng } = coords;

    if (!this.map) {
      this.map = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        preferCanvas: false,
      });

      this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        detectRetina: true,
        crossOrigin: true,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);

      this.tileLayer.once('load', () => setTimeout(() => this.map?.invalidateSize(), 80));
    }

    this.map.setView([lat, lng], 15);
    this.tileLayer?.redraw();

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: '#2563eb',
        weight: 3,
        opacity: 0.9,
        fillColor: '#3b82f6',
        fillOpacity: 0.7,
        interactive: false,
      }).addTo(this.map);
    }

    this.mapReady = true;
    setTimeout(() => this.map?.invalidateSize(), 200);
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
    this.mapReady = false;
  }

  private isValidCoordinate(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private loadLeafletAssets(): void {
    const id = 'leaflet-css';
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  centerMapOnFarm(): void {
    if (!this.mapReady || !this.map) return;
    const coords = this.getDisplayCoordinates();
    const target: L.LatLngExpression = coords ? [coords.lat, coords.lng] : this.defaultCenter;
    this.map.setView(target, this.map.getZoom() ?? 15);
    this.marker?.setLatLng(target);
  }

  private getDisplayCoordinates(): { lat: number; lng: number } | null {
    const rawLat = this.farm?.latitude;
    const rawLon = this.farm?.longitude;
    if (!this.isValidCoordinate(rawLat) || !this.isValidCoordinate(rawLon)) {
      return null;
    }
    const lat = this.clamp(rawLat, -90, 90);
    const lng = this.normalizeLongitude(rawLon);
    return { lat, lng };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private normalizeLongitude(value: number): number {
    if (!Number.isFinite(value)) return 0;
    const normalized = ((value + 180) % 360 + 360) % 360 - 180;
    return this.clamp(normalized, -180, 180);
  }
}
