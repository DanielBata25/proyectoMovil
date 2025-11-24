import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthState } from '../../../../core/services/auth/auth.state';
import { NotificationService } from '../../../services/notification/notificacion.service';
import { NotificationHubService } from '../../../services/notification/notificationHub/notificacion-hub.service';
import { NotificationListItemDto } from '../../../models/notificacions/notificacion.model';

import { Subject, takeUntil } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-navbar-bueno',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './navbar-bueno.component.html',
  styleUrls: ['./navbar-bueno.component.scss'],
})
export class NavbarBuenoComponent implements OnInit, OnDestroy {
  @Input() title = 'Cuenta';
  @Input() backTo: string | string[] = '/home/inicio';
  @Input() showBack = false;
  @Input() showNotifications = true;

  // Services
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private authState = inject(AuthState);
  private notificationService = inject(NotificationService);
  private notificationHubService = inject(NotificationHubService);
  
  // Lifecycle
  private destroy$ = new Subject<void>();

  // Notification state
  notifications: NotificationListItemDto[] = [];
  notificationsLoading = false;

  // Lifecycle methods
  ngOnInit(): void {
    this.initializeNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationHubService.disconnect(); // Cierra SignalR cuando se destruye el nav
  }

  // Navigation methods
  goBack() {
    if (this.backTo === 'history') {
      this.location.back();
      return;
    }

    if (Array.isArray(this.backTo)) this.router.navigate(this.backTo);
    else this.router.navigate([this.backTo]);
  }

  // Original method for backwards compatibility
  openNotifications() {
    this.router.navigate(['/notifications']);
  }

  // Badge count for notifications
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // Notification methods adapted from web logic
  private async initializeNotifications(): Promise<void> {
    this.authState.me$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (me) => {
        if (me) {
          try {
            await this.notificationHubService.connect();
          } catch {
            console.log('SignalR no disponible - continuando sin tiempo real');
          }
          
          this.loadUnreadNotifications();
        } else {
          this.notifications = [];
          await this.notificationHubService.disconnect();
        }
      });

    this.notificationHubService
      .onNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        // Inserta nueva notificación al inicio y limita a 20 para el badge
        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, 20);
      });
  }

  // Notification event handlers
  onNotificationsMenuOpened(): void {
    this.loadUnreadNotifications();
  }

  onNotificationOpen(notification: NotificationListItemDto): void {
    this.markNotificationAsRead(notification, true);
  }

  onNotificationMarkRead(notification: NotificationListItemDto): void {
    this.markNotificationAsRead(notification, false);
  }

  onNotificationMarkAll(): void {
    const unread = this.notifications.filter((item) => !item.isRead);
    if (!unread.length) {
      return;
    }

    this.notificationsLoading = true;
    forkJoin(unread.map((item) => this.notificationService.markAsRead(item.id)))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.notificationsLoading = false)),
        catchError((error) => {
          console.error('Could not mark all notifications as read', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.notifications = this.notifications.map((item) => ({
          ...item,
          isRead: true,
        }));
      });
  }

  // Private helper methods
  private loadUnreadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationService
      .getUnread()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.notificationsLoading = false)),
        catchError((error) => {
          console.error('Could not load unread notifications', error);
          return of([] as NotificationListItemDto[]);
        })
      )
      .subscribe((items) => {
        this.notifications = items ?? [];
      });
  }

  private markNotificationAsRead(notification: NotificationListItemDto, navigate: boolean): void {
    if (notification.isRead) {
      this.goToNotificationRoute(notification, navigate);
      return;
    }

    this.notificationService
      .markAsRead(notification.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Could not mark notification as read', error);
          return of(undefined);
        })
      )
      .subscribe(() => {
        this.notifications = this.notifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        );
        this.goToNotificationRoute(notification, navigate);
      });
  }

  private goToNotificationRoute(notification: NotificationListItemDto, navigate: boolean): void {
    if (!navigate || !notification.relatedRoute) {
      return;
    }

    const url = notification.relatedRoute.startsWith('/')
      ? notification.relatedRoute
      : `/${notification.relatedRoute}`;
    this.router.navigateByUrl(url);
  }
}
