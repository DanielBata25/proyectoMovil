import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { OrderChatComponent } from 'src/app/shared/components/order-chat/order-chat.component';

@Component({
  selector: 'app-user-order-chat',
  standalone: true,
  imports: [CommonModule, IonicModule, OrderChatComponent, ButtonComponent],
  templateUrl: './user-order-chat.component.html',
  styleUrls: ['./user-order-chat.component.scss'],
})
export class UserOrderChatComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly code = String(this.route.snapshot.paramMap.get('code') ?? '');

  goBack(): void {
    if (this.code) {
      this.router.navigate(['/account/orders', this.code]);
      return;
    }
    this.router.navigateByUrl('/account/orders');
  }
}
