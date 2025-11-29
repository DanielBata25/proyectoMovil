import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthState } from '../../services/auth/auth.state';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [
    IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonButton, IonIcon
  ],
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent implements OnInit {
  private auth = inject(AuthState);
  private location = inject(Location);
  private router = inject(Router);

  constructor() {
    addIcons({ arrowBack });
  }

  ngOnInit(): void {
    this.auth.loadMe().subscribe(() => {
      console.log("No autorizado");
    });
  }

  goBack(): void {
    // Si hay historial, vuelve atrás
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Fallback seguro al home
      this.router.navigateByUrl('/');
    }
  }
}
