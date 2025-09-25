import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
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
    // Regresa a la página anterior si existe; si no, va al inicio
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
