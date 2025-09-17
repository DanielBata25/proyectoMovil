import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarBuenoComponent } from '../navs/navbar-bueno/navbar-bueno.component';
import { TabsComponent } from '../tabs/tabs.component';



@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, NavbarBuenoComponent, TabsComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  private router = inject(Router);

  /** Ocultar barras en ciertas rutas (login, registro, etc.) */
  hideBars = false;
  private HIDE_PATTERNS = [/^\/auth(\/|$)/, /^\/notFound$/];

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url || '';
        this.hideBars = this.HIDE_PATTERNS.some(rx => rx.test(url));
      });
  }
}
