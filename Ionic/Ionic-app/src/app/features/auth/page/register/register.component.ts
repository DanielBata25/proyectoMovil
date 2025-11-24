import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { take, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LocationService } from 'src/app/shared/services/location/location.service';
import { CityModel, DepartmentModel } from 'src/app/shared/models/location/location.model';
import { PasswordPolicyService } from 'src/app/shared/services/passwordPolicy/password-policy.service';
import { RegisterUserModel } from 'src/app/core/models/register.user.model';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

type FormSection = 'credentials' | 'basic' | 'contact';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonicModule, ButtonComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private locationSrv = inject(LocationService);
  private pass = inject(PasswordPolicyService);
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
          RegisterComponent.notBlank,
        ],
      ],
      password: [
        '',
        [
          this.pass.validator(),
          RegisterComponent.notBlank,
          RegisterComponent.noSpaces,
        ],
      ],
      confirmPassword: ['', [Validators.required, RegisterComponent.notBlank]],
    },
    { validators: this.pass.passwordsMatch('password', 'confirmPassword') }
  );

  // Paso 2: Datos básicos
  public basicForm: FormGroup = this.fb.group({
    firstName: [
      '',
      [
        Validators.required,
        RegisterComponent.notBlank,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        RegisterComponent.notBlank,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/),
      ],
    ],
    identification: [
      '',
      [
        Validators.required,
        RegisterComponent.notBlank,
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
        RegisterComponent.notBlank,
        Validators.maxLength(25),
        RegisterComponent.phoneDigitsValidator,
      ],
    ],
    address: [
      '',
      [
        Validators.required,
        RegisterComponent.notBlank,
        Validators.minLength(5),
        Validators.maxLength(120),
      ],
    ],
    departmentId: [null, [Validators.required, RegisterComponent.positiveSelect]],
    cityId: [null, [Validators.required, RegisterComponent.positiveSelect]],
  });

  private readonly sectionMessages: Record<FormSection, Record<string, Record<string, string>>> = {
    credentials: {
      email: {
        required: 'El email es obligatorio.',
        blank: 'El email no puede estar en blanco.',
        email: 'Formato de email no válido.',
        maxlength: 'El email no debe superar 150 caracteres.',
      },
      password: {
        required: 'La contraseña es obligatoria.',
        blank: 'La contraseña no puede estar en blanco.',
        passwordPolicy: 'Debe tener al menos 6 caracteres y una mayúscula.',
        spaces: 'La contraseña no debe contener espacios.',
      },
      confirmPassword: {
        required: 'Debes confirmar la contraseña.',
        blank: 'Debes confirmar la contraseña.',
        passwordMismatch: 'Las contraseñas no coinciden.',
      },
    },
    basic: {
      firstName: {
        required: 'El nombre es obligatorio.',
        blank: 'El nombre no puede estar en blanco.',
        minlength: 'Debe tener al menos 2 caracteres.',
        maxlength: 'No debe superar 50 caracteres.',
        pattern: 'Solo debe contener letras y espacios.',
      },
      lastName: {
        required: 'El apellido es obligatorio.',
        blank: 'El apellido no puede estar en blanco.',
        minlength: 'Debe tener al menos 2 caracteres.',
        maxlength: 'No debe superar 50 caracteres.',
        pattern: 'Solo debe contener letras y espacios.',
      },
      identification: {
        required: 'La identificación es obligatoria.',
        blank: 'La identificación no puede estar en blanco.',
        minlength: 'Debe tener al menos 5 caracteres.',
        maxlength: 'No debe superar 20 caracteres.',
        pattern: 'Solo puede contener letras, números, punto y guion.',
      },
    },
    contact: {
      phoneNumber: {
        required: 'El teléfono es obligatorio.',
        blank: 'El teléfono no puede estar en blanco.',
        digits: 'Debe tener entre 7 y 15 dígitos.',
        maxlength: 'No debe superar 25 caracteres.',
      },
      address: {
        required: 'La dirección es obligatoria.',
        blank: 'La dirección no puede estar en blanco.',
        minlength: 'Debe tener al menos 5 caracteres.',
        maxlength: 'No debe superar 120 caracteres.',
      },
      departmentId: {
        required: 'El departamento es obligatorio.',
        invalidSelect: 'Debe seleccionar un departamento válido.',
      },
      cityId: {
        required: 'La ciudad es obligatoria.',
        invalidSelect: 'Debe seleccionar una ciudad válida.',
      },
    },
  };

  currentStep = 1;
  loading = false;

  ngOnInit(): void {
    this.loadDepartments();
    this.bindDepartmentWatcher();
  }

  async nextStep(): Promise<void> {
    if (this.currentStep === 1) {
      this.credentialsForm.markAllAsTouched();
      if (this.credentialsForm.invalid) {
        await this.toast(this.getSectionError('credentials') ?? 'Corrige los campos del Paso 1.', 'danger');
        return;
      }
      this.currentStep = 2;
      return;
    }
    if (this.currentStep === 2) {
      this.basicForm.markAllAsTouched();
      if (this.basicForm.invalid) {
        await this.toast(this.getSectionError('basic') ?? 'Corrige los campos del Paso 2.', 'danger');
        return;
      }
      this.currentStep = 3;
    }
  }
  prevStep(): void { if (this.currentStep > 1) this.currentStep -= 1; }

  private bindDepartmentWatcher(): void {
    this.contactForm.get('departmentId')?.valueChanges.subscribe((val) => {
      const id = Number(val);
      const cityControl = this.contactForm.get('cityId');
      cityControl?.reset(null);
      if (id > 0) {
        this.loadCities(id);
      } else {
        this.cities = [];
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
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  async register(): Promise<void> {
    if (this.loading) return;

    this.credentialsForm.markAllAsTouched();
    this.basicForm.markAllAsTouched();
    this.contactForm.markAllAsTouched();

    if (this.credentialsForm.invalid || this.basicForm.invalid || this.contactForm.invalid) {
      const message =
        this.getSectionError('credentials') ??
        this.getSectionError('basic') ??
        this.getSectionError('contact') ??
        'Completa los campos obligatorios.';
      await this.toast(message, 'danger');
      return;
    }

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

    this.auth.Register(payload).pipe(
      take(1),
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'No se pudo completar el registro.';
        this.toast(msg, 'danger');
        return of({ isSuccess: false });
      }),
      finalize(() => { this.loading = false; })
    ).subscribe((data: any) => {
      if (data?.isSuccess) {
        this.toast('Usuario creado correctamente', 'success');
        this.router.navigate(['/auth/login']);
      } else {
        this.toast('Error al crear el usuario.', 'danger');
      }
    });
  }

  shouldShowError(form: FormGroup, controlName: string, section: FormSection): boolean {
    const control = form.get(controlName);
    if (!control) return false;
    if (section === 'credentials' && controlName === 'confirmPassword') {
      return (
        (control.invalid && (control.touched || control.dirty)) ||
        (form.hasError('passwordMismatch') && (control.touched || control.dirty))
      );
    }
    return control.invalid && (control.touched || control.dirty);
  }

  getFieldMessage(section: FormSection, controlName: string): string {
    const form = this.getForm(section);
    const control = form.get(controlName);
    const messages = this.sectionMessages[section][controlName];
    if (!messages) return 'Campo inválido.';

    if (section === 'credentials' && controlName === 'confirmPassword' && form.hasError('passwordMismatch')) {
      return messages['passwordMismatch'];
    }

    const resolved = this.resolveMessage(messages, control?.errors ?? null);
    return resolved ?? 'Campo inválido.';
  }

  private getSectionError(section: FormSection): string | null {
    const form = this.getForm(section);
    const fields = this.sectionMessages[section];
    for (const field of Object.keys(fields)) {
      if (section === 'credentials' && field === 'confirmPassword' && form.hasError('passwordMismatch')) {
        return fields[field]['passwordMismatch'];
      }
      const control = form.get(field);
      if (control?.invalid) {
        const msg = this.resolveMessage(fields[field], control.errors ?? null);
        if (msg) return msg;
      }
    }
    return null;
  }

  private resolveMessage(messages: Record<string, string>, errors: ValidationErrors | null): string | null {
    if (!errors) return null;
    for (const key of Object.keys(messages)) {
      if (errors[key]) return messages[key];
    }
    return null;
  }

  private getForm(section: FormSection): FormGroup {
    if (section === 'credentials') return this.credentialsForm;
    if (section === 'basic') return this.basicForm;
    return this.contactForm;
  }

  private static notBlank(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').toString();
    return value.trim().length ? null : { blank: true };
  }

  private static noSpaces(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').toString();
    return value.includes(' ') ? { spaces: true } : null;
  }

  private static phoneDigitsValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').toString();
    if (!value.trim()) return null;
    const digits = value.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15 ? null : { digits: true };
  }

  private static positiveSelect(control: AbstractControl): ValidationErrors | null {
    const value = Number(control.value);
    if (!value) return { invalidSelect: true };
    return value > 0 ? null : { invalidSelect: true };
  }
}
