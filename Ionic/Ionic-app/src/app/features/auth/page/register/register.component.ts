import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { take, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { IonicModule, LoadingController, ToastController } from '@ionic/angular';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LocationService } from 'src/app/shared/services/location/location.service';
import { CityModel, DepartmentModel } from 'src/app/shared/models/location/location.model';
import { PasswordPolicyService } from 'src/app/shared/services/passwordPolicy/password-policy.service';
import { RegisterUserModel } from 'src/app/core/models/register.user.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonicModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private locationSrv = inject(LocationService);
  private pass = inject(PasswordPolicyService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  // Paso 1: Credenciales
  public credentialsForm: FormGroup = this.fb.group(
    {
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(150),
          Validators.pattern(/^\S.*$/), // no espacios en blanco iniciales
        ],
      ],
      password: [
        '',
        [
          this.pass.validator(),
          Validators.pattern(/^\S*$/), // no espacios
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.pass.passwordsMatch('password', 'confirmPassword') }
  );

  // Paso 2: Datos básicos
  public basicForm: FormGroup = this.fb.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/),
      ],
    ],
    identification: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9.\-]+$/),
      ],
    ],
  });

  // Paso 3: Contacto y ubicación
  public contactForm: FormGroup = this.fb.group({
    phoneNumber: [
      '',
      [
        Validators.required,
        Validators.maxLength(25),
        Validators.pattern(/^[0-9]{7,15}$/),
      ],
    ],
    address: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(120),
      ],
    ],
    departmentId: ['', Validators.required],
    cityId: ['', Validators.required],
  });

  currentStep = 1;
  loading = false;

  ngOnInit(): void {
    this.loadDepartments();
    this.bindDepartmentWatcher();
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.credentialsForm.valid) { this.currentStep = 2; return; }
    if (this.currentStep === 2 && this.basicForm.valid) { this.currentStep = 3; return; }
  }
  prevStep(): void { if (this.currentStep > 1) this.currentStep -= 1; }

  private bindDepartmentWatcher(): void {
    this.contactForm.get('departmentId')?.valueChanges.subscribe((val) => {
      const id = Number(val);
      if (id) {
        this.loadCities(id);
        this.contactForm.get('cityId')?.setValue('');
      } else {
        this.cities = [];
        this.contactForm.get('cityId')?.setValue('');
      }
    });
  }

  private loadDepartments(): void {
    this.locationSrv.getDepartment().subscribe((data) => this.departments = data);
  }

  private loadCities(id: number): void {
    this.locationSrv.getCity(id).subscribe((data) => this.cities = data);
  }

  private async toast(message: string, color: 'success' | 'danger' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await t.present();
  }

  async register(): Promise<void> {
    if (this.loading) return;

    this.credentialsForm.markAllAsTouched();
    this.basicForm.markAllAsTouched();
    this.contactForm.markAllAsTouched();

    if (this.credentialsForm.invalid || this.basicForm.invalid || this.contactForm.invalid) return;

    const payload: RegisterUserModel = {
      firstName: (this.basicForm.value.firstName ?? '').trim(),
      lastName: (this.basicForm.value.lastName ?? '').trim(),
      identification: this.basicForm.value.identification,
      phoneNumber: this.contactForm.value.phoneNumber,
      address: (this.contactForm.value.address ?? '').trim(),
      cityId: this.contactForm.value.cityId,
      email: (this.credentialsForm.value.email ?? '').trim(),
      password: this.credentialsForm.value.password,
    };

    this.loading = true;
    const loading = await this.loadingCtrl.create({ message: 'Creando usuario...', spinner: 'circles' });
    await loading.present();

    this.auth.Register(payload).pipe(
      take(1),
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'No se pudo completar el registro.';
        this.toast(msg, 'danger');
        return of({ isSuccess: false });
      }),
      finalize(async () => {
        this.loading = false;
        await loading.dismiss();
      })
    ).subscribe((data: any) => {
      if (data?.isSuccess) {
        this.toast('Usuario creado correctamente', 'success');
        this.router.navigate(['/auth/login']);
      } else {
        this.toast('Error al crear el usuario.', 'danger');
      }
    });
  }
}
