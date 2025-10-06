import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-producer-layout',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterOutlet],
  templateUrl: './producer-layout.component.html',
  styleUrls: ['./producer-layout.component.scss']
})
export class ProducerLayoutComponent {
  currentTab: string = 'summary';

  constructor(private router: Router) {}

  onTabChange(event: CustomEvent) {
    this.currentTab = event.detail.value;
    this.router.navigate([`/account/producer/${this.currentTab}`]);
  }
}
