import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ContainerCardFlexComponent } from '../../../../shared/components/cards/container-card-flex/container-card-flex.component';
import { FarmService } from '../../../../shared/services/farm/farm.service';
import { LocationService } from '../../../../shared/services/location/location.service';
import { FarmSelectModel } from '../../../../shared/models/farm/farm.model';
import { DepartmentModel, CityModel } from '../../../../shared/models/location/location.model';

@Component({
  selector: 'app-farm-page',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, ContainerCardFlexComponent],
  templateUrl: './farm.component.html',
  styleUrls: ['./farm.component.scss'],
})
export class FarmComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly locationService = inject(LocationService);

  /** Estado */
  farms: FarmSelectModel[] = [];
  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  /** Controles */
  readonly departmentCtrl = new FormControl<number | null>({ value: null, disabled: true });
  readonly cityCtrl = new FormControl<number | null>({ value: null, disabled: true });
  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

  /** Loading */
  isLoadingFarms = false;
  isLoadingDepartments = false;
  isLoadingCities = false;

  /** UI */
  showFilters = false;

  /** Paginado (cliente) */
  pageIndex = 0;
  readonly pageSize = 8;

  private normalize = (value: string | null | undefined) =>
    (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  get filteredFarms(): FarmSelectModel[] {
    const term = this.normalize(this.searchCtrl.value);
    const deptId = this.departmentCtrl.value;
    const cityId = this.cityCtrl.value;

    return this.farms.filter(farm => {
      const matchesDept = deptId ? farm.departmentId === deptId : true;
      const matchesCity = cityId ? farm.cityId === cityId : true;
      const matchesTerm = term
        ? this.normalize(farm.name).includes(term) ||
          this.normalize(farm.producerName).includes(term) ||
          this.normalize(farm.cityName).includes(term)
        : true;
      return matchesDept && matchesCity && matchesTerm;
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
      if (!deptId) {
        this.cityCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
        this.cities = [];
        this.resetPaging();
        return;
      }

      this.loadCities(deptId);
      this.resetPaging();
    });

    this.cityCtrl.valueChanges.subscribe(() => this.resetPaging());
  }

  /** Acciones UI */
  onSearch(ev: CustomEvent): void {
    const value = (ev.detail as any)?.value ?? '';
    this.searchCtrl.setValue(value, { emitEvent: true });
  }

  onDepartmentSelect(ev: CustomEvent): void {
    const value = (ev.detail as any)?.value ?? null;
    this.departmentCtrl.setValue(value, { emitEvent: true });
    if (!value) {
      this.cityCtrl.reset({ value: null, disabled: true }, { emitEvent: false });
    }
  }

  onCitySelect(ev: CustomEvent): void {
    const value = (ev.detail as any)?.value ?? null;
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
    this.searchCtrl.setValue('', { emitEvent: true });
    this.cities = [];
    this.resetPaging();
  }

  /** Paginación */
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

  private resetPaging(): void {
    this.pageIndex = 0;
  }

  /** Carga de datos */
  private loadFarms(): void {
    this.isLoadingFarms = true;
    this.farmService.getAll().subscribe({
      next: farms => {
        this.farms = farms ?? [];
        this.resetPaging();
        this.isLoadingFarms = false;
      },
      error: err => {
        console.error('[Farm] getAll', err);
        this.farms = [];
        this.isLoadingFarms = false;
      },
    });
  }

  private loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.locationService.getDepartment().subscribe({
      next: departments => {
        this.departments = departments ?? [];
        this.isLoadingDepartments = false;
        this.departmentCtrl.enable({ emitEvent: false });
      },
      error: err => {
        console.error('[Farm] getDepartment', err);
        this.departments = [];
        this.isLoadingDepartments = false;
      },
    });
  }

  private loadCities(departmentId: number): void {
    this.isLoadingCities = true;
    this.cityCtrl.disable({ emitEvent: false });
    this.cityCtrl.setValue(null, { emitEvent: false });

    this.locationService.getCity(departmentId).subscribe({
      next: cities => {
        this.cities = cities ?? [];
        this.isLoadingCities = false;
        this.cityCtrl.enable({ emitEvent: false });
      },
      error: err => {
        console.error('[Farm] getCity', err);
        this.cities = [];
        this.isLoadingCities = false;
      },
    });
  }
}
