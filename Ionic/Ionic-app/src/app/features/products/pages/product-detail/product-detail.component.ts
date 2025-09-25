import { Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonItem, IonLabel, IonButton, IonIcon, IonBadge,
  IonSpinner, IonList, IonTextarea, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cart, star, starOutline, personCircle, location } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { ProductService } from '../../../../shared/services/product/product.service';
import { ReviewService } from '../../../../shared/services/review/review.service';
import { ProductSelectModel, ReviewSelectModel, ReviewRegisterModel } from '../../../../shared/models/product/product.model';

import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { UserMeDto } from 'src/app/core/models/login.model';
import { AuthState } from 'src/app/core/services/auth/auth.state';

// Swiper Web Components
import { register } from 'swiper/element/bundle';

// Modal de Order (Ionic)
import { OrderCreateModalComponent, OrderCreateDialogData } from '../../modals/order-create-dialog/order-create-dialog.component'; // ajusta la ruta real

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent,
    IonButton, IonIcon, IonBadge,
    IonSpinner, IonTextarea, IonNote
],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [AlertController, ToastController, ModalController],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private authState = inject(AuthState);

  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);

  me$: Observable<UserMeDto | null> = of(null);

  productId!: number;
  product!: ProductSelectModel;
  loadingProduct = true;

  // Carrusel (atributos de Web Component)
  slidesOpts = { slidesPerView: 1, spaceBetween: 12, pagination: true };

  selectedImage = signal<string | null>(null);

  reviews: ReviewSelectModel[] = [];
  loadingReviews = true;
  newReview = '';
  selectedRating = 0;
  hoverRating = 0;
  readonly starScale = [1, 2, 3, 4, 5] as const;

  averageRating = 0;
  distribution: { star: number; count: number; percentage: number }[] = [];
  totalReviews = 0;

  Math = Math;
  principalImage = computed(() =>
    this.selectedImage() || (this.product?.images?.length ? this.product.images[0].imageUrl : '')
  );

  sendingReview = false;
  private readonly ratingLabels = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] as const;

  constructor() {
    addIcons({ cart, star, starOutline, personCircle, location });
    register(); // habilita <swiper-container> y <swiper-slide>
  }

  ngOnInit(): void {
    void this.authState.hydrateFromStorage();
    this.me$ = this.authState.loadMe();

    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.productId) return;

    this.loadProduct();
    this.loadReviews();
  }

  private loadProduct(): void {
    this.loadingProduct = true;
    this.productService.getById(this.productId).subscribe({
      next: (data) => {
        this.product = data;
        this.loadingProduct = false;
        if (this.product?.images?.length) this.selectedImage.set(this.product.images[0].imageUrl);
      },
      error: () => {
        this.loadingProduct = false;
        this.showToast('No se pudo cargar el producto', 'danger');
      },
    });
  }

  private loadReviews(): void {
    this.loadingReviews = true;
    this.reviewService.getReviewByProduct(this.productId).subscribe({
      next: (list) => {
        this.reviews = list ?? [];
        this.recomputeStats();
        this.loadingReviews = false;
      },
      error: () => {
        this.loadingReviews = false;
        this.showToast('No se pudieron cargar las resenas', 'warning');
      },
    });
  }

  // === Pedido (relacion con Order) ===
  async openCreateOrder(): Promise<void> {
    const me = await firstValueFrom(this.me$);
    if (!me) {
      const alert = await this.alertCtrl.create({
        header: 'Inicia sesion',
        message: 'Debes iniciar sesion para crear un pedido.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Ir a iniciar sesion',
            handler: () => this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } }),
          },
        ],
      });
      await alert.present();
      return;
    }

    if ((this.product?.stock ?? 0) <= 0) {
      const alert = await this.alertCtrl.create({
        header: 'Sin stock',
        message: 'Este producto no tiene stock disponible.',
        buttons: ['Entendido'],
      });
      await alert.present();
      return;
    }

    // Abrimos el modal de Order (Ionic)
    const modal = await this.modalCtrl.create({
      component: OrderCreateModalComponent,
      componentProps: {
        data: {
          productId: this.product.id,
          productName: this.product.name,
          unitPrice: this.product.price,
          stock: this.product.stock,
          shippingNote: this.product.shippingIncluded ? 'Envio gratis' : 'No incluye envio',
        } as OrderCreateDialogData
      },
      breakpoints: [0, 0.7, 0.95],
      initialBreakpoint: 0.7,
      backdropDismiss: false
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<{ IsSuccess: boolean; OrderId: number }>();
    if (data?.IsSuccess) {
      this.showToast(`Pedido #${data.OrderId} creado`, 'success', 'bottom');
    }
  }

  onDetail(item: ProductSelectModel) {
    this.router.navigate(['home/product/profile', item.producerCode]);
  }

  setRating(v: number) { this.selectedRating = v; }
  onMouseEnter(r: number) { this.hoverRating = r; }
  onMouseLeave() { this.hoverRating = 0; }

  submitReview(): void {
    if (this.sendingReview) return;
    if (this.selectedRating < 1 || this.selectedRating > 5) return;
    const comment = this.newReview.trim();
    if (comment.length < 4) {
      void this.showToast('La reseña debe tener al menos 4 caracteres.', 'warning', 'top');
      return;
    }

    const payload: ReviewRegisterModel = { 
      productId: this.productId, 
      rating: this.selectedRating, 
      comment 
    };

    // 👇 Log para depuración
    console.log('Payload reseña:', payload);

    this.sendingReview = true;
    this.loadingReviews = true;

    this.reviewService.createReview(payload).pipe(
      switchMap(() => this.reviewService.getReviewByProduct(this.productId)),
      finalize(() => { this.sendingReview = false; })
    ).subscribe({
      next: (list) => {
        this.reviews = list ?? [];
        this.recomputeStats();
        this.newReview = '';
        this.selectedRating = 0;
        this.hoverRating = 0;
        this.loadingReviews = false;
        this.showToast('Reseña publicada', 'success', 'bottom');
      },
      error: (err) => {
        this.loadingReviews = false;
        console.error('[Review][create]', err);
        const message =
          (err as any)?.data?.message ||
          (err as any)?.error?.message ||
          err?.message ||
          'No se pudo publicar la reseña';
        this.showToast(message, 'danger', 'top');
      },
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar resena?',
      message: 'Esta accion no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.reviewService.deleteReview(reviewId));
              this.reviews = this.reviews.filter(r => r.id !== reviewId);
              this.recomputeStats();
              this.showToast('Resena eliminada', 'success', 'bottom');
            } catch (e: any) {
              this.showToast(e?.error?.message ?? 'No se pudo eliminar la resena', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private recomputeStats(): void {
    const n = this.reviews.length;
    this.totalReviews = n;

    if (n === 0) {
      this.averageRating = 0;
      this.distribution = [5, 4, 3, 2, 1].map(star => ({ star, count: 0, percentage: 0 }));
      return;
    }
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    this.averageRating = sum / n;

    const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    for (const r of this.reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;

    this.distribution = [5,4,3,2,1].map(star => {
      const count = counts[star] ?? 0;
      const percentage = (count / n) * 100;
      return { star, count, percentage };
    });
  }

  trackByReview = (_: number, r: ReviewSelectModel) => r.id;

  get ratingLabel(): string {
    const idx = (this.hoverRating || this.selectedRating) - 1;
    return idx >= 0 ? this.ratingLabels[idx] : '';
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium',
    position: 'top' | 'bottom' | 'middle' = 'top'
  ) {
    const t = await this.toastCtrl.create({ message, duration: 1600, position, color });
    await t.present();
  }
}
