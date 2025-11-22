import { Component, Input, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';



@Component({
  selector: 'app-navbar-bueno',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './navbar-bueno.component.html',
  styleUrls: ['./navbar-bueno.component.scss'],
})
export class NavbarBuenoComponent {
  @Input() title = 'Cuenta';
  @Input() backTo: string | string[] = '/home/inicio';
  @Input() showBack = false;
  @Input() showNotifications = true;

  private router = inject(Router);
  private location = inject(Location);

  goBack() {
    if (this.backTo === 'history') {
      this.location.back();
      return;
    }

    if (Array.isArray(this.backTo)) this.router.navigate(this.backTo);
    else this.router.navigate([this.backTo]);
  }
}
