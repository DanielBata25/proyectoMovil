import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

/** Interceptor de autenticación (401 -> refresh, agrega Authorization y XSRF) */
import { authInterceptor } from './app/core/interceptors/auth/auth.interceptor';

/** === Ionicons: registra solo los íconos que usas === */
import { addIcons } from 'ionicons';
import {
  // ——— LOS QUE YA TENÍAS ———
  person,
  location,
  create,
  trash,
  star,
  starOutline,
  chevronForward,
  refresh,
  menu,
  search,
  cubeOutline,
  notifications,
  personCircle,
  arrowBack,
  cart,
  mail,
  call,
  businessOutline,
  shieldCheckmarkOutline,
  trendingUpOutline,
  leafOutline,
  idCard,

  // ——— NUEVOS PARA NAVBAR/TABS/PÁGINAS ———
  homeOutline,
  heartOutline,
  bagHandleOutline,
  personOutline,
  calendarOutline,
  idCardOutline,
  locationOutline,
  keyOutline,
  logOutOutline,
  createOutline,
} from 'ionicons/icons';

// Registra los SVG (evita cargas por URL y quita warnings de iconos no encontrados)
addIcons({
  // ——— EXISTENTES ———
  person,
  location,
  create,
  trash,
  star,
  'star-outline': starOutline,
  'chevron-forward': chevronForward,
  refresh,
  menu,
  search,
  'cube-outline': cubeOutline,
  notifications,
  'person-circle': personCircle,
  'arrow-back': arrowBack,
  cart,
  mail,
  call,
  'business-outline': businessOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'trending-up-outline': trendingUpOutline,
  'leaf-outline': leafOutline,
  'id-card': idCard,

  // ——— NUEVOS ———
  'home-outline': homeOutline,
  'heart-outline': heartOutline,
  'bag-handle-outline': bagHandleOutline,
  'person-outline': personOutline,

  'calendar-outline': calendarOutline,
  'id-card-outline': idCardOutline,
  'location-outline': locationOutline,
  'key-outline': keyOutline,
  'log-out-outline': logOutOutline,
  'create-outline': createOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});

