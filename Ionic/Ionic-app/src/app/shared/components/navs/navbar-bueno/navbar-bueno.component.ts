import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  goBack() {
    if (Array.isArray(this.backTo)) this.router.navigate(this.backTo);
    else this.router.navigate([this.backTo]);
  }
}
