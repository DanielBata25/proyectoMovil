import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { StatCardComponent } from 'src/app/shared/components/stat-card/stat-card.component';
import { AnalyticService } from 'src/app/shared/services/analytics/analytic.service';
import { ProducerService } from 'src/app/shared/services/producer/producer.service';
import { OrderService } from 'src/app/features/products/services/order/order.service';

import { forkJoin, catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, BaseChartDirective, StatCardComponent],
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
  loading = true;
  chartLoading = true;
  codeProducer?: string;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Pedidos completados',
        data: [],
        backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#29B6F6'],
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top', align: 'start' },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  ngOnInit() {
    this.loadProducer();
    this.loadSummary();
    this.loadTopProductsChart();
  }

  private loadProducer() {
    // ⚠️ Ajusta según tu servicio real (getCodeProducer o getByCodeProducer)
    this.producerService.getByCodeProducer('someCode').subscribe((data) => {
      this.codeProducer = data.code;
    });
  }

  private loadSummary() {
    this.loading = true;
    forkJoin({
      all: this.orderService.getProducerOrders().pipe(catchError(() => of([]))),
      pending: this.orderService.getProducerPendingOrders().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ all, pending }) => {
        this.totalOrders = all.length;
        this.pendingOrders = pending.length;
      });
  }

  private loadTopProductsChart(limit = 5) {
    this.chartLoading = true;
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

  async goProfile() {
    if (!this.codeProducer) {
      this.showToast('No se pudo cargar tu perfil.');
      return;
    }
    window.location.href = `/home/product/profile/${this.codeProducer}`;
  }

  async updateProfile() {
    this.showAlert('Actualizar perfil', 'Aquí abrirías un modal o flujo de edición en Ionic.');
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
