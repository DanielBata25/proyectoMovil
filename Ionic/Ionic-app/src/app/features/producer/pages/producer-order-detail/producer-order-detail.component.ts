import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import {
  OrderDetailModel,
  OrderStatus
} from '../../../products/models/order/order.model';
import { OrderService } from '../../../products/services/order/order.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { ConsumerRatingCreateModel } from '../../../products/models/consumerRating/consumerRating.model';
import { OrderChatComponent } from 'src/app/shared/components/order-chat/order-chat.component';

@Component({
  selector: 'app-producer-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ButtonComponent,
    OrderChatComponent
  ],
  templateUrl: './producer-order-detail.component.html',
  styleUrls: ['./producer-order-detail.component.scss'],
})
export class ProducerOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersSrv = inject(OrderService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  code!: string;
  loading = true;
  processing = false;
  detail?: OrderDetailModel;

  // Calificación del cliente
  stars = [1, 2, 3, 4, 5];
  rating = 0;
  comment = '';
  savingRating = false;
  // UI: chat flotante
  showChat = false;

  ngOnInit(): void {
    this.code = String(this.route.snapshot.paramMap.get('code'));
    if (!this.code) {
      this.router.navigateByUrl('/account/producer/orders');
      return;
    }
    this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    this.loading = true;
    try {
      this.detail = await firstValueFrom(
        this.ordersSrv.getDetailForProducer(this.code)
      );
      this.resetRatingFromDetail();
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
  get canAcceptReject(): boolean {
    return this.detail?.status === 'PendingReview';
  }

  get canMarkPreparing(): boolean {
    return this.detail?.status === 'PaymentSubmitted';
  }

  get canMarkDispatched(): boolean {
    return this.detail?.status === 'Preparing';
  }

  get canMarkDelivered(): boolean {
    return this.detail?.status === 'Dispatched';
  }

  get canManageLogistics(): boolean {
    return this.canMarkPreparing || this.canMarkDispatched || this.canMarkDelivered;
  }

  get isAlreadyRated(): boolean {
    return !!this.detail?.consumerRating;
  }

  private resetRatingFromDetail(): void {
    if (!this.detail?.consumerRating) {
      this.rating = 0;
      this.comment = '';
      return;
    }

    this.rating = this.detail.consumerRating.rating;
    this.comment = this.detail.consumerRating.comment ?? '';
  }

  setRating(value: number): void {
    if (this.savingRating) return;
    this.rating = value;
  }

  async onRateCustomer(): Promise<void> {
    if (!this.detail) return;

    if (this.detail.status !== 'Completed') {
      await this.showToast('Solo puedes calificar cuando la orden está completada.');
      return;
    }

    if (this.rating < 1 || this.rating > 5) {
      await this.showToast('Selecciona una calificación entre 1 y 5.');
      return;
    }

    const body: ConsumerRatingCreateModel = {
      rating: this.rating,
      comment: this.comment?.trim() || null,
      rowVersion: this.detail.rowVersion,
    };

    this.savingRating = true;
    const loadingAlert = await this.alertController.create({
      header: 'Guardando...',
      message: 'Registrando la calificación del cliente.',
      buttons: [],
      cssClass: 'loading-alert',
    });
    await loadingAlert.present();

    this.ordersSrv.rateCustomer(this.code, body).subscribe({
      next: async (res) => {
        await loadingAlert.dismiss();
        this.savingRating = false;

        if (this.detail) {
          this.detail.consumerRating = res.data;
          this.resetRatingFromDetail();
        }

        await this.showToast(
          'La calificación del cliente se guardó correctamente.',
          'success'
        );
      },
      error: async (err: any) => {
        await loadingAlert.dismiss();
        this.savingRating = false;
        await this.showToast(
          err?.error?.message ?? 'No se pudo registrar la calificación.'
        );
      },
    });
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
  async accept(): Promise<void> {
    if (!this.detail) return;

    const alert = await this.alertController.create({
      header: 'Aceptar pedido',
      message: '¿Estás seguro de que deseas aceptar este pedido?',
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notas al cliente (opcional)',
          placeholder: 'Escribe notas internas o para el cliente…'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Aceptar',
          handler: async (data: any) => {
            await this.processAcceptance(data?.notes);
          }
        }
      ],
      cssClass: 'confirm-alert'
    });
    await alert.present();
  }

  private async processAcceptance(notes?: string): Promise<void> {
    if (!this.detail) return;

    this.processing = true;

    const loadingAlert = await this.alertController.create({
      header: 'Procesando...',
      message: 'Aceptando el pedido.',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();

    this.ordersSrv.acceptOrder(this.code, {
      notes: notes?.trim() || undefined,
      rowVersion: this.detail.rowVersion,
    }).subscribe({
      next: async () => {
        await loadingAlert.dismiss();
        const successAlert = await this.alertController.create({
          header: 'Hecho',
          message: 'Pedido aceptado.',
          buttons: ['OK'],
          cssClass: 'success-alert'
        });
        await successAlert.present();
        this.loadDetail();
      },
      error: async (err: any) => {
        await loadingAlert.dismiss();
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudo aceptar el pedido.',
          buttons: ['OK'],
          cssClass: 'error-alert'
        });
        await errorAlert.present();
      },
      complete: () => (this.processing = false),
    });
  }

  async reject(): Promise<void> {
    if (!this.detail) return;

    const alert = await this.alertController.create({
      header: 'Rechazar pedido',
      message: '¿Estás seguro de que deseas rechazar este pedido?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          label: 'Motivo (requerido)',
          placeholder: 'Explica por qué se rechaza…',
          attributes: {
            required: true,
            minlength: 5
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Rechazar',
          handler: async (data: any) => {
            const reason = data?.reason?.trim();
            if (reason && reason.length >= 5) {
              await this.processRejection(reason);
            } else {
              await this.showToast('El motivo debe tener al menos 5 caracteres.', 'danger');
            }
          }
        }
      ],
      cssClass: 'warning-alert'
    });
    await alert.present();
  }

  private async processRejection(reason: string): Promise<void> {
    if (!this.detail) return;

    this.processing = true;

    const loadingAlert = await this.alertController.create({
      header: 'Procesando...',
      message: 'Rechazando el pedido.',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();

    this.ordersSrv.rejectOrder(this.code, {
      reason,
      rowVersion: this.detail.rowVersion,
    }).subscribe({
      next: async () => {
        await loadingAlert.dismiss();
        const successAlert = await this.alertController.create({
          header: 'Hecho',
          message: 'Pedido rechazado.',
          buttons: ['OK'],
          cssClass: 'success-alert'
        });
        await successAlert.present();
        this.loadDetail();
      },
      error: async (err: any) => {
        await loadingAlert.dismiss();
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudo rechazar el pedido.',
          buttons: ['OK'],
          cssClass: 'error-alert'
        });
        await errorAlert.present();
      },
      complete: () => (this.processing = false),
    });
  }

  async markPreparing(): Promise<void> {
    if (!this.canMarkPreparing || !this.detail) return;
    await this.confirmLogisticsAction({
      header: 'Marcar como preparando',
      message: 'Confirmarás que ya estás preparando el pedido.',
      confirmText: 'Sí, preparar',
      successMessage: 'Pedido marcado como preparando.',
      actionFactory: () => this.ordersSrv.markPreparing(this.code, this.detail!.rowVersion),
    });
  }

  async markDispatched(): Promise<void> {
    if (!this.canMarkDispatched || !this.detail) return;
    await this.confirmLogisticsAction({
      header: 'Marcar como despachado',
      message: 'Indica que el pedido ya salió a entrega.',
      confirmText: 'Sí, despachar',
      successMessage: 'Pedido marcado como despachado.',
      actionFactory: () => this.ordersSrv.markDispatched(this.code, this.detail!.rowVersion),
    });
  }

  async markDelivered(): Promise<void> {
    if (!this.canMarkDelivered || !this.detail) return;
    await this.confirmLogisticsAction({
      header: 'Marcar como entregado',
      message: 'Confirmarás que el pedido se entregó al comprador.',
      confirmText: 'Sí, entregado',
      successMessage: 'Pedido marcado como entregado.',
      actionFactory: () => this.ordersSrv.markDelivered(this.code, this.detail!.rowVersion),
    });
  }

  private async confirmLogisticsAction(opts: {
    header: string;
    message: string;
    confirmText?: string;
    successMessage: string;
    actionFactory: () => Observable<any>;
  }): Promise<void> {
    const alert = await this.alertController.create({
      header: opts.header,
      message: opts.message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: opts.confirmText ?? 'Confirmar',
          handler: () => {
            this.executeLogisticsAction(opts.actionFactory, opts.successMessage);
          },
        },
      ],
      cssClass: 'confirm-alert',
    });
    await alert.present();
  }

  private async executeLogisticsAction(
    actionFactory: () => Observable<any>,
    successMessage: string
  ): Promise<void> {
    this.processing = true;
    const loadingAlert = await this.alertController.create({
      header: 'Procesando...',
      message: 'Actualizando estado del pedido.',
      buttons: [],
      cssClass: 'loading-alert',
    });
    await loadingAlert.present();

    actionFactory().subscribe({
      next: async () => {
        await loadingAlert.dismiss();
        await this.showToast(successMessage, 'success');
        this.loadDetail();
      },
      error: async (err: any) => {
        await loadingAlert.dismiss();
        await this.showToast(err?.error?.message ?? 'No se pudo actualizar el pedido.');
      },
      complete: () => (this.processing = false),
    });
  }

  /* ======= Imagen ======= */
  openImage(): void {
    const url = this.detail?.paymentImageUrl;
    if (url) window.open(url, '_blank');
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

  @HostListener('document:closeChat')
  handleCloseChat(): void {
    this.showChat = false;
  }
}
