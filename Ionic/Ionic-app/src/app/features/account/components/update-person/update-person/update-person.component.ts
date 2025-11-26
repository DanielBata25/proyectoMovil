import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, close } from 'ionicons/icons';

import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PersonUpdateModel, UserSelectModel } from 'src/app/core/models/user.model';
import { DepartmentModel, CityModel } from 'src/app/shared/models/location/location.model';
import { LocationService } from 'src/app/shared/services/location/location.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-update-person',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    ButtonComponent
  ],
  templateUrl: './update-person.component.html',
  styleUrls: ['./update-person.component.scss']
})
export class UpdatePersonComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private locationSvc = inject(LocationService);
  private location = inject(Location);

  title = 'Actualizar datos personales';
  person?: UserSelectModel;
  isLoading = false;

  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  isLoadingDepartments = false;
  isLoadingCities = false;
  private initializing = false;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(4)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    departmentId: [null as number | null, [Validators.required]],
    cityId: [{ value: null as number | null, disabled: true }, [Validators.required]],
  });

  get f() { return this.form.controls; }

  constructor() {
    addIcons({ save, close });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPerson();
    this.handleDepartmentChanges();
  }

  private loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.locationSvc.getDepartment().subscribe({
      next: (deps) => this.departments = deps ?? [],
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudieron cargar los departamentos.',
          buttons: ['OK']
        });
        alert.present();
      },
      complete: () => this.isLoadingDepartments = false
    });
  }

  private handleDepartmentChanges(): void {
    this.form.get('departmentId')!.valueChanges.subscribe((deptId) => {
      if (!deptId) {
        this.cities = [];
        this.form.get('cityId')!.reset();
        this.form.get('cityId')!.disable({ emitEvent: false });
        return;
      }
      const preselect = this.initializing ? this.person?.cityId : undefined;
      this.fetchCitiesForDept(deptId as number, preselect);
    });
  }

  private fetchCitiesForDept(deptId: number, preselectCityId?: number): void {
    this.isLoadingCities = true;
    if (!this.initializing) {
      this.cities = [];
      this.form.get('cityId')!.reset(undefined, { emitEvent: false });
      this.form.get('cityId')!.disable({ emitEvent: false });
    }

    this.locationSvc.getCity(deptId).subscribe({
      next: (cities) => {
        this.cities = cities ?? [];
        this.form.get('cityId')!.enable({ emitEvent: false });
        if (preselectCityId) {
          const exists = this.cities.some(c => c.id === preselectCityId);
          if (exists) {
            this.form.get('cityId')!.setValue(preselectCityId, { emitEvent: false });
          }
        }
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudieron cargar las ciudades.',
          buttons: ['OK']
        });
        alert.present();
      },
      complete: () => this.isLoadingCities = false
    });
  }

  private loadPerson(): void {
    this.isLoading = true;
    this.initializing = true;

    this.auth.GetDataBasic().subscribe({
      next: (data) => {
        this.person = data;
        this.form.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          phoneNumber: data.phoneNumber
        }, { emitEvent: false });

        if ((data as any).departmentId) {
          this.form.get('departmentId')!.setValue((data as any).departmentId, { emitEvent: false });
          this.fetchCitiesForDept((data as any).departmentId, data.cityId ?? undefined);
        }

        this.form.markAsPristine();
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudieron cargar los datos.',
          buttons: ['OK']
        });
        alert.present();
      },
      complete: () => {
        this.isLoading = false;
        this.initializing = false;
      }
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.pristine) {
      const toast = await this.toastCtrl.create({
        message: 'No realizaste modificaciones.',
        duration: 2000,
        color: 'medium'
      });
      toast.present();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: PersonUpdateModel = {
      firstName: raw.firstName!,
      lastName: raw.lastName!,
      address: raw.address!,
      phoneNumber: raw.phoneNumber!,
      cityId: raw.cityId!
    };

    this.isLoading = true;
    this.auth.UpdatePerson(dto).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Datos actualizados correctamente ✅',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.form.markAsPristine();
        this.router.navigate(['/account/info']);
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudo actualizar la información.',
          buttons: ['OK']
        });
        alert.present();
      },
      complete: () => this.isLoading = false
    });
  }

  cancel(): void {
    this.router.navigate(['/account/info']);
  }
}
