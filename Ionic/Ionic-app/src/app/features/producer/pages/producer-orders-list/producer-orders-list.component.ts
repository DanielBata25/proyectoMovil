import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { OrderListItemModel } from '../../../../features/products/models/order/order.model';
import { OrderService } from '../../../../features/products/services/order/order.service';
import { StatusTranslatePipesPipe } from '../../../../shared/pipes/statusTranslate/status-translate.pipe';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-producer-orders-list',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, StatusTranslatePipesPipe, ButtonComponent],
  templateUrl: './producer-orders-list.component.html',
  styleUrls: ['./producer-orders-list.component.scss']
})
export class ProducerOrdersListComponent implements OnInit, OnDestroy{
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderSrv = inject(OrderService);
  private toastCtrl = inject(ToastController);

  isLoading = false;
  items: OrderListItemModel[] = [];
  statusFilter: 'pending' | 'all' = 'pending';

  private sub?: Subscription;

  ngOnInit(): void {
    // lee ?status=pending|all y carga
    this.sub = this.route.queryParams
      .pipe(
        switchMap((qp: Params) => {
          this.statusFilter = qp['status'] === 'all' ? 'all' : 'pending';
          this.isLoading = true;
          return this.statusFilter === 'pending'
            ? this.orderSrv.getProducerPendingOrders()
            : this.orderSrv.getProducerOrders();
        })
      )
      .subscribe({
        next: (data: OrderListItemModel[]) => {
          this.items = data ?? [];
          console.log(data);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.showToast('Error al cargar los pedidos. Por favor, intenta de nuevo.');
          console.error('Error loading orders:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Navega con status específico (para botones)
  goFilter(status: 'pending' | 'all'): void {
    if (this.statusFilter === status) return;
    
    this.statusFilter = status;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge',
    });
  }

  // Navegar a detalle de pedido
  goToOrderDetail(OrderCode: string): void {
    this.router.navigate([`/account/producer/orders/${OrderCode}`], {
      queryParams: { view: 'for-producer' }
    });
  }

  // Helper UI para formatear moneda
  asCurrency(v: number): string {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(v);
  }

  // Color del status chip
  statusChipColor(status: string): 'warning' | 'info' | 'success' | 'danger' {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return 'warning';
    if (s.includes('accepted')) return 'info';
    if (s.includes('completed')) return 'success';
    if (s.includes('rejected') || s.includes('disputed')) return 'danger';
    return 'info';
  }

  // Color del ion-chip de Ionic
  getStatusChipColor(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return 'warning';
    if (s.includes('accepted')) return 'primary';
    if (s.includes('completed')) return 'success';
    if (s.includes('rejected') || s.includes('disputed')) return 'danger';
    return 'medium';
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
