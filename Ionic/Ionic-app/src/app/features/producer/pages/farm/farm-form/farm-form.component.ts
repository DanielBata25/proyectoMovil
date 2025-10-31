import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule, LoadingController, ToastController, ViewDidEnter } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { locateOutline } from 'ionicons/icons';

import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { LocationService } from 'src/app/shared/services/location/location.service';
import {
  FarmRegisterModel,
  FarmSelectModel,
  FarmUpdateModel,
} from 'src/app/shared/models/farm/farm.model';
import {
  DepartmentModel,
  CityModel,
} from 'src/app/shared/models/location/location.model';

@Component({
  selector: 'app-farm-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
  ],
  templateUrl: './farm-form.component.html',
  styleUrls: ['./farm-form.component.scss'],
})
export class FarmFormComponent implements OnInit, AfterViewInit, OnDestroy, ViewDidEnter {
  private readonly fb = inject(FormBuilder);
  private readonly farmService = inject(FarmService);
  private readonly locationService = inject(LocationService);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isEdit = false;
  private farmId?: number;

  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  existingImages: { url: string; id: string }[] = [];
  selectedFiles: File[] = [];
  selectedPreviews: string[] = [];
  imagesToDelete: string[] = [];

  isSaving = false;
  isLoadingFarm = false;

  private pendingCityId: number | null = null;

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;
  private tileLayer?: L.TileLayer;
  private mapInitialized = false;
  mapReady = false;
  readonly hasMapSupport = true;

  constructor() {
    addIcons({ locateOutline });
    this.loadLeafletAssets();
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      hectares: [null, [Validators.required, Validators.min(0)]],
      altitude: [
        null,
        [Validators.required, Validators.min(-200), Validators.max(4000)],
      ],
      latitude: [
        null,
        [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      longitude: [
        null,
        [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      departmentId: [null, [Validators.required]],
      cityId: [{ value: null, disabled: true }, [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  ionViewDidEnter(): void {
    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initMap();
        return;
      }
      this.map?.invalidateSize();
      this.updateMarkerFromForm(true);
    }, 150);
  }

  ngOnDestroy(): void {
    this.map?.off();
    this.map?.remove();
    this.mapInitialized = false;
    this.marker = undefined;
    this.tileLayer = undefined;
    this.map = undefined;
  }

  ngOnInit(): void {

    this.form.valueChanges.subscribe(() => {
      this.updateMarkerFromForm();
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.farmId = Number(idParam);
    }

    this.form.get('departmentId')?.valueChanges.subscribe((deptId) => {
      const numericId = this.toNumber(deptId);
      if (numericId === null) {
        this.cities = [];
        this.pendingCityId = null;
        this.form.get('cityId')?.reset();
        this.form.get('cityId')?.disable({ emitEvent: false });
        return;
      }

      if (numericId !== deptId) {
        this.form.get('departmentId')?.setValue(numericId, { emitEvent: false });
      }

      this.loadCities(numericId, this.pendingCityId ?? undefined);
    });

    this.form.get('cityId')?.valueChanges.subscribe((cityId) => {
      const numericCity = this.toNumber(cityId);
      if (numericCity !== cityId) {
        this.form.get('cityId')?.setValue(numericCity, { emitEvent: false });
      }
    });

    this.loadDepartments().then(() => {
      if (this.isEdit && this.farmId) {
        this.loadFarm(this.farmId);
      }
    });
  }

  get title(): string {
    return this.isEdit ? 'Editar finca' : 'Registrar finca';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    this.selectedFiles = [];
    this.selectedPreviews = [];

    Array.from(files).forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        this.selectedPreviews.push(url);
      };
      reader.readAsDataURL(file);
    });
  }

  removeSelectedFile(index: number): void {
    if (index < 0 || index >= this.selectedFiles.length) return;
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.selectedPreviews = this.selectedPreviews.filter((_, i) => i !== index);
  }

  removeExistingImage(index: number): void {
    const img = this.existingImages[index];
    if (!img) return;
    this.existingImages = this.existingImages.filter((_, i) => i !== index);
    if (img.id) {
      this.imagesToDelete.push(img.id);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.isEdit ? 'Actualizando finca...' : 'Creando finca...',
    });
    await loading.present();
    this.isSaving = true;

    const value = this.form.getRawValue();
    const cityId = this.toNumber(value.cityId);
    if (cityId === null) {
      await loading.dismiss();
      this.isSaving = false;
      void this.presentToast('Selecciona ciudad');
      return;
    }

    const core = {
      name: value.name.trim(),
      hectares: Number(value.hectares),
      altitude: Number(value.altitude),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      cityId,
    };

    const createPayload: FarmRegisterModel = {
      ...core,
      images: this.selectedFiles,
    };

    const updatePayload: FarmUpdateModel = {
      ...core,
      id: this.farmId!,
      images: this.selectedFiles.length ? this.selectedFiles : undefined,
      imagesToDelete: this.imagesToDelete.length ? this.imagesToDelete : undefined,
    };

    const request$ = this.isEdit
      ? this.farmService.update(updatePayload)
      : this.farmService.create(createPayload);

    request$
      .pipe(
        finalize(async () => {
          this.isSaving = false;
          await loading.dismiss();
        }),
      )
      .subscribe({
        next: async () => {
          await this.presentToast(
            this.isEdit ? 'Finca actualizada' : 'Finca creada',
            'success',
          );
          this.router.navigate(['/account/producer/farm']);
        },
        error: async (err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'No se pudo guardar la finca.';
          await this.presentToast(msg, 'danger');
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/account/producer/farm']);
  }

  trackById = (_: number, item: { id: number }) => item.id;

  private async loadDepartments(): Promise<void> {
    return new Promise((resolve) => {
      this.locationService.getDepartment().subscribe({
        next: (departments) => {
          this.departments = departments ?? [];
          resolve();
        },
        error: async () => {
          await this.presentToast(
            'No se pudieron cargar los departamentos.',
            'danger',
          );
          resolve();
        },
      });
    });
  }

  private loadCities(
    departmentId: number,
    selectedCityId?: number,
  ): void {
    this.form.get('cityId')?.disable({ emitEvent: false });
    this.form.get('cityId')?.reset();
    this.locationService.getCity(Number(departmentId)).subscribe({
      next: (cities) => {
        this.cities = cities ?? [];
        this.form.get('cityId')?.enable({ emitEvent: false });
        if (selectedCityId) {
          this.form.get('cityId')?.setValue(Number(selectedCityId), {
            emitEvent: false,
          });
        }
        this.pendingCityId = null;
      },
      error: async () => {
        await this.presentToast('No se pudieron cargar las ciudades.', 'danger');
        this.form.get('cityId')?.disable({ emitEvent: false });
      },
    });
  }

  private loadFarm(id: number): void {
    this.isLoadingFarm = true;
    this.farmService.getById(id).subscribe({
      next: (farm) => {
        this.applyFarm(farm);
        this.isLoadingFarm = false;
        this.updateMarkerFromForm(true);
      },
      error: async () => {
        this.isLoadingFarm = false;
        await this.presentToast('No se pudo cargar la finca.', 'danger');
        this.router.navigate(['/account/producer/farm']);
      },
    });
  }

  private applyFarm(farm: FarmSelectModel): void {
    const departmentId = this.toNumber(farm.departmentId);
    const cityId = this.toNumber(farm.cityId);

    this.form.patchValue(
      {
        name: farm.name,
        hectares: farm.hectares,
        altitude: farm.altitude,
        latitude: farm.latitude,
        longitude: farm.longitude,
        departmentId,
      },
      { emitEvent: false },
    );

    this.selectedFiles = [];
    this.selectedPreviews = [];
    this.imagesToDelete = [];

    if (departmentId && departmentId > 0) {
      this.form.get('departmentId')?.setValue(departmentId, { emitEvent: false });
      this.loadCities(departmentId, cityId ?? undefined);
    } else if (cityId && cityId > 0) {
      this.resolveDepartmentForCity(cityId).then((resolved) => {
        if (resolved) {
          this.form.get('departmentId')?.setValue(resolved, { emitEvent: false });
          this.loadCities(resolved, cityId);
        } else {
          this.clearCityControl();
        }
      });
    } else {
      this.clearCityControl();
    }

    if (cityId && cityId > 0) {
      this.form.get('cityId')?.setValue(cityId, { emitEvent: false });
    }

    this.existingImages = (farm.images ?? []).map((img) => ({
      url: img.imageUrl,
      id: img.publicId ?? String(img.id ?? ''),
    }));

    this.updateMarkerFromForm(true);
  }

  private clearCityControl(): void {
    this.cities = [];
    this.form.get('cityId')?.reset(null, { emitEvent: false });
    this.form.get('cityId')?.disable({ emitEvent: false });
  }

  private loadLeafletAssets(): void {
    const leafletCssId = 'leaflet-css';
    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement('link');
      link.id = leafletCssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }

  private initMap(): void {
    if (this.mapInitialized) return;
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      setTimeout(() => this.initMap(), 120);
      return;
    }

    this.map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    }).setView([4.5709, -74.2973], 6);

    this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.marker = L.marker([4.5709, -74.2973]).addTo(this.map);

    this.mapInitialized = true;
    this.mapReady = true;
    this.updateMarkerFromForm(true);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private updateMarkerFromForm(fitView = false): void {
    if (!this.mapInitialized) return;
    const lat = this.toNumber(this.form.get('latitude')?.value);
    const lon = this.toNumber(this.form.get('longitude')?.value);
    if (lat === null || lon === null) return;

    const position: L.LatLngExpression = [lat, lon];
    this.marker?.setLatLng(position);
    if (fitView) {
      this.map?.setView(position, 13);
    }
  }

  centerMapOnInputs(): void {
    this.updateMarkerFromForm(true);
  }

  private async resolveDepartmentForCity(cityId: number): Promise<number | null> {
    for (const dept of this.departments) {
      try {
        const cities = await firstValueFrom(this.locationService.getCity(dept.id));
        if (cities?.some(city => city.id === cityId)) {
          return dept.id;
        }
      } catch (err) {
        console.error("[FarmForm] resolveDepartmentForCity", err);
      }
    }
    return null;
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
