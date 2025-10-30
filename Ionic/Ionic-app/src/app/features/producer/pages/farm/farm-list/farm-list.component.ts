import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Location } from '@angular/common';

import { ContainerCardFlexComponent } from 'src/app/shared/components/cards/container-card-flex/container-card-flex.component';
import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { LocationService } from 'src/app/shared/services/location/location.service';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';
import { DepartmentModel, CityModel } from 'src/app/shared/models/location/location.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-farm-list',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    ContainerCardFlexComponent,
  ],
  templateUrl: './farm-list.component.html',
  styleUrls: ['./farm-list.component.scss'],
})
export class FarmListComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly locationService = inject(LocationService);
  private readonly alertCtrl = inject(AlertController);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  farms: FarmSelectModel[] = [];
  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  loadingFarms = true;
  isLoadingDepartments = false;
  isLoadingCities = false;

  showFilters = false;

  readonly departmentCtrl = new FormControl<number | null>({ value: null, disabled: true });
  readonly cityCtrl = new FormControl<number | null>({ value: null, disabled: true });
  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

  pageIndex = 0;
  readonly pageSize = 8;

  private normalize = (value: string | null | undefined) =>
    (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  get filteredFarms(): FarmSelectModel[] {
    const query = this.normalize(this.searchCtrl.value);
    const deptId = this.toNumber(this.departmentCtrl.value);
    const cityId = this.toNumber(this.cityCtrl.value);

    return this.farms.filter(farm => {
      const matchesDept = deptId ? farm.departmentId === deptId : true;
      const matchesCity = cityId ? farm.cityId === cityId : true;
      const matchesQuery = query
        ? this.normalize(farm.name).includes(query) ||
          this.normalize(farm.producerName).includes(query) ||
          this.normalize(farm.cityName).includes(query)
        : true;
      return matchesDept && matchesCity && matchesQuery;
    });
  }

  get totalPages(): number {
    const count = this.filteredFarms.length;
    return count > 0 ? Math.ceil(count / this.pageSize) : 1;
  }

  get pagedFarms(): FarmSelectModel[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredFarms.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.loadFarms();
    this.loadDepartments();

    this.searchCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => this.resetPaging());

    this.departmentCtrl.valueChanges.subscribe(deptId => {
      const numericId = this.toNumber(deptId);
      if (numericId === null) {
        this.cities = [];
        this.cityCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
        this.resetPaging();
        return;
      }

      this.loadCities(numericId);
      this.resetPaging();
    });

    this.cityCtrl.valueChanges.subscribe(value => {
      const numeric = this.toNumber(value);
      if (numeric !== value) {
        this.cityCtrl.setValue(numeric, { emitEvent: false });
      }
      this.resetPaging();
    });
  }

  onSearch(ev: CustomEvent): void {
    const value = (ev.detail as any)?.value ?? '';
    this.searchCtrl.setValue(value, { emitEvent: true });
  }

  onDepartmentSelect(ev: CustomEvent): void {
    const rawValue = (ev.detail as any)?.value ?? null;
    const value = this.toNumber(rawValue);
    this.departmentCtrl.setValue(value, { emitEvent: true });
    if (value == null) {
      this.cityCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    }
  }

  onCitySelect(ev: CustomEvent): void {
    const rawValue = (ev.detail as any)?.value ?? null;
    const value = this.toNumber(rawValue);
    this.cityCtrl.setValue(value, { emitEvent: true });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.departmentCtrl.reset(
      { value: null, disabled: this.isLoadingDepartments },
      { emitEvent: false }
    );
    if (!this.isLoadingDepartments) {
      this.departmentCtrl.enable({ emitEvent: false });
    }
    this.cityCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    this.cities = [];
    this.searchCtrl.setValue('', { emitEvent: true });
    this.resetPaging();
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
        this.resetPaging();
      },
      error: err => console.error('[Farm][delete]', err),
    });
  }

  private loadFarms(): void {
    this.loadingFarms = true;
    this.farmService.getByProducer().subscribe({
      next: farms => {
        this.farms = farms ?? [];
        this.resetPaging();
        this.loadingFarms = false;
      },
      error: err => {
        console.error('[Farm][getByProducer]', err);
        this.farms = [];
        this.loadingFarms = false;
      },
    });
  }

  private loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.departmentCtrl.disable({ emitEvent: false });
    this.locationService.getDepartment().subscribe({
      next: departments => {
        this.departments = departments ?? [];
        this.isLoadingDepartments = false;
        this.departmentCtrl.enable({ emitEvent: false });
      },
      error: err => {
        console.error('[Farm][getDepartment]', err);
        this.isLoadingDepartments = false;
      },
    });
  }

  private loadCities(departmentId: number): void {
    this.isLoadingCities = true;
    this.cityCtrl.disable({ emitEvent: false });
    this.cityCtrl.setValue(null, { emitEvent: false });

    this.locationService.getCity(Number(departmentId)).subscribe({
      next: cities => {
        this.cities = cities ?? [];
        this.isLoadingCities = false;
        this.cityCtrl.enable({ emitEvent: false });
      },
      error: err => {
        console.error('[Farm][getCity]', err);
        this.isLoadingCities = false;
      },
    });
  }

  private resetPaging(): void {
    this.pageIndex = 0;
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}









