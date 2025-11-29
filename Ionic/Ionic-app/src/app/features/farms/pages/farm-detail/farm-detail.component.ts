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
import { locateOutline, mapOutline, alertCircleOutline } from 'ionicons/icons';
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
  private marker?: L.Marker;
  private tileLayer?: L.TileLayer;
  mapReady = false;
  private mapInitialized = false;
  private mapVisibilityObserver?: MutationObserver; // Monitor to keep map visible
  private readonly defaultCenter: L.LatLngExpression = [4.5709, -74.2973];

  constructor() {
    register();
    addIcons({ locateOutline, mapOutline, alertCircleOutline });
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
    this.initSwiperAutoplay();
    // Initialize map with proper timing like in FarmFormComponent
    setTimeout(() => this.initMap(), 0);
  }

  ionViewDidEnter(): void {
    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initMap();
        return;
      }
      this.map?.invalidateSize();
      this.centerMapOnFarm();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.mapInitialized) {
      this.destroyMap();
    }
    this.mapInitialized = false;
    
    // Clean up visibility monitoring
    if (this.mapVisibilityObserver) {
      this.mapVisibilityObserver.disconnect();
      this.mapVisibilityObserver = undefined;
    }
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
        this.farm = this.normalizeFarmCoords(farm);
        this.loading = false;
        
        console.log('[FarmDetail] Farm data loaded, preserving map visibility');
        
        // Initialize map if not already done, then update marker
        if (!this.mapInitialized) {
          setTimeout(() => this.initMap(), 100);
        } else {
          // CRITICAL: Preserve map visibility when farm data loads
          setTimeout(() => {
            this.updateMarkerFromFarm();
            this.forceMapVisibility(); // Force visibility after data load
          }, 200);
        }
        
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

    if (!this.mapInitialized) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    this.updateMarkerFromFarm();
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

  private normalizeFarmCoords(farm: FarmSelectModel): FarmSelectModel {
    const toNumber = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const cleaned = v.trim().replace(/[^\d.,-]/g, '');
        if (!cleaned) return null;
        const lastSep = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
        if (lastSep === -1) {
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : null;
        }
        const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, '');
        const fracPart = cleaned.slice(lastSep + 1).replace(/[.,]/g, '');
        const n = Number(`${intPart}.${fracPart}`);
        return Number.isFinite(n) ? n : null;
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const lat = toNumber((farm as any)?.latitude);
    const lon = toNumber((farm as any)?.longitude);
    return {
      ...farm,
      latitude: lat ?? farm.latitude ?? undefined,
      longitude: lon ?? farm.longitude ?? undefined,
    } as FarmSelectModel;
  }

  private loadLeafletAssets(): void {
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
    const DefaultIcon = L.Icon.Default as any;
    if (!DefaultIcon._agroIconPatched) {
      DefaultIcon.mergeOptions({
        iconRetinaUrl: `${iconBase}marker-icon-2x.png`,
        iconUrl: `${iconBase}marker-icon.png`,
        shadowUrl: `${iconBase}marker-shadow.png`,
      });
      DefaultIcon._agroIconPatched = true;
    }
  }

  centerMapOnFarm(): void {
    if (!this.mapReady || !this.map) return;
    const coords = this.getDisplayCoordinates();
    const target: L.LatLngExpression = coords ? [coords.lat, coords.lng] : this.defaultCenter;
    this.map.setView(target, this.map.getZoom() ?? 15);
    this.marker?.setLatLng(target);
  }

  private initMap(): void {
    if (this.mapInitialized) return;
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      setTimeout(() => this.initMap(), 120);
      return;
    }

    console.log('[FarmDetail] Initializing STATIC map (view mode) with visibility monitoring');

    // Configure map as STATIC for view mode - NO interactions allowed
    this.map = L.map(container, {
      zoomControl: false,        // No zoom controls in view mode
      attributionControl: false, // No attribution in view mode
      dragging: false,           // No dragging/pan in view mode
      touchZoom: false,          // No touch zoom in view mode
      doubleClickZoom: false,    // No double click zoom in view mode
      scrollWheelZoom: false,    // No scroll zoom in view mode
      boxZoom: false,            // No box zoom in view mode
      keyboard: false,           // No keyboard controls in view mode
    }).setView([4.5709, -74.2973], 6);

    // Add static tile layer
    this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '', // No attribution in view mode
      maxZoom: 19,
    }).addTo(this.map);

    // Add static marker (not interactive)
    this.marker = L.marker([4.5709, -74.2973], {
      icon: L.icon({
        iconUrl: 'assets/img/map-pin.svg',
        iconSize: [30, 42],
        iconAnchor: [15, 40],
      }),
      interactive: false, // Marker is not interactive in view mode
    }).addTo(this.map);

    // Add CSS class to make map completely static
    container.classList.add('leaflet-container-static');

    this.mapInitialized = true;
    this.mapReady = true;
    
    console.log('[FarmDetail] Static map initialized (view mode - no interactions)');
    
    // CRITICAL: Start visibility monitoring immediately
    this.startVisibilityMonitoring();
    
    // Update marker position if we have farm data
    setTimeout(() => {
      this.updateMarkerFromFarm();
      this.map?.invalidateSize();
      // Multiple invalidateSize calls to prevent disappearing
      setTimeout(() => this.map?.invalidateSize(), 100);
      setTimeout(() => this.map?.invalidateSize(), 300);
    }, 200);
  }

  private startVisibilityMonitoring(): void {
    const container = this.mapContainer?.nativeElement;
    if (!container || this.mapVisibilityObserver) return;

    // Monitor for any changes that might hide the map
    this.mapVisibilityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('leaflet-container') || 
              target.classList.contains('leaflet-tile-pane')) {
            
            // Force visibility if anything tries to hide the map
            if (target.style.display === 'none' || 
                target.style.visibility === 'hidden' || 
                target.style.opacity === '0') {
              console.log('[FarmDetail] Visibility monitoring: forcing map visible');
              this.forceMapVisibility();
            }
          }
        }
      });
    });

    // Start monitoring the map container and all its children
    this.mapVisibilityObserver.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });

    console.log('[FarmDetail] Visibility monitoring started');
  }

  private updateMarkerFromFarm(): void {
    if (!this.mapInitialized || !this.farm || !this.hasValidCoordinates) return;
    
    const coords = this.getDisplayCoordinates();
    if (!coords) return;
    
    // CRITICAL FIX: Preserve map visibility during data updates
    console.log('[FarmDetail] Updating marker position:', coords);
    
    // Update marker position
    this.marker?.setLatLng([coords.lat, coords.lng]);
    
    // CRITICAL FIX: Set view without triggering map recreation
    if (this.map) {
      // Don't recreate the map, just update view
      this.map.setView([coords.lat, coords.lng], 15, { animate: false });
      
      // CRITICAL FIX: Force multiple invalidations to prevent disappearing
      setTimeout(() => {
        this.map?.invalidateSize();
        this.forceMapVisibility();
      }, 50);
      
      setTimeout(() => {
        this.map?.invalidateSize();
        this.forceMapVisibility();
      }, 150);
      
      setTimeout(() => {
        this.map?.invalidateSize();
        this.forceMapVisibility();
      }, 300);
    }
    
    console.log('[FarmDetail] Marker updated and map visibility preserved');
  }

  private forceMapVisibility(): void {
    const container = this.mapContainer?.nativeElement;
    if (container && this.map) {
      // Force the map container to be visible
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.display = 'block';
      
      // Force leaflet container visibility
      const leafletContainer = container.querySelector('.leaflet-container') as HTMLElement;
      if (leafletContainer) {
        leafletContainer.style.opacity = '1';
        leafletContainer.style.visibility = 'visible';
        leafletContainer.style.display = 'block';
      }
      
      // Force tile visibility
      const tiles = container.querySelectorAll('.leaflet-tile');
      tiles.forEach(tile => {
        (tile as HTMLElement).style.opacity = '1';
        (tile as HTMLElement).style.visibility = 'visible';
      });
    }
  }

  private getDisplayCoordinates(): { lat: number; lng: number } | null {
    const rawLat = this.farm?.latitude;
    const rawLon = this.farm?.longitude;
    if (!this.isValidCoordinate(rawLat) || !this.isValidCoordinate(rawLon)) {
      return null;
    }
    const lat = this.clamp(rawLat, -90, 90);
    const lng = this.normalizeLongitude(rawLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
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
