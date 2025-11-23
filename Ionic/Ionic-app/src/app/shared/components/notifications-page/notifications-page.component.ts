import { Component, OnInit } from '@angular/core';
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
    private notificationService: NotificationService   // ✔ YA CORRECTO
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    console.log('[NOTIFICATIONS] Iniciando carga de history...');
    this.notificationService.getHistory().subscribe((data)=>{
      this.items = data;
      console.log(this.items);
    })
    // this.loading = true;

    // this.notificationService.getHistory(1, 50).subscribe({
    //   next: (res) => {
    //     const resultItems = Array.isArray(res) ? res : res?.items;
    //     this.items = resultItems ?? [];
    //     this.showMarkAll = this.items.some(n => !n.isRead);
    //     this.loading = false;
    //   },
    //   error: (err) => {
    //     console.error('[NOTIFICATIONS] Error loading history', err);
    //     this.loading = false;
    //   }
    // });
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

  onMarkAll() {
    const unread = this.items.filter(n => !n.isRead);

    unread.forEach(n => {
      this.notificationService.markAsRead(n.id).subscribe(() => {
        n.isRead = true;
      });
    });
  }

  onOpenItem(n: NotificationListItemDto) {
    if (!n.isRead) {
      this.onMarkRead(n);
    }
  }

  onMarkRead(n: NotificationListItemDto) {
    this.notificationService.markAsRead(n.id).subscribe(() => {
      n.isRead = true;
    });
  }
}
