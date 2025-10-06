import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { AnalyticService } from 'src/app/shared/services/analytics/analytic.service';
import { ProducerService } from 'src/app/shared/services/producer/producer.service';
import { OrderService } from 'src/app/features/products/services/order/order.service';

import { forkJoin, catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [IonicModule, CommonModule, BaseChartDirective],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryPage implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private orderService = inject(OrderService);
  private analyticService = inject(AnalyticService);
  private producerService = inject(ProducerService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  totalOrders = 0;
  pendingOrders = 0;
  publishedProducts = 0;
  loading = true;
  chartLoading = true;
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
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  ngOnInit(): void {
    this.loadProducer();
    this.loadSummary();
    this.loadTopProductsChart();
  }

  private loadProducer(): void {
    this.producerService.getByCodeProducer('someCode').subscribe((data) => {
      this.codeProducer = data.code;
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
      next: ({ items }) => {
        if (!items || items.length === 0) {
          this.barChartData.labels = ['Sin datos'];
          this.barChartData.datasets[0].data = [0];
        } else {
          this.barChartData.labels = items.map((i) => i.productName);
          this.barChartData.datasets[0].data = items.map((i) => i.completedOrders);
        }
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

  async goProfile(): Promise<void> {
    if (!this.codeProducer) {
      this.showToast('No se pudo cargar tu perfil.');
      return;
    }
    window.location.href = `/home/product/profile/${this.codeProducer}`;
  }

  async updateProfile(): Promise<void> {
    this.showAlert('Actualizar perfil', 'Aquí abrirías un flujo de edición en Ionic.');
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

