import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementPage {
  tabs = [
    { label: 'Productos', path: 'product' },
    { label: 'Fincas', path: 'farm' }
  ];
}
