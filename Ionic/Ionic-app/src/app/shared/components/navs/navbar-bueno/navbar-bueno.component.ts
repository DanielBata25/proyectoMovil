import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/notification/notificacion.service';
import { NotificationHubService } from '../../../services/notification/notificationHub/notificacion-hub.service';

import { catchError, finalize, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { NotificationListItemDto } from '../../../models/notificacions/notificacion.model';
import { PopoverController, ToastController } from '@ionic/angular';
import { AuthState } from 'src/app/core/services/auth/auth.state';
import { NotificationsMenuComponent } from '../../notifications-menu/notifications-menu.component';

@Component({
  selector: 'app-navbar-bueno',
  standalone: true,
  imports: [IonicModule, CommonModule, NotificationsMenuComponent],
  templateUrl: './navbar-bueno.component.html',
  styleUrls: ['./navbar-bueno.component.scss'],
})
export class NavbarBuenoComponent implements OnInit, OnDestroy {
  @Input() title = 'Cuenta';
  @Input() backTo: string | string[] = '/home/inicio';
  @Input() showBack = false;
  @Input() showNotifications = true;

  // Notification system properties
  notifications: NotificationListItemDto[] = [];
  notificationsLoading = false;
  
  // Inject services
  private router = inject(Router);
  private location = inject(Location);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationHubService = inject(NotificationHubService);
  private readonly authState = inject(AuthState);
  private readonly destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    // Initialize notifications when user is authenticated
    this.authState.me$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (me) => {
        if (me) {
          try {
            await this.notificationHubService.connect();
          } catch {
            // Connection failed is already logged in console, continue without interrupting flow
          }
          this.loadUnreadNotifications();
        } else {
          this.notifications = [];
          await this.notificationHubService.disconnect();
        }
      });

    // Listen for real-time notifications
    this.notificationHubService
      .onNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, 20);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    void this.notificationHubService.disconnect();
  }

  goBack() {
    if (this.backTo === 'history') {
      this.location.back();
      return;
    }

    if (Array.isArray(this.backTo)) this.router.navigate(this.backTo);
    else this.router.navigate([this.backTo]);
  }

  // Notification system methods
  onNotificationsMenuOpened(): void {
    this.loadUnreadNotifications();
  }

  private loadUnreadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationService
      .getUnread()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.notificationsLoading = false)),
        catchError((error) => {
          console.error('Could not get notifications', error);
          return of([] as NotificationListItemDto[]);
        })
      )
      .subscribe((items) => {
        this.notifications = items ?? [];
      });
  }
}
