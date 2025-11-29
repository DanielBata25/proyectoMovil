import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.configureKeyboard();
  }

  private configureKeyboard(): void {
    if (!Capacitor.isPluginAvailable('Keyboard')) return;

    // Evita que el viewport se reduzca y empuje la tab-bar al abrir el teclado
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});
    // Desactiva el autoscroll del plugin (dejamos que Ionic maneje el scroll)
    Keyboard.setScroll({ isDisabled: true }).catch(() => {});
  }
}
