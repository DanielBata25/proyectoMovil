import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

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
export class FarmFormComponent implements OnInit {
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

  existingImages: { url: string; name: string }[] = [];
  selectedFiles: File[] = [];
  selectedPreviews: string[] = [];

  isSaving = false;
  isLoadingFarm = false;

  private pendingCityId: number | null = null;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      hectares: [null, [Validators.required, Validators.min(0)]],
      altitude: [null, [Validators.required]],
      latitude: [null, [Validators.required]],
      longitude: [null, [Validators.required]],
      departmentId: [null, [Validators.required]],
      cityId: [{ value: null, disabled: true }, [Validators.required]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.farmId = Number(idParam);
    }

    this.form.get('departmentId')?.valueChanges.subscribe((deptId) => {
      if (!deptId) {
        this.cities = [];
        this.pendingCityId = null;
        this.form.get('cityId')?.reset();
        this.form.get('cityId')?.disable({ emitEvent: false });
        return;
      }
      this.loadCities(deptId, this.pendingCityId ?? undefined);
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
    const core = {
      name: value.name.trim(),
      hectares: Number(value.hectares),
      altitude: Number(value.altitude),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      cityId: Number(value.cityId),
    };

    const createPayload: FarmRegisterModel = {
      ...core,
      images: this.selectedFiles,
    };

    const updatePayload: FarmUpdateModel = {
      ...core,
      id: this.farmId!,
      images: this.selectedFiles.length ? this.selectedFiles : undefined,
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
    this.locationService.getCity(departmentId).subscribe({
      next: (cities) => {
        this.cities = cities ?? [];
        this.form.get('cityId')?.enable({ emitEvent: false });
        if (selectedCityId) {
          this.form.get('cityId')?.setValue(selectedCityId, {
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
      },
      error: async () => {
        this.isLoadingFarm = false;
        await this.presentToast('No se pudo cargar la finca.', 'danger');
        this.router.navigate(['/account/producer/farm']);
      },
    });
  }

  private applyFarm(farm: FarmSelectModel): void {
    this.pendingCityId = farm.cityId ?? null;
    this.form.patchValue(
      {
        name: farm.name,
        hectares: farm.hectares,
        altitude: farm.altitude,
        latitude: farm.latitude,
        longitude: farm.longitude,
        departmentId: farm.departmentId,
      },
      { emitEvent: false },
    );

    if (farm.departmentId) {
      this.form.get('departmentId')?.setValue(farm.departmentId, {
        emitEvent: true,
      });
    }

    this.selectedFiles = [];
    this.selectedPreviews = [];

    if (farm.cityId) {
      this.pendingCityId = farm.cityId;
      this.loadCities(farm.departmentId, farm.cityId);
    }

    this.existingImages = (farm.images ?? []).map((img) => ({
      url: img.imageUrl,
      name: img.fileName,
    }));
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
