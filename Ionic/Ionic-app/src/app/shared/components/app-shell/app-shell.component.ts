import { AfterViewInit, Component, DestroyRef, ElementRef, HostBinding, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { NavbarBuenoComponent } from '../navs/navbar-bueno/navbar-bueno.component';
import { TabsComponent } from '../tabs/tabs.component';



@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, NavbarBuenoComponent, TabsComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements AfterViewInit {
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  /** Ocultar barras en ciertas rutas (login, registro, etc.) */
  @HostBinding('class.hide-bars')
  hideBars = false;
  private HIDE_PATTERNS = [/^\/auth(\/|$)/, /^\/notFound$/];

  private headerEl?: HTMLElement;
  private footerEl?: HTMLElement;
  private rafId?: number;

  @ViewChild('headerHost', { read: ElementRef })
  set headerHost(ref: ElementRef<HTMLElement> | undefined) {
    this.headerEl = ref?.nativeElement;
    this.scheduleOffsetUpdate();
  }

  @ViewChild('footerHost', { read: ElementRef })
  set footerHost(ref: ElementRef<HTMLElement> | undefined) {
    this.footerEl = ref?.nativeElement;
    this.scheduleOffsetUpdate();
  }

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(e => {
        const url = e.urlAfterRedirects || e.url || '';
        const nextHideBars = this.HIDE_PATTERNS.some(rx => rx.test(url));
        if (nextHideBars !== this.hideBars) {
          this.hideBars = nextHideBars;
        }
        this.scheduleOffsetUpdate();
      });

    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.scheduleOffsetUpdate());
    }

    this.destroyRef.onDestroy(() => {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = undefined;
      }
    });
  }

  ngAfterViewInit(): void {
    this.scheduleOffsetUpdate();
  }

  private scheduleOffsetUpdate(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = undefined;
      this.applyOffsets();
    });
  }

  private applyOffsets(): void {
    const hostElement = this.host.nativeElement;

    if (this.hideBars) {
      hostElement.style.setProperty('--app-shell-header-offset', '0px');
      hostElement.style.setProperty('--app-shell-footer-offset', '0px');
      return;
    }

    const headerHeight = this.headerEl ? Math.round(this.headerEl.getBoundingClientRect().height) : 0;
    const footerHeight = this.footerEl ? Math.round(this.footerEl.getBoundingClientRect().height) : 0;

    hostElement.style.setProperty('--app-shell-header-offset', `${headerHeight}px`);
    hostElement.style.setProperty('--app-shell-footer-offset', `${footerHeight}px`);
  }
}
