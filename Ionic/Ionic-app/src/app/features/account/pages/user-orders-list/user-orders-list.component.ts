import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { firstValueFrom, take } from 'rxjs';
import { 
  OrderListItemModel,
  OrderDetailModel,
  OrderConfirmRequest,
  UploadPaymentRequest,
} from '../../../products/models/order/order.model';
import { OrderService } from '../../../products/services/order/order.service';
import { StatusTranslatePipesPipe } from '../../../../shared/pipes/statusTranslate/status-translate.pipe';

@Component({
  selector: 'app-user-orders-list',
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    StatusTranslatePipesPipe
  ],
  templateUrl: './user-orders-list.component.html',
  styleUrl: './user-orders-list.component.scss',
})
export class UserOrdersListComponent implements OnInit {
  private ordersSrv = inject(OrderService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  private numberOrders: number = 0;

  loading = true;
  items: OrderListItemModel[] = [];

  // Límite de 6MB para comprobantes
  readonly MAX_FILE_MB = 6;
  readonly MAX_FILE_BYTES = this.MAX_FILE_MB * 1024 * 1024;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.ordersSrv
      .getMine()
      .pipe(take(1))
      .subscribe({
        next: (list) => {
          this.items = list ?? [];

          // prueba cantidad de pedidos
          this.numberOrders = this.items.length;

          this.loading = false;
        },
        error: async (err) => {
          this.loading = false;
          await this.showToast('Error al cargar tus pedidos.');
          console.error('Error loading orders:', err);
        },
      });
  }

  view(id: number): void {
    this.router.navigate(['/account/orders', id]);
  }

  /* ======= Guards por estado ======= */
  canUploadPayment(status: string): boolean {
    return status === 'AcceptedAwaitingPayment';
  }

  canCancel(status: string): boolean {
    return status === 'PendingReview';
  }

  canConfirm(status: string): boolean {
    return status === 'DeliveredPendingBuyerConfirm';
  }

  /* Chip CSS según estado */
  chipClass(status: string): 'pending' | 'accepted' | 'completed' | 'rejected' | 'disputed' {
    const s = (status || '').toLowerCase();

    // Pendiente del productor o pendiente de confirmación del comprador
    if (s === 'pendingreview' || s === 'deliveredpendingbuyerconfirm') return 'pending';

    // Flujo intermedio (aceptado/esperando pago o en proceso logístico)
    if (
      s === 'acceptedawaitingpayment' ||
      s === 'paymentsubmitted' ||
      s === 'preparing' ||
      s === 'dispatched'
    ) return 'accepted';

    if (s === 'completed') return 'completed';
    if (s === 'rejected' || s === 'expired' || s === 'cancelledbyuser') return 'rejected';
    if (s === 'disputed') return 'disputed';

    return 'accepted';
  }

  /* ======= Confirmar recepción (Sí/No) ======= */
  async confirm(id: number): Promise<void> {
    let detail: OrderDetailModel;
    try {
      detail = await firstValueFrom(this.ordersSrv.getDetailForUser(id));
    } catch (err: any) {
      await this.showToast('No se pudo cargar el pedido.');
      return;
    }

    const alert = await this.alertController.create({
      header: '¿Recibiste el pedido?',
      message: 'Confirma si ya lo recibiste correctamente.',
      buttons: [
        {
          text: 'No, hubo problema',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Sí, recibido',
          handler: async () => {
            await this.processConfirmation(id, detail, 'yes');
          }
        }
      ],
      cssClass: 'confirm-alert'
    });
    await alert.present();
  }

  private async processConfirmation(id: number, detail: OrderDetailModel, answer: 'yes' | 'no'): Promise<void> {
    const body: OrderConfirmRequest = {
      answer: answer,
      rowVersion: detail.rowVersion,
    };

    this.ordersSrv.confirmReceived(id, body).subscribe({
      next: async () => {
        await this.showToast(answer === 'yes' ? '¡Gracias por confirmar!' : 'Hemos registrado tu reporte.', 'success');
        this.load();
      },
      error: async (err) => {
        await this.showToast('No se pudo registrar la confirmación.');
      },
    });
  }

  /* ======= Cancelar pedido (PendingReview) ======= */
  async cancel(id: number): Promise<void> {
    let detail: OrderDetailModel;
    try {
      detail = await firstValueFrom(this.ordersSrv.getDetailForUser(id));
    } catch (err: any) {
      await this.showToast('No se pudo cargar el pedido.');
      return;
    }

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
          handler: () => {
            this.ordersSrv.cancelByUser(id, detail.rowVersion).subscribe({
              next: async () => {
                await this.showToast('Pedido cancelado.', 'success');
                this.load();
              },
              error: async () => {
                await this.showToast('No se pudo cancelar el pedido.');
              },
            });
          }
        }
      ],
      cssClass: 'warning-alert'
    });
    await alert.present();
  }

  /* ======= Subir comprobante (AcceptedAwaitingPayment) ======= */
  triggerFile(el: HTMLInputElement) {
    el.click();
  }

  async onPickPaymentFile(id: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; 
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.showToast('El comprobante debe ser una imagen (JPG/PNG/WEBP).');
      return;
    }
    if (file.size > this.MAX_FILE_BYTES) {
      await this.showToast(`La imagen excede ${this.MAX_FILE_MB} MB.`);
      return;
    }

    let detail: OrderDetailModel;
    try {
      detail = await firstValueFrom(this.ordersSrv.getDetailForUser(id));
    } catch (err: any) {
      await this.showToast('No se pudo cargar el pedido.');
      return;
    }

    const req: UploadPaymentRequest = { rowVersion: detail.rowVersion, paymentImage: file };
    const action$ = this.ordersSrv.uploadPayment(id, req);

    const loadingAlert = await this.alertController.create({
      header: 'Subiendo comprobante…',
      message: 'Por favor espera...',
      buttons: [],
      cssClass: 'loading-alert'
    });
    await loadingAlert.present();
    
    action$.subscribe({
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

  trackById = (_: number, it: OrderListItemModel) => it.id;

  private async showToast(message: string, color: 'success' | 'danger' = 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}
