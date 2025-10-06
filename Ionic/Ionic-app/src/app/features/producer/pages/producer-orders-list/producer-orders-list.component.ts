import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-producer-orders-list',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './producer-orders-list.component.html',
  styleUrls: ['./producer-orders-list.component.scss'],
})
export class ProducerOrdersListComponent {}
