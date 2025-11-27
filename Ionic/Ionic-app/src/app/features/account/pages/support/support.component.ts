import { Component } from '@angular/core';
import {
  IonContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail } from 'ionicons/icons';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    IonContent, IonButton, IonIcon
  ],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent {
  email = 'portalagrocomercialhuila@gmail.com';

  constructor() {
    addIcons({ mail });
  }

  sendEmail() {
    window.location.href = `mailto:${this.email}`;
  }
}
