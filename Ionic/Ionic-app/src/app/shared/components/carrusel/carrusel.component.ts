import {
  Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrusel.component.html',
  styleUrls: ['./carrusel.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CarruselComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperRef', { static: false }) swiperEl!: ElementRef<HTMLElement>;

  slides = [
    { image: 'assets/backgrounds/1.png', title: 'Conectando los Productores de nuestra tierra' },
    { image: 'assets/backgrounds/2.png', title: 'Del campo a tu mesa, productos frescos y de calidad' },
    { image: 'assets/backgrounds/3.png', title: 'Apoyando a los agricultores locales' }
  ];

  ngOnInit() {}

  ngAfterViewInit(): void {
    // inicializa cuando el DOM ya tiene los slides
    requestAnimationFrame(() => {
      const el: any = this.swiperEl?.nativeElement;
      if (el?.initialize) el.initialize();
    });
  }

  updateSwiper() {
    const el: any = this.swiperEl?.nativeElement;
    el?.swiper?.update?.();
  }

  trackByIdx = (_: number, __: any) => _;
}
