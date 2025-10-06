import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterOutlet],
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementPage implements OnInit, OnDestroy {
  currentTab = 'product';
  private sub?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.syncWithRoute();
    this.sub = this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(() => this.syncWithRoute());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private syncWithRoute(): void {
    const child = this.route.firstChild?.snapshot.url[0]?.path;
    if (child) {
      this.currentTab = child;
    }
  }

  get title(): string {
    if (this.currentTab === 'farm') {
      return 'Gestión Fincas';
    }
    if (this.currentTab === 'product') {
      return 'Gestión Productos';
    }
    return 'Gestión';
  }
}




