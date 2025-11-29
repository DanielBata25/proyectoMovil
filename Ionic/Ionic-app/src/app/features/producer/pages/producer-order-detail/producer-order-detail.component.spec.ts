import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ProducerOrderDetailComponent } from './producer-order-detail.component';
import { OrderService } from '../../../products/services/order/order.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('ProducerOrderDetailComponent', () => {
  let component: ProducerOrderDetailComponent;
  let fixture: ComponentFixture<ProducerOrderDetailComponent>;
  let mockOrderService: jasmine.SpyObj<OrderService>;

  beforeEach(waitForAsync(() => {
    mockOrderService = jasmine.createSpyObj('OrderService', ['getDetailForProducer', 'acceptOrder', 'rejectOrder']);
    
    TestBed.configureTestingModule({
      declarations: [ ProducerOrderDetailComponent ],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        { provide: OrderService, useValue: mockOrderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProducerOrderDetailComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.processing).toBe(false);
  });

  it('should load order detail on init', waitForAsync(() => {
    const mockDetail = {
      id: 123,
      status: 'PendingReview',
      productName: 'Test Product',
      unitPrice: 1000,
      quantityRequested: 2,
      subtotal: 2000,
      total: 2000,
      recipientName: 'Test User',
      contactPhone: '123456789',
      addressLine1: 'Test Address',
      addressLine2: '',
      cityName: 'Test City',
      cityId: 1,
      createdAt: new Date().toISOString(),
      producerDecisionAt: null,
      paymentImageUrl: null,
      rowVersion: 'test-version'
    };

    mockOrderService.getDetailForProducer.and.returnValue(of(mockDetail));

    fixture.detectChanges();
    
    fixture.whenStable().then(() => {
      expect(component.detail).toBeDefined();
      expect(component.detail?.id).toBe(123);
      expect(component.loading).toBe(false);
    });
  }));

  it('should have correct status chip for PendingReview', () => {
    component.detail = {
      id: 1,
      status: 'PendingReview',
      productName: 'Test',
      unitPrice: 1000,
      quantityRequested: 1,
      subtotal: 1000,
      total: 1000,
      recipientName: 'Test',
      contactPhone: '123',
      addressLine1: 'Test',
      addressLine2: '',
      cityName: 'Test',
      cityId: 1,
      createdAt: new Date().toISOString(),
      producerDecisionAt: null,
      paymentImageUrl: null,
      rowVersion: 'test'
    };

    fixture.detectChanges();

    const chip = component.statusChip;
    expect(chip.text).toBe('Pendiente de revisión');
    expect(chip.cls).toBe('info');
  });

  it('should have accept/reject actions for PendingReview status', () => {
    component.detail = {
      id: 1,
      status: 'PendingReview',
      productName: 'Test',
      unitPrice: 1000,
      quantityRequested: 1,
      subtotal: 1000,
      total: 1000,
      recipientName: 'Test',
      contactPhone: '123',
      addressLine1: 'Test',
      addressLine2: '',
      cityName: 'Test',
      cityId: 1,
      createdAt: new Date().toISOString(),
      producerDecisionAt: null,
      paymentImageUrl: null,
      rowVersion: 'test'
    };

    fixture.detectChanges();

    expect(component.canAcceptReject).toBe(true);
  });

  it('should open image in new tab when clicked', () => {
    const windowOpenSpy = spyOn(window, 'open');
    
    component.detail = {
      id: 1,
      status: 'Completed',
      productName: 'Test',
      unitPrice: 1000,
      quantityRequested: 1,
      subtotal: 1000,
      total: 1000,
      recipientName: 'Test',
      contactPhone: '123',
      addressLine1: 'Test',
      addressLine2: '',
      cityName: 'Test',
      cityId: 1,
      createdAt: new Date().toISOString(),
      producerDecisionAt: null,
      paymentImageUrl: 'http://test.com/image.jpg',
      rowVersion: 'test'
    };

    component.openImage();

    expect(windowOpenSpy).toHaveBeenCalledWith('http://test.com/image.jpg', '_blank');
  });

  it('should not open image if no payment image URL', () => {
    const windowOpenSpy = spyOn(window, 'open');
    
    component.detail = {
      id: 1,
      status: 'Completed',
      productName: 'Test',
      unitPrice: 1000,
      quantityRequested: 1,
      subtotal: 1000,
      total: 1000,
      recipientName: 'Test',
      contactPhone: '123',
      addressLine1: 'Test',
      addressLine2: '',
      cityName: 'Test',
      cityId: 1,
      createdAt: new Date().toISOString(),
      producerDecisionAt: null,
      paymentImageUrl: null,
      rowVersion: 'test'
    };

    component.openImage();

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });
});
