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
import { ModalController, ToastController, LoadingController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { arrowBack, checkmark, chevronBack, chevronForward } from 'ionicons/icons';

import { DepartmentModel, CityModel } from '../../../../shared/models/location/location.model';
import { LocationService } from '../../../../shared/services/location/location.service';
import { OrderService } from '../../services/order/order.service';

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
    IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea,
    IonNote
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
  private loadingCtrl = inject(LoadingController);
  private locationSrv = inject(LocationService);
  private orderSrv = inject(OrderService);

  // Estado UI
  currentStep = 1; // 1: producto, 2: entrega
  isSubmitting = false;

  // Formularios (como en tu código original)
  productGroup!: FormGroup;
  deliveryGroup!: FormGroup;

  // Catálogos
  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  constructor() {
    addIcons({ arrowBack, checkmark, chevronBack, chevronForward });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadDepartments();
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

  onDepartmentChange(depId: number): void {
    this.deliveryGroup.patchValue({ cityId: null });
    this.cities = [];
    if (!depId) return;

    this.locationSrv.getCity(depId).subscribe({
      next: (cities) => (this.cities = cities ?? []),
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
  submit(): void {
    if (this.isSubmitting) return;

    this.productGroup.markAllAsTouched();
    this.deliveryGroup.markAllAsTouched();

    if (this.productGroup.invalid || this.deliveryGroup.invalid) return;

    const qty = Number(this.productGroup.value.quantityRequested);
    const d = this.deliveryGroup.value;

    const dto: any = {
      productId: this.data.productId,
      quantityRequested: qty,
      recipientName: (d.recipientName ?? '').trim(),
      contactPhone: (d.contactPhone ?? '').trim(),
      addressLine1: (d.addressLine1 ?? '').trim(),
      addressLine2: (d.addressLine2 ?? '').trim() || undefined,
      cityId: Number(d.cityId),
      additionalNotes: (d.additionalNotes ?? '').trim() || undefined,
    };

    this.isSubmitting = true;

    this.toast('Creando pedido...', 'loading');

    this.orderSrv.create(dto).subscribe({
      next: (resp: any) => {
        this.isSubmitting = false;

        if (resp && resp.isSuccess) {
          this.toast(`Pedido #${resp.orderId} creado exitosamente`, 'success');
          this.modalCtrl.dismiss({ isSuccess: true, orderId: resp.orderId });
        } else {
          const msg = resp?.message || 'Ocurrió un error al crear el pedido.';
          this.toast(msg, 'error');
          this.modalCtrl.dismiss({ isSuccess: false, message: msg });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message || 'No se pudo crear el pedido.';
        this.toast(msg, 'error');
        this.modalCtrl.dismiss({ isSuccess: false, message: msg });
      }
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