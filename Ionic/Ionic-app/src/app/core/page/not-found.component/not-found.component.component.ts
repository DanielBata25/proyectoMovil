import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButton, IonIcon
  ],
  templateUrl: './not-found.component.component.html',
  styleUrls: ['./not-found.component.component.scss']
})
export class NotFoundComponent {
  private location = inject(Location);
  private router = inject(Router);

  constructor() {
    addIcons({ arrowBack });
  }

  goBack(): void {
    // Si hay historial, vuelve atrás
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Si no, redirige al home
      this.router.navigateByUrl('/');
    }
  }
}
