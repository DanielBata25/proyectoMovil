import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartOptions, CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend } from 'chart.js';

import { AnalyticService } from 'src/app/shared/services/analytics/analytic.service';
import { ProducerService } from 'src/app/shared/services/producer/producer.service';
import { OrderService } from 'src/app/features/products/services/order/order.service';
import { StatCardComponent } from 'src/app/shared/components/stat-card/stat-card.component';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { ProductService } from 'src/app/shared/services/product/product.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';

import { forkJoin, catchError, finalize, of } from 'rxjs';

// Registrar escalas y elementos requeridos para bar chart
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    BaseChartDirective,
    RouterLink,
    StatCardComponent,
    ButtonComponent,
  ],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryPage implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private orderService = inject(OrderService);
  private analyticService = inject(AnalyticService);
  private producerService = inject(ProducerService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  totalOrders = 0;
  pendingOrders = 0;
  publishedProducts = 0;
  loading = true;
  chartLoading = true;
  lowStockProducts: ProductSelectModel[] = [];
  loadingLowStock = false;
  errorLoadingLowStock = false;
  codeProducer?: string;

  range: 'day' | 'week' | 'month' = 'month';
  get rangeLabel(): string {
    switch (this.range) {
      case 'day':
        return 'dia';
      case 'week':
        return 'semana';
      default:
        return 'mes';
    }
  }

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Pedidos completados',
        data: [],
        backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#29B6F6', '#4DD0E1'],
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#475569' },
        grid: { color: 'rgba(148, 163, 184, 0.35)' },
      },
      x: {
        ticks: { color: '#475569' },
        grid: { display: false },
      },
    },
  };

  ngOnInit(): void {
    this.loadProducer();
    this.loadSummary();
    this.loadTopProductsChart();
    this.loadLowStockProducts();
  }

  private loadProducer(): void {
    this.producerService.getMine().subscribe({
      next: (producer) => {
        this.codeProducer = producer?.code ?? undefined;
      },
      error: () => {
        this.resolveCodeFromProducts();
      },
    });
  }

  private resolveCodeFromProducts(): void {
    this.productService.getByProducerId().subscribe({
      next: (products) => {
        const code = products?.[0]?.producerCode;
        this.codeProducer = code ?? undefined;
      },
      error: () => {
        this.codeProducer = undefined;
      },
    });
  }

  private loadSummary(): void {
    this.loading = true;
    forkJoin({
      all: this.orderService.getProducerOrders().pipe(catchError(() => of([]))),
      pending: this.orderService.getProducerPendingOrders().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ all, pending }: { all: any[]; pending: any[] }) => {
        this.totalOrders = all.length;
        this.pendingOrders = pending.length;
        this.publishedProducts = all.filter((order) => order?.product?.status === true).length;
      });
  }

  private loadTopProductsChart(): void {
    this.chartLoading = true;
    const limit = this.range === 'day' ? 5 : this.range === 'week' ? 7 : 6;
    this.analyticService.getTopProducts(limit).subscribe({
      next: (resp) => {
        const rawItems =
          (resp as any)?.items ??
          (resp as any)?.data?.items ??
          [];
        const items = Array.isArray(rawItems) ? rawItems : [];
        const labels = items.map((i) => i.productName ?? i.name ?? `#${i.productId ?? ''}`);
        const data = items.map((i) => Number((i as any)?.completedOrders ?? (i as any)?.totalOrders ?? 0) || 0);

        const hasData = labels.length && data.some((v) => Number.isFinite(v) && v > 0);
        this.barChartData.labels = hasData ? labels : ['Sin datos'];
        this.barChartData.datasets[0].data = hasData ? data : [0];
        this.barChartData.datasets[0].backgroundColor = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#29B6F6', '#4DD0E1'];
        this.barChartData.datasets[0].borderColor = '#2563eb';
        this.barChartData.datasets[0].borderWidth = 1;

        this.chart?.update();
        this.chartLoading = false;
      },
      error: () => {
        this.barChartData.labels = ['Error'];
        this.barChartData.datasets[0].data = [0];
        this.chart?.update();
        this.chartLoading = false;
      },
    });
  }

  onRangeChange(event: CustomEvent): void {
    const value = (event.detail.value as 'day' | 'week' | 'month') ?? 'month';
    if (value !== this.range) {
      this.range = value;
      this.loadTopProductsChart();
    }
  }

  private loadLowStockProducts(): void {
    this.loadingLowStock = true;
    this.errorLoadingLowStock = false;

    this.productService
      .getLowStockByProducer()
      .pipe(finalize(() => (this.loadingLowStock = false)))
      .subscribe({
        next: (products) => (this.lowStockProducts = products ?? []),
        error: () => (this.errorLoadingLowStock = true),
      });
  }

  async goProfile(): Promise<void> {
    if (!this.codeProducer) {
      this.showToast('No se pudo cargar tu perfil.');
      return;
    }
    this.router.navigate(['/account/producer/profile'], {
      state: { code: this.codeProducer },
    });
  }

  async updateProfile(): Promise<void> {
    this.showAlert('Actualizar perfil', 'Aquí abrirías un flujo de edición en Ionic.');
  }

  goToOrders(status: string): void {
    this.router.navigate(['/account/producer/orders'], { queryParams: { status } });
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }

  private async showAlert(header: string, message: string) {
    const a = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await a.present();
  }
}
