import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationListItemDto } from '../../models/notificacions/notificacion.model';

@Component({
  selector: 'app-notifications-menu',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './notifications-menu.component.html',
  styleUrls: ['./notifications-menu.component.scss']
})
export class NotificationsMenuComponent implements OnInit {
  @Input() items: NotificationListItemDto[] = [];
  @Input() loading = false;
  @Output() opened = new EventEmitter<void>();

  private router = inject(Router);

  constructor() {}

  ngOnInit() {}

  get unreadCount(): number {
    return this.items.filter(item => !item.isRead).length;
  }

  navigateToNotifications(): void {
    // Emit event to parent to load fresh notifications
    this.opened.emit();
    
    // Navigate to notifications page
    this.router.navigate(['/notifications-menu']);
  }
}
