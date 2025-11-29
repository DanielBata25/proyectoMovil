import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrderChatComponent } from './order-chat.component';

describe('OrderChatComponent', () => {
  let component: OrderChatComponent;
  let fixture: ComponentFixture<OrderChatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), OrderChatComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderChatComponent);
    component = fixture.componentInstance;
    component.orderCode = 'TEST';
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
