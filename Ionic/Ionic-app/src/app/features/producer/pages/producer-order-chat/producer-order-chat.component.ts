import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { OrderChatComponent } from 'src/app/shared/components/order-chat/order-chat.component';

@Component({
  selector: 'app-producer-order-chat',
  standalone: true,
  imports: [CommonModule, IonicModule, OrderChatComponent, ButtonComponent],
  templateUrl: './producer-order-chat.component.html',
  styleUrls: ['./producer-order-chat.component.scss'],
})
export class ProducerOrderChatComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly code = String(this.route.snapshot.paramMap.get('code') ?? '');

  goBack(): void {
    if (this.code) {
      this.router.navigate(['/account/producer/orders', this.code]);
      return;
    }
    this.router.navigateByUrl('/account/producer/orders');
  }
}
