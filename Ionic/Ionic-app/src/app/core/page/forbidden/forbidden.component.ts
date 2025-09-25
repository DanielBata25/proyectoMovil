import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home } from 'ionicons/icons';
import { AuthState } from '../../services/auth/auth.state';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent implements OnInit {
  private auth = inject(AuthState);

  constructor() {
    addIcons({ home });
  }

  ngOnInit(): void {
    this.auth.loadMe().subscribe(() => {
      console.log('No autorizado');
    });
  }
}
