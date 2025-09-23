import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonTextarea, IonNote, IonFooter, IonList, IonBadge, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, checkmark, chevronBack, chevronForward, cloudUpload, trash } from 'ionicons/icons';

import { DepartmentModel, CityModel } from '../../../../shared/models/location/location.model';
import { LocationService } from '../../../../shared/services/location/location.service';
import { OrderService } from '../../services/order/order.service';

// === Props que recibirás desde el padre (mismo shape que tu web) ===
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
const phoneBasic = (label: string): ValidatorFn => (c: AbstractControl): ValidationErrors | null => {
  const v = (c.value ?? '').toString().trim();
  if (!v) return { required: `${label} es obligatorio.` };
  if (!/^[0-9 +()\-]{7,20}$/.test(v)) return { pattern: `${label} no es válido.` };
  return null;
};

@Component({
  selector: 'app-order-create-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea,
    IonNote, IonGrid, IonRow, IonCol
],
  templateUrl: './order-create-dialog.component.html',
  styleUrls: ['./order-create-dialog.component.scss'],
})
export class OrderCreateModalComponent implements OnInit {
  // ⬇️ Datos que llegan del padre vía componentProps
  @Input() data!: OrderCreateDialogData;

  // Inyecciones
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private locationSrv = inject(LocationService);
  private orderSrv = inject(OrderService);

  // Estado UI
  currentStep = 1; // 1: producto, 2: entrega, 3: comprobante
  isSubmitting = false;
  MAX_FILE_MB = 6;
  MAX_FILE_BYTES = this.MAX_FILE_MB * 1024 * 1024;

  // Formularios
  productGroup!: FormGroup;
  deliveryGroup!: FormGroup;
  paymentGroup!: FormGroup;

  // Catálogos
  departments: DepartmentModel[] = [];
  cities: CityModel[] = [];

  // Archivo
  paymentFile?: File;
  paymentPreview?: string;

  constructor() {
    addIcons({ close, checkmark, chevronBack, chevronForward, cloudUpload, trash });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadDepartments();
  }

  // ====== Init Forms ======
  private initForms(): void {
    this.productGroup = this.fb.group({
      quantityRequested: [1, [positiveInt('Cantidad'), maxInt(this.data.stock, 'Cantidad')]],
    });

    this.deliveryGroup = this.fb.group({
      recipientName: ['', [requiredTrimmed('Nombre del destinatario')]],
      contactPhone: ['', [phoneBasic('Teléfono de contacto')]],
      departmentId: [null, [Validators.required]],
      cityId: [null, [Validators.required, positiveInt('Ciudad')]],
      addressLine1: ['', [requiredTrimmed('Dirección')]],
      addressLine2: [''],
      additionalNotes: [''],
    });

    this.paymentGroup = this.fb.group({
      paymentImage: [null, [Validators.required]],
    });
  }

  // ====== Catálogos ======
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

  // ====== Helpers ======
  get quantity(): number {
    return Number(this.productGroup.value.quantityRequested || 0);
  }
  get subtotal(): number {
    return this.quantity * (this.data.unitPrice ?? 0);
  }
  formatCop(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  // ====== Navegación de pasos ======
  canNextFromStep1(): boolean { return this.productGroup.valid; }
  canNextFromStep2(): boolean { return this.deliveryGroup.valid; }
  goNext(): void {
    if (this.currentStep === 1 && !this.canNextFromStep1()) { this.productGroup.markAllAsTouched(); return; }
    if (this.currentStep === 2 && !this.canNextFromStep2()) { this.deliveryGroup.markAllAsTouched(); return; }
    if (this.currentStep < 3) this.currentStep++;
  }
  goPrev(): void { if (this.currentStep > 1) this.currentStep--; }
  goTo(step: number): void { this.currentStep = step; }

  // ====== Archivo ======
  onFilePicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { this.toast('El comprobante debe ser una imagen (JPG/PNG/WEBP).', 'warning'); return; }
    if (file.size > this.MAX_FILE_BYTES) { this.toast(`La imagen excede ${this.MAX_FILE_MB} MB.`, 'warning'); return; }

    this.paymentFile = file;
    this.paymentGroup.get('paymentImage')!.setValue('ok');
    const reader = new FileReader();
    reader.onload = e => this.paymentPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }
  removeFile(): void {
    this.paymentFile = undefined;
    this.paymentPreview = undefined;
    this.paymentGroup.get('paymentImage')!.reset();
  }

  // ====== Submit ======
  async submit(): Promise<void> {
    if (this.isSubmitting) return;

    this.productGroup.markAllAsTouched();
    this.deliveryGroup.markAllAsTouched();
    this.paymentGroup.markAllAsTouched();

    if (this.productGroup.invalid || this.deliveryGroup.invalid || !this.paymentFile) return;

    const qty = Number(this.productGroup.value.quantityRequested);
    const d = this.deliveryGroup.value;

    // Mantengo el DTO como en tu servicio actual (archivo incluido)
    const dto = {
      productId: this.data.productId,
      quantityRequested: qty,
      recipientName: (d.recipientName ?? '').trim(),
      contactPhone: (d.contactPhone ?? '').trim(),
      addressLine1: (d.addressLine1 ?? '').trim(),
      addressLine2: (d.addressLine2 ?? '').trim() || undefined,
      cityId: Number(d.cityId),
      additionalNotes: (d.additionalNotes ?? '').trim() || undefined,
      paymentImage: this.paymentFile, // <- archivo
    };

    const loading = await this.loadingCtrl.create({ message: 'Creando pedido…' });
    await loading.present();
    this.isSubmitting = true;

    this.orderSrv.create(dto).subscribe({
      next: async (resp: any) => {
        this.isSubmitting = false;
        await loading.dismiss();

        // Soporto ambas variantes (isSuccess o IsSuccess)
        const ok = resp?.IsSuccess ?? resp?.isSuccess ?? false;
        const orderId = resp?.OrderId ?? resp?.orderId;

        if (ok) {
          await this.toast(`Pedido #${orderId} creado`, 'success');
          this.modalCtrl.dismiss({ IsSuccess: true, OrderId: orderId });
        } else {
          this.toast('No se pudo crear el pedido.', 'danger');
        }
      },
      error: async (err) => {
        this.isSubmitting = false;
        await loading.dismiss();
        const msg = err?.error?.message || err?.message || 'No se pudo crear el pedido.';
        this.toast(msg, 'danger');
      }
    });
  }

  close(): void {
    this.modalCtrl.dismiss();
  }

  // ====== UI helpers ======
  private async toast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 1700, position: 'top', color });
    await t.present();
  }
}
