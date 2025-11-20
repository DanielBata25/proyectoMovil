import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthState } from 'src/app/core/services/auth/auth.state';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent {
  private authState = inject(AuthState);

  get ordersRoute(): string {
    return this.authState.hasRole('producer') || this.authState.hasRole('admin')
      ? '/account/producer/orders'
      : '/account/orders';
  }
}
