import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { NotificationListItemDto } from '../../models/notificacions/notificacion.model';
import { NotificationService } from '../../services/notification/notificacion.service';

// Importar el componente Button personalizado
import { ButtonComponent } from '../button/button.component';

import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonSpinner,
  IonBadge
} from "@ionic/angular/standalone";

type NotificationFilter = 'all' | 'unread';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonSpinner,
    IonBadge,
    ButtonComponent
  ],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
})
export class NotificationPageComponent implements OnInit {

  allItems: NotificationListItemDto[] = [];
  unreadItems: NotificationListItemDto[] = [];
  currentItems: NotificationListItemDto[] = [];
  loading = false;
  currentFilter: NotificationFilter = 'all';
  unreadCount = 0;

  constructor(
    private nav: NavController,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  /** Carga las notificaciones desde el servidor */
  private loadNotifications(): void {
    this.loading = true;

    // Cargar todas las notificaciones
    this.notificationService.getHistory(1, 50).subscribe({
      next: (allNotifications) => {
        this.allItems = allNotifications || [];
        this.updateCurrentItems();
      },
      error: (error) => {
        console.error('[NOTIFICATIONS] Error loading all notifications:', error);
        this.allItems = [];
        this.updateCurrentItems();
      }
    });

    // Cargar solo las no leídas
    this.notificationService.getUnread(50).subscribe({
      next: (unreadNotifications) => {
        this.unreadItems = unreadNotifications || [];
        this.unreadCount = this.unreadItems.length;
        this.updateCurrentItems();
        this.loading = false;
      },
      error: (error) => {
        console.error('[NOTIFICATIONS] Error loading unread notifications:', error);
        this.unreadItems = [];
        this.unreadCount = 0;
        this.updateCurrentItems();
        this.loading = false;
      }
    });
  }

  /** Actualiza los elementos mostrados según el filtro actual */
  private updateCurrentItems(): void {
    if (this.currentFilter === 'all') {
      this.currentItems = [...this.allItems];
    } else {
      this.currentItems = [...this.unreadItems];
    }
  }

  /** Cambia el filtro activo */
  changeFilter(filter: NotificationFilter): void {
    if (this.currentFilter !== filter) {
      this.currentFilter = filter;
      this.updateCurrentItems();
    }
  }

  goBack() {
    this.nav.back();
  }

  timeAgo(value?: string): string {
    if (!value) return '';
    const diff = (Date.now() - new Date(value).getTime()) / 1000;

    if (diff < 60) return 'hace segundos';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;

    return `hace ${Math.floor(diff / 86400)} d`;
  }

  /** Maneja el click en una notificación */
  onOpenItem(n: NotificationListItemDto) {
    // Marcar como leída si no lo está
    if (!n.isRead) {
      this.onMarkRead(n);
    }

    // Navegar a la ruta relacionada si existe
    if (n.relatedRoute) {
      this.nav.navigateForward(n.relatedRoute);
    }
  }

  /** Marca una notificación individual como leída */
  onMarkRead(n: NotificationListItemDto): void {
    if (n.isRead) return;

    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        // Actualizar estado local
        n.isRead = true;
        
        // Remover de la lista de no leídas
        const index = this.unreadItems.findIndex(item => item.id === n.id);
        if (index >= 0) {
          this.unreadItems.splice(index, 1);
        }
        
        this.unreadCount = this.unreadItems.length;
        this.updateCurrentItems();
      },
      error: (error) => {
        console.error(`[NOTIFICATIONS] Error marking notification ${n.id} as read:`, error);
      }
    });
  }

  /** Función trackBy para optimizar la renderización de listas */
  trackByNotificationId(index: number, notification: NotificationListItemDto): number {
    return notification.id;
  }

  /** Obtiene el ícono para una notificación basada en su tipo */
  getNotificationIcon(n: NotificationListItemDto): string {
    if (!n.relatedType) return 'notifications-outline';
    
    const type = n.relatedType.toLowerCase();
    
    if (type.includes('order') || type.includes('pedido')) return 'basket-outline';
    if (type.includes('product') || type.includes('producto')) return 'storefront-outline';
    if (type.includes('farm') || type.includes('granja')) return 'leaf-outline';
    if (type.includes('message') || type.includes('mensaje')) return 'mail-outline';
    if (type.includes('alert') || type.includes('alerta')) return 'warning-outline';
    
    return 'notifications-outline';
  }

  /** Refresca los datos de notificaciones */
  refreshData(): void {
    this.loadNotifications();
  }
}
