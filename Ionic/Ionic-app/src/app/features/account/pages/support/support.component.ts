import { Component } from '@angular/core';
import {
  IonContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, call } from 'ionicons/icons';

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
  phone = '+57 310 123 4567';

  constructor() {
    addIcons({ mail, call });
  }

  sendEmail() {
    window.location.href = `mailto:${this.email}`;
  }

  callPhone() {
    window.location.href = `tel:${this.phone}`;
  }
}
