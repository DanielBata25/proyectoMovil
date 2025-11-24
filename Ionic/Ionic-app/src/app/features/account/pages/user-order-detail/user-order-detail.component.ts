import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  OrderDetailModel,
  OrderStatus,
  OrderConfirmRequest,
  UploadPaymentRequest,
} from '../../../products/models/order/order.model';
import { OrderService } from '../../../products/services/order/order.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { OrderChatComponent } from 'src/app/shared/components/order-chat/order-chat.component';

@Component({
  selector: 'app-user-order-detail',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule,
    ButtonComponent,
    OrderChatComponent
  ],
  templateUrl: './user-order-detail.component.html',
  styleUrls: ['./user-order-detail.component.scss'],
})
export class UserOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersSrv = inject(OrderService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  code!: string;
  loading = true;
  confirming = false;
  detail?: OrderDetailModel;

  // zoom imagen
  showImage = false;

  // límite de archivo para comprobante
  readonly MAX_FILE_MB = 6;
  readonly MAX_FILE_BYTES = this.MAX_FILE_MB * 1024 * 1024;

  // estrellas para mostrar la calificación del productor al cliente
  stars = [1, 2, 3, 4, 5];
  // UI: chat flotante
  showChat = false;

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code'));
    if (!this.code) {
      this.router.navigateByUrl('/account/orders');
      return;
    }
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.detail = await firstValueFrom(
        this.ordersSrv.getDetailForUser(this.code)
      );
    } catch (err: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: err?.error?.message ?? 'No se pudo cargar el pedido.',
        buttons: ['OK'],
        cssClass: 'error-alert'
      });
      await alert.present();
      this.detail = undefined;
    } finally {
      this.loading = false;
    }
  }

  /* ======= Guards por estado ======= */
  get canCancel(): boolean {
    return this.detail?.status === 'PendingReview';
  }

  get canUploadPayment(): boolean {
    return this.detail?.status === 'AcceptedAwaitingPayment';
  }

  get canConfirm(): boolean {
    return this.detail?.status === 'DeliveredPendingBuyerConfirm';
  }

  get hasRating(): boolean {
    return !!this.detail?.consumerRating;
  }

  /* ======= Chip de estado (texto + clase) ======= */
  get statusChip(): { text: string; cls: string } {
    const s = (this.detail?.status || '') as OrderStatus;
    switch (s) {
      case 'PendingReview':
        return { text: 'Pendiente de revisión', cls: 'info' };

      case 'AcceptedAwaitingPayment':
        return { text: 'Aceptado (esperando pago)', cls: 'warning' };

      case 'PaymentSubmitted':
        return { text: 'Pago enviado (en revisión)', cls: 'info' };

      case 'Preparing':
        return { text: 'Preparando', cls: 'info' };

      case 'Dispatched':
        return { text: 'Despachado', cls: 'info' };

      case 'DeliveredPendingBuyerConfirm':
        return {
          text: 'Entregado (pendiente de confirmación)',
          cls: 'warning',
        };

      case 'Completed':
        return { text: 'Completado', cls: 'success' };

      case 'Rejected':
        return { text: 'Rechazado', cls: 'danger' };

      case 'Disputed':
        return { text: 'En disputa', cls: 'danger' };

      case 'Expired':
        return { text: 'Expirado', cls: 'danger' };

      case 'CancelledByUser':
        return { text: 'Cancelado por el usuario', cls: 'danger' };

      default:
        return { text: s, cls: 'neutral' };
    }
  }

  /* ======= Acciones ======= */
  async confirm(answer: 'yes' | 'no'): Promise<void> {
    if (!this.detail) return;

    const alert = await this.alertController.create({
      header: answer === 'yes' ? '¿Confirmar recepción?' : '¿Reportar problema?',
      message: answer === 'yes' 
        ? 'Se dará por completado el pedido.' 
        : 'Se marcará como "En disputa".',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: answer === 'yes' ? 'Sí, recibido' : 'Reportar',
          handler: async () => {
            await this.processConfirmation(answer);
          }
        }
      ],
      cssClass: 'confirm-alert'
    });
    await alert.present();
  }

  private async processConfirmation(answer: 'yes' | 'no'): Promise<void> {
    if (!this.detail) return;

    this.confirming = true;

    // Loading mientras se procesa la confirmación
    const loadingAlert = await this.alertController.create({
      header: 'Procesando...',
      message: answer === 'yes' ? 'Registrando tu confirmación.' : 'Enviando reporte.',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();

    const body: OrderConfirmRequest = {
      answer,
      rowVersion: this.detail.rowVersion,
    };

    this.ordersSrv.confirmReceived(this.code, body).subscribe({
      next: async () => {
        await loadingAlert.dismiss();
        const successAlert = await this.alertController.create({
          header: 'Hecho',
          message: answer === 'yes' 
            ? '¡Gracias por confirmar!' 
            : 'Se registró tu reporte.',
          buttons: ['OK'],
          cssClass: 'success-alert'
        });
        await successAlert.present();
        this.load();
      },
      error: async (err) => {
        await loadingAlert.dismiss();
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudo registrar la confirmación.',
          buttons: ['OK'],
          cssClass: 'error-alert'
        });
        await errorAlert.present();
      },
      complete: () => (this.confirming = false),
    });
  }

  async cancel(): Promise<void> {
    if (!this.detail) return;

    const alert = await this.alertController.create({
      header: 'Cancelar pedido',
      message: '¿Seguro que deseas cancelar este pedido?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Sí, cancelar',
          handler: async () => {
            await this.processCancellation();
          }
        }
      ],
      cssClass: 'warning-alert'
    });
    await alert.present();
  }

  private async processCancellation(): Promise<void> {
    if (!this.detail) return;

    // Loading mientras se procesa la cancelación
    const loadingAlert = await this.alertController.create({
      header: 'Procesando...',
      message: 'Cancelando el pedido.',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();

    try {
      await firstValueFrom(this.ordersSrv.cancelByUser(this.code, this.detail.rowVersion));
      
      await loadingAlert.dismiss();
      const successAlert = await this.alertController.create({
        header: 'Hecho',
        message: 'Pedido cancelado.',
        buttons: ['OK'],
        cssClass: 'success-alert'
      });
      await successAlert.present();
      this.load();
    } catch (err: any) {
      await loadingAlert.dismiss();
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: err?.error?.message ?? 'No se pudo cancelar el pedido.',
        buttons: ['OK'],
        cssClass: 'error-alert'
      });
      await errorAlert.present();
    }
  }

  /* ======= Imagen ======= */
  openImageModal(): void {
    this.showImage = true;
  }

  /* ======= Subir comprobante ======= */
  triggerFile(el: HTMLInputElement) {
    el.click();
  }

  async onPickPaymentFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; 
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const alert = await this.alertController.create({
        header: 'Atención',
        message: 'El comprobante debe ser una imagen (JPG/PNG/WEBP).',
        buttons: ['OK'],
        cssClass: 'warning-alert'
      });
      await alert.present();
      return;
    }
    if (file.size > this.MAX_FILE_BYTES) {
      const alert = await this.alertController.create({
        header: 'Atención',
        message: `La imagen excede ${this.MAX_FILE_MB} MB.`,
        buttons: ['OK'],
        cssClass: 'warning-alert'
      });
      await alert.present();
      return;
    }

    if (!this.detail) {
      await this.showToast('No se pudo validar el pedido.');
      return;
    }

    const req: UploadPaymentRequest = { rowVersion: this.detail.rowVersion, paymentImage: file };
    const loadingAlert = await this.alertController.create({
      header: 'Subiendo comprobante…',
      message: 'Por favor espera...',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();

    this.ordersSrv.uploadPayment(this.code, req).subscribe({
      next: async () => {
        await loadingAlert.dismiss();
        await this.showToast('Comprobante subido.', 'success');
        this.load();
      },
      error: async () => {
        await loadingAlert.dismiss();
        await this.showToast('No se pudo subir el comprobante.');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  // ======= Chat flotante =======
  toggleChat(): void {
    this.showChat = !this.showChat;
  }
}
