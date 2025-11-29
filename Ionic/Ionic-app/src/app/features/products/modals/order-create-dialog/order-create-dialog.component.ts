import { OrderCreateModel } from './../../models/order/order.model';
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea, IonNote
} from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { arrowBack, checkmark, chevronBack, chevronForward, bagCheckOutline } from 'ionicons/icons';
import { finalize, take } from 'rxjs';

import { DepartmentModel, CityModel } from '../../../../shared/models/location/location.model';
import { LocationService } from '../../../../shared/services/location/location.service';
import { OrderService } from '../../services/order/order.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from 'src/app/core/services/auth/auth.service';

// === Props desde el padre ===
export interface OrderCreateDialogData {
  productId: number;
  productName: string;
  unitPrice: number;
  stock: number;
  shippingNote: string; // 'Envío gratis' | 'No incluye envío'
}

// ===== Validadores utilitarios =====
const positiveInt = (label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const n = Number(c.value);
  if (!Number.isInteger(n) || n <= 0) return { positiveInt: `${label} debe ser mayor a 0.` };
  return null;
};

const maxInt = (max: number, label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const n = Number(c.value);
  if (!Number.isInteger(n)) return { required: `${label} es obligatorio.` };
  if (n > max) return { max: `${label} no puede exceder ${max}.` };
  return null;
};

const requiredTrimmed = (label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return { required: `${label} es obligatorio.` };
  return null;
};

const minLetters = (min: number, label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const raw = (c.value ?? '').toString();
  // Extrae letras Unicode (incluye tildes y ñ)
  const letters = raw.match(/\p{L}/gu) ?? [];
  if (letters.length < min) return { minLetters: `${label} debe tener al menos ${min} letras.` };
  return null;
};

const minAlnum = (min: number, label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const raw = (c.value ?? '').toString();
  const alnum = raw.match(/[\p{L}\p{N}]/gu) ?? [];
  if (alnum.length < min) return { minAlnum: `${label} debe tener al menos ${min} caracteres válidos.` };
  return null;
};

const phoneCoMobile = (label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const raw = (c.value ?? '').toString();
  const digits = raw.replace(/\D+/g, ''); // deja solo dígitos
  if (digits.length === 0) return { required: `${label} es obligatorio.` };
  if (digits.length !== 10) return { phoneCo: `${label} debe tener 10 dígitos.` };
  if (!digits.startsWith('3')) return { phoneCo: `${label} debe iniciar con 3.` };
  return null;
};

@Component({
  selector: 'app-order-create-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea,
    IonNote, ButtonComponent
  ],
  templateUrl: './order-create-dialog.component.html',
  styleUrls: ['./order-create-dialog.component.scss'],
})
export class OrderCreateModalComponent implements OnInit {
  // - Datos que llegan del padre via componentProps
  @Input() data!: OrderCreateDialogData;

  // Inyecciones
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private locationSrv = inject(LocationService);
  private orderSrv = inject(OrderService);
  private authSrv = inject(AuthService);

  // Estado UI
  currentStep = 1; // 1: producto, 2: entrega
  isSubmitting = false;

  // Formularios (como en tu código original)
  productGroup!: FormGroup;
  deliveryGroup!: FormGroup;

  // Catálogos
  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  // Opciones de interfaz para selects (popover compacto)
  readonly selectInterfaceOpts = { cssClass: 'select-popover' };

  constructor() {
    addIcons({ arrowBack, checkmark, chevronBack, chevronForward, bagCheckOutline });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadDepartments();
    this.prefillForm();
  }

  // ---------- Init Forms (exactamente como tu código) ----------
  private initForms(): void {
    this.productGroup = this.fb.group({
      quantityRequested: [1, [positiveInt('Cantidad'), maxInt(this.data.stock, 'Cantidad')]],
    });

    this.deliveryGroup = this.fb.group({
      recipientName: [
        '',
        [
          requiredTrimmed('Nombre del destinatario'),
          minLetters(3, 'Nombre del destinatario'),
        ],
      ],
      contactPhone: [
        '',
        [
          phoneCoMobile('Teléfono de contacto'),
        ],
      ],
      departmentId: [null, [Validators.required]],
      cityId: [null, [Validators.required, positiveInt('Ciudad')]],
      addressLine1: [
        '',
        [
          requiredTrimmed('Dirección'),
          minAlnum(5, 'Dirección'),
        ],
      ],
      addressLine2: [''],
      additionalNotes: [''],
    });
  }

  // ---------- Catálogos ----------
  private loadDepartments(): void {
    this.locationSrv.getDepartment().subscribe({
      next: (deps) => (this.departments = deps ?? []),
    });
  }

  onDepartmentChange(depId: number, cityId?: number): void {
    this.deliveryGroup.patchValue({ cityId: null });
    this.cities = [];
    if (!depId) return;

    this.locationSrv.getCity(depId).subscribe({
      next: (cities) => {
        this.cities = cities ?? [];
        if (cityId) {
          const exists = this.cities.some((c) => c.id === cityId);
          if (exists) {
            this.deliveryGroup.patchValue({ cityId });
          }
        }
      },
    });
  }

  // Precarga datos básicos del usuario (como en web)
  private prefillForm(): void {
    this.authSrv
      .GetDataBasic()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();

          this.deliveryGroup.patchValue({
            recipientName: fullName || undefined,
            contactPhone: data.phoneNumber ?? undefined,
            addressLine1: data.address ?? undefined,
            departmentId: data.departmentId ?? null,
          });

          if (data.departmentId) {
            this.onDepartmentChange(data.departmentId, data.cityId ?? undefined);
          }
        },
        error: () => {
          // Silenciar errores para no bloquear la creación de pedido
        },
      });
  }

  // ---------- Helpers UI (exactamente como tu código) ----------
  get quantity(): number {
    return Number(this.productGroup.value.quantityRequested || 0);
  }

  get subtotal(): number {
    return this.quantity * (this.data.unitPrice ?? 0);
  }

  formatCop(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  // ---------- Navegación de pasos ----------
  goNext(): void {
    if (this.currentStep === 1 && !this.productGroup.valid) {
      this.productGroup.markAllAsTouched();
      return;
    }
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  goPrev(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step === this.currentStep || step < 1 || step > 2) return;

    // Validación básica antes de cambiar paso
    if (step === 2 && !this.productGroup.valid) {
      this.productGroup.markAllAsTouched();
      return;
    }

    this.currentStep = step;
  }

  // ---------- Submit (exactamente como tu código) ----------
  async submit() {
    if (this.isSubmitting) {
      return;
    }

    console.log('%c ---> SUBMIT EJECUTADO', 'color: #28a745; font-weight: bold;');

    this.productGroup.markAllAsTouched();
    this.deliveryGroup.markAllAsTouched();

    if (this.productGroup.invalid || this.deliveryGroup.invalid) {
      console.log('❌ Formulario inválido');
      return;
    }

    const dto: OrderCreateModel = {
      productId: this.data.productId,
      quantityRequested: Number(this.productGroup.value.quantityRequested),
      recipientName: this.deliveryGroup.value.recipientName,
      contactPhone: this.deliveryGroup.value.contactPhone,
      addressLine1: this.deliveryGroup.value.addressLine1,
      addressLine2: this.deliveryGroup.value.addressLine2,
      cityId: Number(this.deliveryGroup.value.cityId),
      additionalNotes: this.deliveryGroup.value.additionalNotes,
    };

    console.log('%c DTO a enviar:', 'color: #00aaff; font-weight: bold;', dto);

    console.log('%c ---> LLAMANDO SERVICIO...', 'color: orange; font-weight: bold;');

    this.isSubmitting = true;

    this.orderSrv.create(dto).pipe(
      take(1),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: async (resp) => {
        console.log('%c ✔ RESPUESTA OK:', 'color: #00d26a; font-weight: bold;', resp);
        const successMsg = (resp as any)?.message || 'Pedido creado correctamente.';
        await this.toast(successMsg, 'success');
        this.modalCtrl.dismiss({ created: true, order: resp });
      },
      error: async (err) => {
        console.log('%c ❌ ERROR:', 'color: red; font-weight: bold;', err);
        await this.toast('No se pudo crear el pedido', 'error');
      },
    });
  }


  close(): void {
    this.modalCtrl.dismiss();
  }

  // ---------- Toast helper ----------
  private async toast(title: string, icon: 'success'|'error'|'loading'|'info') {
    const t = await this.toastCtrl.create({
      message: title,
      duration: icon === 'loading' ? 0 : 2000,
      position: 'top',
      color: icon === 'success' ? 'success' : icon === 'error' ? 'danger' : 'medium'
    });
    await t.present();
  }
}
