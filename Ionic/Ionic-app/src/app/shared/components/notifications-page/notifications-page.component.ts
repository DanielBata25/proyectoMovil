import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { NotificationListItemDto } from '../../models/notificacions/notificacion.model';
import { NotificationService } from '../../services/notification/notificacion.service';

import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonSpinner
} from "@ionic/angular/standalone";

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
    IonSpinner
  ],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
})
export class NotificationPageComponent implements OnInit {

  items: NotificationListItemDto[] = [];
  loading = false;
  showMarkAll = true;

  constructor(
    private nav: NavController,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    console.log('[NOTIFICATIONS] ngOnInit ejecutado');
    this.loadNotifications();
  }

  /** ===========================
   *   CARGA PRINCIPAL
   * =========================== */
  loadNotifications() {
    console.log('[NOTIFICATIONS] Iniciando carga de notificaciones...');
    this.loading = true;

    // 🔄 TEMPORAL: Usando getUnread() en lugar de getHistory() 
    // porque el endpoint /history puede no existir en el backend
    this.notificationService.getUnread(50).subscribe({
      next: (items) => {
        console.log('[NOTIFICATIONS] Respuesta recibida:', items);
        console.log('[NOTIFICATIONS] Total items:', items?.length);
        this.items = items ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('[NOTIFICATIONS] Error loading:', err);
        console.error('[NOTIFICATIONS] Error status:', err?.status);
        console.error('[NOTIFICATIONS] Error message:', err?.message);
        console.error('[NOTIFICATIONS] Error data:', err?.data);
        this.loading = false;
        
        // Mostrar mensaje de error al usuario
        alert(`Error cargando notificaciones: ${err?.message || 'Error desconocido'}`);
      }
    });
  }

  /** ===========================
   *   UTILIDADES
   * =========================== */

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

  /** ===========================
   *   MARCAR TODO COMO LEÍDO
   * =========================== */

  onMarkAll() {
    const unread = this.items.filter(n => !n.isRead);

    unread.forEach(n => {
      this.notificationService.markAsRead(n.id).subscribe({
        next: () => (n.isRead = true),
        error: (err) => console.error(`[NOTIFICATIONS] Error markAll:`, err)
      });
    });
  }

  /** ===========================
   *   ABRIR ITEM
   * =========================== */

  onOpenItem(n: NotificationListItemDto) {
    if (!n.isRead) this.onMarkRead(n);
  }

  /** ===========================
   *   MARCAR UNA COMO LEÍDA
   * =========================== */

  onMarkRead(n: NotificationListItemDto) {
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => (n.isRead = true),
      error: (err) => console.error(`[NOTIFICATIONS] Error markRead:`, err)
    });
  }
}
