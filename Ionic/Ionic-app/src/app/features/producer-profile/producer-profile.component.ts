import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
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
  checkmarkCircle,
  alertCircleOutline,
} from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProducerSelectModel, SocialNetwork } from 'src/app/shared/models/producer/producer.model';
import { ProducerService } from 'src/app/shared/services/producer/producer.service';
import { ProductService } from 'src/app/shared/services/product/product.service';
import { FarmService } from 'src/app/shared/services/farm/farm.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';
import { CardComponent } from 'src/app/shared/components/cards/card/card.component';
import { CardFarmComponent } from 'src/app/shared/components/cards/card-farm/card-farm.component';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule, IonicModule, CardComponent, CardFarmComponent],
  templateUrl: './producer-profile.component.html',
  styleUrls: ['./producer-profile.component.scss'],
})
export class ProducerProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private producerService = inject(ProducerService);
  private productService = inject(ProductService);
  private farmService = inject(FarmService);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  private currentCode = '';
  producer?: ProducerSelectModel;
  products: ProductSelectModel[] = [];
  famrs: FarmSelectModel[] = [];
  saleNumber = 0;
  loading = true;
  errorMessage = '';

  readonly SocialNetwork = SocialNetwork;
  trackByProduct = (_: number, p: ProductSelectModel) => p.id;
  trackByFarm = (_: number, f: FarmSelectModel) => f.id;

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
      checkmarkCircle,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    const stateCode = (navState?.['code'] ?? history.state?.code) as string | undefined;

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const code = params.get('code') ?? stateCode;
      if (code) {
        this.loadByCode(code);
      } else {
        this.loadMine();
      }
    });
  }

  private loadMine(): void {
    this.loading = true;
    this.errorMessage = '';
    this.producerService.getMine().subscribe({
      next: (producer) => {
        if (!producer?.code) {
          this.handleError('No se pudo cargar la información del productor.');
          return;
        }
        this.producer = producer;
        this.currentCode = producer.code;
        this.loading = false;
        this.loadRelatedData(producer.code);
      },
      error: () => {
        this.handleError('No se pudo cargar la información del productor.');
      },
    });
  }

  private loadByCode(code: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentCode = code;

    this.producerService.getByCodeProducer(code).subscribe({
      next: (producer) => {
        this.producer = producer;
        this.loading = false;
      },
      error: () => {
        this.handleError('No se pudo cargar la información del productor.');
      },
    });

    this.loadRelatedData(code);
  }

  private loadRelatedData(code: string): void {
    if (!code) return;

    this.productService.getProductByCodeProducer(code).subscribe({
      next: (data) => {
        this.products = data;
      },
      error: () => {
        console.error('Error cargando productos');
      },
    });

    // Cargar fincas
    this.farmService.getFarmByCodeProducer(code).subscribe({
      next: (data) => {
        this.famrs = data;
      },
      error: () => {
        console.error('Error cargando fincas');
      },
    });
  }

  // private loadSalesNumber(code: string): void {
  //   this.producerService.getSalesNumberByCode(code).subscribe({
  //     next: (data: number) => {
  //       this.saleNumber = data ?? 0;
  //       this.loading = false;
  //     },
  //     error: () => {
  //       this.saleNumber = 0;
  //       this.loading = false;
  //     },
  //   });
  // }

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
    const stateCode = (history.state?.code as string | undefined) ?? this.currentCode;
    const codeParam = this.route.snapshot.paramMap.get('code');
    if (codeParam || stateCode) this.loadByCode(codeParam ?? stateCode!);
    else this.loadMine();
  }

  trustLevelClass(n: number): string {
    if (n >= 50) return 'trust-high';
    if (n >= 10) return 'trust-mid';
    return 'trust-low';
  }

  compact(n: number): string {
    try {
      return new Intl.NumberFormat('es-CO', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n);
    } catch {
      if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
      return String(n);
    }
  }

  get avg(): number {
    return this.producer?.averageRating ?? 0;
  }

  formatAvg(): string {
    return this.avg.toFixed(1);
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
