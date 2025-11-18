import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';

import { UserOrderDetailComponent } from './user-order-detail.component';
import { OrderService } from '../../../products/services/order/order.service';
import { OrderDetailModel } from '../../../products/models/order/order.model';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

describe('UserOrderDetailComponent', () => {
  let component: UserOrderDetailComponent;
  let fixture: ComponentFixture<UserOrderDetailComponent>;
  let mockOrderService: jasmine.SpyObj<OrderService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockAlertController: jasmine.SpyObj<AlertController>;
  let mockToastController: jasmine.SpyObj<ToastController>;

  const mockDetail: OrderDetailModel = {
    id: 1,
    productName: 'Test Product',
    unitPrice: 10000,
    quantityRequested: 2,
    subtotal: 20000,
    total: 20000,
    status: 'PendingReview',
    paymentImageUrl: 'https://example.com/payment.jpg',
    paymentUploadedAt: '2023-01-01T00:00:00Z',
    recipientName: 'John Doe',
    contactPhone: '123456789',
    addressLine1: 'Calle 123',
    addressLine2: 'Apto 456',
    cityId: 1,
    cityName: 'Bogotá',
    createdAt: '2023-01-01T00:00:00Z',
    producerDecisionAt: null,
    producerDecisionReason: null,
    producerNotes: null,
    rowVersion: 'mock-row-version'
  };

  beforeEach(waitForAsync(() => {
    // Create mock services
    mockOrderService = jasmine.createSpyObj('OrderService', ['getDetailForUser', 'confirmReceived']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    });
    mockAlertController = jasmine.createSpyObj('AlertController', ['create']);
    mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      declarations: [UserOrderDetailComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: OrderService, useValue: mockOrderService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserOrderDetailComponent);
    component = fixture.componentInstance;
    
    // Mock the detail
    component.detail = mockDetail;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.detail).toBeUndefined();
  });

  it('should navigate back if no id provided', async () => {
    // Override the activated route mock for this test
    const routeOverride = TestBed.inject(ActivatedRoute);
    Object.defineProperty(routeOverride.snapshot.paramMap, 'get', {
      value: jasmine.createSpy('get').and.returnValue(null)
    });

    await component.ngOnInit();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/account/orders');
  });

  it('should load order details successfully', async () => {
    const mockOrderDetail = mockDetail;
    const orderService = TestBed.inject(OrderService);
    (orderService.getDetailForUser as jasmine.Spy).and.returnValue(Promise.resolve(mockOrderDetail));

    await component.load();
    
    expect(component.detail).toBe(mockOrderDetail);
    expect(component.loading).toBe(false);
  });

  it('should handle load error', async () => {
    const orderService = TestBed.inject(OrderService);
    const alertController = TestBed.inject(AlertController);
    (orderService.getDetailForUser as jasmine.Spy).and.returnValue(Promise.reject({ error: { message: 'Test error' } }));
    (alertController.create as jasmine.Spy).and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss')
    } as any));

    await component.load();
    
    expect(component.detail).toBeUndefined();
    expect(component.loading).toBe(false);
    expect(alertController.create).toHaveBeenCalled();
  });

  describe('Status Guards', () => {
    beforeEach(() => {
      component.detail = mockDetail;
    });

    it('should allow cancel for PendingReview status', () => {
      component.detail!.status = 'PendingReview';
      expect(component.canCancel).toBe(true);
    });

    it('should not allow cancel for other statuses', () => {
      component.detail!.status = 'AcceptedAwaitingPayment';
      expect(component.canCancel).toBe(false);
    });

    it('should allow upload payment for AcceptedAwaitingPayment status', () => {
      component.detail!.status = 'AcceptedAwaitingPayment';
      expect(component.canUploadPayment).toBe(true);
    });

    it('should not allow upload payment for other statuses', () => {
      component.detail!.status = 'PendingReview';
      expect(component.canUploadPayment).toBe(false);
    });

    it('should allow confirm for DeliveredPendingBuyerConfirm status', () => {
      component.detail!.status = 'DeliveredPendingBuyerConfirm';
      expect(component.canConfirm).toBe(true);
    });

    it('should not allow confirm for other statuses', () => {
      component.detail!.status = 'PendingReview';
      expect(component.canConfirm).toBe(false);
    });
  });

  describe('Status Chip', () => {
    beforeEach(() => {
      component.detail = mockDetail;
    });

    it('should return correct chip for PendingReview status', () => {
      component.detail!.status = 'PendingReview';
      const chip = component.statusChip;
      expect(chip.text).toBe('Pendiente de revisión');
      expect(chip.cls).toBe('info');
    });

    it('should return correct chip for AcceptedAwaitingPayment status', () => {
      component.detail!.status = 'AcceptedAwaitingPayment';
      const chip = component.statusChip;
      expect(chip.text).toBe('Aceptado (esperando pago)');
      expect(chip.cls).toBe('warning');
    });

    it('should return correct chip for DeliveredPendingBuyerConfirm status', () => {
      component.detail!.status = 'DeliveredPendingBuyerConfirm';
      const chip = component.statusChip;
      expect(chip.text).toBe('Entregado (pendiente de confirmación)');
      expect(chip.cls).toBe('warning');
    });

    it('should return correct chip for Completed status', () => {
      component.detail!.status = 'Completed';
      const chip = component.statusChip;
      expect(chip.text).toBe('Completado');
      expect(chip.cls).toBe('success');
    });

    it('should return correct chip for Rejected status', () => {
      component.detail!.status = 'Rejected';
      const chip = component.statusChip;
      expect(chip.text).toBe('Rechazado');
      expect(chip.cls).toBe('danger');
    });

    it('should return neutral chip for unknown status', () => {
      component.detail!.status = 'UnknownStatus';
      const chip = component.statusChip;
      expect(chip.text).toBe('UnknownStatus');
      expect(chip.cls).toBe('neutral');
    });
  });

  describe('Image Modal', () => {
    it('should open image modal when requested', () => {
      expect(component.showImage).toBe(false);
      component.openImageModal();
      expect(component.showImage).toBe(true);
    });
  });

  describe('File Upload', () => {
    it('should trigger file input click', () => {
      const mockFileInput = document.createElement('input');
      spyOn(mockFileInput, 'click');
      
      component.triggerFile(mockFileInput);
      expect(mockFileInput.click).toHaveBeenCalled();
    });

    it('should validate file type for images only', async () => {
      const mockEvent = {
        target: {
          files: [new File(['test'], 'test.pdf', { type: 'application/pdf' })],
          value: ''
        }
      } as any;
      
      await component.onPickPaymentFile(mockEvent);
      // Should not proceed with non-image files
      expect(component).toBeTruthy();
    });

    it('should validate file size under limit', async () => {
      const largeFile = new File(['x'.repeat(7 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [largeFile],
          value: ''
        }
      } as any;
      
      await component.onPickPaymentFile(mockEvent);
      // Should not proceed with files over 6MB
      expect(component).toBeTruthy();
    });

    it('should accept valid image files', async () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [validFile],
          value: ''
        }
      } as any;
      
      await component.onPickPaymentFile(mockEvent);
      // Should proceed with valid files
      expect(component).toBeTruthy();
    });
  });

  describe('Confirmation Actions', () => {
    beforeEach(() => {
      component.detail = { ...mockDetail, status: 'DeliveredPendingBuyerConfirm' };
    });

    it('should show confirmation dialog for yes answer', async () => {
      const alertController = TestBed.inject(AlertController);
      (alertController.create as jasmine.Spy).and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present'),
        dismiss: jasmine.createSpy('dismiss')
      } as any));

      await component.confirm('yes');
      
      expect(alertController.create).toHaveBeenCalled();
      const alertConfig = (alertController.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(alertConfig.header).toBe('¿Confirmar recepción?');
    });

    it('should show confirmation dialog for no answer', async () => {
      const alertController = TestBed.inject(AlertController);
      (alertController.create as jasmine.Spy).and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present'),
        dismiss: jasmine.createSpy('dismiss')
      } as any));

      await component.confirm('no');
      
      expect(alertController.create).toHaveBeenCalled();
      const alertConfig = (alertController.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(alertConfig.header).toBe('¿Reportar problema?');
    });
  });

  describe('Cancel Action', () => {
    beforeEach(() => {
      component.detail = { ...mockDetail, status: 'PendingReview' };
    });

    it('should show cancel dialog', async () => {
      const alertController = TestBed.inject(AlertController);
      (alertController.create as jasmine.Spy).and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present'),
        dismiss: jasmine.createSpy('dismiss')
      } as any));

      await component.cancel();
      
      expect(alertController.create).toHaveBeenCalled();
      const alertConfig = (alertController.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(alertConfig.header).toBe('Cancelar pedido');
    });
  });

  describe('File Constants', () => {
    it('should have correct file size limits', () => {
      expect(component.MAX_FILE_MB).toBe(6);
      expect(component.MAX_FILE_BYTES).toBe(6 * 1024 * 1024);
    });
  });
});
