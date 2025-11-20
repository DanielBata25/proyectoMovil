import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification/notificacion.service';
import { NotificationHubService } from '../../services/notification/notificationHub/notificacion-hub.service';

import { NotificationListItemDto } from '../../models/notificacions/notificacion.model';
import { catchError, finalize, forkJoin, of, Subject, takeUntil, Observable } from 'rxjs';
import { AuthState } from 'src/app/core/services/auth/auth.state';

@Component({
    selector: 'app-notifications-page',
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule],
    templateUrl: './notifications-page.component.html',
    styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private notificationHubService = inject(NotificationHubService);
    private authState = inject(AuthState);
    private router = inject(Router);
    private destroy$ = new Subject<void>();

    notifications: NotificationListItemDto[] = [];
    filteredNotifications: NotificationListItemDto[] = [];
    loading = false;

    // Filter options
    currentFilter: 'all' | 'unread' = 'all';
    filterCounts = {
      all: 0,
      unread: 0
    };

    constructor() { }

    ngOnInit(): void {
        this.loadNotifications();
        this.setupRealtimeNotifications();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadNotifications(): void {
        this.loading = true;
        this.notificationService
            .getAll(50)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => (this.loading = false)),
                catchError((error) => {
                    console.error('Could not get all notifications, trying unread:', error);
                    // Si falla getAll, intentamos con getUnread como respaldo
                    return this.loadUnreadAsFallback();
                })
            )
            .subscribe((items) => {
                this.notifications = items ?? [];
                this.updateFilterCounts();
                this.applyFilter();
            });
    }

    private loadUnreadAsFallback(): Observable<NotificationListItemDto[]> {
        return this.notificationService
            .getUnread(50)
            .pipe(
                catchError((error) => {
                    console.error('Could not get unread notifications either:', error);
                    return of([] as NotificationListItemDto[]);
                })
            );
    }

    private setupRealtimeNotifications(): void {
        this.authState.me$
            .pipe(takeUntil(this.destroy$))
            .subscribe(async (me) => {
                if (me) {
                    try {
                        await this.notificationHubService.connect();
                    } catch {
                        // Connection failed is already logged in console
                    }
                } else {
                    await this.notificationHubService.disconnect();
                }
            });

        this.notificationHubService
            .onNotification()
            .pipe(takeUntil(this.destroy$))
            .subscribe((notification) => {
                this.notifications = [
                    notification,
                    ...this.notifications.filter((item) => item.id !== notification.id),
                ].slice(0, 50);
                this.updateFilterCounts();
                this.applyFilter();
            });
    }

    private updateFilterCounts(): void {
      this.filterCounts = {
        all: this.notifications.length,
        unread: this.notifications.filter(n => !n.isRead).length
      };
    }
  
    setFilter(filter: 'all' | 'unread'): void {
      this.currentFilter = filter;
      this.applyFilter();
    }
  
    private applyFilter(): void {
      switch (this.currentFilter) {
        case 'unread':
          this.filteredNotifications = this.notifications.filter(n => !n.isRead);
          break;
        default:
          this.filteredNotifications = [...this.notifications];
      }
    }

    markAsRead(notification: NotificationListItemDto): void {
        if (notification.isRead) return;

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
                notification.isRead = true;
                this.updateFilterCounts();
                this.applyFilter();
            });
    }

    markAllAsRead(): void {
        const unread = this.notifications.filter(n => !n.isRead);
        if (!unread.length) return;

        this.loading = true;
        forkJoin(unread.map(item => this.notificationService.markAsRead(item.id)))
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => (this.loading = false)),
                catchError((error) => {
                    console.error('Could not mark all notifications as read', error);
                    return of(null);
                })
            )
            .subscribe(() => {
                this.notifications.forEach(item => item.isRead = true);
                this.updateFilterCounts();
                this.applyFilter();
            });
    }

    openNotification(notification: NotificationListItemDto): void {
        this.markAsRead(notification);

        if (notification.relatedRoute) {
            const url = notification.relatedRoute.startsWith('/')
                ? notification.relatedRoute
                : `/${notification.relatedRoute}`;
            this.router.navigateByUrl(url);
        }
    }

    getTimeAgo(dateString?: string): string {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Ahora';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    trackByFn(index: number, item: NotificationListItemDto): string {
        return item.id?.toString() || index.toString();
    }

    get showMarkAllButton(): boolean {
        return this.filterCounts.unread > 0;
    }

    get currentFilterTitle(): string {
        switch (this.currentFilter) {
            case 'unread': return 'No Leídas';
            default: return 'Todas';
        }
    }
}