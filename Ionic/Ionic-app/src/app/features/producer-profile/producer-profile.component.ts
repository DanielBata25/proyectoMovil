import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  star,
  starOutline,
  call,
  mail,
  link,
  globe,
  logoFacebook,
  logoInstagram,
  logoWhatsapp,
  logoTwitter,
} from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProducerSelectModel, SocialNetwork } from 'src/app/shared/models/producer/producer.model';
import { ProducerService } from 'src/app/shared/services/producer/producer.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './producer-profile.component.html',
  styleUrls: ['./producer-profile.component.scss'],
})
export class ProducerProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private producerService = inject(ProducerService);
  private toastCtrl = inject(ToastController);

  private currentCode = '';
  producer?: ProducerSelectModel;
  loading = true;
  errorMessage = '';

  readonly SocialNetwork = SocialNetwork;

  constructor() {
    addIcons({
      personCircleOutline,
      star,
      starOutline,
      call,
      mail,
      link,
      globe,
      logoFacebook,
      logoInstagram,
      logoWhatsapp,
      logoTwitter,
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const code = params.get('code');
      if (!code) {
        this.handleError('No se encontró el código del productor.');
        return;
      }
      this.currentCode = code;
      this.loadProducer(code);
    });
  }

  private loadProducer(code: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.producerService.getByCodeProducer(code).subscribe({
      next: (producer) => {
        this.producer = producer;
        this.loading = false;
      },
      error: () => {
        this.handleError('No se pudo cargar la información del productor.');
      },
    });
  }

  private async handleError(message: string): Promise<void> {
    this.loading = false;
    this.errorMessage = message;
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }

  retry(): void {
    if (this.currentCode) {
      this.loadProducer(this.currentCode);
      return;
    }
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.loadProducer(code);
    }
  }

  networkLabel(network: SocialNetwork): string {
    switch (network) {
      case SocialNetwork.Facebook:
        return 'Facebook';
      case SocialNetwork.Instagram:
        return 'Instagram';
      case SocialNetwork.Whatsapp:
        return 'WhatsApp';
      case SocialNetwork.X:
        return 'X';
      default:
        return 'Sitio web';
    }
  }

  networkIcon(network: SocialNetwork): string {
    switch (network) {
      case SocialNetwork.Facebook:
        return 'logo-facebook';
      case SocialNetwork.Instagram:
        return 'logo-instagram';
      case SocialNetwork.Whatsapp:
        return 'logo-whatsapp';
      case SocialNetwork.X:
        return 'logo-twitter';
      default:
        return 'globe';
    }
  }

  normalizeUrl(raw: string): string {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  }
}
