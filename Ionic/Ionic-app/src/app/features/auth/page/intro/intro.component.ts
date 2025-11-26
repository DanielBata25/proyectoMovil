import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent {
  private router = inject(Router);

  constructor() {
    addIcons({ arrowForward });
  }

  goLogin(): void {
    this.router.navigateByUrl('/auth/login');
  }
}
